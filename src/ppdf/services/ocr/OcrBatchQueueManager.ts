/**
 * @file OcrBatchQueueManager.ts
 * @description 다국어 OCR 병렬 배치 큐 및 Worker Pool 동시성 제어 관리자
 */

import { OcrResult, OcrEngineType } from '../../../types';
import { OcrEngineFactory } from './OcrEngineFactory';
import { IOcrEngineAdapter, OcrExecutionOptions } from './IOcrEngineAdapter';

export type BatchStatus = 'IDLE' | 'RUNNING' | 'PAUSED' | 'CANCELLED' | 'COMPLETED';
export type PageJobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';

export interface PageOcrJob {
  pageNumber: number;
  imageBlobUrl?: string;
  imageBase64?: string;
  status: PageJobStatus;
  retryCount: number;
  result?: OcrResult;
  error?: string;
  startedAt?: number;
  completedAt?: number;
  durationMs?: number;
}

export interface OcrBatchProgressState {
  status: BatchStatus;
  totalPages: number;
  pendingPages: number;
  processingPages: number;
  completedPages: number;
  failedPages: number;
  progressPercent: number;
  currentTps: number;           // Pages per second
  estimatedSecondsLeft: number;  // ETA (seconds)
  elapsedTimeMs: number;
  activeConcurrency: number;
  jobs: PageOcrJob[];
}

export interface OcrBatchOptions {
  concurrency?: number;         // 동시 실행 워커 수 (기본 3, 1~8)
  language?: string;            // 'kor+eng' | 'kor' | 'eng' | 'jpn' | 'chi_sim'
  engineType?: OcrEngineType;   // 'tesseract' | 'paddle' | 'gemini' | 'ensemble'
  retryLimit?: number;          // 페이지 실패 시 최대 재시도 횟수 (기본 3)
  timeoutMs?: number;           // 페이지당 타임아웃 (기본 15000ms)
  customAdapter?: IOcrEngineAdapter; // 테스트/커스텀용 어댑터 주입
  onProgress?: (state: OcrBatchProgressState) => void;
  onPageComplete?: (job: PageOcrJob) => void;
  onBatchComplete?: (jobs: PageOcrJob[]) => void;
}

export type OcrBatchObserver = (state: OcrBatchProgressState) => void;

export class OcrBatchQueueManager {
  private static instance: OcrBatchQueueManager | null = null;

  private status: BatchStatus = 'IDLE';
  private jobs: PageOcrJob[] = [];
  private activeWorkers = 0;
  private concurrency = 3;
  private retryLimit = 3;
  private language = 'kor+eng';
  private engineType: OcrEngineType = 'ensemble';
  private timeoutMs = 15000;
  private adapter: IOcrEngineAdapter | null = null;

  private observers: Set<OcrBatchObserver> = new Set();
  private batchStartTime: number = 0;
  private completedTimestamps: number[] = [];
  private resolveBatchPromise: ((jobs: PageOcrJob[]) => void) | null = null;
  private rejectBatchPromise: ((err: Error) => void) | null = null;

  constructor() {
    // 기본 브라우저 코어 감지
    if (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) {
      this.concurrency = Math.max(1, Math.min(navigator.hardwareConcurrency - 1, 4));
    }
  }

  public static getInstance(): OcrBatchQueueManager {
    if (!OcrBatchQueueManager.instance) {
      OcrBatchQueueManager.instance = new OcrBatchQueueManager();
    }
    return OcrBatchQueueManager.instance;
  }

  /**
   * 상태 구독 (옵저버 등록)
   */
  public subscribe(observer: OcrBatchObserver): () => void {
    this.observers.add(observer);
    // 즉시 현재 상태 전달
    observer(this.getState());
    return () => {
      this.observers.delete(observer);
    };
  }

