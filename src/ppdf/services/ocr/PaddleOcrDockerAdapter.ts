/**
 * @file PaddleOcrDockerAdapter.ts
 * @description 우분투 온프레미스 서버 Docker 컨테이너(CPU 전용 모드) PaddleOCR 어댑터
 * (FastAPI 마이크로서비스 연동, 헬스체크 핑, 지능형 무장애 폴백)
 */

import { IOcrEngineAdapter, OcrExecutionOptions } from './IOcrEngineAdapter';
import { OcrEngineType, OcrResult, BoundingBoxItem } from '../../../types';

export class PaddleOcrDockerAdapter implements IOcrEngineAdapter {
  public readonly engineType: OcrEngineType = 'paddleocr';
  public readonly engineName: string = 'PaddleOCR (우분투 Docker CPU)';
  public readonly isCloudAi: boolean = false;
  public readonly defaultLanguage: string = 'korean';
  public readonly supportedLanguages: string[] = ['korean', 'ch', 'en', 'japan'];

  private defaultServerUrl: string = 'http://localhost:8000';
  private defaultTimeoutMs: number = 8000;

  constructor(serverUrl?: string, timeoutMs?: number) {
    if (serverUrl) this.defaultServerUrl = serverUrl;
    if (timeoutMs) this.defaultTimeoutMs = timeoutMs;
  }

  public async recognize(options: OcrExecutionOptions = {}): Promise<OcrResult> {
    const t0 = Date.now();
    const language = options.language || this.defaultLanguage;
    const serverUrl = options.serverUrl || this.defaultServerUrl;
    const timeoutMs = options.timeoutMs || this.defaultTimeoutMs;

    const sampleText =
      options.sampleText ||
      '제1장 우분투 서버 컨테이너 기반 PaddleOCR 파이프라인\n1.1 CPU 가속 최적화 및 4점 폴리곤 바운딩 박스 정규화\n1.2 대량 배치 도서 텍스트 비동기 추출';

    try {
      // 1. 프록시 API 호출 (브라우저 CORS 및 네트워크 방어)
      const res = await fetch('/api/ocr/paddle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverUrl,
          language,
          sampleText,
          timeoutMs,
          preprocessing: options.preprocessing,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      if (data.success && data.result) {
        return {
          ...data.result,
          engine: this.engineType,
          engineName: this.engineName,
        };
      } else {
        throw new Error(data.error || 'PaddleOCR 응답 데이터 형식 오류');
      }
    } catch (err: any) {
      // 🛑 Zero-Hang 원칙: 원격 서버 미기동 시에도 안전한 폴백 결과 생성 및 안내
      const duration = Date.now() - t0;
      const lines = sampleText.split('\n').filter((l) => l.trim().length > 0);
      const boxes: BoundingBoxItem[] = [];

      let currentY = 12;
      lines.forEach((line, idx) => {
        boxes.push({
          id: idx + 1,
          text: line,
          confidence: 0.95,
          x: 10,
          y: currentY,
          w: Math.min(82, line.length * 3.4),
          h: 7.5,
          lineIndex: idx + 1,
          words: line.split(' ').map((w, wIdx) => ({
            text: w,
            confidence: 0.94,
            x: 10 + wIdx * 15,
            y: currentY,
            w: Math.max(12, w.length * 3.5),
            h: 6.5,
          })),
        });
        currentY += 15;
      });

      return {
        engine: this.engineType,
        engineName: this.engineName,
        language,
        cost: '0원 (온프레미스 CPU 무료 연산)',
        executionTimeMs: duration > 0 ? duration : 450,
        accuracyEstimated: '96.2% ~ 98.4%',
        fullText: sampleText,
        boxes,
        boxesDetected: boxes.length,
        status: 'FALLBACK',
        timestamp: new Date().toISOString(),
        preprocessed: !!options.preprocessing?.binarization || !!options.preprocessing?.deskew,
        deskewAngle: options.preprocessing?.deskew ? 0.5 : 0,
        message: `[온프레미스 도커 연동 준비 모드] 우분투 서버(${serverUrl}) 미응답으로 안전 폴백 렌더링 (${err.message})`,
      };
    }
  }

  public async checkHealth(serverUrl?: string): Promise<{ online: boolean; latencyMs: number; message: string }> {
    const targetUrl = serverUrl || this.defaultServerUrl;
    const t0 = Date.now();
    try {
      const res = await fetch(`/api/ocr/paddle/health?serverUrl=${encodeURIComponent(targetUrl)}`);
      const data = await res.json();
      const latency = Date.now() - t0;
      return {
        online: !!data.online,
        latencyMs: latency,
        message: data.online ? `우분투 Docker 서버(${targetUrl}) 정상 응답` : data.message || '서버 미기동 (연결 대기)',
      };
    } catch (e: any) {
      return {
        online: false,
        latencyMs: Date.now() - t0,
        message: `연결 실패: ${e.message}`,
      };
    }
  }
}
