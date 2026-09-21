/**
 * @file DeepSeekQuotaDetectionStrategy.ts
 * @description DeepSeek (Chat/Reasoner) API 전용 토큰/쿼터 한도 소진 감지 전략
 */

import { AgentProvider, AgentTurnPayload, TokenQuotaCheckResult } from '../types';
import { AbstractTokenQuotaStrategy } from './TokenQuotaStrategy';

export class DeepSeekQuotaDetectionStrategy extends AbstractTokenQuotaStrategy {
  readonly provider: AgentProvider = 'deepseek';

  supports(providerOrModel: string): boolean {
    const target = providerOrModel.toLowerCase();
    return target.includes('deepseek');
  }

  evaluate(payload: AgentTurnPayload): TokenQuotaCheckResult {
    const text = this.extractSearchableText(payload);
    const httpStatus = payload.httpStatus;
    const retryAfter = this.extractRetryAfter(payload);

    const deepSeekPatterns: Array<{ pattern: RegExp; code: string; message: string }> = [
      {
        pattern: /insufficient_balance/i,
        code: 'DEEPSEEK_INSUFFICIENT_BALANCE',
        message: 'DeepSeek 잔액 부족 (insufficient_balance)',
      },
      {
        pattern: /rate limit exceeded/i,
        code: 'DEEPSEEK_RATE_LIMIT',
        message: 'DeepSeek API 요청 빈도 한도 초과',
      },
      {
        pattern: /quota/i,
        code: 'DEEPSEEK_QUOTA',
        message: 'DeepSeek 사용량 쿼터 도달',
      },
    ];

    for (const { pattern, code, message } of deepSeekPatterns) {
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
        reasonCode: 'DEEPSEEK_HTTP_429',
        diagnosticMessage: 'DeepSeek HTTP 429 Too Many Requests',
        httpStatus: 429,
        retryAfterSeconds: retryAfter,
      });
    }

    return this.createNormalResult();
  }
}
