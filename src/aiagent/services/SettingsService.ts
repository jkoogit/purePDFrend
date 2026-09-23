import { SystemSettings } from '../../types';

/**
 * SettingsService.ts
 * 
 * 아키텍처: 레이어드 아키텍처 (Layered Architecture - 3 Tier Service Layer)
 * 디자인 패턴: 싱글톤 패턴 (Singleton Pattern)
 * 
 * 단순 비즈니스(환경설정 관리) 영역으로, 불필요한 포트/어댑터 추상화 없이
 * 직관적인 단방향 흐름(Controller -> Service -> Repository)을 통해 높은 개발 속도와 단순성을 제공함.
 */
export class SettingsService {
  private static instance: SettingsService;
  private settings: SystemSettings;

  private constructor() {
    this.settings = {
      ocr: {
        tesseract: {
          enabled: true,
          name: 'Tesseract.js (Local/WASM)',
          type: 'Client-Side WASM',
          cost: 'Free ($0.00)',
          languages: ['kor', 'eng', 'kor+eng'],
          defaultLanguage: 'kor+eng',
          cacheStatus: 'Preloaded in IndexedDB',
          accuracyRating: '92.4%',
        },
        gemini: {
          enabled: true,
          name: 'Google Gemini Vision OCR',
          type: 'Server-Side Cloud LLM',
          cost: 'Tier Usage (Token based)',
          languages: ['Multilingual (100+)'],
          defaultLanguage: 'Auto-detect',
          cacheStatus: 'API Ready',
          accuracyRating: '98.9%',
        },
        paddleocr: {
          enabled: true,
          name: 'PaddleOCR (우분투 Docker CPU)',
          type: 'onpremise_docker',
          cost: '0원 (온프레미스 CPU 무료 연산)',
          languages: ['korean', 'ch', 'en', 'japan'],
          defaultLanguage: 'korean',
          cacheStatus: 'DOCKER READY',
          accuracyRating: '96.5% ~ 98.6%',
          serverUrl: 'http://localhost:8000',
          timeoutMs: 8000,
          cpuMode: true,
          isOnline: false,
        },
        primaryEngine: 'tesseract',
        autoFallback: true,
      },
      graphView: {
        defaultSpacing: 180,
        defaultViewModes: { session: true, task: true, loop: true },
      },
    };
  }

  public static getInstance(): SettingsService {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService();
    }
    return SettingsService.instance;
  }

  public getSettings(): SystemSettings {
    return { ...this.settings };
  }

  public updateSettings(newSettings: Partial<SystemSettings>): SystemSettings {
    this.settings = {
      ...this.settings,
      ...newSettings,
    };
    return { ...this.settings };
  }
}
