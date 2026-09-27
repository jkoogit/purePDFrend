/**
 * @file GeminiQuotaDetectionStrategy.ts
 * @description Google Gemini (GenAI SDK) API 전용 토큰/쿼터 한도 소진 감지 전략
 */

import { AgentProvider, AgentTurnPayload, TokenQuotaCheckResult } from '../types';
import { AbstractTokenQuotaStrategy } from './TokenQuotaStrategy';

export class GeminiQuotaDetectionStrategy extends AbstractTokenQuotaStrategy {
  readonly provider: AgentProvider = 'gemini';

  supports(providerOrModel: string): boolean {
    const target = providerOrModel.toLowerCase();
    return target.includes('gemini') || target.includes('google') || target.includes('genai');
  }

  evaluate(payload: AgentTurnPayload): TokenQuotaCheckResult {
    const text = this.extractSearchableText(payload);
    const httpStatus = payload.httpStatus;
    const retryAfter = this.extractRetryAfter(payload);

    // 1. Google API 명시적 리소스 소진 패턴 (Resource Exhausted / Quota Exceeded)
    const geminiPatterns: Array<{ pattern: RegExp; code: string; message: string }> = [
      {
        pattern: /resource_exhausted/i,
        code: 'GEMINI_RESOURCE_EXHAUSTED',
        message: 'Google Cloud RESOURCE_EXHAUSTED (gRPC status 8)',
      },
      {
        pattern: /quota\s*exceeded/i,
        code: 'GEMINI_QUOTA_EXCEEDED',
        message: 'Gemini API 무료/프로젝트 쿼터 소진',
      },
      {
        pattern: /generativelanguage\.googleapis\.com.*quota/i,
        code: 'GEMINI_ENDPOINT_QUOTA',
        message: 'Generative Language API 엔드포인트 쿼터 제한',
      },
      {
        pattern: /rate[\s-_]*limit/i,
        code: 'GEMINI_RATE_LIMIT',
        message: 'Gemini 초당 요청수(RPM) 또는 분당 토큰수(TPM) 초과',
      },
    ];

    for (const { pattern, code, message } of geminiPatterns) {
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
        reasonCode: 'GEMINI_HTTP_429',
        diagnosticMessage: 'Gemini API HTTP 429 Too Many Requests 수신',
        httpStatus: 429,
        retryAfterSeconds: retryAfter,
      });
    }

    return this.createNormalResult();
  }
}
