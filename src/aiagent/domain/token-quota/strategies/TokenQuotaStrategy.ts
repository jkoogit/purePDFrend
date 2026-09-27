/**
 * @file TokenQuotaStrategy.ts
 * @description 토큰 쿼터 감지 전략 기본 추상 클래스 (Template Method & Common Behaviors)
 */

import { AgentProvider, AgentTurnPayload, ITokenQuotaDetectionStrategy, TokenQuotaCheckResult } from '../types';

export abstract class AbstractTokenQuotaStrategy implements ITokenQuotaDetectionStrategy {
  abstract readonly provider: AgentProvider;

  abstract supports(providerOrModel: string): boolean;

  abstract evaluate(payload: AgentTurnPayload): TokenQuotaCheckResult;

  /**
   * 페이로드로부터 검사 가능한 통합 텍스트 추출 (프롬프트, 응답, 요약, 에러 본문 등)
   */
  protected extractSearchableText(payload: AgentTurnPayload): string {
    const parts: string[] = [];
    if (payload.userPrompt) parts.push(String(payload.userPrompt));
    if (payload.agentResponse) parts.push(String(payload.agentResponse));
    if (payload.responseSummary) parts.push(String(payload.responseSummary));
    if (payload.rawError) {
      if (typeof payload.rawError === 'string') {
        parts.push(payload.rawError);
      } else {
        try {
          parts.push(JSON.stringify(payload.rawError));
        } catch {
          parts.push(String(payload.rawError));
        }
      }
    }
    return parts.join(' ').toLowerCase();
  }

  /**
   * HTTP 429 상태코드 또는 일반 Retry-After 헤더 검사
   */
  protected extractRetryAfter(payload: AgentTurnPayload): number | undefined {
    if (!payload.headers) return undefined;
    const retryHeader = payload.headers['retry-after'] || payload.headers['Retry-After'];
    if (retryHeader) {
      const val = Array.isArray(retryHeader) ? retryHeader[0] : retryHeader;
      const parsed = parseInt(val, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return undefined;
  }

  /**
   * 결과 팩토리 메서드 (성공/정상)
   */
  protected createNormalResult(): TokenQuotaCheckResult {
    return {
      isExhausted: false,
      agentProvider: this.provider,
      diagnosticMessage: `[${this.provider}] 정상 상태 - 토큰 한도 초과 없음`,
    };
  }

  /**
   * 결과 팩토리 메서드 (한도 초과/소진)
   */
  protected createExhaustedResult(options: {
    matchedPattern: string;
    reasonCode: string;
    diagnosticMessage: string;
    httpStatus?: number;
    retryAfterSeconds?: number;
  }): TokenQuotaCheckResult {
    return {
      isExhausted: true,
      agentProvider: this.provider,
      matchedPattern: options.matchedPattern,
      reasonCode: options.reasonCode,
      httpStatus: options.httpStatus,
      retryAfterSeconds: options.retryAfterSeconds,
      diagnosticMessage: `[${this.provider}] 토큰/쿼터 한도 소진 감지: ${options.diagnosticMessage}`,
    };
  }
}
