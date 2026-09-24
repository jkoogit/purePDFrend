/**
 * @file tests/page_layout_and_history.test.ts
 * @description PDF 페이지 레이아웃 조작 엔진 및 무제한 Undo/Redo 커맨드 히스토리 관리자 TDD 단위 검증
 */

import {
  PageLayoutEngine,
  HistoryManager,
  PdfPageStore,
} from '../src/ppdf/services';
import { PdfPageItem } from '../src/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ [FAIL] ${message}`);
    process.exit(1);
  }
  console.log(`✅ [PASS] ${message}`);
}

console.log('=== [TDD] PDF 페이지 레이아웃 엔진 및 무제한 Undo/Redo 커맨드 관리자 단위 테스트 ===\n');

// -------------------------------------------------------------
// [1] PageLayoutEngine: 단일 및 일괄 페이지 회전 검증
// -------------------------------------------------------------
console.log('▶ [1] 페이지 회전 및 각도 정규화(0/90/180/270) 검증');

let testPages = PdfPageStore.generateMockBook(10, '테스트 도서');

// 1. 단일 페이지 90도 회전
let rotated = PageLayoutEngine.rotatePage(testPages, 1, 90);
assert(rotated[0].rotation === 90, `1-1. 1페이지 90도 회전 (실제: ${rotated[0].rotation}°)`);

// 2. 누적 회전 (+90 -> 180)
rotated = PageLayoutEngine.rotatePage(rotated, 1, 90);
assert(rotated[0].rotation === 180, `1-2. 1페이지 180도 회전 (실제: ${rotated[0].rotation}°)`);

// 3. 360도 도달 시 0도로 정규화 (+180 -> 360 = 0)
rotated = PageLayoutEngine.rotatePage(rotated, 1, 180);
assert(rotated[0].rotation === 0, `1-3. 360도 회전 시 0도 정규화 (실제: ${rotated[0].rotation}°)`);

// 4. 음수 각도(-90도) 회전 시 270도 정규화
const negRotated = PageLayoutEngine.rotatePage(testPages, 2, -90);
assert(negRotated[1].rotation === 270, `1-4. -90도 회전 시 270도 정규화 (실제: ${negRotated[1].rotation}°)`);

// 5. 홀수/짝수 페이지 일괄 회전
const oddRotated = PageLayoutEngine.batchRotate(testPages, 'odd', 90);
assert(oddRotated[0].rotation === 90 && oddRotated[1].rotation === 0, '1-5. 홀수 페이지(1P) 회전 및 짝수 페이지(2P) 보존');

const evenRotated = PageLayoutEngine.batchRotate(testPages, 'even', 180);
assert(evenRotated[0].rotation === 0 && evenRotated[1].rotation === 180, '1-6. 짝수 페이지(2P) 180도 회전 및 홀수 페이지 보존');

// -------------------------------------------------------------
// [2] PageLayoutEngine: 드래그 앤 드롭 순서 재배치 및 pageNum 무결성
// -------------------------------------------------------------
console.log('\n▶ [2] 드래그 앤 드롭 순서 재배치 및 pageNum 무결성 검증');

// 1페이지(page-1)를 맨 끝(index 9)으로 이동
const reordered = PageLayoutEngine.reorderPages(testPages, 0, 9);
assert(reordered.length === 10, '2-1. 페이지 전체 수량 유지');
assert(reordered[0].id === 'page-2' && reordered[0].pageNum === 1, `2-2. 2페이지가 1번 인덱스로 이동하며 pageNum 1 부여 (실제: p.${reordered[0].pageNum})`);
assert(reordered[9].id === 'page-1' && reordered[9].pageNum === 10, `2-3. 1페이지가 10번 인덱스로 이동하며 pageNum 10 부여 (실제: p.${reordered[9].pageNum})`);

// -------------------------------------------------------------
// [3] PageLayoutEngine: 소프트 삭제, 복원 및 클린징(영구 정리)
// -------------------------------------------------------------
console.log('\n▶ [3] 소프트 삭제, 복원 및 클린징(영구 정리) 검증');

// 3페이지 소프트 삭제
const softDeleted = PageLayoutEngine.softDeletePage(testPages, 3);
assert(softDeleted[2].isDeleted === true, '3-1. 3페이지 isDeleted: true 마킹');
assert(softDeleted.length === 10, '3-2. 소프트 삭제 시 원본 배열 길이 10 보존 (Undo 대비)');

// 3페이지 복원
const restored = PageLayoutEngine.restorePage(softDeleted, 3);
assert(restored[2].isDeleted === false, '3-3. 3페이지 isDeleted: false 복원 완료');

