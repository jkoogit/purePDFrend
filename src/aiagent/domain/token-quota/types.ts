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

/**
 * 4계층(턴/루프/태스크/세션) 실시간 텔레메트리 메트릭
 */
export interface TelemetryMetrics {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  estimated_tokens: number;
  burst_score: number;
  burn_rate_velocity: number; // 턴당 토큰 소모율
  loop_safety_margin: number; // LSM: 안전 수행 가능 잔여 루프수
  burnout_risk_index: number; // BRI: 소진 위험 지수 (0~100)
  risk_level: 'SAFE' | 'CAUTION' | 'CRITICAL';
}

/**
 * 세션 종료 시 토큰 계산 로직 및 모델 적응형 스코어카드
 */
export interface TokenEvaluationScorecard {
  session_id: string;
  total_turns: number;
  total_loops: number;
  total_tokens: number;
  avg_tokens_per_turn: number;
  burn_rate_acceleration: number; // 가속도
  predicted_tokens: number;
  actual_tokens: number;
  mape_percent: number; // 절대 오차율
  calibration_weight_alpha: number; // 적응형 학습 보정 계수
  hang_risk_detected: boolean;
  recommended_max_turns_next_session: number;
  evaluated_at?: string;
  recommendation?: string;
  api_candidate_proposals: Array<{
    name: string;
    rationale: string;
    estimated_token_saving: number;
    deterministic_feasibility: 'HIGH' | 'MEDIUM' | 'LOW';
  }>;
}

/**
 * Git 3대 기준점 (세션원점, 태스크체크포인트, 현재)
 */
export interface GitBaselineRefs {
  session_id: string;
  task_id: string;
  base_ref: string; // 세션 시작 원격 커밋 SHA
  task_checkpoint_ref: string; // 태스크 시작 직전 트리 SHA
  current_branch: string;
  is_clean: boolean;
  modified_files: string[];
}

/**
 * 무손실 세션 연장 인계 도시에 (Handover Dossier)
 */
export interface HandoffDossier {
  parent_session_id: string;
  handoff_token: string;
  generated_at: string;
  status: 'SUSPENDED_QUOTA' | 'COMPLETED' | 'MANUAL_HANDOFF';
  last_task_id: string;
  last_task_name: string;
  branch: string;
  calibration_alpha?: number;
  baseline_refs: GitBaselineRefs;
  pending_backlogs: Array<{
    id: string;
    title: string;
    target_layer: string;
  }>;
  resume_prompt: string;
}

/**
 * 계정(사용자)별 쿼터 및 사용량 프로필
 */
export interface AccountQuotaProfile {
  account_id: string;
  user_email: string;
  allocated_quota: number;
  used_quota: number;
  remaining_quota: number;
  active_sessions_count: number;
  burnout_risk_level: 'SAFE' | 'CAUTION' | 'CRITICAL';
}
