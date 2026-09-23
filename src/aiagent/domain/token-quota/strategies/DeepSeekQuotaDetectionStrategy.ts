/**
 * @file DeepSeekQuotaDetectionStrategy.ts
 * @description DeepSeek 에이전트 전용 토큰 쿼터 소진 감지 전략
 */

import { AgentProvider, AgentTurnPayload, TokenQuotaCheckResult } from '../types';
import { TokenQuotaStrategy } from './TokenQuotaStrategy';

export class DeepSeekQuotaDetectionStrategy extends TokenQuotaStrategy {
  readonly provider: AgentProvider = 'deepseek';

  private readonly patterns = [
    /insufficient_balance/i,
    /rate_limit/i,
    /quota.*exhausted/i,
    /out of credits/i,
    /429/i,
  ];

  supports(providerOrModel: string): boolean {
    const lower = providerOrModel.toLowerCase();
    return lower.includes('deepseek');
  }

  evaluate(payload: AgentTurnPayload): TokenQuotaCheckResult {
    if (payload.httpStatus === 429) {
      return this.createExhaustedResult(
        'HTTP_429',
        'DeepSeek API HTTP 429 Rate/Quota limit exceeded',
        429,
        'DEEPSEEK_429'
      );
    }

    const text = this.extractCombinedText(payload);
    for (const pattern of this.patterns) {
      if (pattern.test(text)) {
        return this.createExhaustedResult(
          pattern.source,
          `DeepSeek quota limit detected matching pattern: ${pattern.source}`,
          429,
          'DEEPSEEK_QUOTA_EXHAUSTED'
        );
      }
    }

    return this.createNormalResult('DeepSeek quota status normal');
  }
}
