/**
 * @file tests/virtual_viewer.test.ts
 * @description 800쪽 대용량 가상화 뷰어(VirtualViewer) & LRU 메모리가드 TDD 단위 검증
 */

import { VirtualScrollEngine } from '../src/ppdf/services/VirtualScrollEngine';
import { MemoryGuardManager, PdfPageStore } from '../src/ppdf/services/PdfPageStore';
import { PdfPageItem } from '../src/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ [FAIL] ${message}`);
    process.exit(1);
  }
  console.log(`✅ [PASS] ${message}`);
}

console.log('=== [TDD] 800쪽 가상 뷰어(VirtualViewer) 및 LRU 메모리가드 단위 테스트 ===\n');

// 800쪽 모의 도서 생성
const mockPages: PdfPageItem[] = PdfPageStore.generateMockBook(800, '대용량 기술 규격서');

// -------------------------------------------------------------
// [1] VirtualScrollEngine: 단면(Single) 모드 가상 스크롤 계산 검증
// -------------------------------------------------------------
console.log('▶ [1] 단면(Single) 가상 스크롤 윈도잉 계산 검증');

const singleRangeTop = VirtualScrollEngine.calculateState(mockPages, {
  scrollTop: 0,
  viewportHeight: 900,
  layoutMode: 'single',
  pageHeight: 1100,
  pageGap: 24,
  overscan: 1,
  scale: 1.0,
});

const itemFullHeight = 1100 + 24; // 1124px
assert(singleRangeTop.startIndex === 0, `1. 단면 상단 startIndex=0 (실제: ${singleRangeTop.startIndex})`);
assert(singleRangeTop.endIndex >= 1 && singleRangeTop.endIndex <= 3, `2. 단면 상단 endIndex 범위 (실제: ${singleRangeTop.endIndex})`);
assert(singleRangeTop.topSpacerHeight === 0, `3. 단면 상단 topSpacerHeight=0 (실제: ${singleRangeTop.topSpacerHeight})`);
assert(singleRangeTop.totalVirtualHeight === 800 * itemFullHeight, `4. 단면 800쪽 전체 가상 높이 일치 (${singleRangeTop.totalVirtualHeight}px)`);
assert(singleRangeTop.visiblePages.length > 0, `5. 가시 페이지 배열 존재 (${singleRangeTop.visiblePages.length}개)`);

// 단면 중간 스크롤 (Page 400 근처)
const singleRangeMid = VirtualScrollEngine.calculateState(mockPages, {
  scrollTop: 400 * itemFullHeight,
  viewportHeight: 900,
  layoutMode: 'single',
  pageHeight: 1100,
  pageGap: 24,
  overscan: 2,
  scale: 1.0,
});

assert(singleRangeMid.startIndex === 398, `6. 단면 400P overscan=2 시 startIndex=398 (실제: ${singleRangeMid.startIndex})`);
assert(singleRangeMid.topSpacerHeight === 398 * itemFullHeight, `7. 단면 400P topSpacerHeight 일치 (${singleRangeMid.topSpacerHeight}px)`);
assert(singleRangeMid.bottomSpacerHeight >= 0, `8. 단면 400P bottomSpacerHeight 양수 유지 (${singleRangeMid.bottomSpacerHeight}px)`);

// -------------------------------------------------------------
// [2] VirtualScrollEngine: 양면(Facing Spread) 모드 가상 스크롤 계산 검증
// -------------------------------------------------------------
console.log('\n▶ [2] 양면(Facing Spread) 펼침면 가상 스크롤 윈도잉 검증');

const facingRangeTop = VirtualScrollEngine.calculateState(mockPages, {
  scrollTop: 0,
  viewportHeight: 900,
  layoutMode: 'facing',
  pageHeight: 1100,
  pageGap: 24,
  overscan: 1,
  scale: 1.0,
});

// 800페이지 -> 1쪽(표지) 1슬롯 + 2~799 (399슬롯) + 800쪽 1슬롯 = 총 401 슬롯
assert(facingRangeTop.startIndex === 0, `9. 양면 상단 startIndex=0`);
assert(facingRangeTop.totalVirtualHeight === 401 * itemFullHeight, `10. 양면 401 슬롯 전체 가상 높이 일치 (${facingRangeTop.totalVirtualHeight}px)`);
assert(facingRangeTop.visiblePages.length >= 1, `11. 양면 가시 페이지 로드 확인 (${facingRangeTop.visiblePages.length}개)`);

// -------------------------------------------------------------
// [3] VirtualScrollEngine: 특정 페이지 점프(ScrollTop) 계산 검증
// -------------------------------------------------------------
console.log('\n▶ [3] 페이지 점프(ScrollTop) 계산 및 클램핑 검증');

// 단면 점프
const jumpSingleP1 = VirtualScrollEngine.getScrollTopForPage(1, 800, 1100, 24, 'single', 1.0);
assert(jumpSingleP1 === 0, `12. 단면 1페이지 점프 위치 = 0px`);

