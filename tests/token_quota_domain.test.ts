/**
 * @file token_quota_domain.test.ts
 * @description 토큰 쿼터 도메인 및 하네스 자동화 서비스 TDD 단위 테스트
 */

import { TokenUsageEstimator } from '../src/aiagent/domain/token-quota/TokenUsageEstimator';
import { HarnessAutomationService } from '../src/aiagent/services/HarnessAutomationService';
import {
  TokenEstimationStrategyFactory,
  TokenTelemetry,
  HandoffDossierBuilder,
  SessionScorecardCalculator,
} from '../src/aiagent/domain/token-quota';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`❌ Assertion Failed: ${message}`);
  }
  console.log(`  ✅ ${message}`);
}

async function runTests() {
  console.log('================================================================');
  console.log('🧪 [TDD] 토큰 소진 방지 및 하네스 자동화 도메인 단위 검증 착수');
  console.log('================================================================\n');

  // Test Suite 1: 토큰 추정 휴리스틱 및 언어/제공자 가중치
  console.log('[Test Suite 1] 휴리스틱 토큰 추정 (Language & Provider Weighting)');
  {
    const empty = TokenUsageEstimator.estimateTokens('');
    assert(empty === 0, '빈 문자열은 0 토큰 반환');

    const korean = TokenUsageEstimator.estimateTokens('안녕하세요 반갑습니다.');
    assert(korean > 10, `한글 문자열 토큰 추정 유효 (${korean} tokens)`);

    const codeWithJson = TokenUsageEstimator.estimateTokens('```json\n{"status": "ok", "count": 100}\n```');
    assert(codeWithJson >= 12, `코드 및 JSON 블록 10% 가산 적용 확인 (${codeWithJson} tokens)`);

    const geminiTokens = TokenUsageEstimator.estimateTokens('Test prompt string', 'gemini');
    const claudeTokens = TokenUsageEstimator.estimateTokens('Test prompt string', 'claude');
    assert(claudeTokens >= geminiTokens, `제공자별 가중치 적용 확인 (Gemini: ${geminiTokens}, Claude: ${claudeTokens})`);
  }

  // Test Suite 2: 4계층 텔레메트리 (Velocity, Burst, LSM, BRI)
  console.log('\n[Test Suite 2] 4계층 텔레메트리 수식 검증 (Velocity, Burst, LSM, BRI)');
  {
    const mockTraces = [
      { step_index: 1, loop_id: 'LOOP-01', total_tokens: 2000, estimated_tokens: 2000 },
      { step_index: 2, loop_id: 'LOOP-01', total_tokens: 2500, estimated_tokens: 2500 },
      { step_index: 3, loop_id: 'LOOP-02', total_tokens: 8000, estimated_tokens: 8000 }, // Sudden Burst!
    ];

    const telemetry = TokenUsageEstimator.calculateTelemetry({
      promptTokens: 2000,
      completionTokens: 6000,
      sessionTotalTokens: 12500,
      recentTurnTokens: [2000, 2500, 8000],
      sessionBudget: 100000,
      calibrationAlpha: 1.05,
    });

    assert(telemetry.burst_score > 1.2, `버스트 스코어(B) 급증 감지 확인 (B = ${telemetry.burst_score.toFixed(2)})`);
    assert(telemetry.burn_rate_velocity > 0, `소모 속도(v) 양수 확인 (v = ${telemetry.burn_rate_velocity.toFixed(1)} tokens/turn)`);
    assert(telemetry.loop_safety_margin > 0, `루프 안전 여유도(LSM) 산출 확인 (LSM = ${telemetry.loop_safety_margin} loops)`);
    assert(telemetry.burnout_risk_index >= 0 && telemetry.burnout_risk_index <= 100, `BRI 지표 정규화 확인 (BRI = ${telemetry.burnout_risk_index}%)`);
    assert(telemetry.risk_level === 'SAFE' || telemetry.risk_level === 'CAUTION' || telemetry.risk_level === 'CRITICAL', `위험 레벨 유효성 검증 (${telemetry.risk_level})`);
  }

  // Test Suite 3: 자가 적응형 스코어카드 및 EMA 보정 (Self-Adaptive Calibration)
  console.log('\n[Test Suite 3] 자가 적응형 스코어카드 및 차기 세션 보정치(α) 산출');
  {
    const traces = [
      { step_index: 1, loop_id: 'LOOP-01', prompt_tokens: 1000, completion_tokens: 2000, total_tokens: 3000, user_prompt: 'git push 실행', agent_response: 'github_sync_push.ts 완료' },
      { step_index: 2, loop_id: 'LOOP-01', prompt_tokens: 1000, completion_tokens: 3000, total_tokens: 4000, user_prompt: 'git commit 점검', agent_response: 'POST /git/commits 성공' },
      { step_index: 3, loop_id: 'LOOP-02', prompt_tokens: 500, completion_tokens: 1500, total_tokens: 2000, user_prompt: 'check:service 점검', agent_response: '전반적인 서비스 전수 점검 완료' },
    ];

    const scorecard = TokenUsageEstimator.generateSessionScorecard({
      sessionId: 'TEST-SESSION-01',
      traces,
      loopsCount: 2,
      currentAlpha: 1.08,
      sessionBudget: 100000,
    });

    assert(scorecard.total_turns === 3, '총 3개 턴 집계 확인');
    assert(scorecard.total_tokens === 9000, '총 9000 토큰 합산 확인');
    assert(scorecard.mape_percent > 0 && scorecard.mape_percent < 50, `MAPE 오차율 산출 확인 (${scorecard.mape_percent}%)`);
    assert(scorecard.calibration_weight_alpha !== 1.0, `차기 세션 보정치 α 갱신 확인 (α = ${scorecard.calibration_weight_alpha.toFixed(3)})`);
    assert(scorecard.api_candidate_proposals.length >= 1, `반복 Git/헬스체크 패턴 기반 API 제안 확인 (${scorecard.api_candidate_proposals.length}건 제안)`);
  }

  // Test Suite 4: 무손실 세션 인계 도시에(Handover Dossier)
  console.log('\n[Test Suite 4] 무손실 세션 인계 도시에 (Handover Dossier) 생성 검증');
  {
    const baselineRefs = {
      session_id: 'TEST-SESSION-01',
      task_id: 'TASK-01',
      base_ref: 'abc1234567890abcdef',
      task_checkpoint_ref: 'def0987654321fedcba',
      current_branch: 'task/사용량_계정관리개선_Gemini',
      is_clean: true,
      modified_files: [],
    };

    const dossier = TokenUsageEstimator.createHandoverDossier({
      parentSessionId: 'TEST-SESSION-01',
      lastTaskId: 'TASK-01',
      lastTaskName: '에이전트 사용량 관리체계 구축',
      branch: baselineRefs.current_branch,
      baselineRefs,
      pendingBacklogs: [
        { id: 'BL-01', title: '계정별 의존성 격리 점검', target_layer: '도메인' },
      ],
      reason: 'SUSPENDED_QUOTA',
    });

    assert(dossier.handoff_token.startsWith('HANDOFF-'), `인계 토큰 발급 확인 (${dossier.handoff_token})`);
    assert(dossier.resume_prompt.includes('parent_session_id="TEST-SESSION-01"'), '즉시 착수 프롬프트에 부모 세션 ID 포함 확인');
    assert(dossier.resume_prompt.includes(baselineRefs.base_ref), '불변 기준 커밋 SHA 포함 확인');
    assert(dossier.pending_backlogs.length === 1, '미완료 백로그 1건 상속 확인');
  }

  // Test Suite 5: 하네스 자동화 머신 (GitOps Baseline & E-Function Condenser)
  console.log('\n[Test Suite 5] 하네스 자동화 머신 (GitOps 3대 기준점 & 터미널 Condenser)');
  {
    const gitRefs = HarnessAutomationService.getGitBaselineRefs();
    assert(gitRefs.base_ref.length > 0, `Git Base Ref 확인 (${gitRefs.base_ref.slice(0, 8)}...)`);
    assert(gitRefs.current_branch.length > 0, `작업 브랜치 확인 (${gitRefs.current_branch})`);

    // E-Function Terminal Condenser 검증
    const verboseRawOutput = `
Running 4-phase comprehensive service health check...
[Phase 1] DB Connectivity... OK
[Phase 2] Route Endpoints... GET /api/agent/usage OK
[Phase 3] Git Status... clean
[Phase 4] PurePDFrend Viewer... READY
===================================================
Summary: 14 checks passed, 0 failures, 0 warnings.
Total execution time: 1.42s
    `;
    const condensed = HarnessAutomationService.condenseHealthCheck(verboseRawOutput);
    assert(condensed.status === 'HEALTHY', `Condenser 상태 요약 성공 (${condensed.status})`);
    assert(condensed.tokens_saved_estimate > 0, `토큰 절약치 추정 확인 (${condensed.tokens_saved_estimate} tokens saved)`);
    assert(condensed.compressed_summary.length > 0, '압축된 요약본 생성 확인');

    // 계정별 쿼터 조회 검증
    const accountQuota = HarnessAutomationService.getAccountQuotaUsage('jkoogit@gmail.com');
    assert(accountQuota.allocated_quota === 200000, '기본 할당 쿼터 200,000 확인');
    assert(accountQuota.remaining_quota >= 0, `잔여 쿼터 양수 확인 (${accountQuota.remaining_quota.toLocaleString()})`);
  }

  // Test Suite 6: OOP / DDD 리팩토링 디자인 패턴 및 격리 도메인 단위 검증
  console.log('\n[Test Suite 6] OOP / DDD 리팩토링 디자인 패턴 및 격리 도메인 검증');
  {
    // 1. Strategy Pattern 검증
    const geminiStrategy = TokenEstimationStrategyFactory.getStrategy('gemini');
    const claudeStrategy = TokenEstimationStrategyFactory.getStrategy('claude');
    const sampleText = '안녕 Hello World 123';
    const geminiTokens = geminiStrategy.calculate(sampleText);
    const claudeTokens = claudeStrategy.calculate(sampleText);
    assert(claudeTokens >= geminiTokens, `Strategy Pattern 가중치 차등 검증 (Gemini: ${geminiTokens}, Claude: ${claudeTokens})`);

    // 2. Value Object Pattern (TokenTelemetry) 비즈니스 규칙 메서드 검증
    const safeTelemetry = new TokenTelemetry({
      prompt_tokens: 1000,
      completion_tokens: 500,
      total_tokens: 1500,
      estimated_tokens: 1500,
      burst_score: 1.0,
      burn_rate_velocity: 1500,
      loop_safety_margin: 8.0,
      burnout_risk_index: 25,
      risk_level: 'SAFE',
    });
    assert(safeTelemetry.isSafe() === true, 'TokenTelemetry.isSafe() 불변 판정 확인');
    assert(safeTelemetry.hasBurstRisk() === false, 'TokenTelemetry.hasBurstRisk() 정상 판정 확인');
    assert(safeTelemetry.hasEnoughMarginForLoop(3) === true, 'TokenTelemetry.hasEnoughMarginForLoop() 루프 가용성 확인');

    const criticalTelemetry = new TokenTelemetry({
      prompt_tokens: 8000,
      completion_tokens: 4000,
      total_tokens: 12000,
      estimated_tokens: 13000,
      burst_score: 2.1,
      burn_rate_velocity: 8000,
      loop_safety_margin: 1.1,
      burnout_risk_index: 88,
      risk_level: 'CRITICAL',
    });
    assert(criticalTelemetry.isCritical() === true, 'TokenTelemetry.isCritical() 위험 판정 확인');
    assert(criticalTelemetry.hasBurstRisk() === true, 'TokenTelemetry.hasBurstRisk() 폭증 감지 확인');

    // 3. Builder Pattern (HandoffDossierBuilder) 단계별 조립 및 유효성 검증
    const builtDossier = new HandoffDossierBuilder()
      .setParentSession('OOP-PARENT-01')
      .setLastTask('TASK-OOP-01', 'DDD 리팩토링')
      .setBranch('task/oop_refactoring')
      .setCalibrationAlpha(1.12)
      .setReason('SUSPENDED_QUOTA')
      .addPendingBacklog({ id: 'BL-01', title: '캐시 계층 분리', target_layer: '도메인' })
      .build();
    assert(builtDossier.parent_session_id === 'OOP-PARENT-01', 'Builder 부모 세션 ID 바인딩 확인');
    assert(builtDossier.calibration_alpha === 1.12, 'Builder 알파 보정치 바인딩 확인');
    assert(builtDossier.pending_backlogs.length === 1, 'Builder 미완료 백로그 추가 확인');
    assert(builtDossier.resume_prompt.includes('OOP-PARENT-01'), 'Builder 프롬프트 템플릿 정상 렌더링 확인');

    // 4. Domain Service (SessionScorecardCalculator) 직접 호출 검증
    const directScorecard = SessionScorecardCalculator.calculate({
      sessionId: 'DIRECT-SESSION-01',
      traces: [
        { prompt_tokens: 2000, completion_tokens: 1000, total_tokens: 3000, user_prompt: 'git push', agent_response: 'github_sync_push' },
        { prompt_tokens: 3000, completion_tokens: 2000, total_tokens: 5000, user_prompt: 'git status', agent_response: 'POST /git/trees' },
      ],
      loopsCount: 1,
      currentAlpha: 1.0,
      sessionBudget: 50000,
    });
    assert(directScorecard.session_id === 'DIRECT-SESSION-01', 'Domain Service 스코어카드 독립 산출 확인');
    assert(directScorecard.total_tokens === 8000, 'Domain Service 총 토큰 8,000 확인');
  }

  console.log('\n================================================================');
  console.log('🎉 [TDD 완료] 모든 토큰 소진 방지 및 하네스 자동화 테스트 통과!');
  console.log('================================================================');
}

runTests().catch((err) => {
  console.error('\n❌ 테스트 실패:', err);
  process.exit(1);
});
