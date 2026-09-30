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
  step_index: number;
  loop_id?: string;
  agent_name: string;
  model_name: string;
  operator_account?: string;
  agent_account?: string;
  user_email?: string;
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
  serverUrl?: string;
}

export interface SystemSettings {
  ocr: {
    tesseract: OcrEngineConfig;
    gemini: OcrEngineConfig;
    paddleocr?: OcrEngineConfig;
    primaryEngine: 'tesseract' | 'gemini';
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
  | 'ocr'
  | 'scenarios'
  | 'wireframes'
  | 'correction';

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

export type OcrEngineType = 'tesseract' | 'gemini' | 'paddleocr' | 'ensemble';

export interface BoundingBoxItem {
  id: number | string;
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
  confidence: number;
  order?: number;
  lineIndex?: number;
  words?: any[];
  isEnsembleRefined?: boolean;
  originalText?: string;
}

export interface PdfPageItem {
  id?: string;
  pageNum: number;
  pageNumber?: number;
  rotation: number;
  width?: number;
  height?: number;
  dataUrl?: string;
  thumbnailUrl?: string;
  thumbnailSrc?: string;
  imageSrc?: string;
  imageUrl?: string;
  title?: string;
  isDeleted?: boolean;
  hasTocBookmark?: boolean;
  tocTitle?: string;
  isOcrDone?: boolean;
  ocrConfidence?: number;
  boundingBoxes?: BoundingBoxItem[];
  ocrBoxes?: BoundingBoxItem[];
}


export type ViewerLayoutMode = 'single' | 'double' | 'continuous' | 'book' | 'facing';

export interface VirtualScrollState {
  startIndex: number;
  endIndex: number;
  scrollTop?: number;
  totalHeight?: number;
  totalVirtualHeight?: number;
  topSpacerHeight?: number;
  bottomSpacerHeight?: number;
  visiblePages: any[];
}


export interface ImagePreprocessingOptions {
  grayscale?: boolean;
  binarize?: boolean;
  binarization?: boolean;
  binarizationThreshold?: number;
  denoise?: boolean;
  deskew?: boolean;
  contrast?: number;
  contrastEnhance?: boolean;
  autoCrop?: boolean;
  splitSpread?: boolean;
}

export interface OcrResult {
  text?: string;
  boxes?: BoundingBoxItem[];
  confidence?: number;
  engine: OcrEngineType;
  processingTimeMs?: number;
  executionTimeMs?: number;
  accuracyEstimated?: string | number;
  fullText?: string;
  boxesDetected?: number;
  status?: string;
  timestamp?: string;
  message?: string;
  ensembleStats?: any;
  engineName?: string;
  language?: string;
  cost?: string;
  preprocessed?: boolean;
  deskewAngle?: number;
  savedCost?: string;
}



