/**
 * @file TokenUsageEstimator.ts
 * @description 자가 적응형(Self-Adaptive) 토큰 도메인 파사드 (Domain Facade)
 * OOP / DDD 원칙에 따라 세부 책임은 개별 도메인 모델, 전략(Strategy), 빌더(Builder), 서비스로 분리하고,
 * 외부 클라이언트에 통일된 고수준 인터페이스를 제공하는 파사드 패턴(Facade Pattern)을 구현합니다.
 */

import {
  AgentProvider,
  TelemetryMetrics,
  TokenEvaluationScorecard,
  HandoffDossier,
  GitBaselineRefs,
} from './types';
import { TokenEstimationStrategyFactory } from './strategies/TokenEstimationStrategy';
import { TokenTelemetry } from './models/TokenTelemetry';
import { HandoffDossierBuilder } from './builders/HandoffDossierBuilder';
import { SessionScorecardCalculator } from './services/SessionScorecardCalculator';

export class TokenUsageEstimator {
  private static readonly DEFAULT_SESSION_BUDGET = 100000;

  /**
   * 문자열 기반의 휴리스틱 토큰 예측
   * Strategy Pattern: TokenEstimationStrategyFactory를 통한 모델별 가중치 적용
   */
  public static estimateTokens(text: string = '', provider: AgentProvider = 'gemini'): number {
    const strategy = TokenEstimationStrategyFactory.getStrategy(provider);
    return strategy.calculate(text);
  }

  /**
   * 4계층 실시간 텔레메트리 지표 계산 (LSM, BRI, Velocity)
   * Domain Model: TokenTelemetry Value Object로 캡슐화하여 반환
   */
  public static calculateTelemetry(params: {
    promptTokens?: number;
    completionTokens?: number;
    sessionTotalTokens?: number;
    recentTurnTokens?: number[];
    sessionBudget?: number;
    calibrationAlpha?: number;
  }): TelemetryMetrics {
    const {
      promptTokens = 0,
      completionTokens = 0,
      sessionTotalTokens = 0,
      recentTurnTokens = [],
      sessionBudget = this.DEFAULT_SESSION_BUDGET,
      calibrationAlpha = 1.0,
    } = params;

    const totalTokens = promptTokens + completionTokens;
    const effectiveBudget = Math.max(10000, sessionBudget);

    // 턴당 평균 소비 속도 (최근 3턴 기준 가중 평균)
    const validRecents = recentTurnTokens.slice(-3);
    const avgRecent = validRecents.length > 0
      ? validRecents.reduce((acc, v) => acc + v, 0) / validRecents.length
      : totalTokens || 1500;

    const burnRateVelocity = Math.round(avgRecent * calibrationAlpha);

    // 버스트 스코어 (최근 평균 대비 급증 여부)
    const burstScore = avgRecent > 0 ? Number((totalTokens / avgRecent).toFixed(2)) : 1.0;

    // 잔여 토큰 계산
    const remainingTokens = Math.max(0, effectiveBudget - sessionTotalTokens);

    // 루프 안전 마진 (LSM): 1루프당 통상 3턴 소비 가정 (안전율 1.5배)
    const estimatedTokensPerLoop = Math.max(3000, burnRateVelocity * 3 * 1.5);
    const loopSafetyMargin = Number((remainingTokens / estimatedTokensPerLoop).toFixed(1));

    // 소진 위험 지수 (BRI, 0~100)
    const projectedUsage = sessionTotalTokens + burnRateVelocity * 2;
    const rawBri = (projectedUsage / effectiveBudget) * 100;
    const burnoutRiskIndex = Math.min(100, Math.max(0, Math.round(rawBri)));

    let riskLevel: 'SAFE' | 'CAUTION' | 'CRITICAL' = 'SAFE';
    if (burnoutRiskIndex >= 85 || loopSafetyMargin < 2) {
      riskLevel = 'CRITICAL';
    } else if (burnoutRiskIndex >= 70 || loopSafetyMargin < 3.5) {
      riskLevel = 'CAUTION';
    }

    const telemetryVO = new TokenTelemetry({
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: totalTokens,
      estimated_tokens: Math.round(totalTokens * calibrationAlpha),
      burst_score: burstScore,
      burn_rate_velocity: burnRateVelocity,
      loop_safety_margin: loopSafetyMargin,
      burnout_risk_index: burnoutRiskIndex,
      risk_level: riskLevel,
    });

    return telemetryVO.toJSON();
  }

  /**
   * 세션정리 시점 자가 적응형 스코어카드 및 오차 보정치 산출
   * Domain Service: SessionScorecardCalculator로 위임
   */
  public static generateSessionScorecard(params: {
    sessionId: string;
    traces: Array<{
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
      user_prompt?: string;
      agent_response?: string;
    }>;
    loopsCount: number;
    sessionBudget?: number;
    currentAlpha?: number;
  }): TokenEvaluationScorecard {
    return SessionScorecardCalculator.calculate(params);
  }

  /**
   * 시스템 팩트 기반 세션 인계 도시에(Handover Dossier) 생성
   * Builder Pattern: HandoffDossierBuilder를 통해 유효성 검증 및 객체 조립
   */
  public static createHandoverDossier(params: {
    parentSessionId: string;
    lastTaskId: string;
    lastTaskName: string;
    branch: string;
    baselineRefs: GitBaselineRefs;
    pendingBacklogs: Array<{ id: string; title: string; target_layer: string }>;
    reason?: 'SUSPENDED_QUOTA' | 'COMPLETED' | 'MANUAL_HANDOFF';
    calibrationAlpha?: number;
  }): HandoffDossier {
    const builder = new HandoffDossierBuilder()
      .setParentSession(params.parentSessionId)
      .setLastTask(params.lastTaskId, params.lastTaskName)
      .setBranch(params.branch)
      .setBaselineRefs(params.baselineRefs)
      .setPendingBacklogs(params.pendingBacklogs)
      .setReason(params.reason || 'SUSPENDED_QUOTA');

    if (params.calibrationAlpha !== undefined) {
      builder.setCalibrationAlpha(params.calibrationAlpha);
    }

    return builder.build();
  }
}
