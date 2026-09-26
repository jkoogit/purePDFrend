/**
 * @file SessionScorecardCalculator.ts
 * @description 세션 종료 시 스코어카드 산출 및 EMA 자가 적응형 학습 도메인 서비스
 * 단일 책임 원칙(SRP)에 따라 MAPE 계산, 차기 보정치 갱신, API 추천 로직을 독립적으로 수행합니다.
 */

import { TokenEvaluationScorecard } from '../types';

export class SessionScorecardCalculator {
  private static readonly DEFAULT_SESSION_BUDGET = 100000;
  private static readonly LEARNING_RATE_ETA = 0.15;

  public static calculate(params: {
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
    const {
      sessionId,
      traces,
      loopsCount,
      sessionBudget = this.DEFAULT_SESSION_BUDGET,
      currentAlpha = 1.0,
    } = params;

    const totalTurns = traces.length;
    const actualTokens = traces.reduce(
      (acc, t) => acc + (t.total_tokens || (t.prompt_tokens + t.completion_tokens) || 0),
      0
    );
    const avgTokensPerTurn = totalTurns > 0 ? Math.round(actualTokens / totalTurns) : 0;

    // 가속도 계산: 전반부 턴 평균 vs 후반부 턴 평균의 차이
    let burnRateAcceleration = 0;
    if (totalTurns >= 4) {
      const half = Math.floor(totalTurns / 2);
      const firstHalfSum = traces.slice(0, half).reduce((acc, t) => acc + t.total_tokens, 0);
      const secondHalfSum = traces.slice(half).reduce((acc, t) => acc + t.total_tokens, 0);
      const firstHalfAvg = firstHalfSum / half;
      const secondHalfAvg = secondHalfSum / (totalTurns - half);
      burnRateAcceleration = Math.round(secondHalfAvg - firstHalfAvg);
    }

    // 예측 소비량 (초기 예측 알파 기준)
    const predictedTokens = Math.round(actualTokens / (currentAlpha || 1.0));

    // MAPE (절대 오차율 %)
    const error = Math.abs(actualTokens - predictedTokens);
    const mapePercent = actualTokens > 0 ? Number(((error / actualTokens) * 100).toFixed(1)) : 0;

    // EMA 기반 차기 세션 보정 계수 (Calibration Alpha Update)
    let nextAlpha = currentAlpha;
    if (actualTokens > 0 && predictedTokens > 0) {
      const deltaRatio = (actualTokens - predictedTokens) / actualTokens;
      nextAlpha = Number((currentAlpha * (1 + this.LEARNING_RATE_ETA * deltaRatio)).toFixed(3));
      nextAlpha = Math.max(0.6, Math.min(2.0, nextAlpha));
    }

    // 행 위험도 감지 여부
    const hangRiskDetected = burnRateAcceleration > 4000 || traces.some((t) => t.total_tokens > 15000);

    // 다음 세션 권장 최대 턴수 산출
    let recommendedMaxTurns = 15;
    if (avgTokensPerTurn > 0) {
      recommendedMaxTurns = Math.max(8, Math.min(25, Math.floor((sessionBudget * 0.8) / avgTokensPerTurn)));
    }

    // 세션 패턴 분석을 통한 내부 API 오프로딩 후보 감지
    const apiCandidateProposals: TokenEvaluationScorecard['api_candidate_proposals'] = [];

    const gitOpsCount = traces.filter((t) =>
      (t.user_prompt && t.user_prompt.includes('git')) ||
      (t.agent_response && (t.agent_response.includes('github_sync_push') || t.agent_response.includes('POST /git/')))
    ).length;

    if (gitOpsCount >= 2) {
      apiCandidateProposals.push({
        name: 'Git 변경사항 자동 커밋/푸시 내부 서비스 (scripts/github_sync_push.ts)',
        rationale: `세션 내 Git 데이터 관련 반복 조작이 ${gitOpsCount}회 감지되었습니다. diff와 트리를 에이전트 프롬프트에 직접 작성하지 않고 전용 스크립트로 분리 시 대화 턴당 약 1,500토큰이 절약됩니다.`,
        estimated_token_saving: gitOpsCount * 1500,
        deterministic_feasibility: 'HIGH',
      });
    }

    const healthCheckCount = traces.filter((t) =>
      (t.user_prompt && (t.user_prompt.includes('health') || t.user_prompt.includes('check:service') || t.user_prompt.includes('점검'))) ||
      (t.agent_response && (t.agent_response.includes('진단') || t.agent_response.includes('점검 결과')))
    ).length;

    if (healthCheckCount >= 1) {
      apiCandidateProposals.push({
        name: '4단계 헬스체크 터미널 압축기 (Terminal Output Condenser: E-기능)',
        rationale: `서비스 및 DB 점검 시 긴 터미널 로그(${healthCheckCount}회 수행)를 1줄 정형화된 요약문으로 압축 전달하여 턴당 1,200토큰을 절약합니다.`,
        estimated_token_saving: healthCheckCount * 1200,
        deterministic_feasibility: 'HIGH',
      });
    }

    return {
      session_id: sessionId,
      total_turns: totalTurns,
      total_loops: loopsCount,
      total_tokens: actualTokens,
      avg_tokens_per_turn: avgTokensPerTurn,
      burn_rate_acceleration: burnRateAcceleration,
      predicted_tokens: predictedTokens,
      actual_tokens: actualTokens,
      mape_percent: mapePercent,
      calibration_weight_alpha: nextAlpha,
      hang_risk_detected: hangRiskDetected,
      recommended_max_turns_next_session: recommendedMaxTurns,
      evaluated_at: new Date().toISOString(),
      recommendation: hangRiskDetected
        ? '⚠️ 급격한 턴당 토큰 증가가 감지되었습니다. 차기 세션에서는 마이크로 턴 호흡(10턴 이내)으로 분할하십시오.'
        : '✅ 안정적인 토큰 소모 패턴입니다. 현재 보정 가중치를 유지하십시오.',
      api_candidate_proposals: apiCandidateProposals,
    };
  }
}
