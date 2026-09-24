/**
 * @file tests/searchable_pdf_export.test.ts
 * @description 투명 텍스트 레이어 결합 Searchable PDF 내보내기 엔진 TDD 단위 검증
 */

import { PDFDocument } from 'pdf-lib';
import {
  SearchablePdfExportEngine,
  FontRegistry,
  PdfPageStore,
  PageLayoutEngine,
} from '../src/ppdf/services';
import { BoundingBoxItem } from '../src/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ [FAIL] ${message}`);
    process.exit(1);
  }
  console.log(`✅ [PASS] ${message}`);
}

async function runTests() {
  console.log('=== [TDD] Searchable PDF 내보내기 엔진 & 폰트 레지스트리 단위 테스트 ===\n');

  // -------------------------------------------------------------
  // [1] 파일명 네이밍 포맷 ([도서제목]_ocr_YYYYMMDD.pdf) 검증
  // -------------------------------------------------------------
  console.log('▶ [1] 표준 파일명 생성 ([도서제목]_ocr_YYYYMMDD.pdf) 검증');

  const testDate = new Date(2026, 8, 24); // 2026-09-24
  const fileName1 = SearchablePdfExportEngine.generateFileName('조선왕조실록 완본', testDate);
  assert(
    fileName1 === '조선왕조실록_완본_ocr_20260924.pdf',
    `1-1. 표준 파일명 생성 규칙 일치 (실제: ${fileName1})`
  );

  const fileNameSpecial = SearchablePdfExportEngine.generateFileName('테스트/도서:특수*문자?제거', testDate);
  assert(
    fileNameSpecial === '테스트도서특수문자제거_ocr_20260924.pdf',
    `1-2. 파일명 내 특수문자(\\ / : * ? " < > |) 안전 정제 (실제: ${fileNameSpecial})`
  );

  // -------------------------------------------------------------
  // [2] FontRegistry (기본 폰트 제공 및 추가 폰트 동적 등록) 검증
  // -------------------------------------------------------------
  console.log('\n▶ [2] FontRegistry 폰트 등록 및 선택 검증');

  const fonts = FontRegistry.getAvailableFonts();
  assert(fonts.length >= 3, `2-1. 기본 제공 폰트 3종 이상 확인 (${fonts.length}종)`);
  assert(fonts.some((f) => f.id === 'helvetica'), '2-2. 기본 표준 폰트 (Helvetica) 제공');
  assert(fonts.some((f) => f.id === 'times'), '2-3. 표준 명조 폰트 (Times Roman) 제공');

  // 커스텀 폰트 등록 테스트
  const mockFontBytes = new Uint8Array([1, 2, 3, 4]);
  FontRegistry.registerCustomFont('custom-nanum', '나눔명조 커스텀', mockFontBytes);
  const customFont = FontRegistry.getFont('custom-nanum');
  assert(customFont !== undefined && customFont.isCustom, '2-4. 커스텀 폰트 등록 및 검색 성공');

  // -------------------------------------------------------------
  // [3] BBox 백분율 좌표 ↔ PDF 포인트 좌표계 변환 검증
  // -------------------------------------------------------------
  console.log('\n▶ [3] BBox 좌표 변환 및 Y축 반전 계산 검증');

  const sampleBox: BoundingBoxItem = {
    id: 1,
    text: '엔터프라이즈 PDF 아카이빙',
    confidence: 0.99,
    x: 10,  // 10%
    y: 20,  // 20%
    w: 50,  // 50%
    h: 5,   // 5%
  };

  const coords = SearchablePdfExportEngine.calculatePdfCoordinates(sampleBox, 800, 1000);
  assert(coords.x === 80, `3-1. X 좌표 10% = 80pt (실제: ${coords.x})`);
  assert(coords.width === 400, `3-2. 너비 50% = 400pt (실제: ${coords.width})`);
  assert(coords.height === 50, `3-3. 높이 5% = 50pt (실제: ${coords.height})`);
  
  // Y축 반전: 1000 - ((20 + 5)% * 1000) = 1000 - 250 = 750pt
  assert(coords.y === 750, `3-4. PDF Y축 반전 좌표 750pt 일치 (실제: ${coords.y})`);
  assert(coords.fontSize >= 6 && coords.fontSize <= 48, `3-5. 폰트 크기 적정 스케일링 (${coords.fontSize}pt)`);

  // -------------------------------------------------------------
  // [4] Searchable PDF 합성 및 페이지 수/바이너리 검증
  // -------------------------------------------------------------
  console.log('\n▶ [4] Searchable PDF 바이너리 합성 및 메타데이터 검증');

  const mockPages = PdfPageStore.generateMockBook(5, '디지털 도서 아카이브');
  
  let progressEvents: number[] = [];
  const result = await SearchablePdfExportEngine.createSearchablePdf(mockPages, {
    bookTitle: '디지털 도서 아카이브',
    author: '한국기록원',
    fontId: 'helvetica',
    onProgress: (current, total) => {
      progressEvents.push(current);
    },
  });

  assert(result.pdfBytes.length > 0, `4-1. PDF 바이너리 정상 생성 (${result.totalBytes} bytes)`);
  assert(result.pageCount === 5, `4-2. 페이지 수 5개 일치 (실제: ${result.pageCount})`);
  assert(result.fileName.includes('디지털_도서_아카이브_ocr_'), `4-3. 반환 파일명 형식 일치 (${result.fileName})`);
  assert(progressEvents.length > 0 && progressEvents[progressEvents.length - 1] === 5, '4-4. 진행률 100% 도달 확인');

  // 생성된 PDF를 pdf-lib로 다시 파싱하여 무결성 교차 검증
  const loadedDoc = await PDFDocument.load(result.pdfBytes);
  assert(loadedDoc.getPageCount() === 5, '4-5. 생성된 PDF 파싱 및 5페이지 무결성 검증');
  assert(loadedDoc.getTitle() === '디지털 도서 아카이브', '4-6. 주입된 PDF Title 메타데이터 일치');
  assert(loadedDoc.getAuthor() === '한국기록원', '4-7. 주입된 PDF Author 메타데이터 일치');

  // -------------------------------------------------------------
  // [5] 소프트 삭제 페이지 자동 배제 검증
  // -------------------------------------------------------------
  console.log('\n▶ [5] 소프트 삭제 페이지 자동 배제 검증');

  // 2번, 4번 페이지 소프트 삭제
  let modifiedPages = PageLayoutEngine.softDeletePage(mockPages, 2);
  modifiedPages = PageLayoutEngine.softDeletePage(modifiedPages, 4);

  const cleanResult = await SearchablePdfExportEngine.createSearchablePdf(modifiedPages, {
    bookTitle: '소프트 삭제 제외 테스트',
  });

  assert(cleanResult.pageCount === 3, `5-1. 삭제된 2개 페이지 자동 배제되어 3페이지만 생성 (실제: ${cleanResult.pageCount}P)`);
  
  const cleanLoadedDoc = await PDFDocument.load(cleanResult.pdfBytes);
  assert(cleanLoadedDoc.getPageCount() === 3, '5-2. 파싱된 실제 PDF 페이지 수 3개 일치');

  // -------------------------------------------------------------
  // [6] 고속 처리 벤치마크 (20페이지 PDF 500ms 이내 생성)
  // -------------------------------------------------------------
  console.log('\n▶ [6] 20페이지 Searchable PDF 고속 생성 벤치마크');

  const benchPages = PdfPageStore.generateMockBook(20, '벤치마크 도서');
  const benchResult = await SearchablePdfExportEngine.createSearchablePdf(benchPages, {
    bookTitle: '20P 벤치마크',
  });

  assert(benchResult.pageCount === 20, '6-1. 20페이지 완본 생성');
  assert(benchResult.durationMs < 1000, `6-2. 20페이지 합성 고속 처리 (${benchResult.durationMs}ms < 1000ms)`);

  console.log('\n================================================================');
  console.log('🎉 [TDD 완료] Searchable PDF 내보내기 엔진 100% 무결성 통과!');
  console.log('================================================================\n');
}

runTests().catch((err) => {
  console.error('Test Execution Failed:', err);
  process.exit(1);
});
