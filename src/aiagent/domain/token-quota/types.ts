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

export interface TelemetryMetrics {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  context_tokens?: number;
  turn_count?: number;
  total_context_bloat_ratio?: number;
  estimated_tokens?: number;
  burst_score?: number;
  burn_rate_velocity?: number;
  loop_safety_margin?: number;
  burnout_risk_index?: number;
  risk_level?: string;
  pro_requests_used?: number;
  flash_requests_used?: number;
  pro_requests_remaining?: number;
  flash_requests_remaining?: number;
  contextWindowLimit?: number;
  contextBloatRatio?: number;
  isOverLimit?: boolean;
}

export interface TokenEvaluationScorecard {
  session_id?: string;
  score?: number;
  grade?: string;
  verdict?: 'SAFE' | 'WARNING' | 'CRITICAL' | 'PASSED' | 'ACTION_REQUIRED';
  recommendations?: string[];
  recommendation?: string;
  api_candidate_proposals?: any;
  risk_level?: string;
  indicators?: any;
  total_tokens?: number;
  actual_tokens?: number;
  total_turns?: number;
  total_loops?: number;
  avg_tokens_per_turn?: number;
  burn_rate_acceleration?: number;
  predicted_tokens?: number;
  mape_percent?: number;
  calibration_weight_alpha?: number;
  hang_risk_detected?: boolean;
  recommended_max_turns_next_session?: number;
  evaluated_at?: string;
}

export interface HandoffDossier {
  sessionId?: string;
  session_id?: string;
  parent_session_id?: string;
  sourceOperator?: string;
  targetOperator?: string;
  lastTaskId?: string;
  last_task_id?: string;
  last_task_name?: string;
  unfinalizedTasks?: any[];
  pending_backlogs?: any[];
  gitBranch?: string;
  branch?: string;
  baselineSha?: string;
  createdAt?: string;
  generated_at?: string;
  status?: string;
  handoff_token?: string;
  resume_prompt?: string;
  calibration_alpha?: number;
  baseline_refs?: any;
}

export interface GitBaselineRefs {
  session_id?: string;
  task_id?: string;
  mainSha?: string;
  devSha?: string;
  stgSha?: string;
  targetBranch?: string;
  current_branch?: string;
  base_ref?: string;
  task_checkpoint_ref?: string;
  is_clean?: boolean;
  modified_files?: any[];
  main_sha?: string;
  dev_sha?: string;
  stg_sha?: string;
}

export interface AccountQuotaProfile {
  account_id?: string;
  userId?: string;
  user_email?: string;
  email?: string;
  tier?: string;
  dailyLimit?: number;
  usedToday?: number;
  remainingToday?: number;
  allocated_quota?: number;
  used_quota?: number;
  remaining_quota?: number;
  active_sessions_count?: number;
  burnout_risk_level?: 'SAFE' | 'CAUTION' | 'CRITICAL' | string;
}