const jumpSingleP500 = VirtualScrollEngine.getScrollTopForPage(500, 800, 1100, 24, 'single', 1.0);
assert(jumpSingleP500 === 499 * itemFullHeight, `13. 단면 500페이지 점프 위치 = ${499 * itemFullHeight}px`);

// 양면 점프
const jumpFacingP1 = VirtualScrollEngine.getScrollTopForPage(1, 800, 1100, 24, 'facing', 1.0);
assert(jumpFacingP1 === 0, `14. 양면 1페이지(표지) 점프 위치 = 0px`);

const jumpFacingP2 = VirtualScrollEngine.getScrollTopForPage(2, 800, 1100, 24, 'facing', 1.0);
assert(jumpFacingP2 === itemFullHeight, `15. 양면 2페이지 점프 위치 = ${itemFullHeight}px (Slot 1)`);

const jumpFacingP3 = VirtualScrollEngine.getScrollTopForPage(3, 800, 1100, 24, 'facing', 1.0);
assert(jumpFacingP3 === itemFullHeight, `16. 양면 3페이지 점프 위치 = ${itemFullHeight}px (Slot 1 동일)`);

// 클램핑 검증
const jumpClampedUnder = VirtualScrollEngine.getScrollTopForPage(-5, 800, 1100, 24, 'single', 1.0);
assert(jumpClampedUnder === 0, `17. 음수 페이지 점프 시 1페이지(0px)로 클램핑`);

const jumpClampedOver = VirtualScrollEngine.getScrollTopForPage(9999, 800, 1100, 24, 'single', 1.0);
assert(jumpClampedOver === 799 * itemFullHeight, `18. 초과 페이지 점프 시 800페이지(마지막)로 클램핑`);

// -------------------------------------------------------------
// [4] MemoryGuardManager: 10페이지 LRU 메모리 가드 및 축출 검증
// -------------------------------------------------------------
console.log('\n▶ [4] MemoryGuardManager 10페이지 LRU 메모리 가드 검증');

const memGuard = new MemoryGuardManager(10);

// 1~10 페이지 캐시 적재
for (let p = 1; p <= 10; p++) {
  memGuard.touchPage(`page-${p}`, `data:image/svg+xml;utf8,dummy-${p}`);
}

assert(memGuard.getActiveCacheCount() === 10, `19. 10페이지 적재 후 활성 캐시 수 = 10`);

// 11번째 페이지 적재 -> 가장 오래된 page-1 축출되어야 함
memGuard.touchPage('page-11', 'data:image/svg+xml;utf8,dummy-11');
assert(memGuard.getActiveCacheCount() === 10, `20. 11페이지 적재 후에도 캐시 최대 크기 10 유지`);
assert(memGuard.getCachedImage('page-1') === undefined, `21. 가장 오래된 page-1 자동 축출 확인`);
assert(memGuard.getCachedImage('page-11') !== undefined, `22. 최신 page-11 정상 적재 확인`);

// LRU 갱신 검증: page-2를 조회(터치)한 후 page-12를 추가하면 page-3이 축출되어야 함
memGuard.touchPage('page-2', 'data:image/svg+xml;utf8,dummy-2-refreshed');
memGuard.touchPage('page-12', 'data:image/svg+xml;utf8,dummy-12');
assert(memGuard.getCachedImage('page-3') === undefined, `23. page-2 터치 후 12 추가 시 page-3 축출`);
assert(memGuard.getCachedImage('page-2') !== undefined, `24. 최근 사용된 page-2는 캐시에 유지`);

// 캐시 비우기
memGuard.clear();
assert(memGuard.getActiveCacheCount() === 0, `25. 캐시 클리어 후 크기 = 0`);

// -------------------------------------------------------------
// [5] PdfPageStore: 800쪽 모의 도서(Mock Book) 생성 및 메타데이터 검증
// -------------------------------------------------------------
console.log('\n▶ [5] PdfPageStore 800쪽 대용량 모의 데이터 생성 검증');

assert(mockPages.length === 800, `26. 800쪽 모의 도서 데이터 800건 생성 확인`);
assert(mockPages[0].pageNum === 1 && mockPages[0].hasTocBookmark === true, `27. 1페이지 표지 TOC 북마크 확인`);
assert(mockPages[799].pageNum === 800, `28. 800페이지 인덱스 및 페이지 번호 일치`);
assert(mockPages[0].imageSrc.startsWith('data:image/svg+xml'), `29. 모의 도서 SVG Data URL 생성 확인`);
assert(mockPages[20].hasTocBookmark === true, `30. 21페이지 챕터 시작 TOC 북마크 확인`);

console.log('\n===============================================================');
console.log('🎉 [PASS] 800쪽 가상 뷰어 & 메모리가드 단위 테스트 30종 100% 통과!');
console.log('===============================================================\n');
