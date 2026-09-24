/**
 * @file PdfConfigManager.ts
 * @description In-Memory Write-Through PDF 시스템 설정 관리 엔진 (Singleton & Observer Pattern)
 * 0ms 지연 없는 빠른 읽기(RAM Cache)와 localStorage 영속화, React 18 상태 실시간 바인딩을 제공합니다.
 */

import { useSyncExternalStore } from 'react';

export interface PdfSystemConfig {
  // ① [OCR 교정기 도메인]
  liveSyncCorrection: boolean;        // true: 편집 즉시 뷰어 실시간 반영, false: [저장] 클릭 시 명시적 반영
  autoScrollSync: boolean;            // 2-Way 캔버스 ↔ 에디터 포커스 자동 스크롤
  enableBBoxSnap: boolean;            // BBox 드래그/리사이즈 시 4px 그리드 스냅 (Shift 누르면 임시 해제)
  showConfidenceBadges: boolean;      // 80% 미만 저신뢰도 단어 경고 배지 표시
  enableKeyboardShortcuts: boolean;   // Ctrl+Z/Y, Del, M, S 단축키 활성화
  highContrastBBox: boolean;          // 고대비 네온 포커스 링 모드

  // ② [페이지 레이아웃 도메인]
  autoCleanOnSave: boolean;           // 저장/내보내기 시 소프트 삭제 페이지 영구 클린징
  maxHistoryDepth: number;            // 실행취소 최대 스택 수 (0: 무제한)

  // ③ [PDF 내보내기 도메인]
  defaultExportFont: string;          // 기본 임베딩 폰트 ('Helvetica' | 'Noto Sans KR' | 'Times' | 'Courier')
  exportDebugTextLayer: boolean;      // 디버그용 반투명 붉은 텍스트 레이어 생성 여부
  includeSoftDeletedInExport: boolean;// 소프트 삭제된 페이지 포함 여부 (기본 false)

  // ④ [뷰어 & 메모리 도메인]
  lruCacheSize: number;               // 가상 스크롤 메모리가드 LRU 캐시 크기 (기본 10)
  renderResolutionDpi: number;        // 캔버스 렌더링 배율 (1.0x, 1.5x, 2.0x)

  // ⑤ [이미지 전처리 도메인]
  autoBinarization: boolean;          // 전처리 이진화(Otsu) 자동 적용
  autoDeskew: boolean;                // 기울기 자동 보정 활성화

  // ⑥ [OCR 엔진 도메인]
  defaultOcrEngine: string;           // 기본 엔진 ('WASM' | 'Gemini' | 'PaddleOCR')
  confidenceThreshold: number;        // 저신뢰도 판정 임계값 (0.0 ~ 1.0, 기본 0.80)
}

export const DEFAULT_PDF_CONFIG: Readonly<PdfSystemConfig> = Object.freeze({
  liveSyncCorrection: false,
  autoScrollSync: true,
  enableBBoxSnap: true,
  showConfidenceBadges: true,
  enableKeyboardShortcuts: true,
  highContrastBBox: false,

  autoCleanOnSave: true,
  maxHistoryDepth: 0,

  defaultExportFont: 'Helvetica',
  exportDebugTextLayer: false,
  includeSoftDeletedInExport: false,

  lruCacheSize: 10,
  renderResolutionDpi: 1.5,

  autoBinarization: true,
  autoDeskew: true,

  defaultOcrEngine: 'WASM',
  confidenceThreshold: 0.80,
});

export type PresetProfileName = 'precision' | 'performance' | 'massive_book';