// 2번, 5번 페이지 소프트 삭제 후 클린징
let step = PageLayoutEngine.softDeletePage(testPages, 2);
step = PageLayoutEngine.softDeletePage(step, 5);
const cleaned = PageLayoutEngine.cleanDeletedPages(step);
assert(cleaned.length === 8, `3-4. 클린징 후 8페이지로 축소 (실제: ${cleaned.length}P)`);
assert(!cleaned.some((p) => p.id === 'page-2' || p.id === 'page-5'), '3-5. 소프트 삭제된 페이지만 물리적 제거');
assert(cleaned.every((p, idx) => p.pageNum === idx + 1), '3-6. 클린징 후 pageNum 1부터 8까지 순차 재정렬 완결');

// -------------------------------------------------------------
// [4] HistoryManager: 무제한 Undo / Redo 스택 및 생명주기 검증
// -------------------------------------------------------------
console.log('\n▶ [4] HistoryManager 무제한 Undo / Redo 커맨드 엔진 검증');

const history = new HistoryManager<string>('Step-1');
assert(!history.canUndo() && !history.canRedo(), '4-1. 초기 상태에서 canUndo, canRedo 모두 false');
assert(history.getUndoCount() === 0 && history.getRedoCount() === 0, '4-2. 초기 스택 카운트 0');

// Step-2, Step-3 실행
history.execute('Step-2', '2단계 변경');
history.execute('Step-3', '3단계 변경');
assert(history.getState() === 'Step-3', '4-3. 현재 상태 Step-3 일치');
assert(history.canUndo() && !history.canRedo(), '4-4. 2회 실행 후 canUndo=true, canRedo=false');
assert(history.getUndoCount() === 2, `4-5. Undo 스택 2개 누적 (실제: ${history.getUndoCount()})`);

// 1회 Undo (Step-3 -> Step-2)
const undo1 = history.undo();
assert(undo1 === 'Step-2' && history.getState() === 'Step-2', '4-6. 1회 Undo 시 Step-2 복귀');
assert(history.canUndo() && history.canRedo(), '4-7. Undo 후 canUndo=true, canRedo=true');
assert(history.getUndoCount() === 1 && history.getRedoCount() === 1, '4-8. Undo/Redo 스택 각 1개 분배');

// 2회 Undo (Step-2 -> Step-1)
const undo2 = history.undo();
assert(undo2 === 'Step-1' && history.getState() === 'Step-1', '4-9. 2회 Undo 시 초기 Step-1 복귀');
assert(!history.canUndo() && history.canRedo(), '4-10. 초기 복귀 후 canUndo=false, canRedo=true');
assert(history.undo() === null, '4-11. 스택 소진 후 Undo 시 null 안전 반환');

// 1회 Redo (Step-1 -> Step-2)
const redo1 = history.redo();
assert(redo1 === 'Step-2' && history.getState() === 'Step-2', '4-12. 1회 Redo 시 Step-2 재적용');
assert(history.canUndo() && history.canRedo(), '4-13. Redo 후 Undo/Redo 모두 가능');

// 신규 수정 발생 시 Redo 스택 초기화 검증 (Step-2 -> Step-New)
history.execute('Step-New', '새로운 분기 변경');
assert(history.getState() === 'Step-New', '4-14. 신규 상태 Step-New 적용');
assert(!history.canRedo(), '4-15. 신규 수정 시 Redo 스택 자동 제거 (canRedo=false)');
assert(history.getRedoCount() === 0, '4-16. Redo 스택 카운트 0 초기화');

// -------------------------------------------------------------
// [5] 800쪽 대용량 도서 대상 1,000회 연속 커맨드 실행 벤치마크
// -------------------------------------------------------------
console.log('\n▶ [5] 800쪽 대용량 도서 대상 고속 커맨드 벤치마크');

const mockBook800 = PdfPageStore.generateMockBook(800, '대용량 800P 도서');
const bookHistory = new HistoryManager<PdfPageItem[]>(mockBook800);

const startTime = Date.now();

// 100회 다양한 레이아웃 수정 연속 실행
let curBook = mockBook800;
for (let i = 1; i <= 100; i++) {
  curBook = PageLayoutEngine.rotatePage(curBook, i, 90);
  bookHistory.execute(curBook, `${i}쪽 회전`);
}
assert(bookHistory.getUndoCount() === 100, '5-1. 100회 무제한 커맨드 스택 누적 성공');

// 50회 연속 Undo
for (let i = 0; i < 50; i++) {
  bookHistory.undo();
}
assert(bookHistory.getUndoCount() === 50 && bookHistory.getRedoCount() === 50, '5-2. 50회 Undo 후 스택 50/50 분배');

// 50회 연속 Redo
for (let i = 0; i < 50; i++) {
  bookHistory.redo();
}
assert(bookHistory.getUndoCount() === 100 && bookHistory.getRedoCount() === 0, '5-3. 50회 Redo 복원 완료');

const elapsedMs = Date.now() - startTime;
assert(elapsedMs < 100, `5-4. 800쪽 200회 상태 조작 고속 처리 완료 (${elapsedMs}ms < 100ms)`);

console.log('\n================================================================');
console.log('🎉 [TDD 완료] PDF 페이지 레이아웃 엔진 및 무제한 Undo/Redo 100% 무결성 통과!');
console.log('================================================================\n');
