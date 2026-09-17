export interface HarnessSession {
  session_id: string;
  session_name: string;
  work_group: string;
  status_cd: string;
  ai_agent: string;
  ai_model: string;
  started_at: string;
  ended_at?: string | null;
  doc_payload: any;
  created_at?: string;
  updated_at?: string;
  version?: number;
}

export interface HarnessTask {
  task_id: string;
  session_id: string;
  task_name: string;
  status_cd: string;
  git_branch: string;
  started_at: string;
  ended_at?: string | null;
  doc_payload: any;
  created_at?: string;
  updated_at?: string;
  version?: number;
}

export interface HarnessLoop {
  loop_id: string;
  task_id: string;
  session_id: string;
  loop_name: string;
  status_cd: string;
  started_at: string;
  ended_at?: string | null;
  doc_payload: any;
  created_at?: string;
  updated_at?: string;
  version?: number;
}

export interface AgentDoc {
  docId: string;
  folder: string;
  fileName: string;
  filePath: string;
  title: string;
  contentHash: string;
  sizeBytes: number;
  updatedAt: string;
  isSynced: boolean;
  dbHash?: string | null;
  lastSyncedAt?: string | null;
  content?: string;
}

export interface ConversationTrace {
  trace_id: string;
  session_id: string;
  task_id?: string;
  loop_id?: string;
  step_index: number;
  agent_name: string;
  model_name: string;
  user_prompt: string;
  agent_response: string;
  response_summary?: string;
  tool_calls?: any;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  created_at: string;
}

export interface GraphNode {
  id: string;
  parentId?: string;
  level: 'session' | 'task' | 'loop';
  title: string;
  code: string;
  branch?: string;
  status: string;
  agent?: string;
  model?: string;
  time: string;
  payload?: any;
  order: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
}

export interface OcrEngineConfig {
  enabled: boolean;
  name: string;
  type: string;
  cost: string;
  languages: string[];
  defaultLanguage: string;
  cacheStatus: string;
  accuracyRating: string;
}

export interface SystemSettings {
  ocr: {
    tesseract: OcrEngineConfig;
    gemini: OcrEngineConfig;
    primaryEngine: 'tesseract' | 'gemini';
    autoFallback: boolean;
  };
  graphView: {
    defaultSpacing: number;
    defaultViewModes: { session: boolean; task: boolean; loop: boolean };
  };
}
