/**
 * @file OpenAIQuotaDetectionStrategy.ts
 * @description OpenAI 에이전트 전용 토큰 쿼터 소진 감지 전략
 */

import { AgentProvider, AgentTurnPayload, TokenQuotaCheckResult } from '../types';
import { TokenQuotaStrategy } from './TokenQuotaStrategy';

export class OpenAIQuotaDetectionStrategy extends TokenQuotaStrategy {
  readonly provider: AgentProvider = 'openai';

  private readonly patterns = [
    /insufficient_quota/i,
    /rate_limit_exceeded/i,
    /tokens_per_minute/i,
    /requests_per_minute/i,
    /exceeded your current quota/i,
    /billing_not_active/i,
  ];

  supports(providerOrModel: string): boolean {
    const lower = providerOrModel.toLowerCase();
    return lower.includes('openai') || lower.includes('gpt-') || lower.includes('o1') || lower.includes('o3') || lower.includes('chatgpt');
  }

  evaluate(payload: AgentTurnPayload): TokenQuotaCheckResult {
    if (payload.httpStatus === 429) {
      return this.createExhaustedResult(
        'HTTP_429',
        'OpenAI API HTTP 429 Rate/Quota limit exceeded',
        429,
        'OPENAI_429'
      );
    }

    const text = this.extractCombinedText(payload);
    for (const pattern of this.patterns) {
      if (pattern.test(text)) {
        return this.createExhaustedResult(
          pattern.source,
          `OpenAI quota limit detected matching pattern: ${pattern.source}`,
          429,
          'OPENAI_QUOTA_EXHAUSTED'
        );
      }
    }

    return this.createNormalResult('OpenAI quota status normal');
  }
}
