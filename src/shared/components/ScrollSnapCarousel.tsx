import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface ScrollSnapCarouselHandle {
  scrollPrev: () => void;
  scrollNext: () => void;
  scrollToStart: () => void;
  scrollToEnd: () => void;
}

export interface ScrollSnapCarouselProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  trackClassName?: string;
  scrollStep?: number;
  /**
   * 좌우 이동 아이콘 노출 여부 (기본값: false - 생략)
   * 표시할 경우(true) 아이콘 영역만큼의 전용 여백을 자동 확보하여 내부 버튼/카드를 가리지 않음
   */
  showArrows?: boolean;
  showGradients?: boolean;
  gradientWidth?: string;
  /** 마우스로 좌우 이동 (Grab & Drag) 활성화 (기본값: true) */
  dragEnabled?: boolean;
  /** 마우스 휠 이벤트 가로 스크롤 변환 활성화 (기본값: true) */
  wheelEnabled?: boolean;
  /** 버튼, 카드의 이동 간 마그네틱 스냅 기능 (기본값: true) */
  magnetic?: boolean;
  /**
   * 하단 레이어 시작점에 정렬 (좌우 끝 여백 확보)
   * true 시 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 컨테이너 정렬 및 스냅 패딩 자동 적용
   */
  alignWithContent?: boolean;
  /** 사용자 지정 좌우 패딩 클래스 (기본값: undefined) */
  contentPadding?: string;
  ariaLabel?: string;
  // 상단 미니 스크롤 핀 컨트롤
  showTopPins?: boolean;
  topPinCountLabel?: string;
}

/**
 * ScrollSnapCarousel
 * 
 * [정책 03-14 / 기능정리: 가로슬라이드 표준 컴포넌트]
 * 1. 마우스로 좌우 이동 (Grab & Drag, 윈도우 레벨 릴리스 안전 방어)
 * 2. 버튼, 카드의 이동 간 마그네틱 기능 적용 (snap-x snap-mandatory, snap-start)
 * 3. 영역에 마우스 휠 이벤트 적용 (Vertical Wheel -> Smooth Horizontal Scroll 변환)
 * 4. 좌우 끝 여백 확보 (하단 레이어 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 시작점에 일치)
 * 5. 옵션 : 좌우 이동아이콘 (기본값 생략 / 표시할 경우 아이콘 전용 여백 확보하여 요소 침범 방지)
 */
export const ScrollSnapCarousel = forwardRef<
  ScrollSnapCarouselHandle,
  ScrollSnapCarouselProps
