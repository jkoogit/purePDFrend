/**
 * @file ModelCatalog.ts
 * @description 모델 카탈로그 엔티티 (Model Catalog Domain Model)
 */

import { AgentProvider } from '../types';

export interface ModelCatalogProps {
  modelId: string;
  provider: AgentProvider;
  displayName: string;
  promptTokenCost1k: number;      // 1K당 입력 토큰 비용 (USD)
  completionTokenCost1k: number;  // 1K당 출력 토큰 비용 (USD)
  contextWindowTokens: number;    // 최대 컨텍스트 윈도우 한도
  isActive?: boolean;
  docPayload?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export class ModelCatalog {
  public readonly modelId: string;
  public readonly provider: AgentProvider;
  public readonly displayName: string;
  public readonly promptTokenCost1k: number;
  public readonly completionTokenCost1k: number;
  public readonly contextWindowTokens: number;
  public readonly isActive: boolean;
  public readonly docPayload: Record<string, any>;
  public readonly createdAt: string;
  public readonly updatedAt: string;

  constructor(props: ModelCatalogProps) {
    if (!props.modelId || !props.displayName) {
      throw new Error('ModelCatalog: modelId와 displayName은 필수입니다.');
    }
    this.modelId = props.modelId;
    this.provider = props.provider || 'gemini';
    this.displayName = props.displayName;
    this.promptTokenCost1k = Math.max(0, Number(props.promptTokenCost1k) || 0);
    this.completionTokenCost1k = Math.max(0, Number(props.completionTokenCost1k) || 0);
    this.contextWindowTokens = Math.max(1000, Number(props.contextWindowTokens) || 128000);
    this.isActive = props.isActive !== false;
    this.docPayload = props.docPayload || {};
    this.createdAt = props.createdAt || new Date().toISOString();
    this.updatedAt = props.updatedAt || new Date().toISOString();
  }

  /**
   * 입출력 토큰 기준 실제 USD 비용 산출
   */
  public calculateCost(promptTokens: number, completionTokens: number): number {
    const promptCost = (Math.max(0, promptTokens) / 1000) * this.promptTokenCost1k;
    const completionCost = (Math.max(0, completionTokens) / 1000) * this.completionTokenCost1k;
    return Number((promptCost + completionCost).toFixed(6));
  }

  /**
   * 총 토큰 수량 기준 추정 USD 비용 산출 (통상 3:1 비율 휴리스틱)
   */
  public estimateCostFromTotal(totalTokens: number): number {
    const promptEstimate = Math.round(totalTokens * 0.75);
    const completionEstimate = Math.round(totalTokens * 0.25);
    return this.calculateCost(promptEstimate, completionEstimate);
  }

  /**
   * 요청 토큰이 모델 컨텍스트 윈도우 내인지 검증
   */
  public isWithinContextWindow(tokens: number): boolean {
    return tokens <= this.contextWindowTokens;
  }
}
