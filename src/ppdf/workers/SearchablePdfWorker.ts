/**
 * @file SearchablePdfWorker.ts
 * @description Web Worker 백그라운드 Searchable PDF 합성 스레드
 * 메인 UI 스레드로부터 페이지 및 OCR 데이터를 전달받아 백그라운드에서 pdf-lib 합성을 수행하고,
 * 진행률 스트림 및 Transferable Object 기반의 무손실 바이너리 결과를 회신합니다.
 */

import { SearchablePdfExportEngine } from '../services/SearchablePdfExportEngine';
import { PdfPageItem } from '../../types';
import { SearchablePdfExportOptions } from '../services/SearchablePdfExportEngine';

export interface WorkerRequestData {
  type: 'START_COMPILE' | 'CANCEL_COMPILE';
  jobId: string;
  pages: PdfPageItem[];
  options: SearchablePdfExportOptions;
}

// Web Worker Global Scope listener
if (typeof self !== 'undefined' && typeof window === 'undefined') {
  self.addEventListener('message', async (event: MessageEvent<WorkerRequestData>) => {
    const { type, jobId, pages, options } = event.data;

    if (type === 'START_COMPILE') {
      try {
        const result = await SearchablePdfExportEngine.createSearchablePdf(pages, {
          ...options,
          onProgress: (current, total, message) => {
            self.postMessage({
              type: 'PROGRESS',
              jobId,
              current,
              total,
              message,
            });
          },
        });

        // Transferable Object: ArrayBuffer transfer for 0-copy memory efficiency
        const buffer = result.pdfBytes.buffer;
        (self as any).postMessage(
          {
            type: 'SUCCESS',
            jobId,
            result,
          },
          [buffer]
        );
      } catch (err: any) {
        self.postMessage({
          type: 'ERROR',
          jobId,
          error: err.message || 'PDF 백그라운드 컴파일 실패',
        });
      }
    }
  });
}
