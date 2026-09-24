/**
 * @file SearchablePdfWorkerClient.ts
 * @description Web Worker 백그라운드 Searchable PDF 클라이언트 파사드
 * 메인 스레드에서 백그라운드 Worker 스레드를 제어하고, 대용량 도서 컴파일 시
 * 0ms 메인 스레드 블로킹 방어 및 지능형 환경 폴백(Graceful Fallback)을 제공합니다.
 */

import { PdfPageItem } from '../../types';
import {
  SearchablePdfExportEngine,
  SearchablePdfExportOptions,
  PdfExportResult,
} from './SearchablePdfExportEngine';

export class SearchablePdfWorkerClient {
  private static instance: SearchablePdfWorkerClient;
  private currentWorker: Worker | null = null;
  private currentJobId: string | null = null;

  private constructor() {}

  public static getInstance(): SearchablePdfWorkerClient {
    if (!SearchablePdfWorkerClient.instance) {
      SearchablePdfWorkerClient.instance = new SearchablePdfWorkerClient();
    }
    return SearchablePdfWorkerClient.instance;
  }

  /**
   * 브라우저 환경 및 Web Worker 지원 여부 감지
   */
  public isWorkerSupported(): boolean {
    return typeof window !== 'undefined' && typeof Worker !== 'undefined';
  }

  /**
   * Searchable PDF 비동기 컴파일 실행
   * Worker 환경에서는 백그라운드 스레드로 오프로딩하며, 미지원 환경에서는 메인 엔진으로 자동 폴백합니다.
   */
  public async compileSearchablePdfAsync(
    pages: PdfPageItem[],
    options: SearchablePdfExportOptions = {}
  ): Promise<PdfExportResult> {
    if (!this.isWorkerSupported()) {
      // Node.js 또는 Worker 미지원 환경: 메인 스레드 직접 실행 (Fallback)
      return SearchablePdfExportEngine.createSearchablePdf(pages, options);
    }

    // 기존 진행 중인 Worker가 있다면 정리
    this.cancelCurrentJob();

    const jobId = `JOB-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    this.currentJobId = jobId;

    return new Promise<PdfExportResult>((resolve, reject) => {
      try {
        // Vite 모듈 워커 인스턴스화
        const worker = new Worker(
          new URL('../workers/SearchablePdfWorker.ts', import.meta.url),
          { type: 'module' }
        );
        this.currentWorker = worker;

        worker.onmessage = (event: MessageEvent) => {
          const { type, jobId: resJobId, current, total, message, result, error } = event.data;

          if (resJobId !== this.currentJobId) return;

          if (type === 'PROGRESS') {
            if (options.onProgress) {
              options.onProgress(current, total, message);
            }
          } else if (type === 'SUCCESS') {
            this.cleanupWorker();
            // result.pdfBytes may be transferred as ArrayBuffer
            if (result && result.pdfBytes && !(result.pdfBytes instanceof Uint8Array)) {
              result.pdfBytes = new Uint8Array(result.pdfBytes);
            }
            resolve(result);
          } else if (type === 'ERROR') {
            this.cleanupWorker();
            reject(new Error(error || 'Web Worker 컴파일 실패'));
          }
        };

        worker.onerror = (err: ErrorEvent) => {
          console.warn('[Web Worker Error, falling back to main engine]:', err.message);
          this.cleanupWorker();
          // Fallback to main thread execution
          SearchablePdfExportEngine.createSearchablePdf(pages, options)
            .then(resolve)
            .catch(reject);
        };

        // Worker로 작업 전달
        worker.postMessage({
          type: 'START_COMPILE',
          jobId,
          pages,
          options,
        });
      } catch (err: any) {
        console.warn('[Worker creation failed, falling back]:', err.message);
        this.cleanupWorker();
        SearchablePdfExportEngine.createSearchablePdf(pages, options)
          .then(resolve)
          .catch(reject);
      }
    });
  }

  /**
   * 현재 진행 중인 컴파일 작업 취소 및 Worker 자원 즉시 회수
   */
  public cancelCurrentJob(): void {
    if (this.currentWorker) {
      try {
        this.currentWorker.postMessage({
          type: 'CANCEL_COMPILE',
          jobId: this.currentJobId,
        });
        this.currentWorker.terminate();
      } catch (e) {}
      this.cleanupWorker();
    }
  }

  private cleanupWorker(): void {
    if (this.currentWorker) {
      try {
        this.currentWorker.terminate();
      } catch (e) {}
      this.currentWorker = null;
    }
    this.currentJobId = null;
  }
}