>(function ScrollSnapCarousel(
  {
    children,
    className = '',
    containerClassName = '',
    trackClassName = '',
    scrollStep,
    showArrows = false, // 기본값: 생략
    showGradients = true,
    gradientWidth = 'w-6',
    dragEnabled = true, // 마우스로 좌우 이동
    wheelEnabled = true, // 영역에 마우스 휠 이벤트 적용
    magnetic = true, // 마그네틱 기능
    alignWithContent = false, // 하단 레이어 시작점 정렬
    contentPadding,
    ariaLabel = '가로 스크롤 슬라이드',
    showTopPins = false,
    topPinCountLabel,
  },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const isDraggingRef = useRef(false);

  // 스크롤 가능 여부 체크 (정밀 경계 판정)
  const updateScrollState = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 2);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 2);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });

    const resizeObserver = new ResizeObserver(() => {
      updateScrollState();
    });
    resizeObserver.observe(el);

    return () => {
      el.removeEventListener('scroll', updateScrollState);
      resizeObserver.disconnect();
    };
  }, [updateScrollState, children]);

  // 마우스 휠 이벤트 적용 (Wheel -> Horizontal Scroll)
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !wheelEnabled) return;

    let wheelTimeout: ReturnType<typeof setTimeout> | null = null;

    const onWheel = (e: WheelEvent) => {
      // 가로 스크롤 가능 여부 확인
      if (el.scrollWidth <= el.clientWidth) return;

      const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (delta !== 0) {
        e.preventDefault();

        // 휠 이동 중에는 브라우저 마그네틱 스냅 저항을 일시 해제하여 부드러운 스크롤 보장
        if (magnetic) {
          el.style.scrollSnapType = 'none';
        }

        el.scrollLeft += delta * 0.95;
        updateScrollState();

        // 휠 입력 중단 시 가장 가까운 버튼/카드로 마그네틱 자동 흡착 복원
        if (wheelTimeout) clearTimeout(wheelTimeout);
        wheelTimeout = setTimeout(() => {
          if (magnetic) {
            el.style.scrollSnapType = 'x mandatory';
          }
        }, 150);
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
      if (wheelTimeout) clearTimeout(wheelTimeout);
    };
  }, [wheelEnabled, magnetic, updateScrollState]);

  // 좌우 화살표 스크롤 실행
  const handleScroll = useCallback(
    (direction: 'left' | 'right') => {
      const el = containerRef.current;
      if (!el) return;

      const step = scrollStep || Math.max(200, Math.floor(el.clientWidth * 0.65));
      el.scrollBy({
        left: direction === 'left' ? -step : step,
        behavior: 'smooth',
      });
    },
    [scrollStep]
  );

  useImperativeHandle(
    ref,
    () => ({
      scrollPrev: () => handleScroll('left'),
      scrollNext: () => handleScroll('right'),
      scrollToStart: () => {
        containerRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
      },
      scrollToEnd: () => {
        const el = containerRef.current;
        if (el) el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
      },
    }),
    [handleScroll]
  );

  // 마우스 드래그 좌우 이동 핸들러 (윈도우 전역 리스너 바인딩으로 밖으로 나가도 안전 방어)
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragEnabled) return;
    const el = containerRef.current;
    if (!el) return;

    // 마우스 좌클릭만 처리
    if (e.button !== 0) return;

    isDraggingRef.current = true;
    setIsDragging(true);
    setHasMoved(false);
    startXRef.current = e.clientX;
    scrollLeftRef.current = el.scrollLeft;

    // 드래그 중 브라우저 기본 텍스트 선택 방지 및 마그네틱 스냅 일시 해제 (부드러운 실시간 추종)
    el.style.scrollSnapType = 'none';
    document.body.style.userSelect = 'none';

    const onGlobalMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const xDiff = moveEvent.clientX - startXRef.current;
      if (Math.abs(xDiff) > 4) {
        setHasMoved(true);
      }
      el.scrollLeft = scrollLeftRef.current - xDiff;
    };

    const onGlobalMouseUp = () => {
      isDraggingRef.current = false;
      setIsDragging(false);
      document.body.style.userSelect = '';

      // 드래그 종료 후 마그네틱 스냅 복원 (가장 가까운 버튼/카드로 자동 흡착)
      if (magnetic) {
        el.style.scrollSnapType = 'x mandatory';
      }

      window.removeEventListener('mousemove', onGlobalMouseMove);
      window.removeEventListener('mouseup', onGlobalMouseUp);
    };

    window.addEventListener('mousemove', onGlobalMouseMove);
    window.addEventListener('mouseup', onGlobalMouseUp);
  };

  // 드래그 후 마우스업 시 내부 버튼이 잘못 클릭되는 현상 방지
  const handleClickCapture = (e: React.MouseEvent) => {
    if (hasMoved) {
      e.stopPropagation();
      e.preventDefault();
      setHasMoved(false);
    }
  };

  // 좌우 끝 여백 (하단 레이어 시작점 정렬: max-w-7xl mx-auto px-3 sm:px-6 lg:px-8)
  const resolvedContentPadding = contentPadding
    ? contentPadding
    : alignWithContent
    ? 'px-3 sm:px-6 lg:px-8'
    : '';

  return (
    <div className={`flex flex-col space-y-1 ${className}`}>
      {/* 상단 미니 스크롤 핀 컨트롤 (선택 옵션) */}
      {showTopPins && (
        <div className="flex items-center justify-between text-xs px-1 select-none">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleScroll('left')}
              disabled={!canScrollLeft}
              className={`p-1 rounded-md border transition-all ${
                canScrollLeft
                  ? 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
                  : 'bg-slate-950/60 border-slate-900 text-slate-600 opacity-40 cursor-not-allowed'
              }`}
              title="이전 카드 보기"
              aria-label="이전 카드 보기"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleScroll('right')}
              disabled={!canScrollRight}
              className={`p-1 rounded-md border transition-all ${
                canScrollRight
                  ? 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
                  : 'bg-slate-950/60 border-slate-900 text-slate-600 opacity-40 cursor-not-allowed'
              }`}
              title="다음 카드 보기"
              aria-label="다음 카드 보기"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-center gap-1 pl-1 text-[10px] text-slate-500 font-mono">
              <span
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  canScrollLeft || canScrollRight ? 'bg-indigo-400/80' : 'bg-slate-600'
                }`}
              />
              <span>슬라이드</span>
            </div>
          </div>

          {topPinCountLabel && (
            <span className="text-[11px] font-mono text-indigo-400/90 font-medium">
              {topPinCountLabel}
            </span>
          )}
        </div>
      )}

      {/* 메인 슬라이더 뷰포트 레이아웃 */}
      <div
        className={`relative group/carousel isolate w-full flex items-center ${containerClassName}`}
        role="region"
        aria-label={ariaLabel}
      >
        {/* 
          [옵션 : 좌우 이동아이콘 - 기본값 생략]
          showArrows가 true일 때만 아이콘 영역(w-8)만큼 여백을 확보하여 내부 요소를 덮지 않음
        */}
        {showArrows && (
          <div className="shrink-0 flex items-center justify-center pl-1 pr-1 z-20">
            <button
              type="button"
              onClick={() => handleScroll('left')}
              disabled={!canScrollLeft}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg border shadow-sm flex items-center justify-center transition-all focus:outline-none ${
                canScrollLeft
                  ? 'bg-slate-900/90 border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white cursor-pointer active:scale-95'
                  : 'bg-slate-950/40 border-slate-800/40 text-slate-600 opacity-30 cursor-not-allowed'
              }`}
              aria-label="이전 항목 보기"
              title="이전 항목 보기"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 좌측 그라디언트 에지 페이드 (Mask) */}
        {showGradients && canScrollLeft && !showArrows && (
          <div
            className={`pointer-events-none absolute inset-y-0 left-0 ${gradientWidth} bg-gradient-to-r from-slate-950 via-slate-950/70 to-transparent z-10 transition-opacity duration-200`}
            aria-hidden="true"
          />
        )}

        {/* 메인 Scroll-Snap 스크롤 트랙 (마그네틱 흡착 + 휠 + 드래그) */}
        <div
          ref={containerRef}
          data-carousel-track="true"
          onMouseDown={handleMouseDown}
          onClickCapture={handleClickCapture}
          className={`flex-1 flex items-center overflow-x-auto overflow-y-hidden no-scrollbar ${
            magnetic ? 'snap-x snap-mandatory' : ''
          } scroll-smooth ${
            alignWithContent ? 'w-full max-w-7xl mx-auto' : ''
          } ${resolvedContentPadding} ${
            dragEnabled
              ? isDragging
                ? 'cursor-grabbing select-none'
                : 'cursor-grab'
              : ''
          } ${trackClassName}`}
          style={{
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            scrollPaddingLeft: alignWithContent ? '12px' : undefined,
            scrollPaddingRight: alignWithContent ? '12px' : undefined,
          }}
        >
          {children}
        </div>

        {/* 우측 그라디언트 에지 페이드 (Mask) */}
        {showGradients && canScrollRight && !showArrows && (
          <div
            className={`pointer-events-none absolute inset-y-0 right-0 ${gradientWidth} bg-gradient-to-l from-slate-950 via-slate-950/70 to-transparent z-10 transition-opacity duration-200`}
            aria-hidden="true"
          />
        )}

        {/* 
          [옵션 : 우측 이동아이콘 - 기본값 생략]
          showArrows가 true일 때만 아이콘 영역(w-8)만큼 여백을 확보하여 내부 요소를 덮지 않음
        */}
        {showArrows && (
          <div className="shrink-0 flex items-center justify-center pl-1 pr-1 z-20">
            <button
              type="button"
              onClick={() => handleScroll('right')}
              disabled={!canScrollRight}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg border shadow-sm flex items-center justify-center transition-all focus:outline-none ${
                canScrollRight
                  ? 'bg-slate-900/90 border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white cursor-pointer active:scale-95'
                  : 'bg-slate-950/40 border-slate-800/40 text-slate-600 opacity-30 cursor-not-allowed'
              }`}
              aria-label="다음 항목 보기"
              title="다음 항목 보기"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

export default ScrollSnapCarousel;
