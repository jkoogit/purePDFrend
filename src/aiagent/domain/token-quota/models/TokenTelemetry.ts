/**
 * @file TokenTelemetry.ts
 * @description 4계층 실시간 텔레메트리 도메인 Value Object
 * 불변(Immutable) 객체로 설계되어 비즈니스 규칙 판정(SAFE/CAUTION/CRITICAL) 메서드를 캡슐화합니다.
 */

import { TelemetryMetrics } from '../types';

export class TokenTelemetry implements TelemetryMetrics {
  public readonly prompt_tokens: number;
  public readonly completion_tokens: number;
  public readonly total_tokens: number;
  public readonly estimated_tokens: number;
  public readonly burst_score: number;
  public readonly burn_rate_velocity: number;
  public readonly loop_safety_margin: number;
  public readonly burnout_risk_index: number;
  public readonly risk_level: 'SAFE' | 'CAUTION' | 'CRITICAL';

  constructor(params: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    estimated_tokens: number;
    burst_score: number;
    burn_rate_velocity: number;
    loop_safety_margin: number;
    burnout_risk_index: number;
    risk_level: 'SAFE' | 'CAUTION' | 'CRITICAL';
  }) {
    this.prompt_tokens = params.prompt_tokens;
    this.completion_tokens = params.completion_tokens;
    this.total_tokens = params.total_tokens;
    this.estimated_tokens = params.estimated_tokens;
    this.burst_score = params.burst_score;
    this.burn_rate_velocity = params.burn_rate_velocity;
    this.loop_safety_margin = params.loop_safety_margin;
    this.burnout_risk_index = Math.max(0, Math.min(100, Math.round(params.burnout_risk_index)));
    this.risk_level = params.risk_level;
  }

  public isSafe(): boolean {
    return this.risk_level === 'SAFE';
  }

  public isCaution(): boolean {
    return this.risk_level === 'CAUTION';
  }

  public isCritical(): boolean {
    return this.risk_level === 'CRITICAL';
  }

  public hasBurstRisk(): boolean {
    return this.burst_score >= 1.5;
  }

  public hasEnoughMarginForLoop(requiredLoops: number = 1): boolean {
    return this.loop_safety_margin >= requiredLoops;
  }

  public toJSON(): TelemetryMetrics {
    return {
      prompt_tokens: this.prompt_tokens,
      completion_tokens: this.completion_tokens,
      total_tokens: this.total_tokens,
      estimated_tokens: this.estimated_tokens,
      burst_score: this.burst_score,
      burn_rate_velocity: this.burn_rate_velocity,
      loop_safety_margin: this.loop_safety_margin,
      burnout_risk_index: this.burnout_risk_index,
      risk_level: this.risk_level,
    };
  }
}
