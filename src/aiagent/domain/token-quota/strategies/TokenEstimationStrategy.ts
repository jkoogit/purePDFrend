/**
 * @file TokenEstimationStrategy.ts
 * @description 모델 제공자별 토큰 추정 전략 패턴 (Strategy Pattern)
 * OCP(개방-폐쇄 원칙)를 준수하여 신규 모델 및 토크나이저 가중치 추가 시 기존 코드를 수정하지 않고 확장 가능합니다.
 */

import { AgentProvider } from '../types';

export interface ITokenEstimationStrategy {
  readonly provider: AgentProvider;
  readonly baseMultiplier: number;
  calculate(text: string): number;
}

export abstract class BaseTokenEstimationStrategy implements ITokenEstimationStrategy {
  abstract readonly provider: AgentProvider;
  abstract readonly baseMultiplier: number;

  public calculate(text: string): number {
    if (!text || typeof text !== 'string') return 0;
    const len = text.length;
    if (len === 0) return 0;

    let koreanCount = 0;
    let asciiCount = 0;
    let otherCount = 0;

    for (let i = 0; i < len; i++) {
      const code = text.charCodeAt(i);
      if ((code >= 0xac00 && code <= 0xd7a3) || (code >= 0x1100 && code <= 0x11ff) || (code >= 0x3130 && code <= 0x318f)) {
        koreanCount++;
      } else if (code <= 127) {
        asciiCount++;
      } else {
        otherCount++;
      }
    }

    const estimatedBase = Math.ceil(koreanCount * 1.5 + (asciiCount + otherCount) / 3.5);
    const codeBlockBonus = text.includes('```') || text.includes('{"') || text.includes('{') ? 1.1 : 1.0;

    return Math.max(1, Math.ceil(estimatedBase * codeBlockBonus * this.baseMultiplier));
  }
}

export class GeminiTokenEstimationStrategy extends BaseTokenEstimationStrategy {
  readonly provider: AgentProvider = 'gemini';
  readonly baseMultiplier: number = 1.0;
}

export class ClaudeTokenEstimationStrategy extends BaseTokenEstimationStrategy {
  readonly provider: AgentProvider = 'claude';
  readonly baseMultiplier: number = 1.15;
}

export class OpenAITokenEstimationStrategy extends BaseTokenEstimationStrategy {
  readonly provider: AgentProvider = 'openai';
  readonly baseMultiplier: number = 1.05;
}

export class GenericTokenEstimationStrategy extends BaseTokenEstimationStrategy {
  readonly provider: AgentProvider = 'generic';
  readonly baseMultiplier: number = 1.0;
}

export class TokenEstimationStrategyFactory {
  private static strategies: Map<AgentProvider, ITokenEstimationStrategy> = new Map([
    ['gemini', new GeminiTokenEstimationStrategy()],
    ['claude', new ClaudeTokenEstimationStrategy()],
    ['openai', new OpenAITokenEstimationStrategy()],
    ['generic', new GenericTokenEstimationStrategy()],
  ]);

  public static getStrategy(providerOrModel: string = 'gemini'): ITokenEstimationStrategy {
    const lower = providerOrModel.toLowerCase();
    if (lower.includes('claude')) return this.strategies.get('claude')!;
    if (lower.includes('openai') || lower.includes('gpt')) return this.strategies.get('openai')!;
    if (lower.includes('gemini')) return this.strategies.get('gemini')!;
    return this.strategies.get('generic')!;
  }
}
