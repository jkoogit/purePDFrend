import React, { useRef, useEffect } from 'react';
import {
  RotateCw,
  CheckCircle2,
  Bookmark,
  Trash2,
  Sparkles,
  Layers,
} from 'lucide-react';
import { PdfPageItem } from '../../types';

interface PageThumbnailSidebarProps {
  pages: PdfPageItem[];
  currentPage: number;
  onSelectPage: (pageNum: number) => void;
  onRotatePage: (pageNum: number) => void;
  onDeletePage: (pageNum: number) => void;
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
  onOpenCorrection,
  isOpen,
  onToggle,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLDivElement>(null);

  // 현재 활성 페이지가 변경될 때 사이드바 자동 스크롤
  useEffect(() => {
    if (activeItemRef.current && containerRef.current) {
      activeItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [currentPage]);

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
          Thumbnails ({pages.length})
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
            {pages.length}P
          </span>
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
        {pages.map((page) => {
          const isActive = page.pageNum === currentPage;
          return (
            <div
              key={page.id}
              ref={isActive ? activeItemRef : null}
              onClick={() => onSelectPage(page.pageNum)}
              className={`group relative rounded-lg p-2 transition-all cursor-pointer border ${
                isActive
                  ? 'bg-indigo-950/40 border-indigo-500/80 ring-2 ring-indigo-500/20 shadow-lg'
                  : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
              }`}
            >
              {/* Page Number & Badges */}
              <div className="flex items-center justify-between mb-1.5 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`font-mono font-bold px-1.5 py-0.5 rounded text-[10px] ${
                      isActive
                        ? 'bg-indigo-500 text-white'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    p.{page.pageNum}
                  </span>
                  {page.hasTocBookmark && (
                    <span title={`목차: ${page.tocTitle || '등록됨'}`}>
                      <Bookmark className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    </span>
                  )}
                </div>

                {/* Status Badges */}
                <div className="flex items-center gap-1">
                  {page.isOcrDone && (
                    <span
                      title={`OCR 완료 (신뢰도: ${Math.round((page.ocrConfidence || 0.9) * 100)}%)`}
                      className="flex items-center text-[10px] text-emerald-400 gap-0.5"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                    </span>
                  )}
                  {page.rotation > 0 && (
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
                  className="w-full h-full object-contain pointer-events-none"
                  loading="lazy"
                />

                {/* Quick Action Overlay (Hover) */}
                <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
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
                    title="페이지 삭제"
                    className="p-1.5 bg-red-950/80 hover:bg-red-800 text-red-300 rounded-md shadow"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Page Title Snippet */}
              <div className="mt-1 text-[10px] text-slate-400 truncate" title={page.title}>
                {page.title}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-2.5 bg-slate-950/60 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
        <span>가상 윈도잉 활성</span>
        <span className="text-emerald-400 font-mono">38MB Guard OK</span>
      </div>
    </aside>
  );
};
