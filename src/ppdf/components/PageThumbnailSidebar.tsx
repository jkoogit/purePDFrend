import React, { useState, useRef, useEffect } from 'react';
import {
  RotateCw,
  CheckCircle2,
  Bookmark,
  Trash2,
  Sparkles,
  Layers,
  GripVertical,
  Undo2,
  AlertTriangle,
} from 'lucide-react';
import { PdfPageItem } from '../../types';

interface PageThumbnailSidebarProps {
  pages: PdfPageItem[];
  currentPage: number;
  onSelectPage: (pageNum: number) => void;
  onRotatePage: (pageNum: number) => void;
  onDeletePage: (pageNum: number) => void;
  onRestorePage?: (pageNum: number) => void;
  onReorderPages?: (sourceIndex: number, targetIndex: number) => void;
  onOpenCorrection: (page: PdfPageItem) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const PageThumbnailSidebar: React.FC<PageThumbnailSidebarProps> = ({
  pages,
  currentPage,
  onSelectPage,
  onRotatePage,
  onDeletePage,
  onRestorePage,
  onReorderPages,
  onOpenCorrection,
  isOpen,
  onToggle,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLDivElement>(null);

  // Drag and Drop 상태
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const deletedPagesCount = pages.filter((p) => p.isDeleted).length;
  const activePagesCount = pages.length - deletedPagesCount;

  // 현재 활성 페이지가 변경될 때 사이드바 자동 스크롤
  useEffect(() => {
    if (activeItemRef.current && containerRef.current) {
      activeItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [currentPage]);

  // Drag and Drop 핸들러
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== targetIndex && onReorderPages) {
      onReorderPages(draggedIndex, targetIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  if (!isOpen) {
    return (
      <div className="flex flex-col items-center py-4 bg-slate-900 border-r border-slate-800 w-12 shrink-0 select-none">
        <button
          onClick={onToggle}
          title="페이지 썸네일 탐색기 열기"
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <Layers className="w-5 h-5 text-indigo-400" />
        </button>
        <span className="mt-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest [writing-mode:vertical-lr]">
          Thumbnails ({activePagesCount}P)
        </span>
      </div>
    );
  }

  return (
    <aside className="w-64 bg-slate-900/95 border-r border-slate-800 flex flex-col shrink-0 select-none transition-all duration-200">
      {/* Header */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold text-slate-200">페이지 탐색기</span>
          <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded-full font-mono">
            {activePagesCount}P
          </span>
          {deletedPagesCount > 0 && (
            <span
              title={`소프트 삭제된 페이지 ${deletedPagesCount}건`}
              className="text-[10px] bg-red-950/80 border border-red-800 text-red-300 px-1.5 py-0.5 rounded-full font-mono flex items-center gap-1"
            >
              <Trash2 className="w-2.5 h-2.5" />
              {deletedPagesCount}
            </span>
          )}
        </div>
        <button
          onClick={onToggle}
          title="사이드바 닫기"
          className="text-xs text-slate-400 hover:text-slate-200 p-1 hover:bg-slate-800 rounded"
        >
          ✕
        </button>
      </div>

      {/* Thumbnail List */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar"
      >
        {pages.map((page, index) => {
          const isActive = page.pageNum === currentPage;
          const isDeleted = !!page.isDeleted;
          const isDragging = draggedIndex === index;
          const isDragOver = dragOverIndex === index;

          return (
            <div
              key={page.id}
              ref={isActive ? activeItemRef : null}
              draggable={!isDeleted}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              onDrop={(e) => handleDrop(e, index)}
              onClick={() => onSelectPage(page.pageNum)}
              className={`group relative rounded-lg p-2 transition-all cursor-pointer border ${
                isDragging
                  ? 'opacity-30 border-dashed border-indigo-400'
                  : isDragOver
                  ? 'border-indigo-400 ring-2 ring-indigo-500/40 translate-y-1'
                  : isDeleted
                  ? 'bg-red-950/20 border-red-900/50 opacity-60'
                  : isActive
                  ? 'bg-indigo-950/40 border-indigo-500/80 ring-2 ring-indigo-500/20 shadow-lg'
                  : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
              }`}
            >
              {/* Page Number & Badges */}
              <div className="flex items-center justify-between mb-1.5 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <div
                    title="드래그하여 순서 변경"
                    className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300"
                  >
                    <GripVertical className="w-3.5 h-3.5" />
                  </div>
                  <span
                    className={`font-mono font-bold px-1.5 py-0.5 rounded text-[10px] ${
                      isDeleted
                        ? 'bg-red-900/80 text-red-200 line-through'
                        : isActive
                        ? 'bg-indigo-500 text-white'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    p.{page.pageNum}
                  </span>
                  {page.hasTocBookmark && !isDeleted && (
                    <span title={`목차: ${page.tocTitle || '등록됨'}`}>
                      <Bookmark className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    </span>
                  )}
                  {isDeleted && (
                    <span className="text-[9px] text-red-400 font-bold bg-red-950 px-1 py-0.5 rounded border border-red-800">
                      삭제됨
                    </span>
                  )}
                </div>

                {/* Status Badges */}
                <div className="flex items-center gap-1">
                  {page.isOcrDone && !isDeleted && (
                    <span
                      title={`OCR 완료 (신뢰도: ${Math.round((page.ocrConfidence || 0.9) * 100)}%)`}
                      className="flex items-center text-[10px] text-emerald-400 gap-0.5"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                    </span>
                  )}
                  {page.rotation > 0 && !isDeleted && (
                    <span className="text-[9px] bg-slate-700 text-slate-300 px-1 rounded font-mono">
                      {page.rotation}°
                    </span>
                  )}
                </div>
              </div>

              {/* Thumbnail Image Preview */}
              <div className="relative aspect-[1/1.414] bg-white rounded border border-slate-700/80 overflow-hidden flex items-center justify-center">
                <img
                  src={page.thumbnailSrc || page.imageSrc}
                  alt={`Page ${page.pageNum}`}
                  style={{
                    transform: `rotate(${page.rotation}deg)`,
                    transition: 'transform 0.2s ease',
                  }}
                  className={`w-full h-full object-contain pointer-events-none ${
                    isDeleted ? 'filter grayscale blur-[0.5px] opacity-40' : ''
                  }`}
                  loading="lazy"
                />

                {/* Deleted Overlay Banner */}
                {isDeleted && (
                  <div className="absolute inset-0 bg-red-950/60 flex flex-col items-center justify-center p-2 text-center pointer-events-none">
                    <AlertTriangle className="w-5 h-5 text-red-400 mb-1" />
                    <span className="text-[10px] font-bold text-red-200">
                      삭제 대기 상태
                    </span>
                    <span className="text-[8px] text-red-300 mt-0.5">
                      저장 시 완전 배제
                    </span>
                  </div>
                )}

                {/* Quick Action Overlay (Hover) */}
                <div className="absolute inset-0 bg-slate-950/75 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {!isDeleted ? (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRotatePage(page.pageNum);
                        }}
                        title="오른쪽으로 90° 회전"
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md shadow"
                      >
                        <RotateCw className="w-3.5 h-3.5 text-indigo-300" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenCorrection(page);
                        }}
                        title="BBox 교정 스튜디오에서 편집"
                        className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md shadow"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeletePage(page.pageNum);
                        }}
                        title="소프트 삭제 (Undo로 복구 가능)"
                        className="p-1.5 bg-red-950/80 hover:bg-red-800 text-red-300 rounded-md shadow"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onRestorePage) onRestorePage(page.pageNum);
                      }}
                      title="페이지 복원"
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md shadow flex items-center gap-1 text-xs font-bold"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                      <span>복원</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Page Title Snippet */}
              <div
                className={`mt-1 text-[10px] truncate ${
                  isDeleted ? 'text-red-400/70 line-through' : 'text-slate-400'
                }`}
                title={page.title}
              >
                {page.title}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-2.5 bg-slate-950/60 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <GripVertical className="w-3 h-3 text-indigo-400" />
          <span>DnD 순서변경 가능</span>
        </span>
        <span className="text-emerald-400 font-mono">38MB Guard OK</span>
      </div>
    </aside>
  );
};