  /**
   * 배치 작업 시작
   */
  public async startBatch(
    pages: { pageNumber: number; imageBlobUrl?: string; imageBase64?: string }[],
    options?: OcrBatchOptions
  ): Promise<PageOcrJob[]> {
    if (this.status === 'RUNNING') {
      throw new Error('이미 실행 중인 OCR 배치 작업이 있습니다. 먼저 취소하거나 완료를 대기하세요.');
    }

    if (!pages || pages.length === 0) {
      this.status = 'COMPLETED';
      this.jobs = [];
      this.notifyObservers();
      return [];
    }

    // 옵션 설정
    this.concurrency = Math.max(1, Math.min(options?.concurrency ?? this.concurrency, 8));
    this.retryLimit = options?.retryLimit ?? 3;
    this.language = options?.language ?? 'kor+eng';
    this.engineType = options?.engineType ?? 'ensemble';
    this.timeoutMs = options?.timeoutMs ?? 15000;
    this.adapter = options?.customAdapter ?? OcrEngineFactory.getAdapter(this.engineType);

    // 큐 초기화
    this.jobs = pages.map((p) => ({
      pageNumber: p.pageNumber,
      imageBlobUrl: p.imageBlobUrl,
      imageBase64: p.imageBase64,
      status: 'PENDING',
      retryCount: 0,
    }));

    this.status = 'RUNNING';
    this.activeWorkers = 0;
    this.batchStartTime = Date.now();
    this.completedTimestamps = [];

    this.notifyObservers();

    return new Promise<PageOcrJob[]>((resolve, reject) => {
      this.resolveBatchPromise = resolve;
      this.rejectBatchPromise = reject;

      // 작업 디스패치 루프 시작
      this.dispatchNextJobs();
    });
  }

  /**
   * 일시 정지 (Pause)
   */
  public pause(): void {
    if (this.status === 'RUNNING') {
      this.status = 'PAUSED';
      this.notifyObservers();
    }
  }

  /**
   * 재개 (Resume)
   */
  public resume(): void {
    if (this.status === 'PAUSED') {
      this.status = 'RUNNING';
      this.notifyObservers();
      this.dispatchNextJobs();
    }
  }

  /**
   * 배치 작업 즉시 취소 (Cancel)
   */
  public cancel(): void {
    if (this.status === 'RUNNING' || this.status === 'PAUSED') {
      this.status = 'CANCELLED';
      // 대기 중인 작업들 취소(SKIPPED) 처리
      this.jobs.forEach((job) => {
        if (job.status === 'PENDING') {
          job.status = 'SKIPPED';
        }
      });
      this.notifyObservers();

      if (this.resolveBatchPromise) {
        this.resolveBatchPromise(this.jobs);
        this.resolveBatchPromise = null;
        this.rejectBatchPromise = null;
      }
    }
  }

  /**
   * 상태 리셋 (IDLE)
   */
  public reset(): void {
    this.status = 'IDLE';
    this.jobs = [];
    this.activeWorkers = 0;
    this.completedTimestamps = [];
    this.batchStartTime = 0;
    this.resolveBatchPromise = null;
    this.rejectBatchPromise = null;
    this.notifyObservers();
  }

  /**
   * 현재 진행 상태 DTO 조회
   */
  public getState(): OcrBatchProgressState {
    const totalPages = this.jobs.length;
    const completedPages = this.jobs.filter((j) => j.status === 'COMPLETED').length;
    const failedPages = this.jobs.filter((j) => j.status === 'FAILED').length;
    const processingPages = this.jobs.filter((j) => j.status === 'PROCESSING').length;
    const pendingPages = this.jobs.filter((j) => j.status === 'PENDING').length;

    const progressPercent = totalPages > 0 ? Math.round(((completedPages + failedPages) / totalPages) * 100) : 0;
    const elapsedTimeMs = this.batchStartTime > 0 ? Date.now() - this.batchStartTime : 0;

    // 실시간 TPS 계산 (최근 5초 이내 완료 페이지 기반 또는 전체 평균)
    const now = Date.now();
    const recentCompleted = this.completedTimestamps.filter((t) => now - t <= 5000).length;
    const currentTps = recentCompleted > 0 
      ? Math.round((recentCompleted / 5) * 10) / 10 
      : (completedPages > 0 && elapsedTimeMs > 0 ? Math.round((completedPages / (elapsedTimeMs / 1000)) * 10) / 10 : 0);

    // 잔여 시간 (ETA) 계산
    const remainingPages = totalPages - (completedPages + failedPages);
    const effectiveTps = currentTps > 0 ? currentTps : 0.5; // 기본 최소 가정 0.5 TPS
    const estimatedSecondsLeft = remainingPages > 0 ? Math.ceil(remainingPages / effectiveTps) : 0;

    return {
      status: this.status,
      totalPages,
      pendingPages,
      processingPages,
      completedPages,
      failedPages,
      progressPercent,
      currentTps,
      estimatedSecondsLeft,
      elapsedTimeMs,
      activeConcurrency: this.activeWorkers,
      jobs: [...this.jobs],
    };
  }

