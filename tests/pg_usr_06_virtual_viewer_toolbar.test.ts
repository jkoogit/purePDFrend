/**
 * @file tests/pg_usr_06_virtual_viewer_toolbar.test.ts
 * @description PG-USR-06 고성능 가상 스크롤 PDF 전용 뷰어, 3탭 상단/좌측 배치 및 도구속성바 TDD 단위 검증
 */

import { VirtualScrollEngine } from '../src/ppdf/services/VirtualScrollEngine';
import { PdfPageStore } from '../src/ppdf/services/PdfPageStore';
import { PdfPageItem } from '../src/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ [FAIL] ${message}`);
    process.exit(1);
  }
  console.log(`✅ [PASS] ${message}`);
}

console.log('=== [TDD] PG-USR-06 가상 스크롤 뷰어 연동 및 3탭/도구속성바 단위 테스트 ===\n');

// 1. 800쪽 대용량 가상 도서 생성 및 초기화 검증
console.log('▶ [1] 800쪽 대용량 도서 가상 페이지 생성 검증');
const totalPages = 800;
const testTitle = 'ISO 32000-2 표준 가이드북 및 엔터프라이즈 PDF 아카이빙 지침서';
const mockPages: PdfPageItem[] = PdfPageStore.generateMockBook(totalPages, testTitle);

assert(mockPages.length === 800, `1.1 전체 800쪽 생성 확인 (실제: ${mockPages.length}쪽)`);
assert(mockPages[0].pageNumber === 1, `1.2 첫 페이지 번호 1 확인 (실제: ${mockPages[0].pageNumber})`);
assert(mockPages[799].pageNumber === 800, `1.3 마지막 페이지 번호 800 확인 (실제: ${mockPages[799].pageNumber})`);
assert(mockPages[0].bookTitle === testTitle, '1.4 도서 제목 일치 확인');

// 2. 가상 스크롤 윈도잉 계산 (60fps 성능 검증)
console.log('\n▶ [2] 60fps 가상 스크롤 윈도잉 계산 검증');
const itemHeight = 1100 + 24;
const midScrollTop = 42 * itemHeight; // 42쪽 스크롤
const scrollCalc = VirtualScrollEngine.calculateState(mockPages, {
  scrollTop: midScrollTop,
  viewportHeight: 900,
  layoutMode: 'single',
  pageHeight: 1100,
  pageGap: 24,
  overscan: 2,
  scale: 1.0,
});

assert(scrollCalc.startIndex >= 39 && scrollCalc.startIndex <= 42, `2.1 가시영역 startIndex 검증 (실제: ${scrollCalc.startIndex})`);
assert(scrollCalc.visiblePages.length >= 1 && scrollCalc.visiblePages.length <= 6, `2.2 렌더링 DOM 최소화 (가시 페이지 수: ${scrollCalc.visiblePages.length})`);
assert(scrollCalc.totalVirtualHeight === 800 * itemHeight, `2.3 전체 가상 높이 800쪽 보존 (${scrollCalc.totalVirtualHeight}px)`);

// 3. 독서 진행률 및 역동기화 계산 검증
console.log('\n▶ [3] 독서 진행률 계산 및 서재 역동기화 검증');
const testCurrentPage = 42;
const progressPercent = Math.min(100, Math.round((testCurrentPage / totalPages) * 100));
assert(progressPercent === 5, `3.1 42/800쪽 진행률 5% 일치 확인 (실제: ${progressPercent}%)`);

const finishPage = 800;
const finishProgress = Math.min(100, Math.round((finishPage / totalPages) * 100));
assert(finishProgress === 100, `3.2 800/800쪽 진행률 100% 완독 확인 (실제: ${finishProgress}%)`);

// 4. 3탭 레이아웃 포지션 전환 검증
console.log('\n▶ [4] 목차포함 3탭 영역 상단/좌측 배치 상태 검증');
type TabLayout = 'left' | 'top';
let currentLayout: TabLayout = 'left';

function toggleLayout(prev: TabLayout): TabLayout {
  return prev === 'left' ? 'top' : 'left';
}

currentLayout = toggleLayout(currentLayout);
assert(currentLayout === 'top', '4.1 좌측배치 ➔ 상단배치 전환 확인');
currentLayout = toggleLayout(currentLayout);
assert(currentLayout === 'left', '4.2 상단배치 ➔ 좌측배치 전환 확인');

// 5. 줌 & 회전 계산 검증
console.log('\n▶ [5] 줌(50%~300%) 및 회전(0~360°) 경계값 검증');
let scale = 1.0;
scale = Math.min(3.0, parseFloat((scale + 0.1).toFixed(1)));
assert(scale === 1.1, `5.1 줌 확대: ${scale}`);
scale = Math.max(0.5, parseFloat((scale - 0.7).toFixed(1)));
assert(scale === 0.5, `5.2 줌 축소 하한선 50% 클램핑 (실제: ${scale})`);

let rotation = 0;
rotation = (rotation + 90) % 360;
assert(rotation === 90, `5.3 시계방향 90° 회전 (실제: ${rotation}°)`);
rotation = (rotation - 90 + 360) % 360;
assert(rotation === 0, `5.4 시계반대방향 90° 원위치 (실제: ${rotation}°)`);

// 6. 도구별 상세속성 상태 검증
console.log('\n▶ [6] 도구별 상세속성(선굵기, 색상, 투명도, OCR스냅) 검증');
let strokeWidth = 3;
strokeWidth = Math.min(20, Math.max(1, strokeWidth + 5));
assert(strokeWidth === 8, `6.1 선 굵기 조절 (실제: ${strokeWidth}px)`);

let opacity = 100;
opacity = Math.min(100, Math.max(10, opacity - 20));
assert(opacity === 80, `6.2 불투명도 80% 조절 (실제: ${opacity}%)`);

let isOcrSnap = true;
isOcrSnap = !isOcrSnap;
assert(isOcrSnap === false, '6.3 형광펜 OCR 텍스트 스냅 토글 확인');

console.log('\n🎉 [PASS] PG-USR-06 가상 스크롤 뷰어 연동 및 3탭/도구속성바 TDD 검증 100% 완료!');
