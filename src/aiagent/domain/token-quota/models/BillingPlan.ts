/**
 * @file BillingPlan.ts
 * @description 요금제 엔티티 (Billing Plan Domain Model)
 */

export type OveragePolicy = 'BLOCK' | 'THROTTLE' | 'PAY_AS_YOU_GO';

export interface BillingPlanProps {
  planId: string;
  planName: string;
  description?: string;
  baseQuotaTokens: number;
  maxBurstMultiplier: number;
  priorityTier: number; // 1 (Lowest) ~ 10 (Highest)
  overagePolicy: OveragePolicy;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export class BillingPlan {
  public readonly planId: string;
  public readonly planName: string;
  public readonly description: string;
  public readonly baseQuotaTokens: number;
  public readonly maxBurstMultiplier: number;
  public readonly priorityTier: number;
  public readonly overagePolicy: OveragePolicy;
  public readonly isActive: boolean;
  public readonly createdAt: string;
  public readonly updatedAt: string;

  constructor(props: BillingPlanProps) {
    if (!props.planId || !props.planName) {
      throw new Error('BillingPlan: planId와 planName은 필수 필드입니다.');
    }
    this.planId = props.planId;
    this.planName = props.planName;
    this.description = props.description || '';
    this.baseQuotaTokens = Math.max(0, Number(props.baseQuotaTokens) || 0);
    this.maxBurstMultiplier = Math.max(1.0, Number(props.maxBurstMultiplier) || 1.5);
    this.priorityTier = Math.min(10, Math.max(1, Number(props.priorityTier) || 5));
    this.overagePolicy = props.overagePolicy || 'BLOCK';
    this.isActive = props.isActive !== false;
    this.createdAt = props.createdAt || new Date().toISOString();
    this.updatedAt = props.updatedAt || new Date().toISOString();
  }

  /**
   * 버스트 지수(B)가 플랜의 허용 배수 내에 있는지 판별
   */
  public isBurstPermitted(burstScore: number): boolean {
    return burstScore <= this.maxBurstMultiplier;
  }

  /**
   * 초과 정책 판별
   */
  public isHardBlockedOnExhaustion(): boolean {
    return this.overagePolicy === 'BLOCK';
  }

  public allowsPayAsYouGo(): boolean {
    return this.overagePolicy === 'PAY_AS_YOU_GO';
  }
}
