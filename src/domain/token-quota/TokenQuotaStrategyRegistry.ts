/**
 * @file TokenQuotaStrategyRegistry.ts
 * @description 에이전트별 토큰 감지 전략 등록소 (Registry & Factory Pattern)
 * 신규 에이전트(예: Ollama, Cohere, Mistral 등) 추가 시 OCP(Open-Closed Principle)를 보장합니다.
 */

import { ITokenQuotaDetectionStrategy } from './types';
import { GeminiQuotaDetectionStrategy } from './strategies/GeminiQuotaDetectionStrategy';
import { OpenAIQuotaDetectionStrategy } from './strategies/OpenAIQuotaDetectionStrategy';
import { ClaudeQuotaDetectionStrategy } from './strategies/ClaudeQuotaDetectionStrategy';
import { DeepSeekQuotaDetectionStrategy } from './strategies/DeepSeekQuotaDetectionStrategy';
import { GenericQuotaDetectionStrategy } from './strategies/GenericQuotaDetectionStrategy';

export class TokenQuotaStrategyRegistry {
  private readonly strategies: ITokenQuotaDetectionStrategy[] = [];
  private readonly fallbackStrategy: ITokenQuotaDetectionStrategy;

  constructor() {
    this.fallbackStrategy = new GenericQuotaDetectionStrategy();

    // 기본 지원 전략 등록
    this.register(new GeminiQuotaDetectionStrategy());
    this.register(new OpenAIQuotaDetectionStrategy());
    this.register(new ClaudeQuotaDetectionStrategy());
    this.register(new DeepSeekQuotaDetectionStrategy());
  }

  /**
   * 동적 전략 등록 (개방-폐쇄 원칙 OCP 준수)
   */
  public register(strategy: ITokenQuotaDetectionStrategy): void {
    this.strategies.push(strategy);
  }

  /**
   * 에이전트명/모델명에 가장 적합한 전략 탐색 (Factory)
   */
  public resolveStrategy(providerOrModel?: string): ITokenQuotaDetectionStrategy {
    if (!providerOrModel) {
      return this.fallbackStrategy;
    }

    const matched = this.strategies.find((s) => s.supports(providerOrModel));
    return matched || this.fallbackStrategy;
  }

  /**
   * 등록된 모든 전략 목록 반환
   */
  public getAllStrategies(): readonly ITokenQuotaDetectionStrategy[] {
    return [...this.strategies, this.fallbackStrategy];
  }

  public getFallbackStrategy(): ITokenQuotaDetectionStrategy {
    return this.fallbackStrategy;
  }
}
