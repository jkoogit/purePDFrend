import React, { useState, useEffect } from 'react';
import { ArrowUp, ChevronRight, ChevronLeft } from 'lucide-react';

interface ScrollToTopFabProps {
  scrollContainerRef?: React.RefObject<HTMLElement | null>;
  threshold?: number;
}

/**
 * ScrollToTopFab
 * 
 * [UX 거버넌스] 첫 표시영역 초과 시 우하단에 나타나는 접이식 상단 점프 컴포넌트
 * - 첫 화면 높이(기본 280px) 초과 시에만 부드럽게 등장
 * - 클릭 시 최상단으로 스무스 스크롤 점프
 * - 우측 가장자리로 접고 펴는(Collapse/Expand) 도킹 기능으로 작업 영역 완벽 확보
 */
export function ScrollToTopFab({
  scrollContainerRef,
  threshold = 280,
}: ScrollToTopFabProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      let currentScrollTop = 0;
      if (scrollContainerRef?.current) {
        currentScrollTop = scrollContainerRef.current.scrollTop;
      } else {
        currentScrollTop = window.scrollY || document.documentElement.scrollTop;
      }
      setIsVisible(currentScrollTop > threshold);
    };

    const container = scrollContainerRef?.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
    } else {
      window.addEventListener('scroll', handleScroll, { passive: true });
    }

    // 초기 체크
    handleScroll();

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      } else {
        window.removeEventListener('scroll', handleScroll);
      }
    };
  }, [scrollContainerRef, threshold]);

  const scrollToTop = () => {
    if (scrollContainerRef?.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!isVisible) return null;

  return (
    <aside
      aria-label="상단 이동 바로가기"
      className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-50 flex items-center select-none transition-all duration-300"
    >
      {isCollapsed ? (
        // 접힌 상태: 우측 벽면에 찰떡같이 붙는 미니 탭 (위로 화살표 제거, 공간 낭비 0%)
        <button
          onClick={() => setIsCollapsed(false)}
          className="group flex items-center justify-center px-2 py-2.5 rounded-l-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border-y border-l border-slate-700 shadow-xl backdrop-blur-md transition-all transform hover:-translate-x-1 active:scale-95"
          title="상단 이동 버튼 펼치기"
          aria-label="상단 이동 버튼 펼치기"
        >
          <ChevronLeft className="w-4 h-4 text-indigo-400 group-hover:animate-pulse" />
        </button>
      ) : (
        // 펼쳐진 상태: 명확한 액션 버튼 + 접기 토글
        <div className="flex items-center rounded-xl bg-slate-900/95 border border-slate-700/90 shadow-2xl backdrop-blur-md p-1 gap-1 text-xs">
          <button
            onClick={scrollToTop}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400"
            title="화면 최상단으로 점프"
          >
            <ArrowUp className="w-4 h-4" />
            <span>맨 위로</span>
          </button>

          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none"
            title="버튼 접어두기 (영역 확보)"
            aria-label="버튼 접기"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </aside>
  );
}

export default ScrollToTopFab;
