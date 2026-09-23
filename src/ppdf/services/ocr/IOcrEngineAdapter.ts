/**
 * @file IOcrEngineAdapter.ts
 * @description 다국어 OCR 엔진 어댑터 공통 인터페이스 및 표준 옵션 DTO
 */

import { OcrEngineType, OcrResult, ImagePreprocessingOptions } from '../../../types';
import { RawImageBuffer } from '../ImagePreprocessingPipeline';

export interface OcrExecutionOptions {
  language?: string; // 'kor+eng' | 'kor' | 'eng' | 'jpn' | 'chi_sim' | 'korean' | 'ch' | 'en'
  sampleText?: string;
  imageBuffer?: RawImageBuffer;
  imageBase64?: string;
  preprocessing?: ImagePreprocessingOptions;
  serverUrl?: string;
  timeoutMs?: number;
}

export interface IOcrEngineAdapter {
  readonly engineType: OcrEngineType;
  readonly engineName: string;
  readonly isCloudAi: boolean;
  readonly defaultLanguage: string;
  readonly supportedLanguages: string[];

  /**
   * OCR 텍스트 및 바운딩 박스 인식 실행
   */
  recognize(options?: OcrExecutionOptions): Promise<OcrResult>;

  /**
   * 엔진 활성화 및 원격/로컬 상태 헬스체크
   */
  checkHealth?(): Promise<{ online: boolean; latencyMs: number; message: string }>;
}
