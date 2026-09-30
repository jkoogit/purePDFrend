import { useState, useRef, useEffect } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Sparkles,
  Check,
  Maximize2,
  Scissors,
  Bookmark,
} from 'lucide-react';

export interface ImageCropSettings {
  enabled: boolean;
  mode: 'crop' | 'keep';
  topPx: number;
  bottomPx: number;
  leftPx: number;
  rightPx: number;
  cropType: 'crop' | 'margin';
  targetScope: 'all' | 'single';
}

export interface ImageStandardizeSettings {
  enabled: boolean;
  pageSize: string;
  widthMm: number;
  heightMm: number;
  dpi: number;
  bgColor: string;
  alignHorizontal: 'center' | 'left' | 'right';
  alignVertical: 'center' | 'top' | 'bottom';
  fitMode: 'contain' | 'original' | 'stretch';
}

interface ImageEditLayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (cropSettings: ImageCropSettings, stdSettings: ImageStandardizeSettings) => void;
  totalPages?: number;
}

export function ImageEditLayerModal({
  isOpen,
  onClose,
  onApply,
  totalPages = 504,
}: ImageEditLayerModalProps) {
  // 활성 탭: 'crop' | 'standard'
  const [activeTab, setActiveTab] = useState<'crop' | 'standard'>('crop');

  // 탭 타이틀 앞 체크박스
  const [cropEnabled, setCropEnabled] = useState(true);
  const [stdEnabled, setStdEnabled] = useState(true);

  // 페이지 네비게이션
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');

  // 9.1 자르기 탭 설정값
  const [cropMode, setCropMode] = useState<'crop' | 'keep'>('crop');
  const [topPx, setTopPx] = useState(20);
  const [bottomPx, setBottomPx] = useState(30);
  const [leftPx, setLeftPx] = useState(25);
  const [rightPx, setRightPx] = useState(25);
  const [cropType, setCropType] = useState<'crop' | 'margin'>('crop');
  const [targetScope, setTargetScope] = useState<'all' | 'single'>('all');

  // 9.2 표준화 탭 설정값
  const [pageSize, setPageSize] = useState('A4- 세로방향');
  const [widthMm, setWidthMm] = useState(210);
  const [heightMm, setHeightMm] = useState(297);
  const [dpi, setDpi] = useState(350);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [alignH, setAlignH] = useState<'center' | 'left' | 'right'>('center');
  const [alignV, setAlignV] = useState<'center' | 'top' | 'bottom'>('center');
  const [fitMode, setFitMode] = useState<'contain' | 'original' | 'stretch'>('contain');

  // 4.6 앵커 드래그 인터랙션 상태
  const [activeDragAnchor, setActiveDragAnchor] = useState<'top' | 'bottom' | 'left' | 'right' | null>(null);
  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const initialPxRef = useRef(0);

  // AI 부가기능 상태
  const [isAutoEdgeDetecting, setIsAutoEdgeDetecting] = useState(false);
  const [noticeMsg, setNoticeMsg] = useState<string | null>(null);

  // 드래그 마우스/터치 리스너
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!activeDragAnchor) return;
      const deltaX = e.clientX - dragStartPosRef.current.x;
      const deltaY = e.clientY - dragStartPosRef.current.y;

      if (activeDragAnchor === 'top') {
        const nextVal = Math.max(0, Math.min(200, Math.round(initialPxRef.current + deltaY)));
        setTopPx(nextVal);
      } else if (activeDragAnchor === 'bottom') {
        const nextVal = Math.max(0, Math.min(200, Math.round(initialPxRef.current - deltaY)));
        setBottomPx(nextVal);
      } else if (activeDragAnchor === 'left') {
        const nextVal = Math.max(0, Math.min(150, Math.round(initialPxRef.current + deltaX)));
        setLeftPx(nextVal);
      } else if (activeDragAnchor === 'right') {
        const nextVal = Math.max(0, Math.min(150, Math.round(initialPxRef.current - deltaX)));
        setRightPx(nextVal);
      }
    };

    const handlePointerUp = () => {
      if (activeDragAnchor) {
        setActiveDragAnchor(null);
      }
    };

    if (activeDragAnchor) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [activeDragAnchor]);

  if (!isOpen) return null;

  const showNotice = (msg: string) => {
    setNoticeMsg(msg);
    setTimeout(() => setNoticeMsg(null), 3000);
  };

  const handleStartAnchorDrag = (
    anchor: 'top' | 'bottom' | 'left' | 'right',
    e: React.PointerEvent
  ) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveDragAnchor(anchor);
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    if (anchor === 'top') initialPxRef.current = topPx;
    if (anchor === 'bottom') initialPxRef.current = bottomPx;
    if (anchor === 'left') initialPxRef.current = leftPx;
    if (anchor === 'right') initialPxRef.current = rightPx;
  };

  const handleGoPage = (p: number) => {
    const clamped = Math.max(1, Math.min(totalPages, p));
    setCurrentPage(clamped);
    setPageInput(String(clamped));
  };

  const handleAutoDetectMargins = () => {
    setIsAutoEdgeDetecting(true);
    setTimeout(() => {
      setTopPx(28);
      setBottomPx(36);
      setLeftPx(22);
      setRightPx(22);
      setIsAutoEdgeDetecting(false);
      showNotice('✨ AI가 스캔 도서의 여백 기준선을 자동 감지하여 최적화했습니다 (상28, 하36, 좌22, 우22 px).');
    }, 450);
  };

  const handlePageSizeChange = (val: string) => {
    setPageSize(val);
    if (val === 'A4- 세로방향') {
      setWidthMm(210);
      setHeightMm(297);
    } else if (val === 'A4- 가로방향') {
      setWidthMm(297);
      setHeightMm(210);
    } else if (val === 'B5') {
      setWidthMm(182);
      setHeightMm(257);
    } else if (val === 'Letter') {
      setWidthMm(215.9);
      setHeightMm(279.4);
    }
  };

  const handleConfirm = () => {
    const cropResult: ImageCropSettings = {
      enabled: cropEnabled,
      mode: cropMode,
      topPx,
      bottomPx,
      leftPx,
      rightPx,
      cropType,
      targetScope,
    };

    const stdResult: ImageStandardizeSettings = {
      enabled: stdEnabled,
      pageSize,
      widthMm,
      heightMm,
      dpi,
      bgColor,
      alignHorizontal: alignH,
      alignVertical: alignV,
      fitMode,
    };

    onApply(cropResult, stdResult);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4 select-none">
      {noticeMsg && (
        <div className="fixed top-8 right-8 z-60 px-4 py-2.5 rounded-xl bg-slate-900 border border-amber-500/70 text-amber-200 text-xs shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <span>🔔</span>
          <span>{noticeMsg}</span>
        </div>
      )}

      {/* 4.8 모바일: 전체화면(w-full h-full rounded-none) vs 데스크톱: rounded-2xl max-w-5xl */}
      <div className="bg-slate-950 border border-slate-700/80 rounded-none sm:rounded-2xl w-full sm:max-w-5xl h-full sm:h-auto sm:max-h-[94vh] flex flex-col shadow-2xl overflow-hidden text-slate-200 text-xs">
        {/* ========================================================= */}
        {/* 1. 상단 책갈피(Bookmark) 탭 디자인 헤더 (요청 4.5 반영) */}
        {/* ========================================================= */}
        <div className="relative flex items-center justify-between px-4 sm:px-6 pt-3 pb-1 bg-slate-900 border-b border-slate-800 shrink-0">
          <div className="flex items-end gap-2 sm:gap-4">
            {/* 책갈피 탭 1: 자르기 */}
            <div
              onClick={() => setActiveTab('crop')}
              className={`relative px-4 py-2.5 rounded-t-xl transition-all cursor-pointer flex items-center gap-2 shadow-md ${
                activeTab === 'crop'
                  ? 'bg-gradient-to-b from-sky-600 to-sky-700 text-white font-bold border-t-2 border-x-2 border-sky-400 translate-y-0.5 z-10'
                  : 'bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-t border-x border-slate-700/60'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                <input
                  type="checkbox"
                  checked={cropEnabled}
                  onChange={(e) => {
                    e.stopPropagation();
                    setCropEnabled(e.target.checked);
                  }}
                  className="w-3.5 h-3.5 rounded border-slate-700 text-amber-400 focus:ring-amber-500 bg-slate-900 cursor-pointer"
                  title="자르기 설정 적용 여부"
                />
                <span className="text-xs sm:text-sm tracking-tight">자르기</span>
              </div>
              <span
                className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                  cropEnabled ? 'bg-sky-950/80 text-sky-200 border border-sky-400/40' : 'bg-slate-800 text-slate-500'
                }`}
              >
                {cropEnabled ? '적용' : '해제'}
              </span>
            </div>

            {/* 책갈피 탭 2: 표준화 */}
            <div
              onClick={() => setActiveTab('standard')}
              className={`relative px-4 py-2.5 rounded-t-xl transition-all cursor-pointer flex items-center gap-2 shadow-md ${
                activeTab === 'standard'
                  ? 'bg-gradient-to-b from-sky-600 to-sky-700 text-white font-bold border-t-2 border-x-2 border-sky-400 translate-y-0.5 z-10'
                  : 'bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-t border-x border-slate-700/60'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 text-indigo-300 fill-indigo-300" />
                <input
                  type="checkbox"
                  checked={stdEnabled}
                  onChange={(e) => {
                    e.stopPropagation();
                    setStdEnabled(e.target.checked);
                  }}
                  className="w-3.5 h-3.5 rounded border-slate-700 text-indigo-400 focus:ring-indigo-500 bg-slate-900 cursor-pointer"
                  title="표준화 설정 적용 여부"
                />
                <span className="text-xs sm:text-sm tracking-tight">표준화</span>
              </div>
              <span
                className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                  stdEnabled ? 'bg-sky-950/80 text-sky-200 border border-sky-400/40' : 'bg-slate-800 text-slate-500'
                }`}
              >
                {stdEnabled ? '적용' : '해제'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. 메인 바디 (모바일 세로 스택 줄바꿈 / 데스크톱 2단 분할 균형 배치) */}
        {/* ========================================================= */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 flex flex-col lg:grid lg:grid-cols-12 gap-5 items-stretch">
          {/* ========================================================= */}
          {/* [좌측: lg:col-span-6 xl:col-span-7] 이미지 프리뷰 캔버스 & 네비게이션 */}
          {/* ========================================================= */}
          <div
            className="w-full lg:col-span-6 xl:col-span-7 flex flex-col items-center bg-slate-900/60 border border-slate-800 rounded-2xl p-3 sm:p-4 min-h-[440px]"
          >
            {activeTab === 'crop' ? (
              /* [자르기 탭 좌측 프리뷰: 4.6 앵커 드래그 실시간 엔진 연동 & 일체형 네비게이션] */
              <div className="w-full flex flex-col items-center">
                <div className="relative w-full max-w-[280px] sm:max-w-[320px] aspect-[1/1.31] bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex items-center justify-center p-2 touch-none">
                  {/* 실제 '바이브 코딩' 스타일 표지 */}
                  <div className="relative w-full h-full bg-gradient-to-b from-slate-950 via-slate-900 to-red-950 rounded-lg p-3 text-white flex flex-col justify-between overflow-hidden select-none">
                    <div className="text-[9px] text-slate-400 font-mono tracking-tight">
                      생성형 AI와 에이전트로 완성하는 소프트웨어 개발의 미래
                    </div>

                    <div className="my-auto text-center space-y-1">
                      <div className="text-3xl font-black text-rose-500 tracking-tighter leading-none drop-shadow-md">
                        바이브
                      </div>
                      <div className="text-3xl font-black text-rose-500 tracking-tighter leading-none drop-shadow-md">
                        코딩:
                      </div>
                      <div className="text-xs font-bold text-slate-200 tracking-wide mt-1">
                        프로덕션의 원칙
                      </div>
                      <div className="text-[8px] text-slate-400">진 킴, 스티브 예기 지음 / 이보라 옮김</div>
                    </div>

                    <div className="flex items-end justify-between pt-2 border-t border-slate-800/80">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-[7px] font-bold text-amber-300">
                          2026
                        </div>
                        <div className="text-[7px] text-slate-300 leading-tight">
                          안드레이 카르파티가 예고한<br />개발 패러다임의 혁신
                        </div>
                      </div>
                      <span className="text-[9px] font-black tracking-widest text-slate-400">Jpub</span>
                    </div>

                    {/* [핵심 4.6] 실시간 점선 테두리 가이드 박스 */}
                    <div
                      className="absolute inset-0 pointer-events-none border-2 border-dashed border-amber-400/90 m-1.5 shadow-[0_0_15px_rgba(251,191,36,0.3)]"
                      style={{
                        top: `${Math.min(60, topPx / 4)}px`,
                        bottom: `${Math.min(60, bottomPx / 4)}px`,
                        left: `${Math.min(60, leftPx / 4)}px`,
                        right: `${Math.min(60, rightPx / 4)}px`,
                      }}
                    />

                    {/* [핵심 4.6] 상단 드래그 앵커 (▲) - 경계 클리핑 방지 */}
                    <div
                      onPointerDown={(e) => handleStartAnchorDrag('top', e)}
                      style={{ top: `${Math.max(4, Math.min(60, topPx / 4))}px` }}
                      className="absolute left-1/2 -translate-x-1/2 w-8 h-6 flex items-center justify-center text-amber-400 hover:text-white bg-amber-950/80 hover:bg-amber-600 border border-amber-400 rounded-md cursor-ns-resize z-30 transition-colors shadow-md touch-none"
                      title="위아래로 드래그하여 상단 여백 조절"
                    >
                      <span className="text-[10px] font-black leading-none">▲</span>
                    </div>

                    {/* [핵심 4.6] 하단 드래그 앵커 (▼) - 경계 클리핑 방지 */}
                    <div
                      onPointerDown={(e) => handleStartAnchorDrag('bottom', e)}
                      style={{ bottom: `${Math.max(4, Math.min(60, bottomPx / 4))}px` }}
                      className="absolute left-1/2 -translate-x-1/2 w-8 h-6 flex items-center justify-center text-amber-400 hover:text-white bg-amber-950/80 hover:bg-amber-600 border border-amber-400 rounded-md cursor-ns-resize z-30 transition-colors shadow-md touch-none"
                      title="위아래로 드래그하여 하단 여백 조절"
                    >
                      <span className="text-[10px] font-black leading-none">▼</span>
                    </div>

                    {/* [핵심 4.6] 좌측 드래그 앵커 (◀) - 경계 클리핑 방지 */}
                    <div
                      onPointerDown={(e) => handleStartAnchorDrag('left', e)}
                      style={{ left: `${Math.max(4, Math.min(60, leftPx / 4))}px` }}
                      className="absolute top-1/2 -translate-y-1/2 w-6 h-8 flex items-center justify-center text-amber-400 hover:text-white bg-amber-950/80 hover:bg-amber-600 border border-amber-400 rounded-md cursor-ew-resize z-30 transition-colors shadow-md touch-none"
                      title="좌우로 드래그하여 왼쪽 여백 조절"
                    >
                      <span className="text-[10px] font-black leading-none">◀</span>
                    </div>

                    {/* [핵심 4.6] 우측 드래그 앵커 (▶) - 경계 클리핑 방지 */}
                    <div
                      onPointerDown={(e) => handleStartAnchorDrag('right', e)}
                      style={{ right: `${Math.max(4, Math.min(60, rightPx / 4))}px` }}
                      className="absolute top-1/2 -translate-y-1/2 w-6 h-8 flex items-center justify-center text-amber-400 hover:text-white bg-amber-950/80 hover:bg-amber-600 border border-amber-400 rounded-md cursor-ew-resize z-30 transition-colors shadow-md touch-none"
                      title="좌우로 드래그하여 오른쪽 여백 조절"
                    >
                      <span className="text-[10px] font-black leading-none">▶</span>
                    </div>
                  </div>
                </div>

                <div className="text-center font-mono text-[10px] text-slate-400 mt-2 space-y-0.5">
                  <div className="text-slate-500">20260908_210020398</div>
                  <div>원본 크기: 1770*2323</div>
                  <div className="text-sky-400 font-bold">
                    잘린 크기: {Math.max(100, 1770 - leftPx - rightPx)}*{Math.max(100, 2323 - topPx - bottomPx)} px
                  </div>
                </div>

                {/* [요청 1] 자르기 탭: '잘린 크기' 바로 아래 미리보기 div 내부에 네비게이션/진행도 배치 */}
                <div className="w-full pt-3 mt-3 border-t border-slate-800/80 flex flex-col gap-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleGoPage(1)}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                        title="첫 페이지"
                      >
                        <ChevronsLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGoPage(currentPage - 1)}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                        title="이전 페이지"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGoPage(currentPage + 1)}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                        title="다음 페이지"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGoPage(totalPages)}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                        title="마지막 페이지"
                      >
                        <ChevronsRight className="w-4 h-4" />
                      </button>

                      <div className="flex items-center gap-1 ml-1.5">
                        <input
                          type="number"
                          value={pageInput}
                          onChange={(e) => setPageInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleGoPage(parseInt(pageInput, 10) || 1);
                          }}
                          className="w-12 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-center font-mono text-white text-xs"
                        />
                        <span className="text-slate-400 font-mono text-xs">/ ({totalPages})</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleAutoDetectMargins}
                      disabled={isAutoEdgeDetecting}
                      className="px-2.5 py-1 rounded bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 font-semibold text-[10px] flex items-center gap-1 transition-all cursor-pointer"
                      title="AI 자동 여백 감지"
                    >
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>{isAutoEdgeDetecting ? '감지중...' : '자동 여백 감지'}</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>진행:</span>
                    <span>{currentPage}/{totalPages}</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-sky-500 h-full transition-all"
                      style={{ width: `${(currentPage / totalPages) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* [표준화 탭 좌측 프리뷰: 일체형 네비게이션] */
              <div className="w-full flex flex-col items-center">
                <div
                  className="relative w-full max-w-[260px] sm:max-w-[300px] aspect-[210/297] rounded-xl overflow-hidden shadow-2xl flex items-center justify-center p-3 border border-slate-600 transition-colors"
                  style={{ backgroundColor: bgColor }}
                >
                  <div
                    className={`w-[85%] h-[85%] bg-gradient-to-b from-slate-950 via-slate-900 to-red-950 rounded-lg p-2.5 text-white flex flex-col justify-between shadow-lg ${
                      alignH === 'left' ? 'mr-auto' : alignH === 'right' ? 'ml-auto' : 'mx-auto'
                    } ${
                      alignV === 'top' ? 'mb-auto' : alignV === 'bottom' ? 'mt-auto' : 'my-auto'
                    } ${fitMode === 'stretch' ? '!w-full !h-full !rounded-none' : ''}`}
                  >
                    <div className="text-[7px] text-slate-400 font-mono">생성형 AI와 에이전트로 완성하는 미래</div>
                    <div className="my-auto text-center">
                      <div className="text-2xl font-black text-rose-500">바이브 코딩</div>
                      <div className="text-[9px] text-slate-200">프로덕션의 원칙</div>
                    </div>
                    <div className="flex items-center justify-between text-[7px] text-slate-400 pt-1 border-t border-slate-800">
                      <span>Jpub</span>
                      <span>2026 표준판</span>
                    </div>
                  </div>
                </div>

                <div className="text-center font-mono text-[10px] text-slate-400 mt-2">
                  미리보기 <strong className="text-sky-400">{widthMm}mm × {heightMm}mm</strong> ({pageSize})
                </div>

                {/* [요청 1] 표준화 탭: 미리보기 텍스트 바로 아래 미리보기 div 내부에 네비게이션/진행도 배치 */}
                <div className="w-full pt-3 mt-3 border-t border-slate-800/80 flex flex-col gap-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleGoPage(1)}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                        title="첫 페이지"
                      >
                        <ChevronsLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGoPage(currentPage - 1)}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                        title="이전 페이지"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGoPage(currentPage + 1)}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                        title="다음 페이지"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGoPage(totalPages)}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                        title="마지막 페이지"
                      >
                        <ChevronsRight className="w-4 h-4" />
                      </button>

                      <div className="flex items-center gap-1 ml-1.5">
                        <input
                          type="number"
                          value={pageInput}
                          onChange={(e) => setPageInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleGoPage(parseInt(pageInput, 10) || 1);
                          }}
                          className="w-12 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-center font-mono text-white text-xs"
                        />
                        <span className="text-slate-400 font-mono text-xs">/ ({totalPages})</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>진행:</span>
                    <span>{currentPage}/{totalPages}</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-sky-500 h-full transition-all"
                      style={{ width: `${(currentPage / totalPages) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* [우측: lg:col-span-6 xl:col-span-5] 상세 설정 패널 */}
          {/* ========================================================= */}
          <div
            className="w-full lg:col-span-6 xl:col-span-5 bg-slate-900/40 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between min-h-[440px]"
          >
            {activeTab === 'crop' ? (
              /* [자르기 탭 우측 설정: 4.4 비디오가이드라인 제거 & 4.7 물음표 제거] */
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Scissors className="w-3.5 h-3.5 text-sky-400" />
                    <span>기준선 설정</span>
                  </span>
                </div>

                {/* 라디오: N 픽셀 자르기 vs N 픽셀 유지 */}
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="cropMode"
                      checked={cropMode === 'crop'}
                      onChange={() => setCropMode('crop')}
                      className="text-amber-500 focus:ring-amber-500 bg-slate-800"
                    />
                    <span className="text-slate-200 font-medium">N 픽셀 자르기</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="cropMode"
                      checked={cropMode === 'keep'}
                      onChange={() => setCropMode('keep')}
                      className="text-amber-500 focus:ring-amber-500 bg-slate-800"
                    />
                    <span className="text-slate-300">N 픽셀 유지</span>
                  </label>
                </div>

                {/* 4방향 픽셀 입력 필드 */}
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl">
                  {/* 상단 */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400">상단:</span>
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        value={topPx}
                        onChange={(e) => setTopPx(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 pr-6 font-mono text-white text-xs"
                      />
                      {topPx > 0 && (
                        <button
                          type="button"
                          onClick={() => setTopPx(0)}
                          className="absolute right-1 text-slate-500 hover:text-slate-300"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                      <span className="ml-1 text-[10px] text-slate-500">px</span>
                    </div>
                  </div>

                  {/* 하단 */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400">하단:</span>
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        value={bottomPx}
                        onChange={(e) => setBottomPx(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 pr-6 font-mono text-white text-xs"
                      />
                      {bottomPx > 0 && (
                        <button
                          type="button"
                          onClick={() => setBottomPx(0)}
                          className="absolute right-1 text-slate-500 hover:text-slate-300"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                      <span className="ml-1 text-[10px] text-slate-500">px</span>
                    </div>
                  </div>

                  {/* 왼쪽 */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400">왼쪽:</span>
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        value={leftPx}
                        onChange={(e) => setLeftPx(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 pr-6 font-mono text-white text-xs"
                      />
                      {leftPx > 0 && (
                        <button
                          type="button"
                          onClick={() => setLeftPx(0)}
                          className="absolute right-1 text-slate-500 hover:text-slate-300"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                      <span className="ml-1 text-[10px] text-slate-500">px</span>
                    </div>
                  </div>

                  {/* 오른쪽 */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400">오른쪽:</span>
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        value={rightPx}
                        onChange={(e) => setRightPx(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 pr-6 font-mono text-white text-xs"
                      />
                      {rightPx > 0 && (
                        <button
                          type="button"
                          onClick={() => setRightPx(0)}
                          className="absolute right-1 text-slate-500 hover:text-slate-300"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                      <span className="ml-1 text-[10px] text-slate-500">px</span>
                    </div>
                  </div>
                </div>

                {/* 자르기 방식 */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-semibold text-slate-300">자르기 방식:</div>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="cropType"
                        checked={cropType === 'margin'}
                        onChange={() => setCropType('margin')}
                        className="text-amber-500 focus:ring-amber-500 bg-slate-800"
                      />
                      <span className="text-slate-300">여백남김</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="cropType"
                        checked={cropType === 'crop'}
                        onChange={() => setCropType('crop')}
                        className="text-amber-500 focus:ring-amber-500 bg-slate-800"
                      />
                      <span className="text-slate-200 font-medium">자르기</span>
                    </label>
                  </div>
                </div>

                {/* 목표 선별 */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-semibold text-slate-300">목표 선별:</div>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="targetScope"
                        checked={targetScope === 'all'}
                        onChange={() => setTargetScope('all')}
                        className="text-amber-500 focus:ring-amber-500 bg-slate-800"
                      />
                      <span className="text-slate-200 font-medium">전체</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="targetScope"
                        checked={targetScope === 'single'}
                        onChange={() => setTargetScope('single')}
                        className="text-amber-500 focus:ring-amber-500 bg-slate-800"
                      />
                      <span className="text-slate-300">단면페이지 (곡면책 제외)</span>
                    </label>
                  </div>
                </div>

                {/* 4.4 작동 방법 안내문 ('비디오가이드라인' 제거 완료) */}
                <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl space-y-1.5 text-[10px] text-slate-400">
                  <div className="text-slate-300 font-bold">작동 방법:</div>
                  <ol className="list-decimal list-inside space-y-0.5 text-slate-400 leading-relaxed">
                    <li>기준선을 확인하고, 미리보기 화면의 오렌지색 앵커(▲▼◀▶)를 직접 드래그하여 조정하십시오.</li>
                    <li>페이지별로 기준선 정확도를 확인하십시오.</li>
                    <li>점선 가이드를 드래그하여 각 페이지를 개별 조정할 수 있습니다.</li>
                  </ol>
                  <div className="text-[9px] text-slate-500 pt-1">
                    Note: 점선으로 조정된 페이지는 점선에 따라 처리되며, 조정되지 않는 페이지는 기준선에 따라 일괄 처리됩니다.
                  </div>
                </div>
              </div>
            ) : (
              /* [표준화 탭 우측 설정: 4.7 물음표 제거] */
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Maximize2 className="w-3.5 h-3.5 text-sky-400" />
                    <span>배경 설정</span>
                  </span>
                </div>

                {/* 페이지 크기 */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">페이지 크기:</label>
                  <select
                    value={pageSize}
                    onChange={(e) => handlePageSizeChange(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs"
                  >
                    <option value="A4- 세로방향">A4- 세로방향 (210 × 297 mm)</option>
                    <option value="A4- 가로방향">A4- 가로방향 (297 × 210 mm)</option>
                    <option value="B5">B5 (182 × 257 mm)</option>
                    <option value="Letter">Letter (215.9 × 279.4 mm)</option>
                  </select>
                </div>

                {/* 가로 / 세로 mm */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400">가로:</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={widthMm}
                        onChange={(e) => setWidthMm(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 font-mono text-white text-xs"
                      />
                      <span className="text-slate-500 font-mono text-[10px]">mm</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400">세로:</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={heightMm}
                        onChange={(e) => setHeightMm(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 font-mono text-white text-xs"
                      />
                      <span className="text-slate-500 font-mono text-[10px]">mm</span>
                    </div>
                  </div>
                </div>

                {/* DPI & 배경색 */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400">DPI:</span>
                    <select
                      value={dpi}
                      onChange={(e) => setDpi(parseInt(e.target.value, 10))}
                      className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-white text-xs font-mono"
                    >
                      <option value={350}>350 (초고화질 출판용)</option>
                      <option value={300}>300 (표준 고화질)</option>
                      <option value={200}>200 (용량 절감용)</option>
                      <option value={150}>150 (경량화 웹용)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400">컬러 (배경색):</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="w-8 h-8 rounded border border-slate-700 cursor-pointer bg-slate-900 p-0.5"
                      />
                      <span className="text-[10px] font-mono text-slate-300">{bgColor}</span>
                    </div>
                  </div>
                </div>

                {/* 페이지 및 배경 맞춤 */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="text-[11px] font-semibold text-slate-300">페이지 및 배경 맞춤:</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400">가로:</span>
                      <select
                        value={alignH}
                        onChange={(e) => setAlignH(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-white text-xs"
                      >
                        <option value="center">가운데</option>
                        <option value="left">왼쪽 정렬</option>
                        <option value="right">오른쪽 정렬</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400">세로:</span>
                      <select
                        value={alignV}
                        onChange={(e) => setAlignV(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-white text-xs"
                      >
                        <option value="center">가운데</option>
                        <option value="top">위쪽 정렬</option>
                        <option value="bottom">아래쪽 정렬</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 배경에 맞게 조절하세요 */}
                <div className="space-y-1.5 pt-1">
                  <div className="text-[11px] text-amber-400 font-semibold">배경에 맞게 조절하세요:</div>
                  <select
                    value={fitMode}
                    onChange={(e) => setFitMode(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs"
                  >
                    <option value="contain">최대화(가로 세로 비율 유지)</option>
                    <option value="original">원본 크기 유지</option>
                    <option value="stretch">용지에 맞춰 늘이기</option>
                  </select>
                </div>
              </div>
            )}

            {/* 4.8 모바일/데스크톱 하단 고정 액션 바 */}
            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={handleConfirm}
                className="w-full sm:w-auto px-8 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Check className="w-4 h-4 text-white" />
                <span>설정 적용 확인</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
