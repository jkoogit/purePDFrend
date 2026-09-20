/**
 * @file TokenQuotaDetectionService.ts
 * @description 토큰 쿼터 한도 소진 감지 도메인 서비스 (Domain Service Facade & Chain)
 * 애플리케이션 계층(Express Controller, Middleware, Harness)과의 단일 진입점.
 */

import { TokenQuotaStrategyRegistry } from './TokenQuotaStrategyRegistry';
import { AgentTurnPayload, TokenQuotaCheckResult } from './types';

export class TokenQuotaDetectionService {
  private static instance: TokenQuotaDetectionService;
  private readonly registry: TokenQuotaStrategyRegistry;

  private constructor(registry?: TokenQuotaStrategyRegistry) {
    this.registry = registry || new TokenQuotaStrategyRegistry();
  }

  /**
   * 싱글톤 인스턴스 접근 (운영성 및 메모리 효율성)
   */
  public static getInstance(): TokenQuotaDetectionService {
    if (!TokenQuotaDetectionService.instance) {
      TokenQuotaDetectionService.instance = new TokenQuotaDetectionService();
    }
    return TokenQuotaDetectionService.instance;
  }

  /**
   * 레지스트리 직접 접근
   */
  public getRegistry(): TokenQuotaStrategyRegistry {
    return this.registry;
  }

  /**
   * 턴 페이로드 객체를 정밀 검사
   */
  public checkQuota(payload: AgentTurnPayload): TokenQuotaCheckResult {
    const hint = payload.agentName || payload.modelName || '';
    const primaryStrategy = this.registry.resolveStrategy(hint);
    const result = primaryStrategy.evaluate(payload);

    if (result.isExhausted) {
      return result;
    }

    // 2차 방어선: 범용 폴백 전략으로 텍스트 기반 다국어 쿼터 에러 최종 검사
    const fallback = this.registry.getFallbackStrategy();
    if (primaryStrategy !== fallback) {
      const fallbackResult = fallback.evaluate(payload);
      if (fallbackResult.isExhausted) {
        return fallbackResult;
      }
    }

    return result;
  }

  /**
   * 단순 문자열 또는 가변 인자를 받는 하위 호환성 편의 메서드
   * @param inputs 문자열, 객체, 에러 등 임의의 입력
   */
  public isQuotaLimitError(...inputs: unknown[]): boolean {
    if (!inputs || inputs.length === 0) return false;

    for (const input of inputs) {
      if (!input) continue;

      let payload: AgentTurnPayload;
      if (typeof input === 'string') {
        payload = { agentResponse: input };
      } else if (typeof input === 'object') {
        const obj = input as any;
        payload = {
          agentName: obj.agent_name || obj.agentName,
          modelName: obj.model_name || obj.modelName,
          userPrompt: obj.user_prompt || obj.userPrompt,
          agentResponse: obj.agent_response || obj.agentResponse,
          responseSummary: obj.response_summary || obj.responseSummary,
          httpStatus: obj.httpStatus || obj.status,
          rawError: obj.rawError || obj.error,
        };
      } else {
        payload = { agentResponse: String(input) };
      }

      const check = this.checkQuota(payload);
      if (check.isExhausted) {
        return true;
      }
    }

    return false;
  }
}