  /**
   * 대기 중인 작업을 동시성 한도 내에서 디스패치
   */
  private dispatchNextJobs(): void {
    if (this.status !== 'RUNNING') return;

    // 슬롯이 남아있고 PENDING 상태의 작업이 있는 동안 반복 실행
    while (this.activeWorkers < this.concurrency) {
      const nextJob = this.jobs.find((j) => j.status === 'PENDING');
      if (!nextJob) break;

      this.processJob(nextJob);
    }

    // 모든 작업 완료 여부 확인
    this.checkCompletion();
  }

  /**
   * 단일 페이지 OCR 실행 프로세스
   */
  private async processJob(job: PageOcrJob): Promise<void> {
    job.status = 'PROCESSING';
    job.startedAt = Date.now();
    this.activeWorkers++;
    this.notifyObservers();

    try {
      const adapter = this.adapter || OcrEngineFactory.getAdapter(this.engineType);
      
      const execOptions: OcrExecutionOptions = {
        language: this.language,
        sampleText: `Page ${job.pageNumber} OCR Processed Content`,
        imageBase64: job.imageBase64,
        timeoutMs: this.timeoutMs,
      };

      // 타임아웃 가드와 함께 실행
      const result = await Promise.race([
        adapter.recognize(execOptions),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error(`Page ${job.pageNumber} OCR 처리 시간 초과 (${this.timeoutMs}ms)`)), this.timeoutMs)
        ),
      ]);

      if (this.status === 'CANCELLED') {
        job.status = 'SKIPPED';
        return;
      }

      job.status = 'COMPLETED';
      job.result = result;
      job.completedAt = Date.now();
      job.durationMs = job.completedAt - (job.startedAt || job.completedAt);
      job.error = undefined;
      this.completedTimestamps.push(Date.now());
    } catch (err: any) {
      if (this.status === 'CANCELLED') {
        job.status = 'SKIPPED';
        return;
      }

      console.warn(`[OcrBatchQueueManager] Page ${job.pageNumber} 실패 (시도 ${job.retryCount + 1}/${this.retryLimit}):`, err.message);

      if (job.retryCount < this.retryLimit) {
        job.retryCount++;
        job.status = 'PENDING'; // 재시도를 위해 PENDING 복귀
        // 지수 백오프 지연
        const backoffMs = Math.pow(2, job.retryCount) * 50;
        await new Promise((r) => setTimeout(r, backoffMs));
      } else {
        job.status = 'FAILED';
        job.error = err.message || '알 수 없는 OCR 오류';
        job.completedAt = Date.now();
        job.durationMs = job.completedAt - (job.startedAt || job.completedAt);
      }
    } finally {
      this.activeWorkers--;
      this.notifyObservers();
      this.dispatchNextJobs();
    }
  }

  /**
   * 전체 배치 완료 검사
   */
  private checkCompletion(): void {
    if (this.status !== 'RUNNING') return;

    const hasPendingOrProcessing = this.jobs.some(
      (j) => j.status === 'PENDING' || j.status === 'PROCESSING'
    );

    if (!hasPendingOrProcessing && this.activeWorkers === 0) {
      this.status = 'COMPLETED';
      this.notifyObservers();

      if (this.resolveBatchPromise) {
        this.resolveBatchPromise([...this.jobs]);
        this.resolveBatchPromise = null;
        this.rejectBatchPromise = null;
      }
    }
  }

  /**
   * 등록된 옵저버들에게 상태 알림
   */
  private notifyObservers(): void {
    const state = this.getState();
    this.observers.forEach((observer) => {
      try {
        observer(state);
      } catch (e) {
        console.error('[OcrBatchQueueManager] Observer error:', e);
      }
    });
  }
}
