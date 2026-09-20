/**
 * @file OpenAIQuotaDetectionStrategy.ts
 * @description OpenAI (GPT-4o, GPT-3.5) API 전용 토큰/쿼터 한도 소진 감지 전략
 */

import { AgentProvider, AgentTurnPayload, TokenQuotaCheckResult } from '../types';
import { AbstractTokenQuotaStrategy } from './TokenQuotaStrategy';

export class OpenAIQuotaDetectionStrategy extends AbstractTokenQuotaStrategy {
  readonly provider: AgentProvider = 'openai';

  supports(providerOrModel: string): boolean {
    const target = providerOrModel.toLowerCase();
    return target.includes('openai') || target.includes('gpt') || target.includes('o1') || target.includes('o3');
  }

  evaluate(payload: AgentTurnPayload): TokenQuotaCheckResult {
    const text = this.extractSearchableText(payload);
    const httpStatus = payload.httpStatus;
    const retryAfter = this.extractRetryAfter(payload);

    // OpenAI 고유 오류 패턴
    const openAiPatterns: Array<{ pattern: RegExp; code: string; message: string }> = [
      {
        pattern: /insufficient_quota/i,
        code: 'OPENAI_INSUFFICIENT_QUOTA',
        message: 'OpenAI 계정 크레딧/쿼터 소진 (insufficient_quota)',
      },
      {
        pattern: /exceeded your current quota/i,
        code: 'OPENAI_CURRENT_QUOTA_EXCEEDED',
        message: 'OpenAI 플랜 한도 초과 (billing details check required)',
      },
      {
        pattern: /rate_limit_exceeded/i,
        code: 'OPENAI_RATE_LIMIT_EXCEEDED',
        message: 'OpenAI 분당 요청(RPM) 또는 분당 토큰(TPM) 초과',
      },
      {
        pattern: /tokens_per_minute/i,
        code: 'OPENAI_TPM_LIMIT',
        message: 'OpenAI TPM(Tokens Per Minute) 한도 도달',
      },
    ];

    for (const { pattern, code, message } of openAiPatterns) {
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
        reasonCode: 'OPENAI_HTTP_429',
        diagnosticMessage: 'OpenAI API 429 Too Many Requests',
        httpStatus: 429,
        retryAfterSeconds: retryAfter,
      });
    }

    return this.createNormalResult();
  }
}
