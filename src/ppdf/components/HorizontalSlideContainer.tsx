import React, { useRef, useState, useEffect, useCallback } from 'react';

interface HorizontalSlideContainerProps {
  children: React.ReactNode;
  className?: string;
  scrollStep?: number;
  showScrollButtons?: boolean;
  wheelEnabled?: boolean;
}

export function HorizontalSlideContainer({
  children,
  className = '',
  scrollStep = 240,
  showScrollButtons = true,
  wheelEnabled = true,
}: HorizontalSlideContainerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);

  // 스크롤 위치 및 스크롤 가능 여부 계산
  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 2);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 2);
  }, []);

  // 마우스 휠 이벤트: 해당 영역에 마우스가 위치하면 화면 전체 세로 스크롤에 항상 '우선'하여 동작
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !wheelEnabled) return;

    const onWheel = (e: WheelEvent) => {
      // 1. 해당 영역에 마우스가 있으면 페이지 세로 스크롤을 무조건 차단하여 우선권 확보
      e.preventDefault();
      e.stopPropagation();

      const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (delta !== 0) {
        // 즉각적이고 끊김 없는 가로 스크롤 이동 (중간 멈춤 및 스냅 충돌 원천 제거)
        el.scrollLeft += delta * 1.15;
        updateScrollState();
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
    };
  }, [wheelEnabled, updateScrollState]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    updateScrollState();

    const handleResize = () => updateScrollState();
    window.addEventListener('resize', handleResize);

    const observer = new ResizeObserver(() => updateScrollState());
    observer.observe(el);

    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, [updateScrollState, children]);

  // 좌우 버튼 스크롤
  const handleScroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;

    const target = direction === 'left' 
      ? el.scrollLeft - scrollStep 
      : el.scrollLeft + scrollStep;

    el.scrollTo({
      left: target,
      behavior: 'smooth',
    });
  };

  // 마우스 드래그 투 스크롤 (Drag-to-Scroll) - window 레벨 이벤트로 중간 이탈 및 끊김 원천 방지
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    const el = scrollRef.current;
    if (!el) return;

    isDraggingRef.current = true;
    setIsDragging(true);
    setHasMoved(false);
    startXRef.current = e.pageX - el.offsetLeft;
    scrollLeftRef.current = el.scrollLeft;

    const onMouseMove = (moveEv: MouseEvent) => {
      if (!isDraggingRef.current || !scrollRef.current) return;
      const targetEl = scrollRef.current;
      const x = moveEv.pageX - targetEl.offsetLeft;
      const walk = (x - startXRef.current) * 1.2;
      if (Math.abs(walk) > 4) {
        setHasMoved(true);
      }
      targetEl.scrollLeft = scrollLeftRef.current - walk;
      updateScrollState();
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
      setIsDragging(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // 드래그 중 내부 버튼 클릭 오동작 방지
  const handleClickCapture = (e: React.MouseEvent) => {
    if (hasMoved) {
      e.preventDefault();
      e.stopPropagation();
      setHasMoved(false);
    }
  };

  return (
    <div className={`relative group ${className}`}>
      {/* 좌측 슬라이드 이동 버튼 */}
      {showScrollButtons && canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center pr-4 bg-gradient-to-r from-slate-900 via-slate-900/90 to-transparent pointer-events-none">
          <button
            type="button"
            onClick={() => handleScroll('left')}
            className="pointer-events-auto h-8 w-8 min-w-[32px] sm:h-9 sm:w-9 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/80 shadow-lg flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-sky-500 active:scale-95 cursor-pointer"
            aria-label="왼쪽으로 스크롤"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
      )}

      {/* 가로 스크롤 컨테이너 (스냅 충돌 없는 무결점 60fps 부드러운 스크롤 트랙) */}
      <div
        ref={scrollRef}
        onScroll={updateScrollState}
        onMouseDown={handleMouseDown}
        onClickCapture={handleClickCapture}
        className={`flex items-center gap-2 overflow-x-auto select-none no-scrollbar py-1 px-0.5 scroll-auto ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab sm:cursor-default'
        }`}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {React.Children.map(children, (child) => {
          if (!React.isValidElement(child)) return child;
          return React.cloneElement(child as React.ReactElement<{ className?: string }>, {
            className: `${(child.props as { className?: string }).className || ''} shrink-0`,
          });
        })}
      </div>

      {/* 우측 슬라이드 이동 버튼 */}
      {showScrollButtons && canScrollRight && (
        <div className="absolute right-0 top-0 bottom-0 z-10 flex items-center pl-4 bg-gradient-to-l from-slate-900 via-slate-900/90 to-transparent pointer-events-none">
          <button
            type="button"
            onClick={() => handleScroll('right')}
            className="pointer-events-auto h-8 w-8 min-w-[32px] sm:h-9 sm:w-9 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/80 shadow-lg flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-sky-500 active:scale-95 cursor-pointer"
            aria-label="오른쪽으로 스크롤"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
