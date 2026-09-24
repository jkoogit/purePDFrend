/**
 * @file ocr_batch_queue.test.ts
 * @description 다국어 OCR 병렬 배치 큐 및 Worker Pool 동시성 제어 단위 테스트
 */

import { OcrBatchQueueManager, OcrBatchProgressState } from '../src/ppdf/services/ocr/OcrBatchQueueManager';
import { IOcrEngineAdapter, OcrExecutionOptions } from '../src/ppdf/services/ocr/IOcrEngineAdapter';
import { OcrResult } from '../src/types';

// Mock OCR Adapter for deterministic testing
class MockFastOcrAdapter implements IOcrEngineAdapter {
  readonly engineType = 'tesseract' as const;
  readonly engineName = 'Mock Fast OCR Adapter';
  readonly isCloudAi = false;
  readonly defaultLanguage = 'kor+eng';
  readonly supportedLanguages = ['kor+eng', 'kor', 'eng', 'jpn', 'chi_sim'];

  public activeCalls = 0;
  public maxConcurrentSeen = 0;
  public delayMs = 20;

  async recognize(options?: OcrExecutionOptions): Promise<OcrResult> {
    this.activeCalls++;
    if (this.activeCalls > this.maxConcurrentSeen) {
      this.maxConcurrentSeen = this.activeCalls;
    }

    await new Promise((r) => setTimeout(r, this.delayMs));
    this.activeCalls--;

    return {
      text: options?.sampleText || 'Mock OCR Recognized Text',
      confidence: 0.95,
      language: options?.language || 'kor+eng',
      engine: 'tesseract',
      paragraphs: [
        {
          text: 'Mock Paragraph',
          bbox: { x: 10, y: 10, width: 80, height: 20 },
          confidence: 0.95,
          lines: [
            {
              text: 'Mock Line',
              bbox: { x: 10, y: 10, width: 80, height: 20 },
              confidence: 0.95,
              words: [
                {
                  text: 'Mock',
                  bbox: { x: 10, y: 10, width: 35, height: 20 },
                  confidence: 0.96,
                },
                {
                  text: 'Line',
                  bbox: { x: 50, y: 10, width: 40, height: 20 },
                  confidence: 0.94,
                },
              ],
            },
          ],
        },
      ],
    };
  }
}

// Mock Failing Adapter for retry testing
class MockFailingOcrAdapter implements IOcrEngineAdapter {
  readonly engineType = 'paddle' as const;
  readonly engineName = 'Mock Failing OCR Adapter';
  readonly isCloudAi = false;
  readonly defaultLanguage = 'kor';
  readonly supportedLanguages = ['kor', 'eng'];

  public callCounts: Record<number, number> = {};

  async recognize(options?: OcrExecutionOptions): Promise<OcrResult> {
    const pageNum = parseInt(options?.sampleText?.match(/\d+/)?.[0] || '1', 10);
    this.callCounts[pageNum] = (this.callCounts[pageNum] || 0) + 1;

    // Page 2 fails always
    if (pageNum === 2) {
      throw new Error('OCR Engine Timeout on Page 2');
    }

    // Page 3 fails twice then succeeds
    if (pageNum === 3 && this.callCounts[pageNum] < 3) {
      throw new Error(`Transient Network Flake on Page 3 (Attempt ${this.callCounts[pageNum]})`);
    }

    return {
      text: `Page ${pageNum} Recovered Text`,
      confidence: 0.92,
      engine: 'paddle',
      paragraphs: [],
    };
  }
}

