/**
 * @file GenericQuotaDetectionStrategy.ts
 * @description 범용 폴백 토큰/쿼터 한도 소진 감지 전략
 * 특정 에이전트 전용 전략에서 감지되지 않았거나 에이전트 종류를 특정할 수 없는 경우의 최후 안전망.
 */

import { AgentProvider, AgentTurnPayload, TokenQuotaCheckResult } from '../types';
import { AbstractTokenQuotaStrategy } from './TokenQuotaStrategy';

export class GenericQuotaDetectionStrategy extends AbstractTokenQuotaStrategy {
  readonly provider: AgentProvider = 'generic';

  supports(_providerOrModel: string): boolean {
    return true; // Always supports as fallback
  }

  evaluate(payload: AgentTurnPayload): TokenQuotaCheckResult {
    const text = this.extractSearchableText(payload);
    const httpStatus = payload.httpStatus;
    const retryAfter = this.extractRetryAfter(payload);

    // 범용 다국어(한국어/영어) 및 HTTP 표준 패턴
    const genericPatterns: Array<{ pattern: RegExp; code: string; message: string }> = [
      {
        pattern: /resource_exhausted/i,
        code: 'GENERIC_RESOURCE_EXHAUSTED',
        message: '리소스 소진 (resource_exhausted)',
      },
      {
        pattern: /quota\s*exceeded/i,
        code: 'GENERIC_QUOTA_EXCEEDED',
        message: '할당량/쿼터 초과 (quota exceeded)',
      },
      {
        pattern: /rate[\s-_]*limit/i,
        code: 'GENERIC_RATE_LIMIT',
        message: '요청 빈도 제한 (rate limit)',
      },
      {
        pattern: /429\s+too\s+many\s+requests/i,
        code: 'GENERIC_HTTP_429_TEXT',
        message: '429 Too Many Requests 텍스트 감지',
      },
      {
        pattern: /토큰\s*한도\s*초과/i,
        code: 'KOREAN_TOKEN_LIMIT_EXCEEDED',
        message: '한국어 토큰 한도 초과 감지',
      },
      {
        pattern: /쿼터\s*(초과|소진)/i,
        code: 'KOREAN_QUOTA_EXHAUSTED',
        message: '한국어 쿼터 초과/소진 감지',
      },
      {
        pattern: /사용량\s*한도\s*초과/i,
        code: 'KOREAN_USAGE_LIMIT_EXCEEDED',
        message: '한국어 사용량 한도 초과 감지',
      },
    ];

    for (const { pattern, code, message } of genericPatterns) {
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
        reasonCode: 'GENERIC_HTTP_429',
        diagnosticMessage: 'HTTP 429 Too Many Requests 상태코드 수신',
        httpStatus: 429,
        retryAfterSeconds: retryAfter,
      });
    }

    return this.createNormalResult();
  }
}
