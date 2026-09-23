import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  BookOpen,
  FileText,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react';
import {
  PdfPageItem,
  ViewerLayoutMode,
  VirtualScrollState,
  ActiveViewId,
} from '../../types';
import { VirtualScrollEngine } from '../services/VirtualScrollEngine';
import { PdfPageStore } from '../services/PdfPageStore';
import { PageThumbnailSidebar } from './PageThumbnailSidebar';

interface VirtualViewerStudioProps {
  onNavigateToCorrection?: (page: PdfPageItem) => void;
  onNavigateView?: (viewId: ActiveViewId) => void;
}

export const VirtualViewerStudio: React.FC<VirtualViewerStudioProps> = ({
  onNavigateToCorrection,
  onNavigateView,
}) => {
  // 1. Pages State (기본 120쪽 모의 도서로 초기화)
  const [pages, setPages] = useState<PdfPageItem[]>(() =>
    PdfPageStore.generateMockBook(120, '엔터프라이즈 디지털 도서 아카이빙 표준 지침서')
  );

  // 2. Viewer Controls State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [jumpPageInput, setJumpPageInput] = useState<string>('1');
  const [scale, setScale] = useState<number>(1.0); // 0.5 ~ 3.0
  const [layoutMode, setLayoutMode] = useState<ViewerLayoutMode>('single');
  const [showBBoxOverlay, setShowBBoxOverlay] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // 3. Virtual Scroll Engine State
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = useState<VirtualScrollState>({
    startIndex: 0,
    endIndex: 2,
    topSpacerHeight: 0,
    bottomSpacerHeight: 0,
    totalVirtualHeight: 0,
    visiblePages: [],
  });

  const PAGE_BASE_HEIGHT = 1131; // A4 height at 1.0x
  const PAGE_GAP = 24;

  // 가상 스크롤 상태 재계산
  const updateVirtualState = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const scrollTop = scrollContainerRef.current.scrollTop;
    const viewportHeight = scrollContainerRef.current.clientHeight;

    const newState = VirtualScrollEngine.calculateState(pages, {
      scrollTop,
      viewportHeight,
      layoutMode,
      pageHeight: PAGE_BASE_HEIGHT,
      pageGap: PAGE_GAP,
      overscan: 2,
      scale,
    });

    setScrollState(newState);

    // 현재 중앙에 위치한 페이지 번호 추정
    const middlePage =
      newState.visiblePages.length > 0
        ? newState.visiblePages[Math.floor(newState.visiblePages.length / 2)].pageNum
        : 1;

    setCurrentPage(middlePage);
    setJumpPageInput(String(middlePage));
  }, [pages, layoutMode, scale]);

  // 스크롤 이벤트 핸들러 (RAF 쓰로틀링)
  const rafIdRef = useRef<number | null>(null);
  const handleScroll = () => {
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = requestAnimationFrame(() => {
      updateVirtualState();
    });
  };

  useEffect(() => {
    updateVirtualState();
  }, [updateVirtualState]);

  // 페이지 점프
  const handleJumpToPage = (pageNum: number) => {
    const target = Math.max(1, Math.min(pages.length, pageNum));
    const targetScrollTop = VirtualScrollEngine.getScrollTopForPage(
      target,
      pages.length,
      PAGE_BASE_HEIGHT,
      PAGE_GAP,
      layoutMode,
      scale
    );

    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth',
      });
    }
  };

  // 모의 도서 프리셋 변경 (120P / 400P / 800P)
  const handleGeneratePreset = (count: number) => {
    const newPages = PdfPageStore.generateMockBook(
      count,
      count === 800
        ? '국가 기록원 조선왕조실록 및 고문서 디지털화 통합 아카이브 (800P 완본)'
        : '엔터프라이즈 디지털 도서 아카이빙 표준 지침서'
    );
    setPages(newPages);
    handleJumpToPage(1);
  };

  // 단일 페이지 90도 회전
  const handleRotatePage = (pageNum: number) => {
    setPages((prev) =>
      prev.map((p) =>
        p.pageNum === pageNum ? { ...p, rotation: (p.rotation + 90) % 360 } : p
      )
    );
  };

  // 홀수/짝수 페이지 일괄 회전
  const handleRotateBatch = (target: 'odd' | 'even' | 'all') => {
    setPages((prev) =>
      prev.map((p) => {
        const isOdd = p.pageNum % 2 === 1;
        const isMatch =
          target === 'all' || (target === 'odd' && isOdd) || (target === 'even' && !isOdd);
        return isMatch ? { ...p, rotation: (p.rotation + 90) % 360 } : p;
      })
    );
  };

  // 페이지 삭제
  const handleDeletePage = (pageNum: number) => {
    if (pages.length <= 1) return;
    setPages((prev) => prev.filter((p) => p.pageNum !== pageNum));
  };

  // BBox 교정 스튜디오로 인계
  const handleOpenCorrection = (page: PdfPageItem) => {
    if (onNavigateToCorrection) {
      onNavigateToCorrection(page);
    } else if (onNavigateView) {
      onNavigateView('correction');
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] max-w-full w-full bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* 1. Left Thumbnail Sidebar */}
      <PageThumbnailSidebar
        pages={pages}
        currentPage={currentPage}
        onSelectPage={handleJumpToPage}
        onRotatePage={handleRotatePage}
        onDeletePage={handleDeletePage}
        onOpenCorrection={handleOpenCorrection}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* 2. Main Viewer Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-900/50">
        {/* Top Control Toolbar */}
        <header className="h-14 bg-slate-900/90 border-b border-slate-800 px-4 flex items-center justify-between gap-3 shrink-0 shadow-md">
          {/* Left: View Mode & Presets */}
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700">
              <button
                onClick={() => setLayoutMode('single')}
                title="단면 보기 (Single Page)"
                className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-md transition-colors ${
                  layoutMode === 'single'
                    ? 'bg-indigo-600 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>단면</span>
              </button>
              <button
                onClick={() => setLayoutMode('facing')}
                title="양면 펼침면 보기 (Facing Spread)"
                className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-md transition-colors ${
                  layoutMode === 'facing'
                    ? 'bg-indigo-600 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>양면 펼침</span>
              </button>
            </div>

            {/* Presets Button Group */}
            <div className="hidden lg:flex items-center gap-1 pl-2 border-l border-slate-700 text-xs">
              <span className="text-[11px] text-slate-400">시뮬레이터:</span>
              <button
                onClick={() => handleGeneratePreset(120)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono border ${
                  pages.length === 120
                    ? 'bg-indigo-950 border-indigo-500 text-indigo-300 font-bold'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                120P
              </button>
              <button
                onClick={() => handleGeneratePreset(400)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono border ${
                  pages.length === 400
                    ? 'bg-indigo-950 border-indigo-500 text-indigo-300 font-bold'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                400P
              </button>
              <button
                onClick={() => handleGeneratePreset(800)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono border ${
                  pages.length === 800
                    ? 'bg-emerald-950 border-emerald-500 text-emerald-300 font-bold'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                800P (대용량)
              </button>
            </div>
          </div>

          {/* Center: Page Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleJumpToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 rounded-md border border-slate-700"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 text-xs font-mono">
              <input
                type="number"
                min={1}
                max={pages.length}
                value={jumpPageInput}
                onChange={(e) => setJumpPageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleJumpToPage(parseInt(jumpPageInput, 10));
                }}
                className="w-12 text-center bg-slate-800 border border-slate-700 rounded py-1 text-indigo-300 font-bold focus:outline-none focus:border-indigo-500"
              />
              <span className="text-slate-400">/ {pages.length}P</span>
            </div>

            <button
              onClick={() => handleJumpToPage(currentPage + 1)}
              disabled={currentPage >= pages.length}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 rounded-md border border-slate-700"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Right: Zoom, Rotate & OCR Studio Link */}
          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
              <button
                onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}
                title="축소"
                className="p-1 text-slate-400 hover:text-slate-200"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono text-slate-300 w-12 text-center">
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={() => setScale((s) => Math.min(3.0, s + 0.1))}
                title="확대"
                className="p-1 text-slate-400 hover:text-slate-200"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setScale(1.0)}
                title="100% 원본 맞춤"
                className="px-1.5 py-0.5 text-[10px] bg-slate-700 hover:bg-slate-600 text-slate-300 rounded"
              >
                1:1
              </button>
            </div>

            {/* BBox Overlay Toggle */}
            <button
              onClick={() => setShowBBoxOverlay(!showBBoxOverlay)}
              title="OCR 바운딩 박스 오버레이 토글"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                showBBoxOverlay
                  ? 'bg-amber-950/60 border-amber-500 text-amber-300 shadow'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">BBox 오버레이</span>
            </button>

            {/* Batch Rotate All */}
            <button
              onClick={() => handleRotateBatch('all')}
              title="모든 페이지 90도 일괄 회전"
              className="hidden xl:flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700 transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>전체회전</span>
            </button>

            {/* Link to BBox Correction Studio */}
            <button
              onClick={() => {
                const cur = pages.find((p) => p.pageNum === currentPage) || pages[0];
                handleOpenCorrection(cur);
              }}
              title="현재 페이지를 BBox 교정 스튜디오에서 편집"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-indigo-500/20"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>교정 스튜디오로 이동</span>
            </button>
          </div>
        </header>

        {/* Virtual Scroll Viewport Container */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto relative p-6 bg-slate-950 custom-scrollbar flex flex-col items-center"
        >
          {/* Top Spacer */}
          <div
            style={{ height: `${scrollState.topSpacerHeight}px` }}
            className="w-full shrink-0 transition-[height] duration-75"
          />

          {/* Rendered Visible Pages */}
          <div
            className={`w-full flex flex-col items-center gap-6 ${
              layoutMode === 'facing' ? 'max-w-6xl' : 'max-w-4xl'
            }`}
          >
            {layoutMode === 'single' ? (
              // 단면 모드 렌더링
              scrollState.visiblePages.map((page) => (
                <div
                  key={page.id}
                  style={{
                    width: `${800 * scale}px`,
                    height: `${PAGE_BASE_HEIGHT * scale}px`,
                  }}
                  className="relative bg-white rounded-lg shadow-2xl border border-slate-800 overflow-hidden shrink-0 group transition-all"
                >
                  {/* Page Image */}
                  <img
                    src={page.imageSrc}
                    alt={`Page ${page.pageNum}`}
                    style={{
                      transform: `rotate(${page.rotation}deg)`,
                      transformOrigin: 'center center',
                    }}
                    className="w-full h-full object-contain"
                  />

                  {/* BBox Overlay Simulation */}
                  {showBBoxOverlay && (
                    <div className="absolute inset-0 pointer-events-none">
                      <div
                        style={{ top: '15%', left: '8%', width: '75%', height: '8%' }}
                        className="absolute border-2 border-emerald-500/80 bg-emerald-500/10 rounded"
                      >
                        <span className="text-[9px] bg-emerald-600 text-white px-1 rounded-br">
                          98% 신뢰도
                        </span>
                      </div>
                      <div
                        style={{ top: '28%', left: '8%', width: '68%', height: '7%' }}
                        className="absolute border-2 border-emerald-500/80 bg-emerald-500/10 rounded"
                      >
                        <span className="text-[9px] bg-emerald-600 text-white px-1 rounded-br">
                          94% 신뢰도
                        </span>
                      </div>
                      <div
                        style={{ top: '38%', left: '8%', width: '78%', height: '10%' }}
                        className="absolute border-2 border-amber-500/80 bg-amber-500/10 rounded"
                      >
                        <span className="text-[9px] bg-amber-600 text-white px-1 rounded-br">
                          74% 검수필요
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Hover Quick Bar */}
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950/80 backdrop-blur-md p-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5 shadow-xl">
                    <button
                      onClick={() => handleRotatePage(page.pageNum)}
                      title="90° 회전"
                      className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded"
                    >
                      <RotateCw className="w-4 h-4 text-indigo-400" />
                    </button>
                    <button
                      onClick={() => handleOpenCorrection(page)}
                      title="교정 스튜디오에서 편집"
                      className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded"
                    >
                      <Sparkles className="w-4 h-4 text-amber-400" />
                    </button>
                  </div>

                  {/* Page Footer Label */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-sm text-slate-300 text-[10px] px-2 py-0.5 rounded-full font-mono border border-slate-700 pointer-events-none">
                    p.{page.pageNum} / {pages.length}
                  </div>
                </div>
              ))
            ) : (
              // 양면 펼침면(Facing Spread) 모드 렌더링
              <div className="w-full flex flex-col items-center gap-8">
                {/* 1쪽(표지) 단독 또는 페어링 렌더링 */}
                {scrollState.visiblePages.map((page) => (
                  <div
                    key={page.id}
                    style={{
                      width: `${800 * scale * (page.pageNum === 1 ? 0.9 : 0.85)}px`,
                      height: `${PAGE_BASE_HEIGHT * scale * (page.pageNum === 1 ? 0.9 : 0.85)}px`,
                    }}
                    className="relative bg-white rounded-lg shadow-2xl border border-slate-800 overflow-hidden shrink-0 transition-all"
                  >
                    <img
                      src={page.imageSrc}
                      alt={`Page ${page.pageNum}`}
                      style={{
                        transform: `rotate(${page.rotation}deg)`,
                      }}
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-sm text-slate-300 text-[10px] px-2 py-0.5 rounded-full font-mono border border-slate-700">
                      p.{page.pageNum}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Spacer */}
          <div
            style={{ height: `${scrollState.bottomSpacerHeight}px` }}
            className="w-full shrink-0 transition-[height] duration-75"
          />
        </div>

        {/* Bottom Status Bar (Telemetry & Memory Guard Status) */}
        <footer className="h-8 bg-slate-950 border-t border-slate-800 px-4 flex items-center justify-between text-[11px] text-slate-400 shrink-0 font-mono">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              가상 뷰포트 활성 (38MB Guard)
            </span>
            <span className="text-slate-600">|</span>
            <span>
              가시 범위: p.{scrollState.startIndex + 1} ~ p.{scrollState.endIndex + 1}
            </span>
            <span className="text-slate-600">|</span>
            <span>DOM 마운트 노드: {scrollState.visiblePages.length}개</span>
          </div>

          <div className="flex items-center gap-3">
            <span>총 {pages.length} 페이지 로드됨</span>
            <span className="text-slate-600">|</span>
            <span className="text-indigo-400 font-bold">
              배율: {Math.round(scale * 100)}% ({layoutMode === 'single' ? '단면' : '양면'})
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
};
