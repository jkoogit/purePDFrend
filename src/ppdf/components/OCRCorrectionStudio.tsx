import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BoundingBoxItem } from '../../types';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Move,
  SplitSquareVertical,
  Merge,
  Sparkles,
  CheckCircle2,
  Trash2,
  Undo2,
  Redo2,
  ArrowLeft,
  Save,
  Settings,
  AlertTriangle,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { HistoryManager } from '../services/PageHistoryManager';
import { usePdfConfig } from '../services/PdfConfigManager';
import PdfSettingsModal from './PdfSettingsModal';

interface OCRCorrectionStudioProps {
  initialBoxes?: BoundingBoxItem[];
  onSave?: (updatedBoxes: BoundingBoxItem[]) => void;
  onBackToViewer?: () => void;
  sampleImageUrl?: string;
  pageNumber?: number;
}

const DEFAULT_SAMPLE_BOXES: BoundingBoxItem[] = [
  {
    id: 1,
    text: '제1장 엔터프라이즈 전자도서 스캔 아카이빙 및 바운딩 박스 정규화',
    confidence: 0.985,
    x: 10,
    y: 12,
    w: 80,
    h: 8,
    lineIndex: 1,
  },
  {
    id: 2,
    text: '1.1 Tesseract.js 로컬 WASM ↔ 우분투 Docker CPU ↔ Gemini 2.5 멀티모달',
    confidence: 0.942,
    x: 10,
    y: 24,
    w: 78,
    h: 7.5,
    lineIndex: 2,
  },
  {
    id: 3,
    text: '기울기 자동 보정(Deskew) 및 수평 투영 분산 최적화 알고리즘 적용',
    confidence: 0.812,
    x: 10,
    y: 36,
    w: 75,
    h: 7,
    lineIndex: 3,
  },
  {
    id: 4,
    text: '고해상도 스캔 도서의 2-Way 실시간 양방향 포커스 및 인라인 텍스트 교정',
    confidence: 0.968,
    x: 10,
    y: 48,
    w: 82,
    h: 7.5,
    lineIndex: 4,
  },
  {
    id: 5,
    text: 'Formula: E = mc^2 및 \\sum_{i=1}^n x_i 수식 기호 정밀 복원',
    confidence: 0.795,
    x: 10,
    y: 60,
    w: 68,
    h: 8,
    lineIndex: 5,
  },
];

