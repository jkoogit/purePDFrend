import { UserAiAccount } from '../models/UserAiAccount';
import { VendorAttribute } from '../models/VendorAttribute';

export interface PromptTierConfig {
  tier1Model?: string;
  tier2Model?: string;
  tier3Model?: string;
  activeAccountId?: string;
  assignedBudget?: number;
}

export interface SessionResourceSnapshot {
  sessionId: string;
  userId: string;
  accountId: string;
  accountEmail: string;
  accountLabel: string;
  vendorId: string;
  planId: string;
  planName: string;
  tierPolicy: {
    tier1: {
      model: string;
      fallbackModel: string;
      rpdLimit: number;
      rpdConsumed: number;
      assignedPhases: string[];
    };
    tier2: {
      model: string;
      fallbackModel: string;
      rpdLimit: number;
      rpdConsumed: number;
      assignedPhases: string[];
    };
    tier3: {
      model: string;
      fallbackModel: string;
      rpdLimit: number;
      rpdConsumed: number;
      assignedPhases: string[];
    };
  };
  resourceBaseline: {
    initialTokenBalance: number;
    currentTokenBalance: number;
    totalSessionConsumedTokens: number;
    totalSessionTurnCount: number;
    dailyRpdLimit: number;
    dailyRpdConsumed: number;
    resetHourKst: number;
    lastSyncedAt: string;
  };
}

export class SessionResourceManager {
  /**
   * 세션 시작 시 프롬프트 설정과 DB 정보를 병합하여 무결한 세션 자원 스냅샷 생성
   */
  public static initSessionResource(
    sessionId: string,
    account: UserAiAccount,
    vendor: VendorAttribute,
    promptConfig?: PromptTierConfig
  ): SessionResourceSnapshot {
    const plan = vendor.subscriptionPlans.find(p => p.planId === account.planId) || vendor.subscriptionPlans[0];

    // 우선순위: 프롬프트 명시 > 계정별 오버라이드 > 플랜 허용 최상위 모델
    const tier1Model = promptConfig?.tier1Model 
      || account.tierOverride?.tier1Model 
      || (plan.allowedModels.includes('models/gemini-1.5-pro') ? 'models/gemini-1.5-pro' : plan.allowedModels[0]);

    const tier2Model = promptConfig?.tier2Model 
      || account.tierOverride?.tier2Model 
      || 'models/gemini-1.5-flash';

    const tier3Model = promptConfig?.tier3Model 
      || account.tierOverride?.tier3Model 
      || 'models/gemini-1.5-flash-8b';

    const maxRpd = plan.quotaLimits.maxRpd || 250;
    const initialBalance = promptConfig?.assignedBudget || 5000000;

    return {
      sessionId,
      userId: account.userId,
      accountId: account.accountId,
      accountEmail: account.accountEmail,
      accountLabel: account.accountLabel,
      vendorId: account.vendorId,
      planId: plan.planId,
      planName: plan.planName,
      tierPolicy: {
        tier1: {
          model: tier1Model,
          fallbackModel: 'models/gemini-1.5-flash',
          rpdLimit: maxRpd,
          rpdConsumed: 0,
          assignedPhases: ['#태스크시작', '아키텍처설계', '도메인모델링']
        },
        tier2: {
          model: tier2Model,
          fallbackModel: 'models/gemini-1.5-flash-8b',
          rpdLimit: 2500,
          rpdConsumed: 0,
          assignedPhases: ['#태스크처리', 'TDD단위검증', '린트컴파일보정']
        },
        tier3: {
          model: tier3Model,
          fallbackModel: 'models/gemini-1.5-flash-8b',
          rpdLimit: 4000,
          rpdConsumed: 0,
          assignedPhases: ['#태스크정리', '#태스크승급', '문서발행', 'GitPush']
        }
      },
      resourceBaseline: {
        initialTokenBalance: initialBalance,
        currentTokenBalance: initialBalance,
        totalSessionConsumedTokens: 0,
        totalSessionTurnCount: 0,
        dailyRpdLimit: maxRpd,
        dailyRpdConsumed: 0,
        resetHourKst: plan.quotaLimits.resetHourKst || 16,
        lastSyncedAt: new Date().toISOString()
      }
    };
  }

