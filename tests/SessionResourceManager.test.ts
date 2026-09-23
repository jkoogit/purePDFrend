import { describe, it, expect } from 'vitest';
import { 
  VendorAttribute, 
  UserAiAccount, 
  SessionResourceManager 
} from '../src/aiagent/domain/token-quota';

describe('SessionResourceManager Domain & Quota Tests', () => {
  it('1. 세션 시작 시 계정 오버라이드 및 프롬프트 설정을 올바르게 병합하여 스냅샷을 생성해야 한다', () => {
    const vendor = VendorAttribute.createDefaultGoogleVendor();
    const accounts = UserAiAccount.createDefaultUserAccounts('USER-DEV-001', 'jkoogit@gmail.com');
    const defaultAcc = accounts[0]; // Pro 계정

    const snapshot = SessionResourceManager.initSessionResource(
      'SESSION-20260923-007',
      defaultAcc,
      vendor,
      {
        tier1Model: 'models/gemini-1.5-pro',
        assignedBudget: 4000000
      }
    );

    expect(snapshot.sessionId).toBe('SESSION-20260923-007');
    expect(snapshot.accountId).toBe('ACC-USER-DEV-001-GOOGLE-PRO');
    expect(snapshot.tierPolicy.tier1.model).toBe('models/gemini-1.5-pro');
    expect(snapshot.tierPolicy.tier1.rpdLimit).toBe(250);
    expect(snapshot.resourceBaseline.currentTokenBalance).toBe(4000000);
    expect(snapshot.resourceBaseline.resetHourKst).toBe(16);
  });

  it('2. 세션 작업 중 외부 원장과 실시간 동기화(Re-sync) 시 변동량을 정확히 계산해야 한다', () => {
    const vendor = VendorAttribute.createDefaultGoogleVendor();
    const accounts = UserAiAccount.createDefaultUserAccounts('USER-DEV-001', 'jkoogit@gmail.com');
    const snapshot = SessionResourceManager.initSessionResource(
      'SESSION-20260923-007',
      accounts[0],
      vendor
    );

    // 원장에서 외부 세션이 1,000,000 토큰을 소비하고 Pro 10회를 사용했다고 가정
    const { updated, deltaTokens, deltaRpd } = SessionResourceManager.resyncResource(
      snapshot,
      4000000, // 기존 500만 -> 400만
      10       // 기존 0회 -> 10회
    );

    expect(deltaTokens).toBe(-1000000);
    expect(deltaRpd).toBe(10);
    expect(updated.resourceBaseline.currentTokenBalance).toBe(4000000);
    expect(updated.resourceBaseline.dailyRpdConsumed).toBe(10);
  });

  it('3. 정수 단위의 결정론적 쿼터 차감 연산이 오차 없이 누적되어야 한다', () => {
    const vendor = VendorAttribute.createDefaultGoogleVendor();
    const accounts = UserAiAccount.createDefaultUserAccounts('USER-DEV-001', 'jkoogit@gmail.com');
    let snapshot = SessionResourceManager.initSessionResource(
      'SESSION-20260923-007',
      accounts[0],
      vendor
    );

    // 턴 1: 50,000 토큰 소비 (Tier 2 Flash)
    snapshot = SessionResourceManager.recordConsumption(snapshot, 50000, 'tier2');
    expect(snapshot.resourceBaseline.currentTokenBalance).toBe(4950000);
    expect(snapshot.resourceBaseline.totalSessionConsumedTokens).toBe(50000);
    expect(snapshot.resourceBaseline.totalSessionTurnCount).toBe(1);
    expect(snapshot.tierPolicy.tier2.rpdConsumed).toBe(1);

    // 턴 2: 120,500 토큰 소비 (Tier 1 Pro)
    snapshot = SessionResourceManager.recordConsumption(snapshot, 120500, 'tier1');
    expect(snapshot.resourceBaseline.currentTokenBalance).toBe(4829500);
    expect(snapshot.resourceBaseline.totalSessionConsumedTokens).toBe(170500);
    expect(snapshot.resourceBaseline.totalSessionTurnCount).toBe(2);
    expect(snapshot.tierPolicy.tier1.rpdConsumed).toBe(1);
  });

  it('4. 차기 세션 인계 프롬프트를 규칙에 부합하게 생성해야 한다', () => {
    const vendor = VendorAttribute.createDefaultGoogleVendor();
    const accounts = UserAiAccount.createDefaultUserAccounts('USER-DEV-001', 'jkoogit@gmail.com');
    const snapshot = SessionResourceManager.initSessionResource(
      'SESSION-20260923-007',
      accounts[0],
      vendor
    );

    const prompt = SessionResourceManager.buildNextSessionPrompt(
      '0011',
      '신규 태스크 업무',
      snapshot
    );

    expect(prompt).toContain('#세션시작 [0011]신규 태스크 업무');
    expect(prompt).toContain('models/gemini-1.5-pro');
    expect(prompt).toContain('KST 16:00');
  });

  it('5. 음수 토큰 소비나 비정상 입력값에 대해 안전하게 0으로 보정해야 한다', () => {
    const vendor = VendorAttribute.createDefaultGoogleVendor();
    const accounts = UserAiAccount.createDefaultUserAccounts('USER-DEV-001', 'jkoogit@gmail.com');
    let snapshot = SessionResourceManager.initSessionResource(
      'SESSION-20260923-007',
      accounts[0],
      vendor
    );

    const initialTokens = snapshot.resourceBaseline.currentTokenBalance;
    // 음수 소비 시도
    snapshot = SessionResourceManager.recordConsumption(snapshot, -50000, 'tier2');
    expect(snapshot.resourceBaseline.currentTokenBalance).toBe(initialTokens);
    expect(snapshot.resourceBaseline.totalSessionConsumedTokens).toBe(0);

    // 소수점 소비 시도 (내림 보정)
    snapshot = SessionResourceManager.recordConsumption(snapshot, 100.9, 'tier2');
    expect(snapshot.resourceBaseline.totalSessionConsumedTokens).toBe(100);
  });

  it('6. 토큰 잔액을 초과하는 대량 소비 시 잔액이 음수로 떨어지지 않고 0(Zero-Floor)으로 안전하게 방어되어야 한다', () => {
    const vendor = VendorAttribute.createDefaultGoogleVendor();
    const accounts = UserAiAccount.createDefaultUserAccounts('USER-DEV-001', 'jkoogit@gmail.com');
    let snapshot = SessionResourceManager.initSessionResource(
      'SESSION-20260923-007',
      accounts[0],
      vendor,
      { assignedBudget: 1000 }
    );

    // 1000 토큰 예산 상태에서 50000 토큰 소비 시도
    snapshot = SessionResourceManager.recordConsumption(snapshot, 50000, 'tier1');
    expect(snapshot.resourceBaseline.currentTokenBalance).toBe(0); // Zero-floor
    expect(snapshot.resourceBaseline.totalSessionConsumedTokens).toBe(50000);
  });

  it('7. VendorAttribute와 UserAiAccount 도메인 엔티티의 초기화 및 플랜 허용 모델 검증', () => {
    const vendor = VendorAttribute.createDefaultGoogleVendor();
    expect(vendor.vendorId).toBe('GOOGLE');
    expect(vendor.originType).toBe('SYSTEM_CONFIRMED');
    expect(vendor.subscriptionPlans.length).toBeGreaterThanOrEqual(2);
    
    const proPlan = vendor.subscriptionPlans.find(p => p.planId === 'PLAN-GOOGLE-ADVANCED');
    expect(proPlan?.quotaLimits.maxRpd).toBe(250);
    expect(proPlan?.allowedModels).toContain('models/gemini-1.5-pro');

    const accounts = UserAiAccount.createDefaultUserAccounts('USER-DEV-001', 'jkoogit@gmail.com');
    expect(accounts.length).toBe(2);
    expect(accounts[0].isDefault).toBe(true);
    expect(accounts[1].isDefault).toBe(false);
  });
});
