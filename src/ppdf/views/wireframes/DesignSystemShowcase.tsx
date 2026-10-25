import { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Code,
  Copy,
  Check,
  ExternalLink,
  Sliders,
  CheckCircle,
  X,
  Sun,
  Smartphone,
  Sparkles,
  Pin
} from 'lucide-react';
import { tokens } from '../../../styles/tokens';
import { STANDARD_COMPONENTS_30, getComponentViewportCondition } from '../../../shared/components/ui/showcaseData';
import { ComponentInteractiveRenderer } from '../../../shared/components/ui/ShowcaseComponentsPool';

export function DesignSystemShowcase() {
  const [activeMainTab, setActiveMainTab] = useState<'components' | 'tokens'>('components');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [globalState, setGlobalState] = useState<'default' | 'hover' | 'active' | 'focus' | 'disabled' | 'error'>('default');
  const [globalSize, setGlobalSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [previewTheme, setPreviewTheme] = useState<'light' | 'dark' | 'dawn'>('dark');
  const [viewportMode, setViewportMode] = useState<'desktop' | 'mobile'>('desktop');
  const [isToolbarPinned, setIsToolbarPinned] = useState(true);
  const [openCodeMap, setOpenCodeMap] = useState<Record<string, boolean>>({});
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 1.1 화면 전체 테마 (실제 글로벌 앱 테마 연동)
  const getGlobalAppTheme = (): 'light' | 'dark' | 'dawn' => {
    if (typeof document !== 'undefined') {
      const attr = document.documentElement.getAttribute('data-theme');
      if (attr === 'light' || attr === 'dark' || attr === 'dawn') return attr;
      if (document.documentElement.classList.contains('light')) return 'light';
      if (document.documentElement.classList.contains('dawn')) return 'dawn';
    }
    try {
      const saved = localStorage.getItem('purepdfrend_theme');
      if (saved === 'light' || saved === 'dark' || saved === 'dawn') return saved;
    } catch {}
    return 'dark';
  };

  const [appTheme, setAppTheme] = useState<'light' | 'dark' | 'dawn'>(getGlobalAppTheme);

  useEffect(() => {
    const handleThemeChange = () => {
      const current = getGlobalAppTheme();
      setAppTheme(current);
    };
    handleThemeChange();
    const observer = new MutationObserver(handleThemeChange);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
    window.addEventListener('storage', handleThemeChange);
    return () => {
      observer.disconnect();
      window.removeEventListener('storage', handleThemeChange);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  const toggleCodeView = (id: string) => {
    setOpenCodeMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCodeId(id);
    showToast('컴포넌트 JSX 코드가 클립보드에 복사되었습니다.');
    setTimeout(() => setCopiedCodeId((prev) => (prev === id ? null : prev)), 2000);
  };

  const handleNavigateToScreen = (progId: string) => {
    try {
      let type: 'user' | 'admin' | 'settings' | 'agent' = 'user';
      if (progId.startsWith('PG-ADM')) type = 'admin';
      else if (progId.startsWith('PG-SET')) type = 'settings';
      else if (progId.startsWith('PG-AGN')) type = 'agent';

      window.dispatchEvent(
        new CustomEvent('purepdfrend-navigate-wireframe', {
          detail: { type, progId },
        })
      );
      showToast(`'${progId}' 화면으로 이동합니다.`);
    } catch {}
  };

  // 1.1 화면 전체 테마 동적 클래스 맵 (앱 전역 테마 반영)
  const showcaseThemeClasses = {
    light: {
      container: 'bg-white border-slate-200 text-slate-800 shadow-sm',
      header: 'bg-gradient-to-r from-blue-50/80 via-slate-50 to-indigo-50/80 border-slate-200 text-slate-900',
      title: 'text-slate-900',
      subtitle: 'text-slate-600',
      panel: 'bg-white/95 border-slate-200 text-slate-800 shadow-lg',
      subPanel: 'bg-slate-100/90 border-slate-200 text-slate-700',
      border: 'border-slate-200',
      input: 'bg-white border-2 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-blue-500',
      card: 'bg-white border-slate-200 text-slate-800 hover:border-slate-300 shadow-sm',
      cardHeader: 'border-slate-200/90 bg-slate-50/70',
      badge: 'bg-blue-50 text-blue-700 border-blue-200',
      textMuted: 'text-slate-500',
      activeTab: 'bg-blue-600 text-white shadow-md font-semibold',
      inactiveTab: 'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
      tokenBg: 'bg-slate-50 border-slate-200',
      tokenCard: 'bg-white border-slate-200 text-slate-800',
    },
    dawn: {
      container: 'bg-[#0e1a38] border-[#1e3066] text-sky-100 shadow-xl shadow-sky-950/20',
      header: 'bg-gradient-to-r from-[#070e22] via-[#0e1a38] to-[#132247] border-[#1e3066] text-white',
      title: 'text-white',
      subtitle: 'text-sky-300/80',
      panel: 'bg-[#070e22]/95 border-[#1e3066] text-sky-200 shadow-xl shadow-sky-950/40',
      subPanel: 'bg-[#0b152d] border-[#1e3066] text-sky-200',
      border: 'border-[#1e3066]',
      input: 'bg-[#070e22] border-2 border-[#1e3066] text-white placeholder:text-sky-400/50 focus:border-sky-400',
      card: 'bg-[#0e1a38] border-[#1e3066] text-sky-100 hover:border-sky-500/60 shadow-md',
      cardHeader: 'border-[#1e3066]/80 bg-[#070e22]/60',
      badge: 'bg-sky-950/80 text-sky-300 border-sky-800/80',
      textMuted: 'text-sky-300/70',
      activeTab: 'bg-sky-600 text-white shadow-md shadow-sky-500/20 font-semibold',
      inactiveTab: 'text-sky-300/70 hover:text-white hover:bg-sky-950/40',
      tokenBg: 'bg-[#070e22] border-[#1e3066]',
      tokenCard: 'bg-[#0e1a38] border-[#1e3066] text-sky-100',
    },
    dark: {
      container: 'bg-slate-900 border-slate-800 text-slate-100 shadow-xl',
      header: 'bg-gradient-to-r from-blue-950/50 via-slate-900 to-indigo-950/50 border-blue-900/40 text-white',
      title: 'text-white',
      subtitle: 'text-slate-300',
      panel: 'bg-slate-900/95 border-slate-800 text-slate-300 shadow-xl shadow-black/40',
      subPanel: 'bg-slate-950 border-slate-800 text-slate-300',
      border: 'border-slate-800',
      input: 'bg-slate-950 border-2 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500',
      card: 'bg-slate-900 border-slate-800 text-slate-100 hover:border-slate-700 shadow-md',
      cardHeader: 'border-slate-800/80 bg-slate-950/40',
      badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      textMuted: 'text-slate-400',
      activeTab: 'bg-blue-600 text-white shadow-md font-semibold',
      inactiveTab: 'text-slate-400 hover:text-slate-200 hover:bg-slate-800',
      tokenBg: 'bg-slate-950 border-slate-800',
      tokenCard: 'bg-slate-900 border-slate-800 text-slate-100',
    },
  }[appTheme];

  // 1.1 개별 토큰요소 프리뷰 캔버스 테마 클래스 (설정된 previewTheme 적용)
  const previewCanvasThemeClasses = {
    light: 'bg-slate-50/90 border border-slate-200 text-slate-800',
    dark: 'bg-slate-950/80 border border-slate-800 text-slate-100',
    dawn: 'bg-[#070e22]/90 border border-[#1e3066] text-sky-100',
  }[previewTheme];

  // Filter components by search and category
  const filteredComponents = useMemo(() => {
    return STANDARD_COMPONENTS_30.filter((c) => {
      const matchCat = selectedCategory === 'all' || c.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        c.id.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.enName.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.usedScreens.some((s) => s.id.toLowerCase().includes(q) || s.name.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="space-y-6 animate-fadeIn select-text pb-16">
      {/* 1. 디자인 시스템 헤더 (1.3 장황한 설명 배제 & 기능 심플 정리) */}
      <div className={`border rounded-2xl p-5 shadow-xl relative overflow-hidden select-text transition-all ${showcaseThemeClasses.header}`}>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className={`text-lg sm:text-xl font-bold tracking-tight flex items-center gap-2 ${showcaseThemeClasses.title}`}>
              <span>🎨 디자인시스템 쇼케이스</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">30 컴포넌트</span>
            </h2>
            <p className={`text-xs ${showcaseThemeClasses.subtitle}`}>
              30대 표준 원자·분자 컴포넌트 프리뷰, 인터랙션 상태 테스트 및 디자인 토큰 규격
            </p>
          </div>

          {/* 2대 메인 탭 전환 스위처 (1.1 전환 전/후 비교 삭제 완료) */}
          <div className={`p-1 rounded-xl border flex items-center text-xs shrink-0 ${showcaseThemeClasses.subPanel}`}>
            <button
              onClick={() => setActiveMainTab('components')}
              className={`px-3.5 py-2 min-h-[40px] rounded-lg font-medium transition-all cursor-pointer ${
                activeMainTab === 'components'
                  ? showcaseThemeClasses.activeTab
                  : showcaseThemeClasses.inactiveTab
              }`}
            >
              🧩 30대 표준 컴포넌트
            </button>
            <button
              onClick={() => setActiveMainTab('tokens')}
              className={`px-3.5 py-2 min-h-[40px] rounded-lg font-medium transition-all cursor-pointer ${
                activeMainTab === 'tokens'
                  ? showcaseThemeClasses.activeTab
                  : showcaseThemeClasses.inactiveTab
              }`}
            >
              📐 디자인 토큰 규격
            </button>
          </div>
        </div>

        {/* 실시간 요소 검색창 */}
        <div className="mt-4 pt-3.5 border-t border-inherit/40">
          <div className="relative flex items-center max-w-2xl">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-9 h-11 rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 transition-all select-text ${showcaseThemeClasses.input}`}
              placeholder="30대 컴포넌트 이름, ID (COMP-01), 설명, 사용화면 (PG-USR-01) 검색..."
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-slate-400 hover:text-slate-200 cursor-pointer"
                title="검색어 지우기"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* TAB 1: 30대 표준 컴포넌트 갤러리 */}
      {/* =================================================================== */}
      {activeMainTab === 'components' && (
        <div className="space-y-6">
          {/* 1.5 설정 영역: 스크롤 고정 앵커 지원 (sticky toggle & 아이콘만 표시) */}
          <div className={`border rounded-2xl p-4 shadow-xl space-y-3.5 backdrop-blur-md transition-all ${isToolbarPinned ? 'sticky top-0 z-30' : 'relative z-10'} ${showcaseThemeClasses.panel}`}>
            {/* 카테고리 칩 필터 + 우측 고정 앵커 아이콘 표시 (아이콘만 표시 & 토글) */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-xs font-semibold mr-1 flex items-center gap-1 ${showcaseThemeClasses.textMuted}`}>
                  <Sliders className="w-3.5 h-3.5 text-blue-400" /> 카테고리:
                </span>
                {[
                  { id: 'all', label: `전체 (${STANDARD_COMPONENTS_30.length})` },
                  { id: 'layout', label: '레이아웃 & 쉘 (4)' },
                  { id: 'form', label: '입력 & 폼 필드 (6)' },
                  { id: 'select', label: '선택 & 스위치 (4)' },
                  { id: 'indicator', label: '뱃지 & 인디케이터 (4)' },
                  { id: 'interaction', label: '고급 인터랙션 (4)' },
                  { id: 'overlay', label: '팝오버 & 오버레이 (4)' },
                  { id: 'container', label: '컨테이너 & 도크 (4)' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`min-h-[34px] px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'border-blue-500 bg-blue-600 text-white shadow-xs font-semibold'
                        : `${showcaseThemeClasses.subPanel} hover:border-slate-500`
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* 1.5 고정 앵커 아이콘 표시 (아이콘만 표시하고 해제시 스크롤에 밀려나도록 토글) */}
              <button
                type="button"
                onClick={() => {
                  setIsToolbarPinned((prev) => !prev);
                  showToast(isToolbarPinned ? '설정 영역 상단 고정이 해제되었습니다. (스크롤 시 이동)' : '설정 영역이 상단에 고정되었습니다.');
                }}
                className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                  isToolbarPinned
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/25'
                    : `${showcaseThemeClasses.subPanel} opacity-60 hover:opacity-100 hover:border-slate-500`
                }`}
                title={isToolbarPinned ? '상단 고정 해제 (클릭 시 스크롤과 함께 밀려납니다)' : '상단 고정 (클릭 시 스크롤 시에도 화면 상단에 고정됩니다)'}
              >
                <Pin className={`w-4 h-4 transition-transform ${isToolbarPinned ? 'rotate-45' : 'rotate-0'}`} />
              </button>
            </div>

            {/* 옵션 및 상태 제어기 (상태, 크기, 테마, 화면모드) */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-inherit/40 text-xs">
              <div className="flex flex-wrap items-center gap-3">
                {/* 1) 컴포넌트 상태 (B. 각 요소별 상태에 따른 동작) */}
                <div className="flex items-center gap-1.5">
                  <span className={`font-medium ${showcaseThemeClasses.textMuted}`}>상태:</span>
                  {(['default', 'hover', 'active', 'focus', 'disabled', 'error'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => {
                        setGlobalState(st);
                        showToast(`컴포넌트 상태가 [${st}] 모드로 시뮬레이션됩니다.`);
                      }}
                      className={`px-2 py-1 rounded-lg font-mono text-[11px] border capitalize transition-colors cursor-pointer ${
                        globalState === st
                          ? 'border-blue-500 bg-blue-500/20 text-blue-400 font-bold'
                          : `${showcaseThemeClasses.subPanel} hover:border-slate-500`
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                {/* 2) 컴포넌트 크기 */}
                <div className="flex items-center gap-1.5 pl-2 border-l border-inherit/50">
                  <span className={`font-medium ${showcaseThemeClasses.textMuted}`}>크기:</span>
                  {(['sm', 'md', 'lg'] as const).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setGlobalSize(sz)}
                      className={`px-2 py-1 rounded-lg font-mono text-[11px] border uppercase transition-colors cursor-pointer ${
                        globalSize === sz
                          ? 'border-blue-500 bg-blue-500/20 text-blue-400 font-bold'
                          : `${showcaseThemeClasses.subPanel} hover:border-slate-500`
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>

                {/* 3) 테마 모드 선택 (A. 주간, 야간, 여명 테마 실시간 반영) */}
                <div className="flex items-center gap-1.5 pl-2 border-l border-inherit/50">
                  <span className={`font-medium flex items-center gap-1 ${showcaseThemeClasses.textMuted}`}>
                    <Sun className="w-3.5 h-3.5 text-amber-400" /> 테마:
                  </span>
                  {[
                    { id: 'light', label: '☀️ 주간' },
                    { id: 'dark', label: '🌙 야간' },
                    { id: 'dawn', label: '🌅 여명' },
                  ].map((th) => (
                    <button
                      key={th.id}
                      type="button"
                      onClick={() => {
                        setPreviewTheme(th.id as any);
                        showToast(`쇼케이스 미리보기 테마가 [${th.label}] 모드로 전환되었습니다.`);
                      }}
                      className={`px-2.5 py-1 rounded-lg font-mono text-[11px] border transition-colors cursor-pointer ${
                        previewTheme === th.id
                          ? 'border-blue-500 bg-blue-500/20 text-blue-400 font-bold'
                          : `${showcaseThemeClasses.subPanel} hover:border-slate-500`
                      }`}
                    >
                      {th.label}
                    </button>
                  ))}
                </div>

                {/* 4) 화면 모드 선택 (A. PC태블릿, 모바일) */}
                <div className="flex items-center gap-1.5 pl-2 border-l border-inherit/50">
                  <span className={`font-medium flex items-center gap-1 ${showcaseThemeClasses.textMuted}`}>
                    <Smartphone className="w-3.5 h-3.5 text-purple-400" /> 화면:
                  </span>
                  {[
                    { id: 'desktop', label: '🖥️ PC/태블릿' },
                    { id: 'mobile', label: '📱 모바일(360px)' },
                  ].map((vp) => (
                    <button
                      key={vp.id}
                      type="button"
                      onClick={() => {
                        setViewportMode(vp.id as any);
                        showToast(`화면 모드가 [${vp.label}] 모드로 전환되었습니다.`);
                      }}
                      className={`px-2.5 py-1 rounded-lg font-mono text-[11px] border transition-colors cursor-pointer ${
                        viewportMode === vp.id
                          ? 'border-blue-500 bg-blue-500/20 text-blue-400 font-bold'
                          : `${showcaseThemeClasses.subPanel} hover:border-slate-500`
                      }`}
                    >
                      {vp.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={`text-[11px] font-mono ${showcaseThemeClasses.textMuted}`}>
                검색 매칭: <span className="text-blue-400 font-bold">{filteredComponents.length}</span> / {STANDARD_COMPONENTS_30.length} 건
              </div>
            </div>
          </div>

          {/* 30대 컴포넌트 반응형 그리드 뷰 */}
          <div className={`grid gap-5 ${viewportMode === 'mobile' ? 'grid-cols-1 max-w-xl mx-auto' : 'grid-cols-1 md:grid-cols-2'}`}>
            {filteredComponents.map((comp) => {
              const isCodeOpen = !!openCodeMap[comp.id];
              const viewportTag = getComponentViewportCondition(comp);
              return (
                <div
                  key={comp.id}
                  className={`border rounded-2xl overflow-hidden shadow-md flex flex-col justify-between transition-colors select-text ${showcaseThemeClasses.card}`}
                >
                  {/* 카드 헤더 (ID, 카테고리, 화면조건, 테마지원 태그) */}
                  <div className={`p-4 border-b space-y-2.5 ${showcaseThemeClasses.cardHeader}`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          {comp.id}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] ${showcaseThemeClasses.subPanel}`}>
                          {comp.categoryLabel}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-purple-500/15 text-purple-300 border border-purple-500/20">
                          {viewportTag}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-amber-500/15 text-amber-300 border border-amber-500/20 flex items-center gap-0.5">
                          <Sparkles className="w-2.5 h-2.5" /> 4모드 테마
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleCodeView(comp.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono flex items-center gap-1 border transition-colors cursor-pointer shrink-0 ${
                          isCodeOpen
                            ? 'border-blue-500 bg-blue-500/20 text-blue-400 font-semibold'
                            : `${showcaseThemeClasses.subPanel} hover:border-slate-500`
                        }`}
                        title="JSX 구현 코드 보기"
                      >
                        <Code className="w-3.5 h-3.5" />
                        <span>{isCodeOpen ? '코드 닫기' : '< > 코드 보기'}</span>
                      </button>
                    </div>

                    <div>
                      <h3 className={`text-sm font-bold flex items-center gap-1.5 ${showcaseThemeClasses.title}`}>
                        <span>{comp.name}</span>
                        <span className={`text-xs font-mono font-normal ${showcaseThemeClasses.textMuted}`}>({comp.enName})</span>
                      </h3>
                      <p className={`text-xs mt-1 leading-relaxed ${showcaseThemeClasses.subtitle}`}>
                        {comp.description}
                      </p>
                    </div>
                  </div>

                  {/* 컴포넌트 실시간 인터랙티브 캔버스 (토큰 요소 결과영역: previewTheme 설정 적용) */}
                  <div className="p-4 flex-1 flex flex-col justify-center min-w-0 w-full overflow-hidden">
                    {viewportMode === 'mobile' ? (
                      <div className="max-w-[360px] mx-auto w-full border-2 border-slate-700/80 bg-slate-950/90 rounded-3xl p-3 shadow-2xl relative my-1 min-w-0 overflow-hidden">
                        <div className="w-14 h-1 bg-slate-700 rounded-full mx-auto mb-2.5" />
                        <ComponentInteractiveRenderer
                          meta={comp}
                          globalState={globalState}
                          globalSize={globalSize}
                          previewTheme={previewTheme}
                          viewportMode={viewportMode}
                          onNavigateToProgram={handleNavigateToScreen}
                          onShowToast={showToast}
                        />
                      </div>
                    ) : (
                      <div className={`w-full min-w-0 p-3.5 rounded-xl border transition-colors overflow-hidden ${previewCanvasThemeClasses}`}>
                        <ComponentInteractiveRenderer
                          meta={comp}
                          globalState={globalState}
                          globalSize={globalSize}
                          previewTheme={previewTheme}
                          viewportMode={viewportMode}
                          onNavigateToProgram={handleNavigateToScreen}
                          onShowToast={showToast}
                        />
                      </div>
                    )}
                  </div>

                  {/* 구현 코드 토글 표시 영역 */}
                  {isCodeOpen && (
                    <div className={`p-3 border-t animate-fadeIn ${showcaseThemeClasses.subPanel}`}>
                      <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
                        <span className={showcaseThemeClasses.textMuted}>JSX & Tailwind Snippet</span>
                        <button
                          type="button"
                          onClick={() => handleCopyCode(comp.id, comp.sampleCode)}
                          className="flex items-center gap-1 text-blue-400 hover:text-blue-300 cursor-pointer"
                        >
                          {copiedCodeId === comp.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedCodeId === comp.id ? '복사됨!' : '코드 복사'}</span>
                        </button>
                      </div>
                      <pre className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-blue-300 overflow-x-auto whitespace-pre leading-relaxed select-text">
                        {comp.sampleCode}
                      </pre>
                    </div>
                  )}

                  {/* 카드 푸터: 사용화면 ID 표시 & 점프 링크 */}
                  <div className={`px-4 py-2.5 border-t flex items-center justify-between text-xs ${showcaseThemeClasses.subPanel}`}>
                    <span className={`text-[11px] font-medium ${showcaseThemeClasses.textMuted}`}>사용 화면:</span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {comp.usedScreens.map((sc) => (
                        <button
                          key={sc.id}
                          type="button"
                          onClick={() => handleNavigateToScreen(sc.id)}
                          className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 transition-colors flex items-center gap-1 cursor-pointer"
                          title={`클릭 시 [${sc.id}] ${sc.name} 화면으로 즉시 이동`}
                        >
                          <span>{sc.id}</span>
                          <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: 디자인 토큰 규격 (Tokens) - 테마 설정에 따라 동적 연동 */}
      {/* =================================================================== */}
      {activeMainTab === 'tokens' && (
        <div className="space-y-6">
          <div className={`border rounded-2xl p-5 shadow-sm space-y-4 ${showcaseThemeClasses.container}`}>
            <div className="flex items-center justify-between border-b border-inherit/40 pb-3">
              <div>
                <h3 className={`text-sm font-bold flex items-center gap-2 ${showcaseThemeClasses.title}`}>
                  <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
                  1. 표준 색상 시스템 (Brand / Neutral / Semantic / Dawn)
                </h3>
                <p className={`text-xs mt-0.5 ${showcaseThemeClasses.subtitle}`}>
                  설정된 테마 [{previewTheme.toUpperCase()}] 기준 단일 토큰 딕셔너리 연동 (WCAG AA 명도 대비 4.5:1 준수)
                </p>
              </div>
              <span className="px-2.5 py-1 text-xs font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg">
                tokens.colors ({previewTheme})
              </span>
            </div>

            <div>
              <span className={`text-xs font-semibold mb-2 block font-mono ${showcaseThemeClasses.title}`}>Brand Palette (Core Blue-600)</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-11 gap-2">
                {Object.entries(tokens.colors.brand).map(([key, hex]) => (
                  <div key={key} className={`p-2 rounded-lg border flex flex-col items-center select-text ${showcaseThemeClasses.tokenBg}`}>
                    <div className="w-full h-10 rounded-md shadow-inner mb-2 border border-slate-700/50" style={{ backgroundColor: hex }} />
                    <span className="text-[11px] font-mono font-semibold">{key}</span>
                    <span className="text-[10px] font-mono opacity-60">{hex}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <span className={`text-xs font-semibold mb-2 block font-mono ${showcaseThemeClasses.title}`}>Gray / Neutral Palette (Slate)</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
                {Object.entries(tokens.colors.gray).map(([key, hex]) => (
                  <div key={key} className={`p-2 rounded-lg border flex flex-col items-center select-text ${showcaseThemeClasses.tokenBg}`}>
                    <div className="w-full h-10 rounded-md shadow-inner mb-2 border border-slate-700/50" style={{ backgroundColor: hex }} />
                    <span className="text-[11px] font-mono font-semibold">{key}</span>
                    <span className="text-[10px] font-mono opacity-60">{hex}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <span className={`text-xs font-semibold mb-2 block font-mono ${showcaseThemeClasses.title}`}>Semantic Status Palette</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(tokens.colors.semantic).map(([statusKey, val]) => (
                  <div key={statusKey} className={`p-3 rounded-lg border space-y-2 select-text ${showcaseThemeClasses.tokenBg}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold capitalize">{statusKey}</span>
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: val.solid }} />
                    </div>
                    <div className="p-2 rounded border text-xs" style={{ backgroundColor: val.darkBg, borderColor: val.darkBorder, color: val.darkText }}>
                      Status Light/Dark Preview
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={`border rounded-2xl p-5 shadow-sm space-y-4 ${showcaseThemeClasses.container}`}>
            <div className="border-b border-inherit/40 pb-3">
              <h3 className={`text-sm font-bold flex items-center gap-2 ${showcaseThemeClasses.title}`}>
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                2. 모서리 둥글기 (Zero-Pill 규율)
              </h3>
              <p className={`text-xs mt-0.5 ${showcaseThemeClasses.subtitle}`}>
                직사각형 컨테이너에 pill(둥근알약) 남발 금지 (최대 16px 이내 규격화)
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(tokens.radius).filter(([k]) => k !== 'none').map(([name, r]) => (
                <div key={name} className={`p-3 border flex items-center justify-between select-text ${showcaseThemeClasses.tokenBg}`} style={{ borderRadius: r }}>
                  <span className="text-xs font-mono font-medium">{name} ({r})</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/20 text-blue-400 font-mono rounded">규격 준수</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 플로팅 상태 피드백 토스트 레이어 */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xl border border-slate-700 text-xs font-medium animate-fadeIn select-text">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
