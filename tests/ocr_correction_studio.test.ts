import { describe, it, expect, beforeEach } from 'vitest';
import { HistoryManager } from '../src/ppdf/services/PageHistoryManager';
import { BoundingBoxItem } from '../src/types';

describe('OCRCorrectionStudio & BBox History / Snap Logic Tests', () => {
  const initialBoxes: BoundingBoxItem[] = [
    {
      id: 1,
      text: '제1장 전자도서 스캔 아카이빙',
      confidence: 0.985,
      x: 10,
      y: 12,
      w: 80,
      h: 8,
      lineIndex: 1,
    },
    {
      id: 2,
      text: '1.1 Tesseract WASM 및 Gemini 멀티모달',
      confidence: 0.942,
      x: 10,
      y: 24,
      w: 78,
      h: 7.5,
      lineIndex: 2,
    },
    {
      id: 3,
      text: '수평 투영 분산 최적화 알고리즘',
      confidence: 0.78,
      x: 10,
      y: 36,
      w: 75,
      h: 7,
      lineIndex: 3,
    },
  ];

  let historyManager: HistoryManager<BoundingBoxItem[]>;

  beforeEach(() => {
    historyManager = new HistoryManager<BoundingBoxItem[]>(initialBoxes, 0);
  });

  it('초기 BBox 상태를 올바르게 로드해야 한다', () => {
    const state = historyManager.getState();
    expect(state).toHaveLength(3);
    expect(state[0].text).toBe('제1장 전자도서 스캔 아카이빙');
    expect(historyManager.canUndo()).toBe(false);
    expect(historyManager.canRedo()).toBe(false);
  });

  it('텍스트 인라인 수정 후 Undo/Redo가 정상 동작해야 한다', () => {
    const updated = initialBoxes.map((b) =>
      b.id === 1 ? { ...b, text: '제1장 [수정됨] 전자도서 스캔 아카이빙' } : b
    );

    historyManager.execute(updated, '텍스트 인라인 교정');

    expect(historyManager.canUndo()).toBe(true);
    expect(historyManager.getState()[0].text).toBe('제1장 [수정됨] 전자도서 스캔 아카이빙');

    // Undo
    const undone = historyManager.undo();
    expect(undone![0].text).toBe('제1장 전자도서 스캔 아카이빙');
    expect(historyManager.canRedo()).toBe(true);

    // Redo
    const redone = historyManager.redo();
    expect(redone![0].text).toBe('제1장 [수정됨] 전자도서 스캔 아카이빙');
  });

  it('BBox 2개 병합(Merge) 시 좌표 합산 및 평균 신뢰도가 올바르게 계산되어야 한다', () => {
    const selectedList = [initialBoxes[0], initialBoxes[1]];
    const mergedText = selectedList.map((b) => b.text).join(' ');
    const minX = Math.min(...selectedList.map((b) => b.x));
    const minY = Math.min(...selectedList.map((b) => b.y));
    const maxX = Math.max(...selectedList.map((b) => b.x + b.w));
    const maxY = Math.max(...selectedList.map((b) => b.y + b.h));
    const avgConf =
      selectedList.reduce((acc, b) => acc + b.confidence, 0) / selectedList.length;

    const mergedBox: BoundingBoxItem = {
      id: 'MERGE-001',
      text: mergedText,
      confidence: Math.round(avgConf * 1000) / 1000,
      x: minX,
      y: minY,
      w: maxX - minX,
      h: maxY - minY,
      lineIndex: 1,
    };

    const nextBoxes = [mergedBox, initialBoxes[2]];
    historyManager.execute(nextBoxes, 'BBox 병합');

    expect(historyManager.getState()).toHaveLength(2);
    expect(historyManager.getState()[0].id).toBe('MERGE-001');
    expect(historyManager.getState()[0].text).toContain('제1장');
    expect(historyManager.getState()[0].text).toContain('1.1 Tesseract');
    expect(historyManager.getState()[0].confidence).toBe(0.964);
    expect(historyManager.getState()[0].w).toBe(80);
    expect(historyManager.getState()[0].h).toBe(19.5); // 31.5 - 12
  });

  it('BBox 분할(Split) 시 2개의 분할된 BBox로 정상 분리되어야 한다', () => {
    const target = initialBoxes[0];
    const words = target.text.split(' ');
    const mid = Math.ceil(words.length / 2);
    const text1 = words.slice(0, mid).join(' ');
    const text2 = words.slice(mid).join(' ');

    const box1: BoundingBoxItem = {
      id: '1-1',
      text: text1,
      confidence: target.confidence,
      x: target.x,
      y: target.y,
      w: target.w / 2 - 1,
      h: target.h,
      lineIndex: target.lineIndex,
    };

    const box2: BoundingBoxItem = {
      id: '1-2',
      text: text2,
      confidence: target.confidence,
      x: target.x + target.w / 2 + 1,
      y: target.y,
      w: target.w / 2 - 1,
      h: target.h,
      lineIndex: (target.lineIndex || 1) + 1,
    };

    const nextBoxes = [box1, box2, initialBoxes[1], initialBoxes[2]];
    historyManager.execute(nextBoxes, 'BBox 분할');

    expect(historyManager.getState()).toHaveLength(4);
    expect(historyManager.getState()[0].text).toBe('제1장 전자도서');
    expect(historyManager.getState()[1].text).toBe('스캔 아카이빙');
  });

  it('BBox 스냅 계산 함수가 0.5% (스냅 단위)로 반올림되어야 한다', () => {
    const snapUnit = 0.5;
    const snap = (val: number) => Math.round(val / snapUnit) * snapUnit;

    expect(snap(10.2)).toBe(10.0);
    expect(snap(10.3)).toBe(10.5);
    expect(snap(10.74)).toBe(10.5);
    expect(snap(10.76)).toBe(11.0);
  });
});
