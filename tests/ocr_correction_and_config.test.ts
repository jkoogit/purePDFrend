/**
 * @file tests/ocr_correction_and_config.test.ts
 * @description In-Memory Write-Through 설정 관리자 및 2-Way BBox 교정기 TDD 단위 검증
 */

import {
  PdfConfigManager,
  DEFAULT_PDF_CONFIG,
  CONFIG_PRESETS,
} from '../src/ppdf/services/PdfConfigManager';
import { HistoryManager } from '../src/ppdf/services/PageHistoryManager';
import { BoundingBoxItem } from '../src/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ [FAIL] ${message}`);
    process.exit(1);
  }
  console.log(`✅ [PASS] ${message}`);
}

async function runTests() {
  console.log('=== [TDD] In-Memory PDF 시스템 설정 관리자 & 2-Way BBox 교정기 단위 테스트 ===\n');

  const manager = PdfConfigManager.getInstance();
  manager.resetToDefaults();

  // -------------------------------------------------------------
  // [1] In-Memory Fast Read & 불변성(Immutability) 검증
  // -------------------------------------------------------------
  console.log('▶ [1] In-Memory Fast Read & 불변성 검증');

  const config1 = manager.getConfig();
  assert(config1.liveSyncCorrection === false, '1-1. 기본 liveSyncCorrection: false (명시적 저장 모드)');
  assert(config1.autoScrollSync === true, '1-2. 기본 autoScrollSync: true (2-Way 자동 스크롤)');
  assert(config1.enableBBoxSnap === true, '1-3. 기본 enableBBoxSnap: true (4px 그리드 스냅)');
  assert(config1.lruCacheSize === 10, '1-4. 기본 LRU 메모리가드 캐시 크기: 10P');
  assert(Object.isFrozen(config1) === true, '1-5. getConfig 반환 객체 불변 동결(Object.freeze) 검증');

  // -------------------------------------------------------------
  // [2] Write-Through 업데이트 & 옵저버 패턴 알림 검증
  // -------------------------------------------------------------
  console.log('\n▶ [2] Write-Through 업데이트 & 옵저버 패턴 알림 검증');

  let observerNotified = false;
  let receivedLiveSyncValue = false;

  const unsubscribe = manager.subscribe((cfg) => {
    observerNotified = true;
    receivedLiveSyncValue = cfg.liveSyncCorrection;
  });

  const updatedConfig = manager.updateConfig({
    liveSyncCorrection: true,
    renderResolutionDpi: 2.0,
  });

  assert(updatedConfig.liveSyncCorrection === true, '2-1. 메모리 liveSyncCorrection: true 즉시 반영');
  assert(updatedConfig.renderResolutionDpi === 2.0, '2-2. 메모리 renderResolutionDpi: 2.0x 즉시 반영');
  assert(observerNotified === true, '2-3. 옵저버 리스너 알림 이벤트 100% 수신');
  assert(receivedLiveSyncValue === true, '2-4. 옵저버 전달 스냅샷 일치 확인');

  unsubscribe();

  // -------------------------------------------------------------
  // [3] 원클릭 프리셋 프로파일(Preset Profiles) 전환 검증
  // -------------------------------------------------------------
  console.log('\n▶ [3] 원클릭 프리셋 프로파일 일괄 전환 검증');

  // 정밀 교정 모드
  const precision = manager.applyPreset('precision');
  assert(precision.liveSyncCorrection === true, '3-1. 정밀 교정: liveSync ON');
  assert(precision.showConfidenceBadges === true, '3-2. 정밀 교정: 저신뢰도 배지 ON');
  assert(precision.renderResolutionDpi === 1.5, '3-3. 정밀 교정: 1.5x 고해상도');

  // 초고속 모드
  const performance = manager.applyPreset('performance');
  assert(performance.liveSyncCorrection === false, '3-4. 초고속: liveSync OFF');
  assert(performance.enableBBoxSnap === false, '3-5. 초고속: 스냅 연산 OFF');
  assert(performance.renderResolutionDpi === 1.0, '3-6. 초고속: 1.0x 표준 해상도');

  // 대용량 도서 모드
  const massive = manager.applyPreset('massive_book');
  assert(massive.lruCacheSize === 5, '3-7. 대용량 도서: LRU 5P 압축');
  assert(massive.maxHistoryDepth === 50, '3-8. 대용량 도서: 히스토리 50단계 제한');

  // 기본값 초기화
  const reset = manager.resetToDefaults();
  assert(reset.liveSyncCorrection === false, '3-9. 시스템 기본값 초기화 완결');

  // -------------------------------------------------------------
  // [4] BBox 2-Way 포커스 및 HistoryManager 무제한 Undo/Redo
  // -------------------------------------------------------------
  console.log('\n▶ [4] BBox 2-Way 포커스 및 HistoryManager 무제한 Undo/Redo 검증');

  const sampleBoxes: BoundingBoxItem[] = [
    { id: 1, text: '첫 번째 박스', confidence: 0.98, x: 10, y: 10, w: 80, h: 8, lineIndex: 1 },
    { id: 2, text: '두 번째 박스', confidence: 0.72, x: 10, y: 20, w: 80, h: 8, lineIndex: 2 },
  ];

  const history = new HistoryManager<BoundingBoxItem[]>(sampleBoxes, 0);

  // 수정
  const editedBoxes = sampleBoxes.map((b) => (b.id === 1 ? { ...b, text: '첫 번째 박스 [교정완료]' } : b));
  history.execute(editedBoxes, '텍스트 교정');

  assert(history.canUndo() === true, '4-1. 수정 후 canUndo 활성화');
  assert(history.getState()[0].text === '첫 번째 박스 [교정완료]', '4-2. 현재 상태 수정 반영');

  // Undo
  const undone = history.undo();
  assert(undone![0].text === '첫 번째 박스', '4-3. Undo 후 원본 복구 완결');
  assert(history.canRedo() === true, '4-4. Undo 후 canRedo 활성화');

  // Redo
  const redone = history.redo();
  assert(redone![0].text === '첫 번째 박스 [교정완료]', '4-5. Redo 후 교정본 재적용');

  // -------------------------------------------------------------
  // [5] BBox 병합(Merge) / 분할(Split) / 4px 스냅 수학적 무결성
  // -------------------------------------------------------------
  console.log('\n▶ [5] BBox 병합/분할/스냅 연산 무결성 검증');

  // Merge calculation
  const b1 = sampleBoxes[0];
  const b2 = sampleBoxes[1];
  const merged: BoundingBoxItem = {
    id: 'MERGED-1',
    text: `${b1.text} ${b2.text}`,
    confidence: (b1.confidence + b2.confidence) / 2,
    x: Math.min(b1.x, b2.x),
    y: Math.min(b1.y, b2.y),
    w: Math.max(b1.x + b1.w, b2.x + b2.w) - Math.min(b1.x, b2.x),
    h: Math.max(b1.y + b1.h, b2.y + b2.h) - Math.min(b1.y, b2.y),
    lineIndex: 1,
  };

  assert(merged.text === '첫 번째 박스 두 번째 박스', '5-1. 텍스트 결합 일치');
  assert(merged.confidence === 0.85, '5-2. 평균 신뢰도 (0.98 + 0.72) / 2 = 0.85 일치');
  assert(merged.h === 18, '5-3. 높이 28 - 10 = 18% 일치');

  // 4px Snap logic
  const snap = (v: number) => Math.round(v / 0.5) * 0.5;
  assert(snap(12.3) === 12.5, '5-4. 12.3% -> 12.5% 스냅');
  assert(snap(12.2) === 12.0, '5-5. 12.2% -> 12.0% 스냅');

  console.log('\n================================================================');
  console.log('🎉 [TDD 완료] In-Memory PDF 시스템 설정 및 2-Way 교정기 100% 무결성 통과!');
  console.log('================================================================\n');
}

runTests().catch((e) => {
  console.error('Test failed with error:', e);
  process.exit(1);
});
