/**
 * @file GenericQuotaDetectionStrategy.ts
 * @description 다국어 및 범용 폴백 토큰 쿼터 소진 감지 전략
 */

import { AgentProvider, AgentTurnPayload, TokenQuotaCheckResult } from '../types';
import { TokenQuotaStrategy } from './TokenQuotaStrategy';

export class GenericQuotaDetectionStrategy extends TokenQuotaStrategy {
  readonly provider: AgentProvider = 'generic';

  private readonly patterns = [
    /429.*Too Many Requests/i,
    /RESOURCE_EXHAUSTED/i,
    /resource_exhausted/i,
    /quota.*exceeded/i,
    /usage.*limit/i,
    /rate.*limit/i,
    /insufficient.*quota/i,
    /credit.*balance/i,
    /overloaded.*intermittent.*errors/i,
    /토큰.*소진/i,
    /사용량.*초과/i,
    /요청.*한도/i,
    /할당량.*초과/i,
  ];

  supports(_providerOrModel: string): boolean {
    return true; // 범용 폴백
  }

  evaluate(payload: AgentTurnPayload): TokenQuotaCheckResult {
    if (payload.httpStatus === 429) {
      return this.createExhaustedResult(
        'HTTP_429',
        'Generic HTTP 429 Rate/Quota limit exceeded',
        429,
        'GENERIC_429'
      );
    }

    const text = this.extractCombinedText(payload);
    for (const pattern of this.patterns) {
      if (pattern.test(text)) {
        return this.createExhaustedResult(
          pattern.source,
          `Generic quota limit detected matching pattern: ${pattern.source}`,
          429,
          'GENERIC_QUOTA_EXHAUSTED'
        );
      }
    }

    return this.createNormalResult('Quota status normal');
  }
}