async function runTests() {
  console.log('================================================================');
  console.log('🧪 [TDD] 다국어 OCR 병렬 배치 큐 & Worker Pool 단위 테스트 시작');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, msg: string) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${msg}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${msg}`);
      throw new Error(`Assertion failed: ${msg}`);
    }
  }

  // 1. 인스턴스 생성 및 옵저버 구독 검증
  console.log('▶ [1] OcrBatchQueueManager 인스턴스 및 옵저버 검증');
  const queueManager = OcrBatchQueueManager.getInstance();
  assert(queueManager !== null, '1-1. 싱글톤 인스턴스 생성 유효');
  
  const initialState = queueManager.getState();
  assert(initialState.status === 'IDLE', `1-2. 초기 상태 IDLE 확인 (실제: ${initialState.status})`);
  assert(initialState.progressPercent === 0, '1-3. 초기 진행률 0% 확인');

  let observerEventsCount = 0;
  let lastObservedState: OcrBatchProgressState | null = null;
  const unsubscribe = queueManager.subscribe((st) => {
    observerEventsCount++;
    lastObservedState = st;
  });
  assert(observerEventsCount >= 1, '1-4. 옵저버 구독 즉시 현재 상태 통지 수신');

  // 2. 6페이지 동시성 제어(Concurrency: 3) 배치 실행 검증
  console.log('\n▶ [2] 동시성 제어(Concurrency: 3) 병렬 배치 실행 검증');
  const mockFastAdapter = new MockFastOcrAdapter();
  mockFastAdapter.delayMs = 30;

  const pages = Array.from({ length: 6 }, (_, i) => ({ pageNumber: i + 1 }));
  const results = await queueManager.startBatch(pages, {
    concurrency: 3,
    language: 'kor+eng',
    customAdapter: mockFastAdapter,
  });

  assert(results.length === 6, `2-1. 6개 페이지 전체 결과 반환 (실제: ${results.length})`);
  assert(mockFastAdapter.maxConcurrentSeen <= 3, `2-2. 최대 동시 실행 수가 concurrency(3) 이하 제한 준수 (실제: ${mockFastAdapter.maxConcurrentSeen})`);
  
  const completedCount = results.filter((r) => r.status === 'COMPLETED').length;
  assert(completedCount === 6, `2-3. 6개 페이지 전원 COMPLETED 완료 (실제: ${completedCount})`);
  assert(lastObservedState?.progressPercent === 100, `2-4. 최종 진행률 100% 도달 (실제: ${lastObservedState?.progressPercent}%)`);
  assert(lastObservedState?.status === 'COMPLETED', `2-5. 최종 상태 COMPLETED 일치 (실제: ${lastObservedState?.status})`);

  // 3. 일시정지(Pause) 및 재개(Resume) 가드레일 검증
  console.log('\n▶ [3] 일시정지(Pause) 및 재개(Resume) 제어 검증');
  queueManager.reset();
  const pauseTestPages = Array.from({ length: 8 }, (_, i) => ({ pageNumber: i + 1 }));
  mockFastAdapter.delayMs = 50;

  const batchPromise = queueManager.startBatch(pauseTestPages, {
    concurrency: 2,
    customAdapter: mockFastAdapter,
  });

  // 실행 직후 일시정지
  await new Promise((r) => setTimeout(r, 20));
  queueManager.pause();
  assert(queueManager.getState().status === 'PAUSED', '3-1. pause() 호출 시 상태 PAUSED 전이');

  // 일시정지 상태에서 잠시 대기
  await new Promise((r) => setTimeout(r, 60));
  const pausedCompleted = queueManager.getState().completedPages;
  assert(pausedCompleted < 8, `3-2. 일시정지 중 잔여 큐 작업 대기 확인 (완료: ${pausedCompleted}/8)`);

  // 재개
  queueManager.resume();
  assert(queueManager.getState().status === 'RUNNING', '3-3. resume() 호출 시 상태 RUNNING 복귀');

  const finalPausedResults = await batchPromise;
  assert(finalPausedResults.length === 8, '3-4. 재개 후 8개 페이지 전체 정상 완결');
  assert(finalPausedResults.every((r) => r.status === 'COMPLETED'), '3-5. 8개 페이지 전원 COMPLETED 상태');

  // 4. 즉시 취소(Cancel) 가드레일 검증
  console.log('\n▶ [4] 즉시 취소(Cancel) 가드레일 검증');
  queueManager.reset();
  const cancelPages = Array.from({ length: 10 }, (_, i) => ({ pageNumber: i + 1 }));
  mockFastAdapter.delayMs = 60;

  const cancelBatchPromise = queueManager.startBatch(cancelPages, {
    concurrency: 2,
    customAdapter: mockFastAdapter,
  });

  await new Promise((r) => setTimeout(r, 30));
  queueManager.cancel();
  assert(queueManager.getState().status === 'CANCELLED', '4-1. cancel() 호출 시 상태 CANCELLED 전이');

  const cancelResults = await cancelBatchPromise;
  const skippedCount = cancelResults.filter((r) => r.status === 'SKIPPED').length;
  assert(skippedCount > 0, `4-2. 미처리 대기 작업 SKIPPED 처리 확인 (${skippedCount}개 SKIPPED)`);

  // 5. 자동 재시도 및 오류 복구(Retry & Fault Tolerance) 검증
  console.log('\n▶ [5] 오류 페이지 자동 재시도 및 실패 처리 검증');
  queueManager.reset();
  const failingAdapter = new MockFailingOcrAdapter();
  const retryPages = [
    { pageNumber: 1 },
    { pageNumber: 2 }, // 계속 실패
    { pageNumber: 3 }, // 2회 실패 후 성공
  ];

  const retryResults = await queueManager.startBatch(retryPages, {
    concurrency: 2,
    retryLimit: 3,
    customAdapter: failingAdapter,
  });

  const page1 = retryResults.find((r) => r.pageNumber === 1);
  const page2 = retryResults.find((r) => r.pageNumber === 2);
  const page3 = retryResults.find((r) => r.pageNumber === 3);

  assert(page1?.status === 'COMPLETED', '5-1. Page 1 정상 성공');
  assert(page2?.status === 'FAILED', '5-2. Page 2 3회 재시도 초과 후 FAILED 판정');
  assert(page2?.retryCount === 3, `5-3. Page 2 재시도 횟수 3회 기록 (실제: ${page2?.retryCount})`);
  assert(page2?.error?.includes('Timeout') === true, '5-4. Page 2 에러 메시지 보존');
  assert(page3?.status === 'COMPLETED', '5-5. Page 3 2회 실패 후 3번째 시도에서 복구 완료');

  // 6. 20페이지 고속 병렬 처리 벤치마크
  console.log('\n▶ [6] 20페이지 대용량 병렬 배치 벤치마크 (동시성 4)');
  queueManager.reset();
  const benchmarkPages = Array.from({ length: 20 }, (_, i) => ({ pageNumber: i + 1 }));
  mockFastAdapter.delayMs = 15;

  const tStart = Date.now();
  const benchResults = await queueManager.startBatch(benchmarkPages, {
    concurrency: 4,
    customAdapter: mockFastAdapter,
  });
  const tDuration = Date.now() - tStart;

  assert(benchResults.length === 20, '6-1. 20페이지 전체 완료');
  assert(tDuration < 500, `6-2. 병렬 동시성 4 처리 시간 최적화 (${tDuration}ms < 500ms)`);
  assert(queueManager.getState().currentTps > 0, `6-3. 실시간 TPS 통계 정상 산출 (${queueManager.getState().currentTps} 쪽/초)`);

  unsubscribe();

  console.log('\n================================================================');
  console.log(`🎉 [TDD 완료] 다국어 OCR 병렬 배치 큐 엔진 100% 무결성 통과! (${passed}/${total} 항목)`);
  console.log('================================================================\n');
}

runTests().catch((e) => {
  console.error('Test run failed:', e);
  process.exit(1);
});
