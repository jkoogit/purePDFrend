export interface HarnessSession {
  session_id: string;
  session_name: string;
  work_group: string;
  status_cd: string;
  ai_agent: string;
  ai_model: string;
  account_id?: string;
  parent_session_id?: string | null;
  handoff_token?: string | null;
  calibration_alpha?: number;
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
  account_id?: string;
  checkpoint_tree_sha?: string | null;
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
  account_id?: string;
  loop_token_budget?: number;
  loop_actual_tokens?: number;
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
  account_id?: string;
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
  estimated_tokens?: number;
  burst_score?: number;
  burn_rate_velocity?: number;
  loop_safety_margin?: number;
  burnout_risk_index?: number;
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

export type OcrEngineType = 'tesseract' | 'gemini' | 'paddleocr';

export interface OcrEngineConfig {
  enabled: boolean;
  name: string;
  type: string;
  cost: string;
  languages: string[];
  defaultLanguage: string;
  cacheStatus: string;
  accuracyRating: string;
  serverUrl?: string;
  timeoutMs?: number;
  cpuMode?: boolean;
  isOnline?: boolean;
}

export interface BoundingBoxItem {
  id: string | number;
  text: string;
  confidence: number;
  x: number; // 0-100 percentage or px
  y: number;
  w: number;
  h: number;
  lineIndex?: number;
  isEnsembleRefined?: boolean;
  originalText?: string;
  words?: Array<{ text: string; confidence: number; x: number; y: number; w: number; h: number }>;
}

export interface OcrResult {
  engine: OcrEngineType | 'ensemble';
  engineName: string;
  language: string;
  cost: string;
  executionTimeMs: number;
  accuracyEstimated: string;
  fullText: string;
  boxes: BoundingBoxItem[];
  boxesDetected: number;
  status: 'SUCCESS' | 'FALLBACK' | 'ERROR';
  timestamp: string;
  preprocessed?: boolean;
  deskewAngle?: number;
  message?: string;
  ensembleStats?: {
    lowConfidenceCount: number;
    refinedCount: number;
    savedCostEstimated: string;
  };
}

export interface ImagePreprocessingOptions {
  grayscale?: boolean;
  binarization?: boolean;
  binarizationThreshold?: number; // 0 - 255
  deskew?: boolean; // 자동 기울기 보정
  denoise?: boolean; // 노이즈 필터링
  contrastEnhance?: boolean; // 대비 향상
  splitSpread?: boolean; // 양면 스캔 분할 (책 접힘선 감지)
  autoCrop?: boolean; // 스캐너 검은 테두리/여백 자동 트리밍
}

export interface SystemSettings {
  ocr: {
    tesseract: OcrEngineConfig;
    gemini: OcrEngineConfig;
    paddleocr: OcrEngineConfig;
    primaryEngine: OcrEngineType;
    autoFallback: boolean;
  };
  graphView: {
    defaultSpacing: number;
    defaultViewModes: { session: boolean; task: boolean; loop: boolean };
  };
}

export type DomainGroupId = 'harness' | 'knowledge' | 'studio';

export type ActiveViewId =
  | 'graph'
  | 'task'
  | 'usage'
  | 'audit'
  | 'docs'
  | 'settings'
  | 'viewer'
  | 'correction'
  | 'ocr'
  | 'scenarios';

export type ViewerLayoutMode = 'single' | 'facing'; // 단면 / 양면 펼침면 보기

export interface PdfPageItem {
  id: string | number;
  pageNum: number;
  title: string;
  imageSrc: string;
  thumbnailSrc?: string;
  width: number;
  height: number;
  rotation: number; // 0, 90, 180, 270
  isOcrDone?: boolean;
  ocrConfidence?: number;
  ocrBoxes?: BoundingBoxItem[];
  hasTocBookmark?: boolean;
  tocTitle?: string;
  isDeleted?: boolean;
}

export interface VirtualScrollState {
  startIndex: number;
  endIndex: number;
  topSpacerHeight: number;
  bottomSpacerHeight: number;
  totalVirtualHeight: number;
  visiblePages: PdfPageItem[];
}

export interface ViewNavItem {
  id: ActiveViewId;
  label: string;
  description: string;
  iconName: string;
}

export interface DomainNavGroup {
  id: DomainGroupId;
  label: string;
  description: string;
  views: ViewNavItem[];
}
