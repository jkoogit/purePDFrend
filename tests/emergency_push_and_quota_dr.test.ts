/**
 * @file emergency_push_and_quota_dr.test.ts
 * @description 비-LLM 긴급 Push, 다차원 쿼터 차감 엔진 및 세션 재해복구(DR) TDD 단위 테스트
 */

import {
  AccountQuotaLedger,
  QuotaDeductionEngine,
  SessionDisasterRecoveryService,
  SessionSnapshot,
} from '../src/aiagent/domain/token-quota';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`❌ Assertion Failed: ${message}`);
  }
  console.log(`  ✅ ${message}`);
}

async function runTests() {
  console.log('================================================================');
  console.log('🧪 [TDD] 비-LLM 긴급 Push, 다차원 쿼터 엔진 & 세션 DR 단위 테스트');
  console.log('================================================================\n');

  // Test Suite 1: 원장(Ledger) Pro/Flash 횟수 및 토큰 하이브리드 관리
  console.log('[Test Suite 1] 원장(Ledger) Pro(250회) / Flash(2,500회) 횟수 쿼터 거버넌스');
  {
    const ledger = new AccountQuotaLedger({
      ledgerId: 'LDG-TEST-001',
      userId: 'USER-TEST',
      planId: 'PLAN-PRO',
      totalGrantedQuota: 2000000,
      usedQuota: 0,
      remainingQuota: 2000000,
      proRequestsLimit: 250,
      proRequestsUsed: 248, // 2 left
      flashRequestsLimit: 2500,
      flashRequestsUsed: 100,
    });

    assert(ledger.proRequestsRemaining === 2, '초기 Pro 잔여 횟수 2회 일치');
    assert(ledger.flashRequestsRemaining === 2400, '초기 Flash 잔여 횟수 2,400회 일치');

    // 1st Pro turn:
    const res1 = ledger.deduct(1000, { modelId: 'gemini-1.5-pro' });
    assert(res1.success === true, '1회차 Pro 차감 성공');
    assert(ledger.proRequestsRemaining === 1, 'Pro 잔여 1회 감소');
    assert(res1.fallbackRecommended === false, '아직 한도 미도달로 폴백 비권고');

    // 2nd Pro turn (hits 250 limit):
    const res2 = ledger.deduct(1000, { modelId: 'gemini-1.5-pro' });
    assert(res2.success === true, '2회차 Pro 차감 성공 (한도 도달)');
    assert(ledger.proRequestsRemaining === 0, 'Pro 잔여 0회 도달');
    assert(res2.fallbackRecommended === true, '한도 도달로 Flash 폴백 권고 플래그 활성화');
    assert(res2.fallbackModelId === 'gemini-1.5-flash', '폴백 대상 모델 gemini-1.5-flash 지정');

    // Subsequent Flash turn:
    const res3 = ledger.deduct(500, { modelId: 'gemini-1.5-flash' });
    assert(res3.success === true, 'Flash 차감 정상 처리');
    assert(ledger.flashRequestsUsed === 101, 'Flash 사용 횟수 101회로 정상 증가');
  }

  // Test Suite 2: 다차원 쿼터 차감 엔진 (QuotaDeductionEngine)
  console.log('\n[Test Suite 2] 다차원 쿼터 차감 엔진 (QuotaDeductionEngine) 계산 및 가중치');
  {
    const engine = new QuotaDeductionEngine({
      proModelMultiplier: 2.5,
      flashModelMultiplier: 1.0,
      completionCostWeight: 1.25,
    });

    // Effective token calculation for Flash
    // prompt 1000 + completion 400 * 1.25 = 1000 + 500 = 1500 * 1.0 = 1500
    const calcFlash = engine.calculateEffectiveTokens('gemini-1.5-flash', 1000, 400);
    assert(calcFlash.effectiveTokens === 1500, `Flash 유효 가중 토큰 계산 확인: ${calcFlash.effectiveTokens}`);
    assert(calcFlash.multiplier === 1.0, 'Flash 승수 1.0x 확인');

    // Effective token calculation for Pro
    // 1500 * 2.5 = 3750
    const calcPro = engine.calculateEffectiveTokens('gemini-1.5-pro', 1000, 400);
    assert(calcPro.effectiveTokens === 3750, `Pro 유효 가중 토큰 계산 확인: ${calcPro.effectiveTokens}`);
    assert(calcPro.multiplier === 2.5, 'Pro 승수 2.5x 확인');

    const ledger = new AccountQuotaLedger({
      ledgerId: 'LDG-ENG-001',
      userId: 'USER-ENG',
      planId: 'PLAN-PRO',
      totalGrantedQuota: 500000,
      usedQuota: 0,
      remainingQuota: 500000,
      proRequestsLimit: 250,
      proRequestsUsed: 0,
    });

    const execResult = engine.executeDeduction(ledger, {
      userId: 'USER-ENG',
      modelId: 'gemini-1.5-pro',
      promptTokens: 1000,
      completionTokens: 400,
      context: { sessionId: 'SES-0009', taskId: 'TASK-02' },
    });

    assert(execResult.success === true, '엔진 executeDeduction 성공');
    assert(execResult.effectiveTokensDeducted === 3750, '원장에서 3,750 유효 토큰 차감 확인');
    assert(ledger.remainingQuota === 500000 - 3750, '잔여 쿼터 정확히 감소');
  }

  // Test Suite 3: 행(Hang) 상태 판정 로직 (SessionDisasterRecoveryService)
  console.log('\n[Test Suite 3] 행(Hang) 상태 판독 및 분류 검증 (SessionDisasterRecoveryService)');
  {
    // Case 1: 일일 쿼터 소진
    const quotaExhausted = SessionDisasterRecoveryService.assessHangStatus({
      httpStatus: 429,
      errorMessage: 'RESOURCE_EXHAUSTED: quota exceeded for model gemini-1.5-pro',
    });
    assert(quotaExhausted.status === 'HANG_QUOTA_EXHAUSTED', '일일 쿼터 소진 상태 정확히 판정');
    assert(quotaExhausted.badgeColor === 'red', '빨간색 경고 배지 확인');

    // Case 2: 순간 과부하 (503 또는 model overloaded)
    const overload = SessionDisasterRecoveryService.assessHangStatus({
      httpStatus: 503,
      errorMessage: 'The model is overloaded. Please try again later.',
    });
    assert(overload.status === 'HANG_OVERLOAD', '순간 과부하 지연 상태 판정');
    assert(overload.badgeColor === 'yellow', '노란색 일시 대기 배지 확인');

    // Case 3: 15만 토큰 컨텍스트 포화
    const contextBloat = SessionDisasterRecoveryService.assessHangStatus({
      contextTokens: 165000,
    });
    assert(contextBloat.status === 'HANG_CONTEXT_BLOAT', '15만 컨텍스트 포화 상태 정확히 판정');
    assert(contextBloat.badgeColor === 'orange', '주황색 인계 권고 배지 확인');

    // Case 4: 10분 이상 무응답
    const indeterminate = SessionDisasterRecoveryService.assessHangStatus({
      silentDurationSeconds: 650,
    });
    assert(indeterminate.status === 'HANG_INDETERMINATE', '10분 이상 지연 원인 불명 판정');

    // Case 5: 정상
    const normal = SessionDisasterRecoveryService.assessHangStatus({
      contextTokens: 80000,
      silentDurationSeconds: 30,
    });
    assert(normal.status === 'NORMAL', '정상 상태 판정');
  }

  // Test Suite 4: 세션 복구 (#세션복구) 1건 자동 vs 다건 선택 분기 검증
  console.log('\n[Test Suite 4] 세션 복구 (#세션복구) 라우팅 및 타겟팅 검증');
  {
    // 0건 스냅샷
    const emptyRes = SessionDisasterRecoveryService.resolveRecoveryTarget([]);
    assert(emptyRes.strategy === 'NO_SNAPSHOT', '스냅샷 부재 시 NO_SNAPSHOT 반환');

    // 1건 스냅샷 -> DIRECT_RESTORE 자동 직결
    const singleSnap: SessionSnapshot = {
      snapshotId: 'SNAP-001',
      sessionNum: '0009',
      sessionTitle: '[0009] 메타 거버넌스',
      latestCommitSha: '7109f1c922',
      branch: 'dev',
      status: 'PENDING_RECOVERY',
      createdAt: new Date().toISOString(),
    };
    const singleRes = SessionDisasterRecoveryService.resolveRecoveryTarget([singleSnap]);
    assert(singleRes.strategy === 'DIRECT_RESTORE', '1건 존재 시 DIRECT_RESTORE 자동 직결');
    assert(singleRes.targetSnapshot?.snapshotId === 'SNAP-001', '대상 스냅샷 일치 확인');

    // 다건 스냅샷 -> SHOW_SELECTION_LIST 다건 목록 제시
    const snap2: SessionSnapshot = {
      snapshotId: 'SNAP-002',
      sessionNum: '0010',
      sessionTitle: '[0010] 후속 작업',
      latestCommitSha: 'abc123456',
      branch: 'dev',
      status: 'PENDING_RECOVERY',
      createdAt: new Date().toISOString(),
    };
    const multiRes = SessionDisasterRecoveryService.resolveRecoveryTarget([singleSnap, snap2]);
    assert(multiRes.strategy === 'SHOW_SELECTION_LIST', '다건 존재 시 SHOW_SELECTION_LIST 반환');
    assert(multiRes.candidates?.length === 2, '2건 후보 목록 반환');

    // 특정 타겟 명시 (#세션복구:0010)
    const targetRes = SessionDisasterRecoveryService.resolveRecoveryTarget([singleSnap, snap2], '0010');
    assert(targetRes.strategy === 'DIRECT_RESTORE', '타겟 번호 명시 시 즉각 DIRECT_RESTORE 전개');
    assert(targetRes.targetSnapshot?.sessionNum === '0010', '지정된 0010 세션 스냅샷 타겟팅 확인');
  }

  console.log('\n================================================================');
  console.log('🎉 모든 비-LLM 긴급 Push 및 세션 DR 도메인 단위 검증이 100% 통과했습니다!');
  console.log('================================================================\n');
}

runTests().catch((e) => {
  console.error('Test Suite Failed:', e);
  process.exit(1);
});