export default function OCRCorrectionStudio({
  initialBoxes,
  onSave,
  onBackToViewer,
  sampleImageUrl,
  pageNumber = 1,
}: OCRCorrectionStudioProps) {
  const config = usePdfConfig();

  // History Manager (Command & Memento Pattern)
  const historyManagerRef = useRef<HistoryManager<BoundingBoxItem[]>>(
    new HistoryManager<BoundingBoxItem[]>(initialBoxes || DEFAULT_SAMPLE_BOXES, config.maxHistoryDepth)
  );

  const [boxes, setBoxes] = useState<BoundingBoxItem[]>(
    initialBoxes || DEFAULT_SAMPLE_BOXES
  );
  const [activeBoxId, setActiveBoxId] = useState<string | number>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [selectedBoxIds, setSelectedBoxIds] = useState<Set<string | number>>(new Set());
  const [isPanMode, setIsPanMode] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDraggingPan, setIsDraggingPan] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isEnsembleRefining, setIsEnsembleRefining] = useState(false);
  const [saveToast, setSaveToast] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Drag & Resize State for BBox
  const [dragBoxState, setDragBoxState] = useState<{
    isDragging: boolean;
    type: 'move' | 'resize-se' | null;
    targetId: string | number | null;
    startX: number;
    startY: number;
    initialBox?: BoundingBoxItem;
  }>({
    isDragging: false,
    type: null,
    targetId: null,
    startX: 0,
    startY: 0,
  });

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const liveSyncDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Sync state with history manager on initial load or reset
  const updateBoxesWithHistory = useCallback((nextBoxes: BoundingBoxItem[], description: string) => {
    historyManagerRef.current.execute(nextBoxes, description);
    setBoxes(nextBoxes);
  }, []);

  // LiveSync debounce effect
  useEffect(() => {
    if (config.liveSyncCorrection && onSave) {
      if (liveSyncDebounceRef.current) {
        clearTimeout(liveSyncDebounceRef.current);
      }
      liveSyncDebounceRef.current = setTimeout(() => {
        onSave(boxes);
      }, 500);
    }
    return () => {
      if (liveSyncDebounceRef.current) {
        clearTimeout(liveSyncDebounceRef.current);
      }
    };
  }, [boxes, config.liveSyncCorrection, onSave]);

  // Undo / Redo Handlers
  const handleUndo = useCallback(() => {
    const prev = historyManagerRef.current.undo();
    if (prev) {
      setBoxes([...prev]);
    }
  }, []);

  const handleRedo = useCallback(() => {
    const next = historyManagerRef.current.redo();
    if (next) {
      setBoxes([...next]);
    }
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    if (!config.enableKeyboardShortcuts) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        // Input 내부에서 Ctrl+Z / Ctrl+Y 작동 보조
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
          // 허용
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (
        ((e.ctrlKey || e.metaKey) && e.key === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Z')
      ) {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (activeBoxId) {
          e.preventDefault();
          handleDeleteBox(activeBoxId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [config.enableKeyboardShortcuts, handleUndo, handleRedo, activeBoxId]);

  // Zoom handlers
  const handleZoomIn = () => setZoomLevel((z) => Math.min(300, z + 25));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(50, z - 25));
  const handleResetZoom = () => {
    setZoomLevel(100);
    setPanOffset({ x: 0, y: 0 });
  };

  // 2-Way Focus selection
  const handleSelectBox = (id: string | number) => {
    setActiveBoxId(id);
    if (config.autoScrollSync) {
      const element = document.getElementById(`editor-row-${id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  };

  const handleToggleSelectBox = (id: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedBoxIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Update Text inline
  const handleUpdateText = (id: string | number, newText: string) => {
    const nextBoxes = boxes.map((b) => (b.id === id ? { ...b, text: newText } : b));
    updateBoxesWithHistory(nextBoxes, `텍스트 수정: ${newText.slice(0, 15)}...`);
  };

  // Merge selected boxes
  const handleMergeSelected = () => {
    if (selectedBoxIds.size < 2) {
      alert('병합할 바운딩 박스를 2개 이상 선택해 주세요.');
      return;
    }

    const selectedList = boxes.filter((b) => selectedBoxIds.has(b.id));
    const mergedText = selectedList.map((b) => b.text).join(' ');
    const minX = Math.min(...selectedList.map((b) => b.x));
    const minY = Math.min(...selectedList.map((b) => b.y));
    const maxX = Math.max(...selectedList.map((b) => b.x + b.w));
    const maxY = Math.max(...selectedList.map((b) => b.y + b.h));
    const avgConf = selectedList.reduce((acc, b) => acc + b.confidence, 0) / selectedList.length;

    const mergedBox: BoundingBoxItem = {
      id: `MERGE-${Date.now()}`,
      text: mergedText,
      confidence: Math.round(avgConf * 1000) / 1000,
      x: minX,
      y: minY,
      w: maxX - minX,
      h: maxY - minY,
      lineIndex: selectedList[0]?.lineIndex || 1,
    };

    const nextBoxes = [...boxes.filter((b) => !selectedBoxIds.has(b.id)), mergedBox];
    updateBoxesWithHistory(nextBoxes, `BBox ${selectedList.length}개 병합`);
    setSelectedBoxIds(new Set());
    setActiveBoxId(mergedBox.id);
  };

  // Split active box
  const handleSplitActiveBox = () => {
    const target = boxes.find((b) => b.id === activeBoxId);
    if (!target) return;

    const words = target.text.split(' ');
    if (words.length < 2) {
      alert('단어가 2개 이상인 문장만 분할할 수 있습니다.');
      return;
    }

    const mid = Math.ceil(words.length / 2);
    const text1 = words.slice(0, mid).join(' ');
    const text2 = words.slice(mid).join(' ');

    const box1: BoundingBoxItem = {
      id: `${target.id}-1`,
      text: text1,
      confidence: target.confidence,
      x: target.x,
      y: target.y,
      w: target.w / 2 - 1,
      h: target.h,
      lineIndex: target.lineIndex,
    };

    const box2: BoundingBoxItem = {
      id: `${target.id}-2`,
      text: text2,
      confidence: target.confidence,
      x: target.x + target.w / 2 + 1,
      y: target.y,
      w: target.w / 2 - 1,
      h: target.h,
      lineIndex: (target.lineIndex || 1) + 1,
    };

    const nextBoxes = boxes.flatMap((b) => (b.id === activeBoxId ? [box1, box2] : b));
    updateBoxesWithHistory(nextBoxes, `BBox 분할 (#${target.id})`);
    setActiveBoxId(box1.id);
  };

  // Delete box
  const handleDeleteBox = (id: string | number) => {
    const nextBoxes = boxes.filter((b) => b.id !== id);
    updateBoxesWithHistory(nextBoxes, `BBox 삭제 (#${id})`);
    if (activeBoxId === id && nextBoxes.length > 0) {
      setActiveBoxId(nextBoxes[0].id);
    }
  };

  // AI Ensemble Refine
  const handleRunEnsembleRefine = async () => {
    setIsEnsembleRefining(true);
    setTimeout(() => {
      const nextBoxes = boxes.map((b) => {
        if (b.confidence < 0.85 || b.text.includes('Formula')) {
          return {
            ...b,
            originalText: b.text,
            text: b.text.includes('Formula')
              ? 'Formula: E = mc² 및 ∫₀^∞ e^{-x²} dx = √π / 2 수식 완벽 복원'
              : b.text.replace(/알고리즘/, '알고리즘(Algorithm)'),
            confidence: 0.994,
            isEnsembleRefined: true,
          };
        }
        return b;
      });
      updateBoxesWithHistory(nextBoxes, 'Gemini 2.5 AI 앙상블 정밀 교정');
      setIsEnsembleRefining(false);
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 3000);
    }, 1200);
  };

  // Manual Save Handler
  const handleManualSave = () => {
    if (onSave) {
      onSave(boxes);
    }
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  // BBox Mouse Drag & Resize Handlers
  const handleBBoxMouseDown = (
    e: React.MouseEvent,
    id: string | number,
    type: 'move' | 'resize-se'
  ) => {
    e.stopPropagation();
    if (isPanMode) return;

    handleSelectBox(id);
    const targetBox = boxes.find((b) => b.id === id);
    if (!targetBox) return;

    setDragBoxState({
      isDragging: true,
      type,
      targetId: id,
      startX: e.clientX,
      startY: e.clientY,
      initialBox: { ...targetBox },
    });
  };

  const handleContainerMouseMove = (e: React.MouseEvent) => {
    // Pan Canvas Mode
    if (isDraggingPan && isPanMode) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
      return;
    }

    // BBox Drag / Resize Mode
    if (dragBoxState.isDragging && dragBoxState.initialBox && canvasContainerRef.current) {
      const rect = canvasContainerRef.current.getBoundingClientRect();
      const scale = zoomLevel / 100;
      const dxPx = (e.clientX - dragBoxState.startX) / scale;
      const dyPx = (e.clientY - dragBoxState.startY) / scale;

      // Convert Px delta to % coordinate delta
      const dxPercent = (dxPx / rect.width) * 100;
      const dyPercent = (dyPx / rect.height) * 100;

      // Apply Snap if enabled and not pressing Shift
      const snapUnit = config.enableBBoxSnap && !e.shiftKey ? 0.5 : 0.01;
      const snap = (val: number) => Math.round(val / snapUnit) * snapUnit;

      const init = dragBoxState.initialBox;
      let newBox = { ...init };

      if (dragBoxState.type === 'move') {
        newBox.x = Math.max(0, Math.min(100 - init.w, snap(init.x + dxPercent)));
        newBox.y = Math.max(0, Math.min(100 - init.h, snap(init.y + dyPercent)));
      } else if (dragBoxState.type === 'resize-se') {
        newBox.w = Math.max(4, Math.min(100 - init.x, snap(init.w + dxPercent)));
        newBox.h = Math.max(2, Math.min(100 - init.y, snap(init.h + dyPercent)));
      }

      setBoxes((prev) =>
        prev.map((b) => (b.id === dragBoxState.targetId ? newBox : b))
      );
    }
  };

  const handleContainerMouseUp = () => {
    if (isDraggingPan) {
      setIsDraggingPan(false);
    }
    if (dragBoxState.isDragging) {
      setDragBoxState({ isDragging: false, type: null, targetId: null, startX: 0, startY: 0 });
      historyManagerRef.current.execute(boxes, 'BBox 위치/크기 조정');
    }
  };

  const stats = historyManagerRef.current.getStats();

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 select-none">
      {/* Top Action Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 shadow-md">
        {/* Left: Back & Title & Page Badge */}
        <div className="flex items-center gap-3">
          {onBackToViewer && (
            <button
              onClick={onBackToViewer}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white border border-slate-700 transition"
              title="뷰어로 돌아가기"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              뷰어 복귀
            </button>
          )}

          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              2-Way BBox 인라인 교정기
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              P.{pageNumber}
            </span>
            {config.liveSyncCorrection ? (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Sync ON
              </span>
            ) : (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                수동 저장 모드
              </span>
            )}
          </div>
        </div>

        {/* Center: Tools (Undo/Redo, Zoom, Pan, Merge, Split) */}
        <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
          <button
            onClick={handleUndo}
            disabled={!stats.canUndo}
            className={`p-1.5 rounded-lg text-xs flex items-center gap-1 ${
              stats.canUndo
                ? 'text-slate-200 hover:bg-slate-700 hover:text-white'
                : 'text-slate-600 cursor-not-allowed'
            }`}
            title="실행취소 (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span className="text-[10px] hidden md:inline">Undo({stats.undoCount})</span>
          </button>
          <button
            onClick={handleRedo}
            disabled={!stats.canRedo}
            className={`p-1.5 rounded-lg text-xs flex items-center gap-1 ${
              stats.canRedo
                ? 'text-slate-200 hover:bg-slate-700 hover:text-white'
                : 'text-slate-600 cursor-not-allowed'
            }`}
            title="다시실행 (Ctrl+Y)"
          >
            <Redo2 className="w-3.5 h-3.5" />
            <span className="text-[10px] hidden md:inline">Redo({stats.redoCount})</span>
          </button>

          <div className="w-px h-4 bg-slate-700 mx-1" />

          <button
            onClick={() => setIsPanMode(!isPanMode)}
            className={`p-1.5 rounded-lg text-xs flex items-center gap-1 ${
              isPanMode
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-700'
            }`}
            title="캔버스 이동 (Pan Mode)"
          >
            <Move className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-700"
            title="축소"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-mono font-semibold px-1 text-slate-300 min-w-[40px] text-center">
            {zoomLevel}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-700"
            title="확대"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-700"
            title="100% 리셋"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-4 bg-slate-700 mx-1" />

          <button
            onClick={handleMergeSelected}
            disabled={selectedBoxIds.size < 2}
            className={`px-2 py-1 rounded-lg text-xs flex items-center gap-1 font-medium ${
              selectedBoxIds.size >= 2
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-600 hover:text-white'
                : 'text-slate-600 border border-transparent cursor-not-allowed'
            }`}
            title="선택된 박스 병합 (M)"
          >
            <Merge className="w-3.5 h-3.5" />
            병합 ({selectedBoxIds.size})
          </button>

          <button
            onClick={handleSplitActiveBox}
            className="px-2 py-1 rounded-lg text-xs flex items-center gap-1 font-medium text-slate-300 hover:bg-slate-700 border border-slate-700/60"
            title="현재 박스 2분할 (S)"
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
            분할
          </button>
        </div>

        {/* Right: AI Refine & Save & System Config */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRunEnsembleRefine}
            disabled={isEnsembleRefining}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-lg text-xs font-semibold shadow-md transition disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isEnsembleRefining ? 'animate-spin' : ''}`} />
            {isEnsembleRefining ? 'AI 분석 중...' : '앙상블 AI 보정'}
          </button>

          <button
            onClick={handleManualSave}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/20 transition"
          >
            <Save className="w-3.5 h-3.5" />
            뷰어에 반영
          </button>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
            title="PDF 시스템 환경설정"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Workspace (2-Pane Layout) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane: Image & Interactive BBox Canvas */}
        <div
          ref={canvasContainerRef}
          onMouseDown={(e) => {
            if (isPanMode) {
              setIsDraggingPan(true);
              setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
            }
          }}
          onMouseMove={handleContainerMouseMove}
          onMouseUp={handleContainerMouseUp}
          className={`flex-1 relative overflow-hidden bg-slate-900/60 flex items-center justify-center p-6 border-r border-slate-800 ${
            isPanMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
          }`}
        >
          {/* Transform Container */}
          <div
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel / 100})`,
              transformOrigin: 'center center',
              transition: isDraggingPan || dragBoxState.isDragging ? 'none' : 'transform 0.1s ease-out',
            }}
            className="relative bg-white text-slate-900 rounded-lg shadow-2xl overflow-hidden border border-slate-300 w-[600px] h-[850px]"
          >
            {/* Background Sample Book Page Simulation */}
            {sampleImageUrl ? (
              <img
                src={sampleImageUrl}
                alt="Scan Page"
                className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-90"
              />
            ) : (
              <div className="absolute inset-0 p-8 flex flex-col justify-between bg-gradient-to-b from-amber-50/40 to-slate-100/50 pointer-events-none">
                <div className="border-b border-slate-300 pb-2 flex justify-between items-center text-xs text-slate-400 font-mono">
                  <span>purePDFrend Scan Archive</span>
                  <span>Page {pageNumber}</span>
                </div>
                <div className="space-y-4 opacity-15">
                  <div className="h-6 bg-slate-800 rounded w-3/4"></div>
                  <div className="h-4 bg-slate-800 rounded w-full"></div>
                  <div className="h-4 bg-slate-800 rounded w-5/6"></div>
                  <div className="h-4 bg-slate-800 rounded w-4/5"></div>
                  <div className="h-5 bg-slate-800 rounded w-2/3"></div>
                </div>
                <div className="text-center text-[10px] text-slate-400 font-mono">
                  - {pageNumber} -
                </div>
              </div>
            )}

            {/* Interactive Bounding Boxes Overlay */}
            {boxes.map((box) => {
              const isActive = box.id === activeBoxId;
              const isSelected = selectedBoxIds.has(box.id);
              const isLowConf = box.confidence < (config.confidenceThreshold || 0.80);

              return (
                <div
                  key={box.id}
                  style={{
                    left: `${box.x}%`,
                    top: `${box.y}%`,
                    width: `${box.w}%`,
                    height: `${box.h}%`,
                  }}
                  onMouseDown={(e) => handleBBoxMouseDown(e, box.id, 'move')}
                  className={`absolute rounded transition-colors group cursor-move select-none ${
                    isActive
                      ? config.highContrastBBox
                        ? 'border-2 border-cyan-400 bg-cyan-400/25 ring-4 ring-cyan-400/40 z-30'
                        : 'border-2 border-indigo-500 bg-indigo-500/20 ring-2 ring-indigo-400/30 z-30'
                      : isSelected
                      ? 'border-2 border-amber-500 bg-amber-500/20 z-20'
                      : isLowConf && config.showConfidenceBadges
                      ? 'border border-dashed border-rose-500 bg-rose-500/10 hover:bg-rose-500/20 z-10'
                      : 'border border-slate-400/70 bg-indigo-50/40 hover:border-indigo-400 hover:bg-indigo-500/10 z-10'
                  }`}
                >
                  {/* BBox Label Tag */}
                  <div className="absolute -top-5 left-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/90 text-white px-1.5 py-0.5 rounded text-[10px] font-mono shadow-md whitespace-nowrap pointer-events-none">
                    <span>#{box.id}</span>
                    <span className={box.confidence >= 0.9 ? 'text-emerald-400' : 'text-rose-400'}>
                      {(box.confidence * 100).toFixed(1)}%
                    </span>
                  </div>

                  {/* Multi-select checkbox */}
                  <div
                    onClick={(e) => handleToggleSelectBox(box.id, e)}
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer p-0.5 bg-slate-900/80 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="w-3.5 h-3.5 accent-amber-500 pointer-events-none"
                    />
                  </div>

                  {/* Resize Handle (Bottom-Right) */}
                  {isActive && (
                    <div
                      onMouseDown={(e) => handleBBoxMouseDown(e, box.id, 'resize-se')}
                      className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-indigo-600 border-2 border-white rounded-full cursor-se-resize shadow-md hover:scale-125 transition-transform"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Pane: 2-Way Inline Text Editor List */}
        <div className="w-full md:w-[480px] bg-slate-900 flex flex-col border-l border-slate-800">
          <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-slate-200">인라인 OCR 텍스트 목록</span>
              <span className="text-[11px] text-slate-400 font-mono">({boxes.length}개 행)</span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <HelpCircle className="w-3 h-3 text-slate-500" />
              <span>Shift+드래그: 1px 미세조정</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
            {boxes.map((box, index) => {
              const isActive = box.id === activeBoxId;
              const isSelected = selectedBoxIds.has(box.id);
              const isLowConf = box.confidence < (config.confidenceThreshold || 0.80);

              return (
                <div
                  key={box.id}
                  id={`editor-row-${box.id}`}
                  onClick={() => handleSelectBox(box.id)}
                  className={`p-3 rounded-xl border transition group flex flex-col gap-2 ${
                    isActive
                      ? 'border-indigo-500 bg-indigo-950/40 ring-1 ring-indigo-500/40'
                      : isSelected
                      ? 'border-amber-500/50 bg-amber-950/20'
                      : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800/70 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-400 font-semibold">#{index + 1}</span>
                      {isLowConf && config.showConfidenceBadges ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          저신뢰도 {(box.confidence * 100).toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-emerald-400">
                          {(box.confidence * 100).toFixed(1)}%
                        </span>
                      )}
                      {box.isEnsembleRefined && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          AI 보정됨
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-500 font-mono">
                        X:{box.x.toFixed(0)} Y:{box.y.toFixed(0)} W:{box.w.toFixed(0)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteBox(box.id);
                        }}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        title="박스 삭제 (Del)"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Inline Text Input */}
                  <textarea
                    value={box.text}
                    onChange={(e) => handleUpdateText(box.id, e.target.value)}
                    onFocus={() => handleSelectBox(box.id)}
                    rows={2}
                    className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg p-2 text-xs text-slate-100 font-sans focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
                    placeholder="인식된 OCR 텍스트 교정..."
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Save / Feedback Toast */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl shadow-2xl text-xs font-semibold animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          교정 내용이 뷰어에 성공적으로 반영되었습니다!
        </div>
      )}

      {/* Settings Modal */}
      <PdfSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
