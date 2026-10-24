/**
 * @file types.ts
 * @description AI 에이전트 하네스 메타원장(세션, 태스크, 루프) 표준 엔티티 및 스키마 인터페이스
 * PostgreSQL aiagent 3대 메타 테이블 및 local_agent_store.json과의 100% 상호 호환성을 보장합니다.
 */

export interface HarnessMetaCommon {
  created_sys?: string;
  created_at?: string;
  created_by?: string;
  updated_sys?: string;
  updated_at?: string;
  updated_by?: string;
  version?: number;
}

/**
 * PostgreSQL aiagent.harness_session_meta 엔티티 인터페이스
 */
export interface HarnessSessionEntity extends HarnessMetaCommon {
  session_id: string;
  session_name: string;
  work_group?: string;
  status_cd: '시작' | '진행중' | '정리완료' | '완료' | '중단';
  ai_agent?: string;
  ai_model?: string;
  started_at?: string;
  ended_at?: string | null;
  doc_payload?: Record<string, any>;
  operator_account?: string;
  user_email?: string;
}

/**
 * PostgreSQL aiagent.harness_task_meta 엔티티 인터페이스
 */
export interface HarnessTaskEntity extends HarnessMetaCommon {
  task_id: string;
  session_id: string;
  task_name: string;
  status_cd: '계획수립' | '진행중' | '정리완료' | '완료' | '중단';
  git_branch?: string;
  started_at?: string;
  ended_at?: string | null;
  doc_payload?: Record<string, any>;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  status?: string;
  assigned_agent?: string;
}

/**
 * PostgreSQL aiagent.harness_loop_meta 엔티티 인터페이스
 */
export interface HarnessLoopEntity extends HarnessMetaCommon {
  loop_id: string;
  task_id: string;
  session_id: string;
  loop_name: string;
  status_cd: '준비' | '진행중' | '보정' | '완료' | '실패';
  started_at?: string;
  ended_at?: string | null;
  doc_payload?: Record<string, any>;
  iteration?: number;
}

/**
 * 하네스 엔티티 UPSERT 실행 결과 인터페이스
 */
export interface HarnessUpsertResult {
  success: boolean;
  entityId: string;
  entityType: 'session' | 'task' | 'loop';
  source: 'REMOTE_DB' | 'LOCAL_FALLBACK';
  rowCount?: number;
  durationMs?: number;
  message?: string;
  error?: string;
}

export const HARNESS_DEFAULTS = {
  WORK_GROUP: 'purePDFrend',
  AI_AGENT: 'gemini',
  AI_MODEL: 'models/gemini-1.5-flash',
  CREATED_SYS: 'agent-harness',
  UPDATED_SYS: 'agent-harness',
  DEFAULT_OPERATOR: 'jkok2j2m',
  DEFAULT_EMAIL: 'jkok2j2m@gmail.com',
};
