import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  PdfConfigManager,
  DEFAULT_PDF_CONFIG,
  CONFIG_PRESETS,
  PdfSystemConfig,
} from '../src/ppdf/services/PdfConfigManager';

describe('PdfConfigManager In-Memory Write-Through Registry Tests', () => {
  let manager: PdfConfigManager;

  beforeEach(() => {
    // Reset singleton instance
    manager = PdfConfigManager.getInstance();
    manager.resetToDefaults();
  });

  it('기본 설정값을 0ms In-Memory 캐시로 즉시 조회해야 한다', () => {
    const config = manager.getConfig();
    expect(config).toBeDefined();
    expect(config.liveSyncCorrection).toBe(false);
    expect(config.autoScrollSync).toBe(true);
    expect(config.enableBBoxSnap).toBe(true);
    expect(config.showConfidenceBadges).toBe(true);
    expect(config.defaultExportFont).toBe('Helvetica');
    expect(config.lruCacheSize).toBe(10);
  });

  it('반환된 설정 객체는 외부에서 직접 수정할 수 없도록 동결(Immutable)되어야 한다', () => {
    const config = manager.getConfig();
    expect(Object.isFrozen(config)).toBe(true);
    // TypeScript/JS 레벨에서 불변성 검증
    expect(() => {
      (config as any).liveSyncCorrection = true;
    }).toThrow();
  });

  it('Write-Through 업데이트를 통해 메모리 설정 갱신 및 옵저버 알림이 정상 작동해야 한다', () => {
    let notifiedConfig: Readonly<PdfSystemConfig> | null = null;
    const unsubscribe = manager.subscribe((cfg) => {
      notifiedConfig = cfg;
    });

    const updated = manager.updateConfig({
      liveSyncCorrection: true,
      lruCacheSize: 20,
    });

    expect(updated.liveSyncCorrection).toBe(true);
    expect(updated.lruCacheSize).toBe(20);
    expect(notifiedConfig).not.toBeNull();
    expect(notifiedConfig!.liveSyncCorrection).toBe(true);
    expect(notifiedConfig!.lruCacheSize).toBe(20);

    unsubscribe();
  });

  it('정밀 교정 프리셋(precision) 적용 시 관련 설정이 일괄 변경되어야 한다', () => {
    const updated = manager.applyPreset('precision');
    expect(updated.liveSyncCorrection).toBe(true);
    expect(updated.autoScrollSync).toBe(true);
    expect(updated.enableBBoxSnap).toBe(true);
    expect(updated.showConfidenceBadges).toBe(true);
    expect(updated.renderResolutionDpi).toBe(1.5);
    expect(updated.confidenceThreshold).toBe(0.85);
  });

  it('초고속 모드 프리셋(performance) 적용 시 오버헤드 방지 설정이 일괄 적용되어야 한다', () => {
    const updated = manager.applyPreset('performance');
    expect(updated.liveSyncCorrection).toBe(false);
    expect(updated.autoScrollSync).toBe(false);
    expect(updated.enableBBoxSnap).toBe(false);
    expect(updated.showConfidenceBadges).toBe(false);
    expect(updated.renderResolutionDpi).toBe(1.0);
  });

  it('대용량 도서 프리셋(massive_book) 적용 시 LRU 5P 및 히스토리 50단계 제한이 적용되어야 한다', () => {
    const updated = manager.applyPreset('massive_book');
    expect(updated.lruCacheSize).toBe(5);
    expect(updated.maxHistoryDepth).toBe(50);
    expect(updated.autoCleanOnSave).toBe(true);
    expect(updated.includeSoftDeletedInExport).toBe(false);
  });

  it('resetToDefaults 호출 시 모든 설정이 초기 기본값으로 완벽 복구되어야 한다', () => {
    manager.updateConfig({ liveSyncCorrection: true, defaultExportFont: 'Courier' });
    expect(manager.getConfig().liveSyncCorrection).toBe(true);

    const reset = manager.resetToDefaults();
    expect(reset.liveSyncCorrection).toBe(false);
    expect(reset.defaultExportFont).toBe('Helvetica');
  });
});
