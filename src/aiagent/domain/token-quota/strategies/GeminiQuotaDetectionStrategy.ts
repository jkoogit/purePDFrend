/**
 * @file GeminiQuotaDetectionStrategy.ts
 * @description Google Gemini 에이전트 전용 토큰 쿼터 소진 감지 전략
 */

import { AgentProvider, AgentTurnPayload, TokenQuotaCheckResult } from '../types';
import { TokenQuotaStrategy } from './TokenQuotaStrategy';

export class GeminiQuotaDetectionStrategy extends TokenQuotaStrategy {
  readonly provider: AgentProvider = 'gemini';

  private readonly patterns = [
    /RESOURCE_EXHAUSTED/i,
    /resource_exhausted/i,
    /quota.*exceeded/i,
    /usage.*limit/i,
    /rate.*limit.*exceeded/i,
    /overloaded.*intermittent.*errors/i,
    /model.*api.*currently.*overloaded/i,
    /reached your usage limit/i,
    /one\.google\.com\/ai/i,
    /429.*Too Many Requests/i,
  ];

  supports(providerOrModel: string): boolean {
    const lower = providerOrModel.toLowerCase();
    return lower.includes('gemini') || lower.includes('google') || lower.includes('antigravity');
  }

  evaluate(payload: AgentTurnPayload): TokenQuotaCheckResult {
    if (payload.httpStatus === 429) {
      return this.createExhaustedResult(
        'HTTP_429',
        'Gemini API HTTP 429 Rate/Quota limit exceeded',
        429,
        'GEMINI_429'
      );
    }

    const text = this.extractCombinedText(payload);
    for (const pattern of this.patterns) {
      if (pattern.test(text)) {
        return this.createExhaustedResult(
          pattern.source,
          `Gemini quota limit detected matching pattern: ${pattern.source}`,
          429,
          'GEMINI_QUOTA_EXHAUSTED'
        );
      }
    }

    return this.createNormalResult('Gemini quota status normal');
  }
}
