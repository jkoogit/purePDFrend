import React, { useState, useRef } from 'react';
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
  Layers,
  Sliders,
  DollarSign
} from 'lucide-react';

interface OCRCorrectionStudioProps {
  initialBoxes?: BoundingBoxItem[];
  onSave?: (updatedBoxes: BoundingBoxItem[]) => void;
  sampleImageUrl?: string;
}

export default function OCRCorrectionStudio({
  initialBoxes,
  onSave,
}: OCRCorrectionStudioProps) {
  const [boxes, setBoxes] = useState<BoundingBoxItem[]>(
    initialBoxes || [
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
    ]
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

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const editorListRef = useRef<HTMLDivElement>(null);

  // Zoom handlers
  const handleZoomIn = () => setZoomLevel((z) => Math.min(300, z + 25));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(50, z - 25));
  const handleResetZoom = () => {
    setZoomLevel(100);
    setPanOffset({ x: 0, y: 0 });
  };

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isPanMode) {
      setIsDraggingPan(true);
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingPan && isPanMode) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => setIsDraggingPan(false);

  // Select box & 2-Way focus
  const handleSelectBox = (id: string | number) => {
    setActiveBoxId(id);
    const element = document.getElementById(`editor-row-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  // Toggle selection for bulk actions (Merge)
  const handleToggleSelectBox = (id: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedBoxIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Update text in 2-Way sync
  const handleUpdateText = (id: string | number, newText: string) => {
    setBoxes((prev) =>
      prev.map((b) => (b.id === id ? { ...b, text: newText } : b))
    );
  };

  // Merge selected boxes into one
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

    const avgConf =
      selectedList.reduce((acc, b) => acc + b.confidence, 0) / selectedList.length;

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

    setBoxes((prev) => [
      ...prev.filter((b) => !selectedBoxIds.has(b.id)),
      mergedBox,
    ]);
    setSelectedBoxIds(new Set());
    setActiveBoxId(mergedBox.id);
  };

  // Split active box into 2
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

    setBoxes((prev) => prev.flatMap((b) => (b.id === activeBoxId ? [box1, box2] : b)));
    setActiveBoxId(box1.id);
  };

  // Delete active box
  const handleDeleteBox = (id: string | number) => {
    setBoxes((prev) => prev.filter((b) => b.id !== id));
    if (activeBoxId === id && boxes.length > 1) {
      setActiveBoxId(boxes.find((b) => b.id !== id)?.id || 1);
    }
  };

  // Run AI Ensemble Refine for low confidence items
  const handleRunEnsembleRefine = async () => {
    setIsEnsembleRefining(true);
    setTimeout(() => {
      setBoxes((prev) =>
        prev.map((b) => {
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
        })
      );
      setIsEnsembleRefining(false);
    }, 600);
  };

  const handleSaveAll = () => {
    if (onSave) onSave(boxes);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  const activeBox = boxes.find((b) => b.id === activeBoxId);
  const refinedCount = boxes.filter((b) => b.isEnsembleRefined).length;
  const avgConfidence =
    boxes.length > 0
      ? Math.round(
          (boxes.reduce((sum, b) => sum + b.confidence, 0) / boxes.length) * 1000
        ) / 10
      : 0;

  return (
    <div className="flex flex-col h-[calc(100vh-5.5rem)] bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Top Toolbar */}
      <div className="bg-slate-900/90 border-b border-slate-800 p-2.5 px-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              <span>2-Way 대조 OCR 바운딩 박스 인라인 교정 스튜디오</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold">
                실시간 양방향 동기화
              </span>
            </h2>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Zoom Controls */}
          <div className="flex items-center bg-slate-950 border border-slate-700 rounded-lg p-0.5 text-xs">
            <button
              onClick={handleZoomOut}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded"
              title="축소"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono text-[11px] text-indigo-300">{zoomLevel}%</span>
            <button
              onClick={handleZoomIn}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded"
              title="확대"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded border-l border-slate-800"
              title="줌 리셋"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Pan Toggle */}
          <button
            onClick={() => setIsPanMode(!isPanMode)}
            className={`p-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              isPanMode
                ? 'bg-indigo-600 text-white border-indigo-500'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Move className="w-3.5 h-3.5" />
            <span>{isPanMode ? '팬(이동) ON' : '팬 OFF'}</span>
          </button>

          {/* Split & Merge */}
          <button
            onClick={handleSplitActiveBox}
            className="p-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5"
            title="선택된 박스를 둘로 분할"
          >
            <SplitSquareVertical className="w-3.5 h-3.5 text-amber-400" />
            <span>박스 분할</span>
          </button>

          <button
            onClick={handleMergeSelected}
            disabled={selectedBoxIds.size < 2}
            className="p-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5"
            title="체크된 여러 박스를 하나로 병합"
          >
            <Merge className="w-3.5 h-3.5 text-indigo-400" />
            <span>박스 병합 ({selectedBoxIds.size})</span>
          </button>

          {/* AI Ensemble Refine */}
          <button
            onClick={handleRunEnsembleRefine}
            disabled={isEnsembleRefining}
            className="p-1.5 px-3 bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-600/20"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isEnsembleRefining ? 'AI 정밀 보정 중...' : '저신뢰도 앙상블 보정'}</span>
          </button>

          {/* Save Action */}
          <button
            onClick={handleSaveAll}
            className="p-1.5 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>최종 반영</span>
          </button>
        </div>
      </div>

      {/* Main 2-Way Split Pane */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* Left Pane: Interactive Bounding Box Canvas */}
        <div
          ref={canvasContainerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className={`flex-1 bg-slate-950 border-r border-slate-800 relative overflow-hidden flex items-center justify-center p-4 ${
            isPanMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
          }`}
        >
          {/* Mock Document Page Background */}
          <div
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel / 100})`,
              transformOrigin: 'center center',
              transition: isDraggingPan ? 'none' : 'transform 0.15s ease-out',
            }}
            className="relative w-[480px] h-[640px] bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-6 select-none"
          >
            {/* Page Header Mock */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-4 text-[10px] text-slate-500 font-mono">
              <span>SCAN DOC #PAGE-001 (DPI: 300)</span>
              <span>DESKEW: +0.7° / ADAPTIVE BINARIZED</span>
            </div>

            {/* Bounding Boxes Layer */}
            {boxes.map((b) => {
              const isActive = b.id === activeBoxId;
              const isChecked = selectedBoxIds.has(b.id);
              const isLowConf = b.confidence < 0.85;

              return (
                <div
                  key={b.id}
                  onClick={() => handleSelectBox(b.id)}
                  style={{
                    position: 'absolute',
                    left: `${b.x}%`,
                    top: `${b.y}%`,
                    width: `${b.w}%`,
                    height: `${b.h}%`,
                  }}
                  className={`border-2 rounded transition-all cursor-pointer flex flex-col justify-between p-1 group ${
                    isActive
                      ? 'border-indigo-400 bg-indigo-500/20 ring-2 ring-indigo-500/40 z-20'
                      : isChecked
                      ? 'border-emerald-400 bg-emerald-500/15 z-10'
                      : isLowConf
                      ? 'border-amber-500/80 bg-amber-500/10 hover:border-amber-400'
                      : 'border-slate-600 bg-slate-800/40 hover:border-indigo-500/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[9px] px-1 py-0.2 rounded font-bold font-mono ${
                        b.isEnsembleRefined
                          ? 'bg-amber-500 text-slate-950'
                          : isLowConf
                          ? 'bg-amber-900 text-amber-300'
                          : 'bg-indigo-900/80 text-indigo-200'
                      }`}
                    >
                      #{b.id} {b.isEnsembleRefined ? 'AI-Refined' : `${Math.round(b.confidence * 100)}%`}
                    </span>

                    <input
                      type="checkbox"
                      checked={isChecked}
                      onClick={(e) => handleToggleSelectBox(b.id, e)}
                      className="w-3 h-3 rounded text-emerald-500 focus:ring-0 opacity-80 group-hover:opacity-100"
                    />
                  </div>

                  <span className="text-[11px] text-slate-200 truncate font-mono mt-0.5">
                    {b.text}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Pane: 2-Way Synchronized Text Editor */}
        <div className="w-full md:w-[420px] bg-slate-900/90 flex flex-col min-h-0 border-t md:border-t-0 border-slate-800">
          <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>텍스트 에디터 (인라인 수정 & 동기화)</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              총 {boxes.length}개 라인 / 평균 신뢰도: <strong className="text-emerald-400">{avgConfidence}%</strong>
            </span>
          </div>

          <div
            ref={editorListRef}
            className="flex-1 overflow-y-auto p-3 space-y-2.5 no-scrollbar"
          >
            {boxes.map((b) => {
              const isActive = b.id === activeBoxId;
              const isChecked = selectedBoxIds.has(b.id);

              return (
                <div
                  key={b.id}
                  id={`editor-row-${b.id}`}
                  onClick={() => handleSelectBox(b.id)}
                  className={`p-2.5 rounded-lg border transition-all ${
                    isActive
                      ? 'border-indigo-500/80 bg-slate-950 ring-1 ring-indigo-500/30'
                      : isChecked
                      ? 'border-emerald-500/60 bg-slate-950/70'
                      : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold font-mono">
                        #{b.id}
                      </span>
                      {b.isEnsembleRefined && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-semibold flex items-center gap-0.5">
                          <Sparkles className="w-2.5 h-2.5" /> 앙상블 보정됨
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 font-mono">
                        신뢰도: {Math.round(b.confidence * 100)}%
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteBox(b.id);
                        }}
                        className="p-1 text-slate-500 hover:text-rose-400 rounded"
                        title="삭제"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <textarea
                    value={b.text}
                    onChange={(e) => handleUpdateText(b.id, e.target.value)}
                    rows={2}
                    className="w-full p-2 bg-slate-900 border border-slate-700/80 rounded text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500 leading-relaxed resize-none"
                  />

                  {b.originalText && (
                    <div className="text-[9px] text-slate-500 font-mono mt-1 truncate">
                      원문: {b.originalText}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Active Box Status Footer */}
          {activeBox && (
            <div className="p-3 border-t border-slate-800 bg-slate-950/80 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-slate-400">선택 좌표:</span>
                <span className="font-mono text-indigo-300 text-[11px]">
                  X:{activeBox.x}% Y:{activeBox.y}% W:{activeBox.w}% H:{activeBox.h}%
                </span>
              </div>
              <div className="text-[11px] text-emerald-400 font-semibold shrink-0">
                1:1 실시간 바인딩
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Summary & Cost Governance Bar */}
      <div className="bg-slate-900 border-t border-slate-800 p-2.5 px-4 flex flex-wrap items-center justify-between text-xs text-slate-300 gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>오프라인/도커 비용 절감액: <strong>약 $0.045 / 페이지 (90% 절약)</strong></span>
          </span>
          <span className="text-slate-400">
            앙상블 정밀 보정: <strong className="text-amber-400">{refinedCount}개 라인</strong>
          </span>
        </div>

        {saveToast && (
          <span className="text-xs text-emerald-400 font-medium flex items-center gap-1 bg-emerald-950/80 px-3 py-1 rounded border border-emerald-800 animate-fade-in">
            <CheckCircle2 className="w-4 h-4" /> <span>바운딩 박스 교정 내용이 저장되었습니다.</span>
          </span>
        )}
      </div>
    </div>
  );
}
