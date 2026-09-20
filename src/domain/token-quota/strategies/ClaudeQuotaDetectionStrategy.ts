/**
 * @file ClaudeQuotaDetectionStrategy.ts
 * @description Anthropic Claude API 전용 토큰/쿼터 한도 소진 감지 전략
 */

import { AgentProvider, AgentTurnPayload, TokenQuotaCheckResult } from '../types';
import { AbstractTokenQuotaStrategy } from './TokenQuotaStrategy';

export class ClaudeQuotaDetectionStrategy extends AbstractTokenQuotaStrategy {
  readonly provider: AgentProvider = 'claude';

  supports(providerOrModel: string): boolean {
    const target = providerOrModel.toLowerCase();
    return target.includes('claude') || target.includes('anthropic');
  }

  evaluate(payload: AgentTurnPayload): TokenQuotaCheckResult {
    const text = this.extractSearchableText(payload);
    const httpStatus = payload.httpStatus;
    const retryAfter = this.extractRetryAfter(payload);

    const claudePatterns: Array<{ pattern: RegExp; code: string; message: string }> = [
      {
        pattern: /rate_limit_error/i,
        code: 'CLAUDE_RATE_LIMIT_ERROR',
        message: 'Anthropic Claude rate_limit_error 감지',
      },
      {
        pattern: /overloaded_error/i,
        code: 'CLAUDE_OVERLOADED_ERROR',
        message: 'Anthropic 서버 과부하 (overloaded_error)',
      },
      {
        pattern: /credit balance is too low/i,
        code: 'CLAUDE_INSUFFICIENT_CREDITS',
        message: 'Anthropic 계정 크레딧 잔액 부족',
      },
      {
        pattern: /tokens? per minute/i,
        code: 'CLAUDE_TPM_LIMIT',
        message: 'Anthropic 분당 토큰수 한도 초과',
      },
    ];

    for (const { pattern, code, message } of claudePatterns) {
      if (pattern.test(text)) {
        return this.createExhaustedResult({
          matchedPattern: pattern.source,
          reasonCode: code,
          diagnosticMessage: message,
          httpStatus: httpStatus || 429,
          retryAfterSeconds: retryAfter,
        });
      }
    }

    if (httpStatus === 429) {
      return this.createExhaustedResult({
        matchedPattern: 'HTTP_429',
        reasonCode: 'CLAUDE_HTTP_429',
        diagnosticMessage: 'Anthropic API HTTP 429 Too Many Requests',
        httpStatus: 429,
        retryAfterSeconds: retryAfter,
      });
    }

    return this.createNormalResult();
  }
}
