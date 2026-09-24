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
  Undo2,
  Redo2,
  Trash2,
  CheckCheck,
  AlertTriangle,
  Download,
  Type,
  Loader2,
  CheckCircle2,
  Settings,
} from 'lucide-react';
import {
  PdfPageItem,
  ViewerLayoutMode,
  VirtualScrollState,
  ActiveViewId,
} from '../../types';
import {
  VirtualScrollEngine,
  PdfPageStore,
  PageLayoutEngine,
  HistoryManager,
  HistoryStats,
  SearchablePdfExportEngine,
  SearchablePdfWorkerClient,
  FontRegistry,
} from '../services';
import { PageThumbnailSidebar } from './PageThumbnailSidebar';
import PdfSettingsModal from './PdfSettingsModal';

interface VirtualViewerStudioProps {
  onNavigateToCorrection?: (page: PdfPageItem) => void;
  onNavigateView?: (viewId: ActiveViewId) => void;
}

export const VirtualViewerStudio: React.FC<VirtualViewerStudioProps> = ({
  onNavigateToCorrection,
  onNavigateView,
}) => {
  // 1. Initial Pages Generator
  const bookTitle = '엔터프라이즈 디지털 도서 아카이빙 표준 지침서';
  const initialPages = useRef<PdfPageItem[]>(
    PdfPageStore.generateMockBook(120, bookTitle)
  );

  // 2. History Manager (Command & Memento Pattern, 무제한 스택)
  const historyManagerRef = useRef<HistoryManager<PdfPageItem[]>>(
    new HistoryManager<PdfPageItem[]>(initialPages.current, 0)
  );

  // 3. Reactive State
  const [pages, setPages] = useState<PdfPageItem[]>(initialPages.current);
  const [historyStats, setHistoryStats] = useState<HistoryStats>({
    undoCount: 0,
    redoCount: 0,
    canUndo: false,
    canRedo: false,
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 4. Searchable PDF Export State
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<{
    current: number;
    total: number;
    message: string;
  }>({ current: 0, total: 0, message: '' });
  const [selectedFontId, setSelectedFontId] = useState<string>('helvetica');
  const availableFonts = FontRegistry.getAvailableFonts();

  // 5. Viewer Controls State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [jumpPageInput, setJumpPageInput] = useState<string>('1');
  const [scale, setScale] = useState<number>(1.0); // 0.5 ~ 3.0
  const [layoutMode, setLayoutMode] = useState<ViewerLayoutMode>('single');
  const [showBBoxOverlay, setShowBBoxOverlay] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // 6. Virtual Scroll Engine State
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

  // 토스트 메시지 도우미
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  // 상태 동기화 및 히스토리 통계 갱신 도우미
  const syncHistoryAndState = useCallback((newPages: PdfPageItem[], description: string) => {
    historyManagerRef.current.execute(newPages, description);
    setPages(newPages);
    setHistoryStats(historyManagerRef.current.getStats());
    showToast(`${description}`);
  }, []);

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
        : bookTitle
    );
    historyManagerRef.current.clear(newPages);
    setPages(newPages);
    setHistoryStats(historyManagerRef.current.getStats());
    handleJumpToPage(1);
    showToast(`${count}페이지 프리셋 로드 완료`);
  };

  // 실행 취소 (Undo)
  const handleUndo = useCallback(() => {
    const prevState = historyManagerRef.current.undo();
    if (prevState) {
      setPages(prevState);
      setHistoryStats(historyManagerRef.current.getStats());
      showToast('↩️ 실행 취소 완료');
    }
  }, []);

  // 다시 실행 (Redo)
  const handleRedo = useCallback(() => {
    const nextState = historyManagerRef.current.redo();
    if (nextState) {
      setPages(nextState);
      setHistoryStats(historyManagerRef.current.getStats());
      showToast('↪️ 다시 실행 완료');
    }
  }, []);

  // 단축키 이벤트 리스너 (Ctrl+Z, Ctrl+Y, Ctrl+Shift+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && !e.altKey) {
        if (e.key === 'z' || e.key === 'Z') {
          if (e.shiftKey) {
            e.preventDefault();
            handleRedo();
          } else {
            e.preventDefault();
            handleUndo();
          }
        } else if (e.key === 'y' || e.key === 'Y') {
          e.preventDefault();
          handleRedo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // 단일 페이지 90도 회전
  const handleRotatePage = (pageNum: number) => {
    const nextPages = PageLayoutEngine.rotatePage(pages, pageNum, 90);
    syncHistoryAndState(nextPages, `제${pageNum}쪽 90° 시계방향 회전`);
  };

  // 홀수/짝수/전체 일괄 회전
  const handleRotateBatch = (target: 'odd' | 'even' | 'all') => {
    const nextPages = PageLayoutEngine.batchRotate(pages, target, 90);
    const label = target === 'all' ? '전체' : target === 'odd' ? '홀수쪽' : '짝수쪽';
    syncHistoryAndState(nextPages, `${label} 90° 일괄 회전`);
  };

  // 드래그 앤 드롭 순서 변경
  const handleReorderPages = (sourceIndex: number, targetIndex: number) => {
    const nextPages = PageLayoutEngine.reorderPages(pages, sourceIndex, targetIndex);
    syncHistoryAndState(
      nextPages,
      `페이지 순서 이동 (${sourceIndex + 1}P ➔ ${targetIndex + 1}P)`
    );
  };

  // 페이지 소프트 삭제
  const handleDeletePage = (pageNum: number) => {
    const nextPages = PageLayoutEngine.softDeletePage(pages, pageNum);
    syncHistoryAndState(nextPages, `제${pageNum}쪽 소프트 삭제 (Undo 가능)`);
  };

  // 소프트 삭제된 페이지 복원
  const handleRestorePage = (pageNum: number) => {
    const nextPages = PageLayoutEngine.restorePage(pages, pageNum);
    syncHistoryAndState(nextPages, `제${pageNum}쪽 삭제 복원`);
  };

  // 저장 시 클린징 (영구 삭제 적용 및 번호 재정렬)
  const handleCleanDeletedPages = () => {
    const deletedCount = pages.filter((p) => p.isDeleted).length;
    if (deletedCount === 0) {
      showToast('삭제 대기 중인 페이지가 없습니다.');
      return;
    }
    const nextPages = PageLayoutEngine.cleanDeletedPages(pages);
    syncHistoryAndState(nextPages, `소프트 삭제 ${deletedCount}건 영구 정리 (클린징)`);
  };

  // Searchable PDF 내보내기 및 다운로드 실행 (Web Worker 백그라운드 오프로딩)
  const handleExportSearchablePdf = async () => {
    const activePages = PageLayoutEngine.getActivePages(pages);
    if (activePages.length === 0) {
      showToast('내보낼 활성 페이지가 없습니다.');
      return;
    }

    try {
      setIsExporting(true);
      setExportProgress({
        current: 0,
        total: activePages.length,
        message: 'Web Worker 백그라운드 컴파일 파이프라인 초기화 중...',
      });

      const result = await SearchablePdfWorkerClient.getInstance().compileSearchablePdfAsync(pages, {
        bookTitle,
        author: 'purePDFrend High-Resolution Scan Archive',
        fontId: selectedFontId,
        onProgress: (current, total, message) => {
          setExportProgress({ current, total, message });
        },
      });

      // 브라우저 파일 다운로드 트리거
      SearchablePdfExportEngine.downloadBlob(result.pdfBytes, result.fileName);

      const sizeKb = Math.round(result.totalBytes / 1024);
      showToast(`📥 ${result.fileName} (${result.pageCount}P, ${sizeKb}KB, ${result.durationMs}ms, 0ms UI 블로킹) 다운로드 완료`);
    } catch (err: any) {
      console.error('PDF Export Error:', err);
      showToast(`❌ PDF 내보내기 실패: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCancelExport = () => {
    SearchablePdfWorkerClient.getInstance().cancelCurrentJob();
    setIsExporting(false);
    showToast('⚠️ PDF 내보내기 작업이 취소되었습니다.');
  };

  // BBox 교정 스튜디오로 인계
  const handleOpenCorrection = (page: PdfPageItem) => {
    if (onNavigateToCorrection) {
      onNavigateToCorrection(page);
    } else if (onNavigateView) {
      onNavigateView('correction');
    }
  };

  const deletedPagesCount = pages.filter((p) => p.isDeleted).length;

  return (
    <div className="flex h-[calc(100vh-4rem)] max-w-full w-full bg-slate-950 text-slate-100 overflow-hidden select-none relative">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-indigo-900/90 text-indigo-100 border border-indigo-500/80 px-4 py-2 rounded-full shadow-2xl backdrop-blur-md text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCheck className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Export Progress Modal */}
      {isExporting && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-500/20 rounded-xl">
                  <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-slate-100">Searchable PDF 내보내는 중...</h3>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-800 font-semibold">Web Worker</span>
                  </div>
                  <p className="text-xs text-slate-400">{exportProgress.message}</p>
                </div>
              </div>
              <button
                onClick={handleCancelExport}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 transition"
              >
                취소
              </button>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono text-slate-400">
                <span>진행률</span>
                <span>
                  {exportProgress.total > 0
                    ? Math.round((exportProgress.current / exportProgress.total) * 100)
                    : 0}
                  % ({exportProgress.current}/{exportProgress.total}P)
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  style={{
                    width: `${
                      exportProgress.total > 0
                        ? (exportProgress.current / exportProgress.total) * 100
                        : 0
                    }%`,
                  }}
                  className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-150"
                />
              </div>
            </div>

            <div className="text-[11px] text-slate-500 bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>투명 텍스트 레이어(opacity:0) 및 OCR BBox 좌표가 합성됩니다.</span>
            </div>
          </div>
        </div>
      )}

      {/* 1. Left Thumbnail Sidebar (DnD & Layout) */}
      <PageThumbnailSidebar
        pages={pages}
        currentPage={currentPage}
        onSelectPage={handleJumpToPage}
        onRotatePage={handleRotatePage}
        onDeletePage={handleDeletePage}
        onRestorePage={handleRestorePage}
        onReorderPages={handleReorderPages}
        onOpenCorrection={handleOpenCorrection}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* 2. Main Viewer Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-900/50">
        {/* Top Control Toolbar */}
        <header className="h-14 bg-slate-900/90 border-b border-slate-800 px-4 flex items-center justify-between gap-3 shrink-0 shadow-md">
          {/* Left: View Mode & History Controls */}
          <div className="flex items-center gap-2">
            {/* View Mode Switcher */}
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

            {/* Undo / Redo Toolbar Buttons */}
            <div className="flex items-center gap-1 pl-2 border-l border-slate-700">
              <button
                onClick={handleUndo}
                disabled={!historyStats.canUndo}
                title={`실행 취소 (Ctrl+Z) - 누적: ${historyStats.undoCount}단계`}
                className={`flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg border transition-all ${
                  historyStats.canUndo
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 hover:border-slate-600'
                    : 'bg-slate-900/50 text-slate-600 border-slate-800/80 cursor-not-allowed'
                }`}
              >
                <Undo2 className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden md:inline">실행취소</span>
                {historyStats.undoCount > 0 && (
                  <span className="text-[10px] bg-slate-700 text-indigo-300 px-1 rounded font-mono">
                    {historyStats.undoCount}
                  </span>
                )}
              </button>

              <button
                onClick={handleRedo}
                disabled={!historyStats.canRedo}
                title={`다시 실행 (Ctrl+Y / Ctrl+Shift+Z) - 대기: ${historyStats.redoCount}단계`}
                className={`flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg border transition-all ${
                  historyStats.canRedo
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 hover:border-slate-600'
                    : 'bg-slate-900/50 text-slate-600 border-slate-800/80 cursor-not-allowed'
                }`}
              >
                <Redo2 className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden md:inline">다시실행</span>
                {historyStats.redoCount > 0 && (
                  <span className="text-[10px] bg-slate-700 text-indigo-300 px-1 rounded font-mono">
                    {historyStats.redoCount}
                  </span>
                )}
              </button>
            </div>

            {/* Presets Button Group */}
            <div className="hidden 2xl:flex items-center gap-1 pl-2 border-l border-slate-700 text-xs">
              <span className="text-[11px] text-slate-400">도서규모:</span>
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
                800P
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

          {/* Right: Zoom, Font Selection, Cleanse, Searchable PDF Export */}
          <div className="flex items-center gap-2">
            {/* Font Selection Dropdown */}
            <div className="hidden lg:flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700 text-xs">
              <Type className="w-3.5 h-3.5 text-indigo-400" />
              <select
                value={selectedFontId}
                onChange={(e) => setSelectedFontId(e.target.value)}
                className="bg-transparent text-slate-300 text-xs focus:outline-none cursor-pointer"
                title="투명 텍스트 레이어 임베딩용 폰트 선택"
              >
                {availableFonts.map((font) => (
                  <option key={font.id} value={font.id} className="bg-slate-900 text-slate-200">
                    {font.name}
                  </option>
                ))}
              </select>
            </div>

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
            </div>

            {/* Cleanse Button */}
            {deletedPagesCount > 0 && (
              <button
                onClick={handleCleanDeletedPages}
                title={`소프트 삭제된 ${deletedPagesCount}개 페이지를 영구 제거하고 순차 재정렬합니다.`}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-700 rounded-lg text-xs font-bold shadow-lg animate-pulse"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                <span>삭제 정리 ({deletedPagesCount})</span>
              </button>
            )}

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
              <span className="hidden sm:inline">BBox</span>
            </button>

            {/* Batch Rotate All */}
            <button
              onClick={() => handleRotateBatch('all')}
              title="모든 페이지 90도 일괄 회전"
              className="hidden xl:flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700 transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5 text-indigo-400" />
              <span>전체회전</span>
            </button>

            {/* Searchable PDF Export Button */}
            <button
              onClick={handleExportSearchablePdf}
              disabled={isExporting}
              title="투명 텍스트 레이어 결합 Searchable PDF 다운로드"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Searchable PDF 다운로드</span>
            </button>

            {/* Link to BBox Correction Studio */}
            <button
              onClick={() => {
                const cur = pages.find((p) => p.pageNum === currentPage) || pages[0];
                handleOpenCorrection(cur);
              }}
              title="현재 페이지를 BBox 교정 스튜디오에서 편집"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-indigo-500/20"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>교정 스튜디오</span>
            </button>

            {/* System Settings Button */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              title="PDF 시스템 환경설정"
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors"
            >
              <Settings className="w-4 h-4" />
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
              scrollState.visiblePages.map((page) => {
                const isDeleted = !!page.isDeleted;
                return (
                  <div
                    key={page.id}
                    style={{
                      width: `${800 * scale}px`,
                      height: `${PAGE_BASE_HEIGHT * scale}px`,
                    }}
                    className={`relative bg-white rounded-lg shadow-2xl border overflow-hidden shrink-0 group transition-all ${
                      isDeleted
                        ? 'border-red-800/80 ring-2 ring-red-500/20 opacity-60'
                        : 'border-slate-800'
                    }`}
                  >
                    {/* Page Image */}
                    <img
                      src={page.imageSrc}
                      alt={`Page ${page.pageNum}`}
                      style={{
                        transform: `rotate(${page.rotation}deg)`,
                        transformOrigin: 'center center',
                      }}
                      className={`w-full h-full object-contain ${
                        isDeleted ? 'filter grayscale blur-[0.5px] opacity-40' : ''
                      }`}
                    />

                    {/* Deleted Page Overlay Banner */}
                    {isDeleted && (
                      <div className="absolute inset-0 bg-red-950/70 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3 p-6 text-center">
                        <AlertTriangle className="w-12 h-12 text-red-400 animate-bounce" />
                        <div className="space-y-1">
                          <h4 className="text-base font-bold text-red-100">
                            제{page.pageNum}쪽 소프트 삭제 대기
                          </h4>
                          <p className="text-xs text-red-300">
                            저장 시 최종 문서에서 영구 배제되며, 지금 즉시 복원할 수 있습니다.
                          </p>
                        </div>
                        <button
                          onClick={() => handleRestorePage(page.pageNum)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-lg flex items-center gap-1.5 transition-transform hover:scale-105"
                        >
                          <Undo2 className="w-4 h-4" />
                          <span>이 페이지 복원하기</span>
                        </button>
                      </div>
                    )}

                    {/* BBox Overlay Simulation (비삭제 상태 시) */}
                    {showBBoxOverlay && !isDeleted && (
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

                    {/* Hover Quick Action Bar */}
                    {!isDeleted && (
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
                        <button
                          onClick={() => handleDeletePage(page.pageNum)}
                          title="소프트 삭제 (Undo 가능)"
                          className="p-1.5 text-red-400 hover:text-red-200 hover:bg-red-950/80 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {/* Page Footer Label */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-sm text-slate-300 text-[10px] px-2 py-0.5 rounded-full font-mono border border-slate-700 pointer-events-none">
                      p.{page.pageNum} / {pages.length} {isDeleted && '(삭제됨)'}
                    </div>
                  </div>
                );
              })
            ) : (
              // 양면 펼침면(Facing Spread) 모드 렌더링
              <div className="w-full flex flex-col items-center gap-8">
                {scrollState.visiblePages.map((page) => {
                  const isDeleted = !!page.isDeleted;
                  return (
                    <div
                      key={page.id}
                      style={{
                        width: `${800 * scale * (page.pageNum === 1 ? 0.9 : 0.85)}px`,
                        height: `${PAGE_BASE_HEIGHT * scale * (page.pageNum === 1 ? 0.9 : 0.85)}px`,
                      }}
                      className={`relative bg-white rounded-lg shadow-2xl border overflow-hidden shrink-0 transition-all ${
                        isDeleted ? 'border-red-800 opacity-60' : 'border-slate-800'
                      }`}
                    >
                      <img
                        src={page.imageSrc}
                        alt={`Page ${page.pageNum}`}
                        style={{
                          transform: `rotate(${page.rotation}deg)`,
                        }}
                        className={`w-full h-full object-contain ${
                          isDeleted ? 'filter grayscale blur-[0.5px] opacity-40' : ''
                        }`}
                      />
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-sm text-slate-300 text-[10px] px-2 py-0.5 rounded-full font-mono border border-slate-700">
                        p.{page.pageNum} {isDeleted && '(삭제됨)'}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom Spacer */}
          <div
            style={{ height: `${scrollState.bottomSpacerHeight}px` }}
            className="w-full shrink-0 transition-[height] duration-75"
          />
        </div>

        {/* Bottom Status Bar */}
        <footer className="h-8 bg-slate-950 border-t border-slate-800 px-4 flex items-center justify-between text-[11px] text-slate-400 shrink-0 font-mono">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              가상 뷰포트 (38MB Guard)
            </span>
            <span className="text-slate-600">|</span>
            <span>
              가시 범위: p.{scrollState.startIndex + 1} ~ p.{scrollState.endIndex + 1}
            </span>
            <span className="text-slate-600">|</span>
            <span>DOM 노드: {scrollState.visiblePages.length}개</span>
            <span className="text-slate-600">|</span>
            <span className="text-indigo-400">
              히스토리: Undo({historyStats.undoCount}) / Redo({historyStats.redoCount})
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span>
              활성 {pages.length - deletedPagesCount}P / 전체 {pages.length}P
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-indigo-400 font-bold">
              배율: {Math.round(scale * 100)}% ({layoutMode === 'single' ? '단면' : '양면'})
            </span>
          </div>
        </footer>
      </div>

      {/* PDF System Settings Modal */}
      <PdfSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};
