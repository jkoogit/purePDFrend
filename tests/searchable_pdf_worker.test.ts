/**
 * @file searchable_pdf_worker.test.ts
 * @description Web Worker 스레드 오프로딩 Searchable PDF 합성 엔진 TDD 단위 테스트
 */

import { PDFDocument } from 'pdf-lib';
import { SearchablePdfWorkerClient } from '../src/ppdf/services/SearchablePdfWorkerClient';
import { SearchablePdfExportEngine } from '../src/ppdf/services/SearchablePdfExportEngine';
import { PdfPageItem } from '../src/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ [FAIL] ${message}`);
    throw new Error(message);
  } else {
    console.log(`✅ [PASS] ${message}`);
  }
}

function createSamplePages(count: number): PdfPageItem[] {
  return Array.from({ length: count }, (_, i) => ({
    pageNum: i + 1,
    rotation: 0,
    isDeleted: false,
    width: 600,
    height: 800,
    ocrData: {
      fullText: `제${i + 1}장 전자도서 스캔 텍스트 샘플`,
      confidence: 0.98,
      boxes: [
        {
          id: 1,
          text: `제${i + 1}장 전자도서 스캔 텍스트 샘플`,
          confidence: 0.98,
          x: 10,
          y: 10,
          w: 80,
          h: 5,
        },
      ],
      ocrDurationMs: 50,
      timestamp: new Date().toISOString(),
    },
  }));
}

async function runTests() {
  console.log('================================================================');
  console.log('🧪 [TDD] Web Worker Searchable PDF 컴파일 엔진 단위 테스트 시작');
  console.log('================================================================\n');

  const client = SearchablePdfWorkerClient.getInstance();

  // -------------------------------------------------------------
  // [1] 싱글톤 및 환경 폴백 검증
  // -------------------------------------------------------------
  console.log('▶ [1] SearchablePdfWorkerClient 싱글톤 및 환경 감지 검증');
  assert(client !== null && client !== undefined, '1-1. SearchablePdfWorkerClient 인스턴스 생성');
  assert(SearchablePdfWorkerClient.getInstance() === client, '1-2. 싱글톤 인스턴스 동일성 보장');
  assert(typeof client.compileSearchablePdfAsync === 'function', '1-3. compileSearchablePdfAsync 메서드 제공');
  assert(typeof client.cancelCurrentJob === 'function', '1-4. cancelCurrentJob 취소 메서드 제공');

  // -------------------------------------------------------------
  // [2] 비동기 Searchable PDF 컴파일 & 진행률 스트림 검증
  // -------------------------------------------------------------
  console.log('\n▶ [2] 비동기 Searchable PDF 컴파일 & 진행률 콜백 스트림 검증');
  const pages = createSamplePages(5);
  const progressLogs: { current: number; total: number; message: string }[] = [];

  const result = await client.compileSearchablePdfAsync(pages, {
    bookTitle: '조선왕조실록 백그라운드 컴파일본',
    author: 'AI Worker Engine',
    onProgress: (current, total, message) => {
      progressLogs.push({ current, total, message });
    },
  });

  assert(result.pdfBytes instanceof Uint8Array, '2-1. PDF Uint8Array 바이너리 정상 반환');
  assert(result.totalBytes > 0, `2-2. 총 바이트 크기 유효 (${result.totalBytes} bytes)`);
  assert(result.pageCount === 5, '2-3. 합성된 페이지 수 5개 일치');
  assert(result.fileName.startsWith('조선왕조실록_백그라운드_컴파일본_ocr_'), '2-4. 표준 파일명 규칙 생성');
  assert(progressLogs.length >= 5, `2-5. 진행률 콜백 정상 수신 (${progressLogs.length}회 수신)`);
  assert(progressLogs[progressLogs.length - 1].current === 5, '2-6. 최종 100% 진행률 도달');

  // -------------------------------------------------------------
  // [3] 생성된 PDF 바이너리 무결성 & 메타데이터 검증
  // -------------------------------------------------------------
  console.log('\n▶ [3] 생성된 PDF 바이너리 파싱 및 메타데이터 무결성 검증');
  const parsedDoc = await PDFDocument.load(result.pdfBytes);
  assert(parsedDoc.getPageCount() === 5, '3-1. 파싱된 PDF 실제 페이지 수 5개 일치');
  assert(parsedDoc.getTitle() === '조선왕조실록 백그라운드 컴파일본', '3-2. Title 메타데이터 주입 일치');
  assert(parsedDoc.getAuthor() === 'AI Worker Engine', '3-3. Author 메타데이터 주입 일치');
  assert(parsedDoc.getCreator() === 'purePDFrend Searchable Engine v2.1', '3-4. Creator 메타데이터 일치');

  // -------------------------------------------------------------
  // [4] 소프트 삭제 페이지 자동 배제 검증
  // -------------------------------------------------------------
  console.log('\n▶ [4] 소프트 삭제 페이지 자동 배제 검증');
  const pagesWithDeleted = createSamplePages(6);
  pagesWithDeleted[1].isDeleted = true; // 2페이지 삭제
  pagesWithDeleted[4].isDeleted = true; // 5페이지 삭제

  const filteredResult = await client.compileSearchablePdfAsync(pagesWithDeleted, {
    bookTitle: '소프트 삭제 필터 테스트',
  });

  assert(filteredResult.pageCount === 4, '4-1. 삭제된 2개 페이지 제외 후 4페이지만 생성');
  const parsedFiltered = await PDFDocument.load(filteredResult.pdfBytes);
  assert(parsedFiltered.getPageCount() === 4, '4-2. 파싱된 PDF 실제 페이지 수 4개 일치');

  // -------------------------------------------------------------
  // [5] 작업 취소 및 자원 회수 안전성 검증
  // -------------------------------------------------------------
  console.log('\n▶ [5] 작업 취소(cancelCurrentJob) 안전성 검증');
  client.cancelCurrentJob(); // 작업이 없는 상태에서도 예외 없이 안전하게 자원 회수
  assert(true, '5-1. cancelCurrentJob() 안전 호출 완료 (No crash)');

  // -------------------------------------------------------------
  // [6] 대용량 도서(20페이지) 고속 컴파일 벤치마크
  // -------------------------------------------------------------
  console.log('\n▶ [6] 20페이지 대용량 도서 고속 컴파일 벤치마크');
  const largePages = createSamplePages(20);
  const t0 = performance.now();
  const largeResult = await client.compileSearchablePdfAsync(largePages, {
    bookTitle: '대용량 도서 컴파일 벤치마크',
  });
  const duration = performance.now() - t0;

  assert(largeResult.pageCount === 20, '6-1. 20페이지 완본 생성 성공');
  assert(duration < 2000, `6-2. 20페이지 고속 처리 (${Math.round(duration)}ms < 2000ms)`);

  console.log('\n================================================================');
  console.log('🎉 [TDD 완료] Web Worker Searchable PDF 엔진 100% 무결성 통과!');
  console.log('================================================================\n');
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
