/**
 * @file TokenQuotaStrategy.ts
 * @description 토큰 쿼터 감지 기본 추상 클래스 (Template Method Pattern)
 */

import { AgentProvider, AgentTurnPayload, ITokenQuotaDetectionStrategy, TokenQuotaCheckResult } from '../types';

export abstract class TokenQuotaStrategy implements ITokenQuotaDetectionStrategy {
  abstract readonly provider: AgentProvider;

  abstract supports(providerOrModel: string): boolean;

  abstract evaluate(payload: AgentTurnPayload): TokenQuotaCheckResult;

  protected extractCombinedText(payload: AgentTurnPayload): string {
    const parts: string[] = [];
    if (payload.agentResponse) parts.push(payload.agentResponse);
    if (payload.responseSummary) parts.push(payload.responseSummary);
    if (payload.userPrompt) parts.push(payload.userPrompt);
    if (payload.rawError) {
      if (typeof payload.rawError === 'string') {
        parts.push(payload.rawError);
      } else if (typeof payload.rawError === 'object') {
        try {
          parts.push(JSON.stringify(payload.rawError));
        } catch {
          parts.push(String(payload.rawError));
        }
      }
    }
    return parts.join('\n');
  }

  protected createExhaustedResult(
    pattern: string,
    diagnostic: string,
    httpStatus = 429,
    reasonCode = 'RESOURCE_EXHAUSTED',
    retryAfter?: number
  ): TokenQuotaCheckResult {
    return {
      isExhausted: true,
      agentProvider: this.provider,
      matchedPattern: pattern,
      reasonCode,
      httpStatus,
      retryAfterSeconds: retryAfter,
      diagnosticMessage: diagnostic,
    };
  }

  protected createNormalResult(diagnostic = 'Normal quota status'): TokenQuotaCheckResult {
    return {
      isExhausted: false,
      agentProvider: this.provider,
      diagnosticMessage: diagnostic,
    };
  }
}