export const CONFIG_PRESETS: Record<PresetProfileName, { name: string; desc: string; config: Partial<PdfSystemConfig> }> = {
  precision: {
    name: '🎯 정밀 교정 모드',
    desc: 'BBox 스냅 가이드, 저신뢰도 배지, 실시간 동기화 및 고해상도 렌더링 활성화',
    config: {
      liveSyncCorrection: true,
      autoScrollSync: true,
      enableBBoxSnap: true,
      showConfidenceBadges: true,
      renderResolutionDpi: 1.5,
      confidenceThreshold: 0.85,
    },
  },
  performance: {
    name: '🚀 초고속 모드',
    desc: '오버헤드를 최소화하고 빠른 변환에 최적화된 경량 모드',
    config: {
      liveSyncCorrection: false,
      autoScrollSync: false,
      enableBBoxSnap: false,
      showConfidenceBadges: false,
      renderResolutionDpi: 1.0,
      confidenceThreshold: 0.70,
    },
  },
  massive_book: {
    name: '📖 대용량 메모리 절약',
    desc: '800쪽 이상 도서 OOM 방어를 위해 LRU 캐시 및 히스토리 스택 절약 모드',
    config: {
      lruCacheSize: 5,
      maxHistoryDepth: 50,
      autoCleanOnSave: true,
      includeSoftDeletedInExport: false,
      renderResolutionDpi: 1.0,
    },
  },
};

const STORAGE_KEY = 'purepdf_system_config_v1';

export class PdfConfigManager {
  private static instance: PdfConfigManager | null = null;
  private inMemoryConfig: PdfSystemConfig;
  private frozenSnapshot: Readonly<PdfSystemConfig>;
  private listeners: Set<(config: Readonly<PdfSystemConfig>) => void> = new Set();

  private constructor() {
    this.inMemoryConfig = this.loadFromStorage();
    this.frozenSnapshot = Object.freeze({ ...this.inMemoryConfig });
  }

  public static getInstance(): PdfConfigManager {
    if (!PdfConfigManager.instance) {
      PdfConfigManager.instance = new PdfConfigManager();
    }
    return PdfConfigManager.instance;
  }

  /**
   * 0ms Fast Read: 메모리 상주 설정 객체 반환 (참조 동일성 및 불변성 보장)
   */
  public getConfig(): Readonly<PdfSystemConfig> {
    return this.frozenSnapshot;
  }

  /**
   * Write-Through Update: 메모리 갱신 즉시 수행 후 localStorage 영속화 및 옵저버 알림
   */
  public updateConfig(partial: Partial<PdfSystemConfig>): Readonly<PdfSystemConfig> {
    this.inMemoryConfig = {
      ...this.inMemoryConfig,
      ...partial,
    };
    this.frozenSnapshot = Object.freeze({ ...this.inMemoryConfig });
    this.persistToStorage();
    this.notifyListeners();
    return this.getConfig();
  }

  /**
   * 프리셋 프로파일 일괄 적용
   */
  public applyPreset(preset: PresetProfileName): Readonly<PdfSystemConfig> {
    const presetData = CONFIG_PRESETS[preset];
    if (presetData) {
      return this.updateConfig(presetData.config);
    }
    return this.getConfig();
  }

  /**
   * 시스템 기본값으로 초기화
   */
  public resetToDefaults(): Readonly<PdfSystemConfig> {
    this.inMemoryConfig = { ...DEFAULT_PDF_CONFIG };
    this.frozenSnapshot = Object.freeze({ ...this.inMemoryConfig });
    this.persistToStorage();
    this.notifyListeners();
    return this.getConfig();
  }

  /**
   * 옵저버 리스너 등록
   */
  public subscribe(listener: (config: Readonly<PdfSystemConfig>) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    const snapshot = this.getConfig();
    this.listeners.forEach((listener) => {
      try {
        listener(snapshot);
      } catch (err) {
        console.error('Error in PdfConfigManager listener:', err);
      }
    });
  }

  private loadFromStorage(): PdfSystemConfig {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          return { ...DEFAULT_PDF_CONFIG, ...parsed };
        }
      }
    } catch (e) {
      console.warn('Failed to load purepdf_system_config from storage, using defaults', e);
    }
    return { ...DEFAULT_PDF_CONFIG };
  }

  private persistToStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.inMemoryConfig));
      }
    } catch (e) {
      console.warn('Failed to persist purepdf_system_config to storage', e);
    }
  }
}

/**
 * React 18 초고속 반응형 훅 (useSyncExternalStore)
 */
export function usePdfConfig(): Readonly<PdfSystemConfig> {
  const manager = PdfConfigManager.getInstance();
  return useSyncExternalStore(
    (onStoreChange) => manager.subscribe(onStoreChange),
    () => manager.getConfig(),
    () => DEFAULT_PDF_CONFIG
  );
}
