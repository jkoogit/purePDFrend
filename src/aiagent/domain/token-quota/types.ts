/**
 * @file types.ts
 * @description 토큰 한도 초과 및 소진 감지 도메인 Value Object & Interface 정의
 * DDD(Domain-Driven Design) 원칙에 따라 불변성(Immutability)과 풍부한 도메인 표현력을 보장합니다.
 */

export type AgentProvider = 'gemini' | 'openai' | 'claude' | 'deepseek' | 'ollama' | 'generic';

/**
 * 턴 페이로드 Value Object 인터페이스
 */
export interface AgentTurnPayload {
  readonly agentName?: string;
  readonly modelName?: string;
  readonly userPrompt?: string;
  readonly agentResponse?: string;
  readonly responseSummary?: string;
  readonly httpStatus?: number;
  readonly headers?: Record<string, string | string[] | undefined>;
  readonly rawError?: unknown;
}

/**
 * 검사 결과 Value Object (불변 객체)
 */
export interface TokenQuotaCheckResult {
  readonly isExhausted: boolean;
  readonly agentProvider: AgentProvider;
  readonly matchedPattern?: string;
  readonly reasonCode?: string;
  readonly httpStatus?: number;
  readonly retryAfterSeconds?: number;
  readonly diagnosticMessage: string;
}

/**
 * 각 에이전트별 토큰 소진 감지 전략 인터페이스 (Strategy Pattern)
 */
export interface ITokenQuotaDetectionStrategy {
  readonly provider: AgentProvider;
  
  /**
   * 해당 전략이 주어진 에이전트/모델명 또는 페이로드를 처리할 수 있는지 여부 판별
   */
  supports(providerOrModel: string): boolean;

  /**
   * 페이로드를 분석하여 토큰 소진 여부 반환
   */
  evaluate(payload: AgentTurnPayload): TokenQuotaCheckResult;
}
