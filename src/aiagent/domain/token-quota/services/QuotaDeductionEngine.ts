/**
 * @file QuotaDeductionEngine.ts
 * @description 다차원 토큰 및 모델별 호출 횟수(Pro 250회/Flash 2,500회) 듀얼 쿼터 차감 엔진
 */

import { AccountQuotaLedger, DeductionContext, DeductionResult } from '../models/AccountQuotaLedger';

export interface QuotaEngineConfig {
  proModelMultiplier?: number;      // 기본: 2.5
  flashModelMultiplier?: number;    // 기본: 1.0
  completionCostWeight?: number;    // 기본: 1.25 (응답 토큰 가중치)
}

export interface TurnDeductionRequest {
  userId: string;
  modelId: string;
  promptTokens: number;
  completionTokens: number;
  context?: DeductionContext;
}

export interface TurnDeductionResponse extends DeductionResult {
  effectiveTokensDeducted: number;
  modelMultiplierApplied: number;
  isFallback: boolean;
}

export class QuotaDeductionEngine {
  private proMultiplier: number;
  private flashMultiplier: number;
  private completionWeight: number;

  constructor(config: QuotaEngineConfig = {}) {
    this.proMultiplier = config.proModelMultiplier ?? 2.5;
    this.flashMultiplier = config.flashModelMultiplier ?? 1.0;
    this.completionWeight = config.completionCostWeight ?? 1.25;
  }

  /**
   * 모델 및 프롬프트/응답 토큰에 따른 유효 가중 토큰 산출
   */
  public calculateEffectiveTokens(modelId: string, promptTokens: number, completionTokens: number): {
    effectiveTokens: number;
    multiplier: number;
  } {
    const isPro = modelId.toLowerCase().includes('pro');
    const multiplier = isPro ? this.proMultiplier : this.flashMultiplier;
    const weightedTokens = Math.round((promptTokens + (completionTokens * this.completionWeight)) * multiplier);
    return {
      effectiveTokens: Math.max(1, weightedTokens),
      multiplier,
    };
  }

  /**
   * 턴 발생 시 원장에서 토큰 및 횟수 차감 실행
   */
  public executeDeduction(
    ledger: AccountQuotaLedger,
    request: TurnDeductionRequest
  ): TurnDeductionResponse {
    const { effectiveTokens, multiplier } = this.calculateEffectiveTokens(
      request.modelId,
      request.promptTokens,
      request.completionTokens
    );

    const deductionContext: DeductionContext = {
      ...request.context,
      modelId: request.modelId,
      unitCostApplied: multiplier,
      reason: request.context?.reason || `대화 턴 차감 (${request.modelId}, 가중치: ${multiplier}x)`,
    };

    const result = ledger.deduct(effectiveTokens, deductionContext);

    return {
      ...result,
      effectiveTokensDeducted: result.deductedTokens,
      modelMultiplierApplied: multiplier,
      isFallback: Boolean(result.fallbackRecommended),
    };
  }
}
