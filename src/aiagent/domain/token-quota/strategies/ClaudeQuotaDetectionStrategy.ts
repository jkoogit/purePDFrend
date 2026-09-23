/**
 * @file ClaudeQuotaDetectionStrategy.ts
 * @description Anthropic Claude 에이전트 전용 토큰 쿼터 소진 감지 전략
 */

import { AgentProvider, AgentTurnPayload, TokenQuotaCheckResult } from '../types';
import { TokenQuotaStrategy } from './TokenQuotaStrategy';

export class ClaudeQuotaDetectionStrategy extends TokenQuotaStrategy {
  readonly provider: AgentProvider = 'claude';

  private readonly patterns = [
    /rate_limit_error/i,
    /usage_limits/i,
    /credit_balance_too_low/i,
    /exceeded your current quota/i,
    /overloaded_error/i,
  ];

  supports(providerOrModel: string): boolean {
    const lower = providerOrModel.toLowerCase();
    return lower.includes('claude') || lower.includes('anthropic');
  }

  evaluate(payload: AgentTurnPayload): TokenQuotaCheckResult {
    if (payload.httpStatus === 429) {
      return this.createExhaustedResult(
        'HTTP_429',
        'Claude API HTTP 429 Rate/Quota limit exceeded',
        429,
        'CLAUDE_429'
      );
    }

    const text = this.extractCombinedText(payload);
    for (const pattern of this.patterns) {
      if (pattern.test(text)) {
        return this.createExhaustedResult(
          pattern.source,
          `Claude quota limit detected matching pattern: ${pattern.source}`,
          429,
          'CLAUDE_QUOTA_EXHAUSTED'
        );
      }
    }

    return this.createNormalResult('Claude quota status normal');
  }
}
