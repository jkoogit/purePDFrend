/**
 * @file OcrEngineFactory.ts
 * @description 다국어 OCR 엔진 어댑터 팩토리 및 레지스트리 라우터
 */

import { IOcrEngineAdapter } from './IOcrEngineAdapter';
import { TesseractWasmAdapter } from './TesseractWasmAdapter';
import { GeminiMultimodalAdapter } from './GeminiMultimodalAdapter';
import { PaddleOcrDockerAdapter } from './PaddleOcrDockerAdapter';
import { OcrEngineType, SystemSettings } from '../../../types';

export class OcrEngineFactory {
  private static instanceMap: Map<OcrEngineType, IOcrEngineAdapter> = new Map();

  /**
   * 등록된 어댑터 싱글톤 인스턴스 반환
   */
  public static getAdapter(type: OcrEngineType, serverUrl?: string): IOcrEngineAdapter {
    if (!this.instanceMap.has(type)) {
      switch (type) {
        case 'tesseract':
          this.instanceMap.set('tesseract', new TesseractWasmAdapter());
          break;
        case 'gemini':
          this.instanceMap.set('gemini', new GeminiMultimodalAdapter());
          break;
        case 'paddleocr':
          this.instanceMap.set('paddleocr', new PaddleOcrDockerAdapter(serverUrl));
          break;
        default:
          this.instanceMap.set('tesseract', new TesseractWasmAdapter());
      }
    }
    return this.instanceMap.get(type)!;
  }

  /**
   * 시스템 설정 기반 활성 기본 어댑터 선택
   */
  public static getActiveAdapter(settings?: SystemSettings | null): IOcrEngineAdapter {
    if (!settings || !settings.ocr) {
      return this.getAdapter('tesseract');
    }

    const primary = settings.ocr.primaryEngine;
    const config = settings.ocr[primary];

    if (config && config.enabled) {
      return this.getAdapter(primary, config.serverUrl);
    }

    // 기본 엔진이 비활성화된 경우 활성화된 타 엔진으로 폴백
    if (settings.ocr.tesseract.enabled) return this.getAdapter('tesseract');
    if (settings.ocr.gemini.enabled) return this.getAdapter('gemini');
    if (settings.ocr.paddleocr?.enabled) return this.getAdapter('paddleocr', settings.ocr.paddleocr.serverUrl);

    return this.getAdapter('tesseract');
  }

  /**
   * 3대 전체 어댑터 목록 반환
   */
  public static getAllAdapters(): IOcrEngineAdapter[] {
    return [
      this.getAdapter('tesseract'),
      this.getAdapter('gemini'),
      this.getAdapter('paddleocr'),
    ];
  }
}