  /**
   * 세션 작업 중 외부 원장과 실시간 동기화 (KST 16:00 리셋 및 타 세션 소비 반영)
   */
  public static resyncResource(
    current: SessionResourceSnapshot,
    ledgerBalance: number,
    ledgerDailyRpdConsumed: number
  ): { updated: SessionResourceSnapshot; deltaTokens: number; deltaRpd: number } {
    const prevTokens = current.resourceBaseline.currentTokenBalance;
    const prevRpd = current.resourceBaseline.dailyRpdConsumed;
    const safeBalance = Math.max(0, Math.floor(Number(ledgerBalance) || 0));
    const safeRpd = Math.max(0, Math.floor(Number(ledgerDailyRpdConsumed) || 0));

    const updated: SessionResourceSnapshot = {
      ...current,
      resourceBaseline: {
        ...current.resourceBaseline,
        currentTokenBalance: safeBalance,
        dailyRpdConsumed: safeRpd,
        lastSyncedAt: new Date().toISOString()
      }
    };

    return {
      updated,
      deltaTokens: safeBalance - prevTokens,
      deltaRpd: safeRpd - prevRpd
    };
  }

  /**
   * 정확한 정수 단위 토큰 소비 연산 (API 전담 및 음수/소수 방어)
   */
  public static recordConsumption(
    current: SessionResourceSnapshot,
    tokensSpent: number,
    tier: 'tier1' | 'tier2' | 'tier3'
  ): SessionResourceSnapshot {
    const safeTokensSpent = Math.max(0, Math.floor(Number(tokensSpent) || 0));
    const newConsumed = current.resourceBaseline.totalSessionConsumedTokens + safeTokensSpent;
    const newBalance = Math.max(0, current.resourceBaseline.currentTokenBalance - safeTokensSpent);
    const newTurnCount = current.resourceBaseline.totalSessionTurnCount + 1;
    const newDailyRpd = current.resourceBaseline.dailyRpdConsumed + 1;

    const updatedTierPolicy = { ...current.tierPolicy };
    if (updatedTierPolicy[tier]) {
      updatedTierPolicy[tier] = {
        ...updatedTierPolicy[tier],
        rpdConsumed: updatedTierPolicy[tier].rpdConsumed + 1
      };
    }

    return {
      ...current,
      tierPolicy: updatedTierPolicy,
      resourceBaseline: {
        ...current.resourceBaseline,
        currentTokenBalance: newBalance,
        totalSessionConsumedTokens: newConsumed,
        totalSessionTurnCount: newTurnCount,
        dailyRpdConsumed: newDailyRpd,
        lastSyncedAt: new Date().toISOString()
      }
    };
  }

  /**
   * 세션 정리 시 차기 세션 착수용 표준 프롬프트 조립
   */
  public static buildNextSessionPrompt(
    nextSessionNumber: string,
    nextSessionTitle: string,
    snapshot: SessionResourceSnapshot
  ): string {
    const tier1 = snapshot.tierPolicy.tier1;
    const tier2 = snapshot.tierPolicy.tier2;
    const tier3 = snapshot.tierPolicy.tier3;
    const baseline = snapshot.resourceBaseline;

    return `#세션시작 [${nextSessionNumber}]${nextSessionTitle}
- 사용자 ID: ${snapshot.userId} (${snapshot.accountEmail})
- 활성 AI 계정: ${snapshot.accountId} (${snapshot.accountLabel})
- 적용 플랜: ${snapshot.planName}
- 티어별 모델 설정:
  * Tier 1 (기획/설계): ${tier1.model} (잔여 RPD: ${Math.max(0, tier1.rpdLimit - baseline.dailyRpdConsumed)} / ${tier1.rpdLimit})
  * Tier 2 (구현/검증): ${tier2.model} (기본)
  * Tier 3 (정리/배포): ${tier3.model}
- 시작 기준 잔여 토큰: ${baseline.currentTokenBalance.toLocaleString()} Tokens
- 일일 리셋 기준: KST ${baseline.resetHourKst}:00 (PST 00:00)`;
  }
}
