import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  X,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  FolderTree,
  GripVertical,
  Pencil,
  Copy,
  HelpCircle,
  CheckCircle,
  Info,
  Plus,
  Trash2,
  Home,
  Check,
  FileText,
  Settings,
  AlertTriangle,
  Layers,
  Sparkles
} from 'lucide-react';
import { StandardComponentMeta } from './showcaseData';
import { Button } from './Button';
import { Badge } from './Badge';

export interface ComponentRendererProps {
  meta: StandardComponentMeta;
  globalState: 'default' | 'hover' | 'active' | 'focus' | 'disabled' | 'error';
  globalSize: 'sm' | 'md' | 'lg';
  previewTheme?: 'light' | 'dark' | 'dawn';
  viewportMode?: 'desktop' | 'mobile';
  onNavigateToProgram?: (progId: string) => void;
  onShowToast?: (msg: string) => void;
}

interface TreeItemNode {
  id: number;
  name: string;
  count: number;
  depth: number;
  parentId: number | null;
  expanded?: boolean;
}

export const ComponentInteractiveRenderer: React.FC<ComponentRendererProps> = ({
  meta,
  globalState,
  globalSize,
  previewTheme = 'dark',
  viewportMode = 'desktop',
  onNavigateToProgram: _onNavigateToProgram,
  onShowToast,
}) => {
  // 1. 기본 폼 & 입력 위젯 상태
  const [inputText, setInputText] = useState('purePDFrend-official-policy.pdf');
  const [searchQuery, setSearchQuery] = useState('법률 계약서');
  const [selectedDropdown, setSelectedDropdown] = useState('전자계약서 (기본)');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // 1.4 COMP-08 선택목록 기반 실시간 필터 드롭다운 상태
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedFilterItem, setSelectedFilterItem] = useState('PDF 페이지 분할 및 병합 엔진');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  const [comboIcon, setComboIcon] = useState('📂');
  const [comboText, setComboText] = useState('Ctrl+Shift+P');
  const [chipStates, setChipStates] = useState<Record<string, boolean>>({
    completed: true,
    pending: false,
    draft: true,
  });
  const [radioVal, setRadioVal] = useState('single');
  const [isChecked, setIsChecked] = useState(true);
  const [isToggleOn, setIsToggleOn] = useState(true);
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'toc' | 'notes'>('bookmarks');
  const [stepperStep, setStepperStep] = useState<number>(2);
  const [copied, setCopied] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [isBannerVisible, setIsBannerVisible] = useState(true);

  // 1.2 & 1.3 COMP-08 실시간 필터선택목록 (입력필드형 Combobox + 접힘형 드롭다운 버튼형)
  const [comp08Mode, setComp08Mode] = useState<'combobox' | 'dropdown'>('combobox');
  const [comboboxQuery, setComboboxQuery] = useState('');
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);

  // 1.7 COMP-20 프로필 아바타 수정 아이콘 상태유형 (4대 상태)
  const [avatarStateType, setAvatarStateType] = useState<'readonly' | 'hover' | 'badge' | 'overlay'>('badge');

  // 1.4 COMP-19 카테고리 트리 상태 (계층 vs 평문 path 보기, 상단 툴바 등록/삭제 모드, 인라인 등록/수정)
  const [treeViewMode, setTreeViewMode] = useState<'tree' | 'flat'>('tree');
  const [isTreeDeleteMode, setIsTreeDeleteMode] = useState(false);
  const [selectedTreeId, setSelectedTreeId] = useState<number | null>(1);
  const [newChildParentId, setNewChildParentId] = useState<number | null>(null);
  const [newChildName, setNewChildName] = useState('');
  const [editingTreeId, setEditingTreeId] = useState<number | null>(null);
  const [draggedTreeId, setDraggedTreeId] = useState<number | null>(null);
  const [dropTargetId, setDropTargetId] = useState<number | null>(null);
  const [treeData, setTreeData] = useState<TreeItemNode[]>([
    { id: 1, name: '법률 및 계약 전자문서', count: 12, depth: 0, parentId: null, expanded: true },
    { id: 11, name: '체결 완료 계약서', count: 8, depth: 1, parentId: 1 },
    { id: 12, name: '법무 검토 중 문서', count: 4, depth: 1, parentId: 1 },
    { id: 2, name: 'OCR 스캔 도서 아카이브', count: 48, depth: 0, parentId: null, expanded: true },
    { id: 21, name: '고문서 고해상도 스캔', count: 30, depth: 1, parentId: 2 },
    { id: 22, name: '텍스트 교정 완료본', count: 18, depth: 1, parentId: 2 },
    { id: 3, name: '개인 비공개 암호화 문서', count: 5, depth: 0, parentId: null, expanded: false },
  ]);

  // 1.8 COMP-22 슬라이드 드래그휠 이벤트 격리 및 첫/끝 경계 도달 상태
  const wheelContainerRef = useRef<HTMLDivElement | null>(null);
  const [wheelStatus, setWheelStatus] = useState<'start' | 'scrolling' | 'end'>('start');
  const [scrollPercent, setScrollPercent] = useState<number>(0);

  useEffect(() => {
    const el = wheelContainerRef.current;
    if (!el || meta.id !== 'COMP-22') return;

    const updateScrollProgress = () => {
      const max = el.scrollWidth - el.clientWidth;
      if (max > 0) {
        const pct = Math.round((el.scrollLeft / max) * 100);
        setScrollPercent(pct);
        if (el.scrollLeft <= 2) setWheelStatus('start');
        else if (Math.ceil(el.scrollLeft) >= max - 2) setWheelStatus('end');
        else setWheelStatus('scrolling');
      }
    };

    const onWheelHandler = (e: WheelEvent) => {
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (delta === 0) return;

      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll <= 0) return;

      const isForward = delta > 0;
      const atStart = el.scrollLeft <= 2;
      const atEnd = Math.ceil(el.scrollLeft) >= maxScroll - 2;

      if (isForward && !atEnd) {
        // 아직 끝에 도달하지 않음: 상하 화면 스크롤 전파 차단 및 내부 가로 스크롤
        e.preventDefault();
        e.stopPropagation();
        el.scrollLeft = Math.min(maxScroll, el.scrollLeft + delta * 1.5);
        updateScrollProgress();
      } else if (!isForward && !atStart) {
        // 아직 시작에 도달하지 않음: 상하 화면 스크롤 전파 차단 및 내부 가로 스크롤
        e.preventDefault();
        e.stopPropagation();
        el.scrollLeft = Math.max(0, el.scrollLeft + delta * 1.5);
        updateScrollProgress();
      } else if (isForward && atEnd) {
        // 마지막 요소 도달: 화면 스크롤 이벤트 정상 전파 허용
        setWheelStatus('end');
      } else if (!isForward && atStart) {
        // 첫 요소 도달: 화면 스크롤 이벤트 정상 전파 허용
        setWheelStatus('start');
      }
    };

    el.addEventListener('wheel', onWheelHandler, { passive: false });
    el.addEventListener('scroll', updateScrollProgress);
    updateScrollProgress();

    return () => {
      el.removeEventListener('wheel', onWheelHandler);
      el.removeEventListener('scroll', updateScrollProgress);
    };
  }, [meta.id]);

  const [activeBottomNav, setActiveBottomNav] = useState('home');

  const disabled = globalState === 'disabled';
  const hasError = globalState === 'error';
  const isMobile = viewportMode === 'mobile';

  // 테마별(주간, 야간, 여명) 스타일 맵
  const themeCardClasses = {
    light: 'bg-white border-slate-200 text-slate-800 shadow-sm',
    dark: 'bg-slate-900 border-slate-800 text-slate-100 shadow-md',
    dawn: 'bg-[#0e1a38] border-[#1e3066] text-sky-100 shadow-md shadow-sky-950/20',
  }[previewTheme];

  const themeInputClasses = {
    light: 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400',
    dark: 'bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-500',
    dawn: 'bg-[#070e22] border-[#1e3066] text-white placeholder:text-sky-400/50',
  }[previewTheme];

  const themeSubpanelClasses = {
    light: 'bg-slate-100/80 border-slate-200 text-slate-600',
    dark: 'bg-slate-950/80 border-slate-800 text-slate-400',
    dawn: 'bg-[#070e22]/80 border-[#1e3066] text-sky-300',
  }[previewTheme];

  // 6대 상태(Default/Hover/Active/Focus/Disabled/Error) 시뮬레이션
  const getStateOverlay = () => {
    switch (globalState) {
      case 'hover':
        return 'ring-2 ring-blue-400/40 border-blue-400/80 shadow-md';
      case 'active':
        return 'ring-2 ring-blue-600 border-blue-600 shadow-inner scale-[0.99] transition-transform';
      case 'focus':
        return 'ring-2 ring-blue-500 border-blue-500 shadow-md';
      case 'disabled':
        return 'opacity-50 cursor-not-allowed pointer-events-none select-none';
      case 'error':
        return 'ring-2 ring-rose-500/40 border-rose-500';
      case 'default':
      default:
        return '';
    }
  };

  const sizeClasses = {
    sm: 'text-xs py-1 px-2.5 min-h-[34px]',
    md: 'text-xs sm:text-sm py-1.5 px-3.5 min-h-[42px]',
    lg: 'text-sm sm:text-base py-2.5 px-4 min-h-[46px]',
  }[globalSize];

  switch (meta.id) {
    // -------------------------------------------------------------
    // 1. 레이아웃 & 쉘 (4종)
    // -------------------------------------------------------------
    case 'COMP-01': // Top 레이어 (TopHeaderLayer)
      return (
        <div className={`w-full border rounded-xl overflow-hidden shadow-sm select-text transition-all ${themeCardClasses} ${getStateOverlay()}`}>
          <div className="h-12 px-3.5 flex items-center justify-between border-b border-inherit">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                P
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xs">purePDFrend</span>
                <span className="text-[9px] opacity-70 font-mono">Top Header</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] rounded-md bg-blue-500/20 text-blue-400 font-mono">
                v1.8.0
              </span>
              <div className={`px-2 py-0.5 rounded-md text-[10px] border flex items-center gap-1 ${themeSubpanelClasses}`}>
                <span>{previewTheme === 'dawn' ? '🌅 여명' : previewTheme === 'light' ? '☀️ 주간' : '🌙 야간'}</span>
              </div>
            </div>
          </div>
          <div className={`p-2 text-[11px] flex items-center justify-between ${themeSubpanelClasses}`}>
            <span>sticky top-0 z-40 레이어 표준 규격</span>
            <span className="text-emerald-500 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> 4모드 동기화
            </span>
          </div>
        </div>
      );

    case 'COMP-02': // Body 레이어 (ContentBodyLayer)
      return (
        <div className={`w-full border rounded-xl p-3 select-text space-y-2 transition-all ${themeCardClasses} ${getStateOverlay()}`}>
          <div className="flex items-center justify-between text-xs font-semibold">
            <span>본문 메인 워크스페이스 ({isMobile ? '모바일 1단 스택' : 'PC 3단 그리드'})</span>
            <span className="text-[10px] font-mono opacity-60">max-w-7xl</span>
          </div>
          <div className={`grid gap-2 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
            <div className={`h-12 rounded-lg border border-dashed border-blue-400/60 flex items-center justify-center text-[11px] text-blue-500 font-medium ${themeSubpanelClasses}`}>
              좌측 패널 ({isMobile ? '100%' : '30%'})
            </div>
            <div className="h-12 rounded-lg border border-blue-500 bg-blue-500/10 flex items-center justify-center text-[11px] text-blue-400 font-bold shadow-xs">
              중앙 메인 ({isMobile ? '100%' : '40%'})
            </div>
            <div className={`h-12 rounded-lg border border-dashed border-slate-400/40 flex items-center justify-center text-[11px] text-slate-400 ${themeSubpanelClasses}`}>
              우측 상세 ({isMobile ? '100%' : '30%'})
            </div>
          </div>
        </div>
      );

    case 'COMP-03': // Footer 레이어 (FooterLayer)
      return (
        <div className={`w-full border rounded-xl overflow-hidden select-text transition-all ${themeCardClasses} ${getStateOverlay()}`}>
          <div className="px-3.5 py-2.5 flex items-center justify-between text-xs">
            <span className="text-[11px] opacity-80">© 2026 purePDFrend. Zero-Hang Engine.</span>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-500 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> DB: 정상 (12ms)
              </span>
              <span className="opacity-30">|</span>
              <span className="font-mono text-[10px] opacity-70">KST 16:00 동기화</span>
            </div>
          </div>
        </div>
      );

    case 'COMP-04': // 화면타이틀영역 (BreadcrumbTitleArea)
      return (
        <div className={`w-full border rounded-xl p-3.5 select-text space-y-1 transition-all ${themeCardClasses} ${getStateOverlay()}`}>
          <div className="flex items-center gap-1.5 text-[11px] opacity-60">
            <span>홈</span> <ChevronRight className="w-3 h-3" /> <span>사용자</span> <ChevronRight className="w-3 h-3" /> <span className="text-blue-500 font-medium">마이페이지</span>
          </div>
          <div className="flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-bold tracking-tight">계정 보안 및 2FA 인증 관리</h3>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
              PG-USR-04
            </span>
          </div>
          <p className="text-xs opacity-70">안전한 전자문서 관리를 위한 비밀번호 및 2단계 인증 정책을 설정합니다.</p>
        </div>
      );

    // -------------------------------------------------------------
    // 2. 입력 및 폼 필드 (6종)
    // -------------------------------------------------------------
    case 'COMP-05': // 입력필드 (기본 Input)
      return (
        <div className="w-full space-y-1.5 select-text">
          <label className="text-xs font-semibold flex items-center justify-between">
            <span>표준 텍스트 인풋 (InputField)</span>
            {hasError && <span className="text-[10px] text-rose-500 font-medium">⚠️ 필수 입력값 누락</span>}
            {globalState === 'focus' && <span className="text-[10px] text-blue-400 font-medium">포커스 링 활성</span>}
          </label>
          <input
            type="text"
            value={inputText}
            disabled={disabled}
            onChange={(e) => setInputText(e.target.value)}
            className={`w-full rounded-xl border outline-none transition-all ${sizeClasses} ${themeInputClasses} ${
              hasError
                ? 'border-rose-500 ring-2 ring-rose-500/20 text-rose-500'
                : globalState === 'focus'
                ? 'border-blue-500 ring-2 ring-blue-500/30'
                : 'focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${getStateOverlay()}`}
            placeholder="파일명을 입력하세요..."
          />
          <div className="flex items-center justify-between text-[11px] opacity-60">
            <span>최소 높이 44px 터치 보장 · Zero-Pill 규격</span>
            <span className="font-mono">{inputText.length} 글자</span>
          </div>
        </div>
      );

    case 'COMP-06': // 검색입력필드 (Search Input)
      return (
        <div className="w-full space-y-1.5 select-text">
          <label className="text-xs font-semibold flex items-center justify-between">
            <span>공개문서 & 태그 실시간 검색</span>
            <span className="text-[10px] opacity-60 font-mono">2px 명확한 테두리</span>
          </label>
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              disabled={disabled}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-9 rounded-xl border-2 transition-all outline-none font-medium ${sizeClasses} ${themeInputClasses} ${
                hasError ? 'border-rose-500' : 'focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${getStateOverlay()}`}
              placeholder="문서명, 태그, 본문 검색..."
            />
            {searchQuery && !disabled && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-slate-400 hover:text-slate-200 cursor-pointer"
                title="입력 내용 지우기"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      );

    case 'COMP-07': // 선택목록 (Select / Dropdown)
      return (
        <div className="w-full space-y-1.5 relative select-text">
          <label className="text-xs font-semibold">문서 분류 카테고리 (SelectDropdown)</label>
          <button
            type="button"
            disabled={disabled}
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className={`w-full rounded-xl border flex items-center justify-between text-left transition-colors cursor-pointer ${sizeClasses} ${themeInputClasses} ${
              disabled ? 'opacity-50 cursor-not-allowed' : ''
            } ${getStateOverlay()}`}
          >
            <span>{selectedDropdown}</span>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          {isDropdownOpen && !disabled && (
            <div className={`absolute top-full left-0 right-0 mt-1 z-30 rounded-xl border shadow-xl p-1 text-xs space-y-0.5 animate-fadeIn ${themeCardClasses}`}>
              {['전자계약서 (기본)', 'OCR 스캔 도서', '재무회계 보고서', '특허 및 기술명세서'].map((item) => (
                <div
                  key={item}
                  onClick={() => {
                    setSelectedDropdown(item);
                    setIsDropdownOpen(false);
                    onShowToast?.(`'${item}' 카테고리가 선택되었습니다.`);
                  }}
                  className={`px-3 py-2 rounded-lg cursor-pointer flex items-center justify-between ${
                    selectedDropdown === item
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'hover:bg-blue-500/10'
                  }`}
                >
                  <span>{item}</span>
                  {selectedDropdown === item && <Check className="w-3.5 h-3.5" />}
                </div>
              ))}
            </div>
          )}
        </div>
      );

    // 1.2 & 1.3 COMP-08 실시간 필터목록 (접힘형 드롭다운 유지 + 1.3 입력형 필터선택목록 신설)
    case 'COMP-08':
      const filterItemsList = [
        'PDF 페이지 분할 및 병합 엔진',
        '2-Way OCR 바운딩박스 교정 스튜디오',
        '전자서명 암호화 인증 파이프라인',
        '가상화 800쪽 고속 렌더러',
        '스마트 검색 및 메타데이터 인덱서',
        '웹소켓 실시간 협업 주석 동기화',
        'PDF 텍스트 레이어 Searchable 결합',
      ];
      const matchingComboboxItems = filterItemsList.filter((i) =>
        i.toLowerCase().includes(comboboxQuery.toLowerCase())
      );
      const matchingDropdownItems = filterItemsList.filter((i) =>
        i.toLowerCase().includes(filterQuery.toLowerCase())
      );

      return (
        <div className="w-full space-y-2 relative select-text">
          {/* 상단 레이블 & 모드 전환 (1.2 접힘형 드롭다운 유지 + 1.3 입력형 필터선택목록 추가) */}
          <div className="flex items-center justify-between text-xs">
            <label className="font-semibold flex items-center gap-1.5">
              <span>실시간 필터목록 (RealtimeFilterList)</span>
            </label>
            <div className="flex items-center gap-1 font-mono text-[10px]">
              <button
                type="button"
                onClick={() => setComp08Mode('combobox')}
                className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                  comp08Mode === 'combobox'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'opacity-60 hover:opacity-100'
                }`}
              >
                1.3 필터선택목록 (입력창)
              </button>
              <button
                type="button"
                onClick={() => setComp08Mode('dropdown')}
                className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                  comp08Mode === 'dropdown'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'opacity-60 hover:opacity-100'
                }`}
              >
                1.2 접힘형 (버튼)
              </button>
            </div>
          </div>

          {comp08Mode === 'combobox' ? (
            /* 1.3 필터선택목록 : 기본 입력필드에 입력초기화 X 아이콘과 선택목록 펼침 아이콘 표시 */
            <div className="relative w-full">
              <div
                className={`w-full rounded-xl border flex items-center transition-all ${themeInputClasses} ${getStateOverlay()}`}
              >
                <Search className="w-4 h-4 text-slate-400 ml-3 shrink-0" />
                <input
                  type="text"
                  value={comboboxQuery}
                  disabled={disabled}
                  onChange={(e) => {
                    setComboboxQuery(e.target.value);
                    if (!isComboboxOpen) setIsComboboxOpen(true);
                  }}
                  onFocus={() => setIsComboboxOpen(true)}
                  placeholder="텍스트 입력 시 실시간 필터링, 우측 아이콘으로 펼침..."
                  className="w-full bg-transparent px-2.5 py-2 text-xs outline-none text-inherit placeholder:opacity-50"
                />
                <div className="flex items-center gap-1 mr-2 shrink-0">
                  {/* 입력초기화 X 아이콘 */}
                  {comboboxQuery && (
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        setComboboxQuery('');
                        onShowToast?.('필터 검색어가 초기화되었습니다.');
                      }}
                      className="p-1 hover:text-white text-slate-400 cursor-pointer"
                      title="입력 초기화 (X)"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {/* 선택목록 펼침 아이콘 */}
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => setIsComboboxOpen((prev) => !prev)}
                    className="p-1 hover:text-white text-slate-400 cursor-pointer"
                    title={isComboboxOpen ? '목록 접기' : '선택목록 펼침'}
                  >
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${isComboboxOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                </div>
              </div>

              {/* 선택목록 펼침 시 실시간 필터링된 결과 노출 */}
              {isComboboxOpen && !disabled && (
                <div
                  className={`absolute top-full left-0 right-0 mt-1.5 z-40 rounded-xl border shadow-2xl p-1.5 text-xs space-y-1 animate-fadeIn max-h-52 overflow-y-auto ${themeCardClasses}`}
                >
                  <div className="flex items-center justify-between px-2 py-1 text-[10px] font-mono opacity-60 border-b border-inherit/40">
                    <span>매칭 항목 ({matchingComboboxItems.length}건)</span>
                    <button
                      type="button"
                      onClick={() => setIsComboboxOpen(false)}
                      className="hover:text-blue-400"
                    >
                      닫기 ✕
                    </button>
                  </div>
                  {matchingComboboxItems.length > 0 ? (
                    matchingComboboxItems.map((item) => (
                      <div
                        key={item}
                        onClick={() => {
                          setComboboxQuery(item);
                          setIsComboboxOpen(false);
                          onShowToast?.(`'${item}' 필터 항목이 선택되었습니다.`);
                        }}
                        className={`p-2 rounded-lg cursor-pointer flex items-center justify-between transition-colors ${
                          comboboxQuery === item
                            ? 'bg-blue-600 text-white font-semibold'
                            : 'hover:bg-blue-500/10'
                        }`}
                      >
                        <span className="truncate">{item}</span>
                        {comboboxQuery === item && <Check className="w-3.5 h-3.5 text-blue-400" />}
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center opacity-60 text-xs">
                      '{comboboxQuery}'와 일치하는 필터 항목이 없습니다.
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* 1.2 접힘형 드롭다운 버튼형 (유지) */
            <div className="relative w-full">
              <button
                type="button"
                disabled={disabled}
                onClick={() => setIsFilterDropdownOpen((prev) => !prev)}
                className={`w-full rounded-xl border flex items-center justify-between text-left transition-colors cursor-pointer ${sizeClasses} ${themeInputClasses} ${
                  disabled ? 'opacity-50 cursor-not-allowed' : ''
                } ${getStateOverlay()}`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Search className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="truncate">{selectedFilterItem || '필터 항목을 검색하여 선택하세요...'}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${isFilterDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isFilterDropdownOpen && !disabled && (
                <div className={`absolute top-full left-0 right-0 mt-1 z-30 rounded-xl border shadow-2xl p-2 text-xs space-y-2 animate-fadeIn ${themeCardClasses}`}>
                  <div className="relative flex items-center">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
                    <input
                      type="text"
                      value={filterQuery}
                      onChange={(e) => setFilterQuery(e.target.value)}
                      placeholder="실시간 키워드 필터링..."
                      autoFocus
                      className={`w-full pl-8 pr-7 h-8 rounded-lg border text-xs outline-none focus:border-blue-500 ${themeInputClasses}`}
                    />
                    {filterQuery && (
                      <button
                        type="button"
                        onClick={() => setFilterQuery('')}
                        className="absolute right-2 text-slate-400 hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div className="max-h-36 overflow-y-auto divide-y divide-inherit rounded-lg border border-inherit">
                    {matchingDropdownItems.map((item) => (
                      <div
                        key={item}
                        onClick={() => {
                          setSelectedFilterItem(item);
                          setIsFilterDropdownOpen(false);
                          onShowToast?.(`'${item}' 필터가 적용되었습니다.`);
                        }}
                        className={`p-2 cursor-pointer flex items-center justify-between hover:bg-blue-500/10 ${
                          selectedFilterItem === item ? 'text-blue-400 font-bold bg-blue-500/10' : ''
                        }`}
                      >
                        <span>{item}</span>
                        {selectedFilterItem === item && <Check className="w-3.5 h-3.5 text-blue-400" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      );

    case 'COMP-09': // 선택형 직접입력 콤보박스 (IconSelectComboBox)
      return (
        <div className="w-full space-y-1.5 select-text">
          <label className="text-xs font-semibold flex items-center justify-between">
            <span>단축키 & 제스처 바인딩 (ComboBox)</span>
            <span className="text-[10px] opacity-60">프리픽스 아이콘 클릭 변경</span>
          </label>
          <div className={`flex items-center rounded-xl border overflow-hidden transition-all ${themeInputClasses} ${getStateOverlay()}`}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                const next = comboIcon === '📂' ? '⚡' : comboIcon === '⚡' ? '🔍' : comboIcon === '🔍' ? '🏷️' : '📂';
                setComboIcon(next);
                onShowToast?.(`프리픽스 아이콘이 [${next}] 로 변경되었습니다.`);
              }}
              className={`px-3 py-2 border-r border-inherit text-sm cursor-pointer hover:bg-blue-500/20 ${themeSubpanelClasses}`}
              title="아이콘 변경 (클릭)"
            >
              {comboIcon}
            </button>
            <input
              type="text"
              value={comboText}
              disabled={disabled}
              onChange={(e) => setComboText(e.target.value)}
              className="flex-1 px-3 py-2 text-xs sm:text-sm bg-transparent outline-none font-mono"
            />
          </div>
        </div>
      );

    case 'COMP-10': // 라디오버튼 그룹 (RadioButtonGroup)
      return (
        <div className="w-full space-y-2 select-text">
          <label className="text-xs font-semibold">뷰어 렌더링 모드 (RadioButtonGroup)</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'single', label: '단면 연속보기' },
              { id: 'spread', label: '양면 펼침보기' },
            ].map((r) => (
              <label
                key={r.id}
                className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer text-xs font-medium transition-colors ${
                  radioVal === r.id
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400 font-semibold'
                    : 'border-slate-700 opacity-70 hover:opacity-100'
                } ${getStateOverlay()}`}
              >
                <input
                  type="radio"
                  name="showcase-radio"
                  disabled={disabled}
                  checked={radioVal === r.id}
                  onChange={() => {
                    setRadioVal(r.id);
                    onShowToast?.(`뷰어 모드: [${r.label}] 적용`);
                  }}
                  className="w-3.5 h-3.5 text-blue-600 cursor-pointer"
                />
                <span>{r.label}</span>
              </label>
            ))}
          </div>
        </div>
      );

    // -------------------------------------------------------------
    // 3. 선택 및 스위치 (4종)
    // -------------------------------------------------------------
    case 'COMP-11': // 필터선택 칩 (FilterSelectChip) - [고정 폭 보장]
      return (
        <div className="w-full space-y-2 select-text">
          <label className="text-xs font-semibold flex items-center justify-between">
            <span>문서 상태 다중선택 칩 (FilterSelectChip)</span>
            <span className="text-[10px] text-blue-400 font-mono">체크아이콘 고정 폭(0px Shift 방지)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'completed', label: '완료 문서 (12)' },
              { id: 'pending', label: '교정 대기 (4)' },
              { id: 'draft', label: '임시 보관 (1)' },
            ].map((chip) => {
              const active = !!chipStates[chip.id];
              return (
                <button
                  key={chip.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    setChipStates((prev) => ({ ...prev, [chip.id]: !prev[chip.id] }));
                    onShowToast?.(`[${chip.label}] 칩 ${!active ? '선택' : '해제'}`);
                  }}
                  className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
                    active
                      ? 'border-blue-500 bg-blue-500/20 text-blue-400 shadow-xs'
                      : `${themeInputClasses} opacity-80 hover:opacity-100 hover:border-slate-500`
                  } ${getStateOverlay()}`}
                >
                  <Check
                    className={`w-3.5 h-3.5 shrink-0 transition-opacity ${
                      active ? 'opacity-100 text-blue-400' : 'opacity-20 text-slate-400'
                    }`}
                  />
                  <span>{chip.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      );

    case 'COMP-12': // 체크박스 컨트롤 (CheckboxControl)
      return (
        <div className="w-full space-y-2 select-text">
          <label className="text-xs font-semibold">약관 동의 및 선택 (CheckboxControl)</label>
          <div className="space-y-2">
            <label className="flex items-center gap-2.5 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={isChecked}
                disabled={disabled}
                onChange={(e) => {
                  setIsChecked(e.target.checked);
                  onShowToast?.(`약관 동의: ${e.target.checked ? '동의 완료' : '동의 해제'}`);
                }}
                className="w-4 h-4 rounded-md border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span className="font-medium">전자문서 이용약관에 동의합니다. (필수)</span>
            </label>
            <label className="flex items-center gap-2.5 text-xs opacity-70 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked
                disabled={disabled}
                className="w-4 h-4 rounded-md text-blue-600 cursor-pointer"
              />
              <span>OCR 텍스트 레이어 백그라운드 자동 생성 (선택)</span>
            </label>
          </div>
        </div>
      );

    case 'COMP-13': // 토글스위치 (ToggleSwitch)
      return (
        <div className={`w-full flex items-center justify-between p-3 rounded-xl border select-text transition-all ${themeCardClasses} ${getStateOverlay()}`}>
          <div>
            <div className="text-xs font-bold">2FA OTP 강제 활성화 (ToggleSwitch)</div>
            <div className="text-[11px] opacity-70">로그인 시 OTP 일회용 인증코드를 강제합니다.</div>
          </div>
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              setIsToggleOn(!isToggleOn);
              onShowToast?.(`2FA OTP 스위치 ${!isToggleOn ? 'ON' : 'OFF'}`);
            }}
            className={`w-12 h-6 p-0.5 rounded-xl transition-colors cursor-pointer flex items-center relative ${
              isToggleOn ? 'bg-blue-600' : 'bg-slate-700'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span
              className={`w-5 h-5 bg-white rounded-lg shadow-md transform transition-transform ${
                isToggleOn ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      );

    case 'COMP-14': // 탭 네비게이션 (TabNavigation)
      return (
        <div className="w-full space-y-2 select-text">
          <label className="text-xs font-semibold flex items-center justify-between">
            <span>탭 네비게이션 (TabNavigation)</span>
            <span className="text-[10px] opacity-60 font-mono">고대비 언더라인 인디케이터</span>
          </label>
          <div className="flex items-center gap-2 border-b border-inherit pb-1">
            {[
              { id: 'bookmarks', label: '북마크 (8)' },
              { id: 'toc', label: '목차 (TOC)' },
              { id: 'notes', label: '정밀 주석 (24)' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                disabled={disabled}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  onShowToast?.(`[${tab.label}] 탭 활성화`);
                }}
                className={`pb-2 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent opacity-60 hover:opacity-100'
                } ${getStateOverlay()}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className={`p-2.5 rounded-lg text-xs opacity-70 ${themeSubpanelClasses}`}>
            선택된 탭: <span className="font-bold text-blue-400">{activeTab.toUpperCase()}</span> 패널 뷰어 콘텐츠가 로드됩니다.
          </div>
        </div>
      );

    // -------------------------------------------------------------
    // 4. 뱃지 및 인디케이터 (4종)
    // -------------------------------------------------------------
    case 'COMP-15': // 건수 뱃지 (Count Badge)
      return (
        <div className="w-full space-y-2 select-text">
          <label className="text-xs font-semibold flex items-center justify-between">
            <span>건수 뱃지 (CountBadge)</span>
            <span className="text-[10px] text-blue-400 font-mono">Zero-Pill 사각 규격</span>
          </label>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-800 text-slate-200 border border-slate-700">
              800P
            </span>
            <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
              총 124건
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
              NEW +3
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
              24 주석
            </span>
          </div>
        </div>
      );

    case 'COMP-16': // 상태 뱃지 (Status Badge)
      return (
        <div className="w-full space-y-2 select-text">
          <label className="text-xs font-semibold flex items-center justify-between">
            <span>4대 시맨틱 상태 뱃지 (StatusBadge)</span>
            <span className="text-[10px] opacity-60">펄스 도트 인디케이터</span>
          </label>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              정상 (Success)
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              대기 (Warning)
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/30">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              오류 (Danger)
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/30">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              정보 (Info)
            </span>
          </div>
        </div>
      );

    // 1.6 COMP-17 오프라인 인디케이터 바 (가변 폭 무제한 자동 줄바꿈 완전 보장)
    case 'COMP-17':
      return (
        <div className="w-full max-w-full min-w-0 select-text">
          <label className="text-xs font-semibold flex items-center justify-between mb-1.5">
            <span>오프라인 인디케이터 바 (OfflineIndicatorBar)</span>
            <span className="text-[10px] text-amber-400 font-mono">가변 폭 무제한 자동 줄바꿈</span>
          </label>
          <div className="w-full max-w-full min-w-0 p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs overflow-hidden">
            <div className="flex items-start gap-2.5 min-w-0 flex-1 max-w-full">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              {/* 1.6 break-all [overflow-wrap:anywhere]로 텍스트 영역 튕겨나감/잘림 완전 방지 */}
              <p className="min-w-0 flex-1 text-xs leading-relaxed font-medium break-all [overflow-wrap:anywhere] whitespace-normal">
                ⚠️ 네트워크 오프라인 상태입니다. 작업 중인 내용이 로컬 IndexedDB 큐(대기 3건)에 안전하게 저장되며, 네트워크 복원 시 자동 동기화됩니다.
              </p>
            </div>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onShowToast?.('서버 재연결 및 로컬 큐 동기화 시도 중...')}
              className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-bold shrink-0 self-start md:self-center transition-colors cursor-pointer border border-amber-500/30 whitespace-nowrap"
            >
              재연결 시도
            </button>
          </div>
        </div>
      );

    case 'COMP-18': // 인라인 시맨틱 피드백 배너 (InlineSemanticBanner)
      return (
        <div className="w-full space-y-1.5 select-text">
          <label className="text-xs font-semibold flex items-center justify-between">
            <span>인라인 시맨틱 피드백 배너 (Banner)</span>
            <span className="text-[10px] opacity-60">X 닫기 액션 연동</span>
          </label>
          {isBannerVisible ? (
            <div className="w-full p-3 rounded-xl border border-blue-500/30 bg-blue-500/10 flex items-start justify-between gap-2.5 animate-fadeIn">
              <div className="flex items-center gap-2 text-xs text-blue-300">
                <Info className="w-4 h-4 shrink-0 text-blue-400" />
                <span>PDF OCR 텍스트 레이어 바운딩박스 분석이 완료되었습니다. 교정 스튜디오에서 검토하세요.</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsBannerVisible(false);
                  onShowToast?.('알림 배너를 닫았습니다.');
                }}
                className="text-blue-400 hover:text-blue-200 shrink-0 cursor-pointer"
                title="배너 닫기"
              >
                ✕
              </button>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setIsBannerVisible(true)}>
              배너 다시 열기
            </Button>
          )}
        </div>
      );

    // -------------------------------------------------------------
    // 5. 고급 인터랙션 분자 (4종)
    // -------------------------------------------------------------
    // 1.4 COMP-19 카테고리 트리 (깊이감 복원, 우측상단 툴바: 보기모드/등록/삭제, 평문 path 전환, 레벨별 입력/등록, 삭제모드)
    case 'COMP-19':
      const getNodePath = (node: TreeItemNode): string => {
        if (!node.parentId) return `/${node.name}`;
        const parent = treeData.find((t) => t.id === node.parentId);
        return parent ? `${getNodePath(parent)}/${node.name}` : `/${node.name}`;
      };

      const handleStartAddChild = (parentId: number | null) => {
        setNewChildParentId(parentId);
        setNewChildName('');
        onShowToast?.(parentId ? '선택한 폴더 아래에 새 항목을 추가합니다.' : '루트 레벨에 새 항목을 추가합니다.');
      };

      const handleConfirmAddChild = () => {
        if (!newChildName.trim()) {
          onShowToast?.('폴더 이름을 입력하세요.');
          return;
        }
        const parent = treeData.find((t) => t.id === newChildParentId);
        const newId = Date.now();
        const newNode: TreeItemNode = {
          id: newId,
          name: newChildName.trim(),
          count: 0,
          depth: parent ? parent.depth + 1 : 0,
          parentId: newChildParentId,
        };

        if (parent) {
          const pIdx = treeData.findIndex((t) => t.id === newChildParentId);
          const next = [...treeData];
          next.splice(pIdx + 1, 0, newNode);
          setTreeData(next);
        } else {
          setTreeData((prev) => [...prev, newNode]);
        }
        setNewChildParentId(null);
        setNewChildName('');
        setSelectedTreeId(newId);
        onShowToast?.(`'${newNode.name}' 폴더가 정상 등록되었습니다.`);
      };

      const handleDeleteItem = (id: number) => {
        setTreeData((prev) => prev.filter((t) => t.id !== id && t.parentId !== id));
        if (selectedTreeId === id) setSelectedTreeId(null);
        onShowToast?.('폴더 항목이 삭제되었습니다.');
      };

      return (
        <div className="w-full space-y-2.5 select-text">
          {/* 1.4 카테고리 트리 우측 상단 툴바: 보기모드 아이콘, 등록, 삭제 버튼 */}
          <div className="flex items-center justify-between text-xs pb-1.5 border-b border-inherit/40">
            <span className="font-semibold flex items-center gap-1.5">
              <FolderTree className="w-4 h-4 text-blue-400" />
              <span>카테고리 트리 (CategoryTree)</span>
            </span>

            <div className="flex items-center gap-1.5">
              {/* 보기모드 전환 아이콘 (계층 트리 vs 평문 path) */}
              <div className="flex items-center p-0.5 rounded-lg border border-inherit/60">
                <button
                  type="button"
                  onClick={() => setTreeViewMode('tree')}
                  className={`p-1.5 rounded cursor-pointer transition-colors ${
                    treeViewMode === 'tree'
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                  title="계층 트리 보기모드"
                >
                  <FolderTree className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setTreeViewMode('flat')}
                  className={`p-1.5 rounded cursor-pointer transition-colors ${
                    treeViewMode === 'flat'
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                  title="평문 보기모드 (폴더구조를 path로 표시)"
                >
                  <FileText className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 등록 버튼 */}
              <button
                type="button"
                disabled={disabled}
                onClick={() => handleStartAddChild(selectedTreeId)}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                title="선택된 항목 위치에 새 항목 등록"
              >
                <Plus className="w-3 h-3" />
                <span>등록</span>
              </button>

              {/* 삭제 모드 토글 버튼 */}
              <button
                type="button"
                disabled={disabled}
                onClick={() => {
                  setIsTreeDeleteMode((prev) => !prev);
                  onShowToast?.(isTreeDeleteMode ? '수정 모드로 전환되었습니다.' : '삭제 모드가 활성화되었습니다. 삭제할 항목을 클릭하세요.');
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer border transition-colors ${
                  isTreeDeleteMode
                    ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-600/30'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                }`}
                title={isTreeDeleteMode ? '수정 모드로 복귀' : '항목 삭제 모드 활성화'}
              >
                <Trash2 className="w-3 h-3" />
                <span>{isTreeDeleteMode ? '삭제 모드 ON' : '삭제'}</span>
              </button>
            </div>
          </div>

          {/* 1.4 트리 결과 영역: 카드 형태 제거하고 깊이감 있는 계층 구조로 표시 */}
          <div className={`p-2 rounded-xl border max-h-60 overflow-y-auto select-text ${themeCardClasses}`}>
            {treeViewMode === 'tree' ? (
              /* 트리보기모드 */
              <div className="space-y-0.5">
                {treeData.map((item) => {
                  const isSelected = selectedTreeId === item.id;
                  const isChild = item.depth > 0;
                  const isAnchorActive = dropTargetId === item.id && draggedTreeId !== item.id;

                  return (
                    <React.Fragment key={item.id}>
                      {/* 드롭 타겟 앵커 라인 */}
                      {isAnchorActive && (
                        <div className="h-0.5 bg-blue-500 mx-2 my-0.5 rounded animate-pulse" />
                      )}

                      <div
                        draggable
                        onDragStart={() => setDraggedTreeId(item.id)}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDropTargetId(item.id);
                        }}
                        onDragLeave={() => {
                          if (dropTargetId === item.id) setDropTargetId(null);
                        }}
                        onDrop={() => {
                          if (draggedTreeId && draggedTreeId !== item.id) {
                            const fromIdx = treeData.findIndex((t) => t.id === draggedTreeId);
                            const toIdx = treeData.findIndex((t) => t.id === item.id);
                            if (fromIdx !== -1 && toIdx !== -1) {
                              const updated = [...treeData];
                              const [removed] = updated.splice(fromIdx, 1);
                              updated.splice(toIdx, 0, removed);
                              setTreeData(updated);
                              onShowToast?.(`'${removed.name}' 위치 이동 완료`);
                            }
                          }
                          setDraggedTreeId(null);
                          setDropTargetId(null);
                        }}
                        onClick={() => setSelectedTreeId(item.id)}
                        style={{ paddingLeft: `${item.depth * 18 + 6}px` }}
                        className={`flex items-center gap-1.5 py-1.5 pr-2 rounded-lg transition-colors cursor-pointer group ${
                          isChild ? 'border-l-2 border-slate-700/50' : ''
                        } ${
                          isSelected
                            ? 'bg-blue-600/20 text-blue-300 font-semibold'
                            : 'hover:bg-blue-500/10 text-inherit'
                        } ${draggedTreeId === item.id ? 'opacity-30' : ''}`}
                      >
                        {/* 드래그 핸들 */}
                        <GripVertical className="w-3 h-3 opacity-30 group-hover:opacity-100 cursor-grab shrink-0" />

                        {/* 폴더 아이콘 */}
                        {isChild ? (
                          <Folder className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        ) : (
                          <FolderOpen className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        )}

                        {/* 이름 또는 인라인 수정 입력필드 */}
                        {editingTreeId === item.id ? (
                          <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              defaultValue={item.name}
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const val = (e.target as HTMLInputElement).value.trim();
                                  if (val) {
                                    setTreeData((prev) =>
                                      prev.map((t) => (t.id === item.id ? { ...t, name: val } : t))
                                    );
                                    setEditingTreeId(null);
                                    onShowToast?.(`폴더명이 '${val}'(으)로 변경되었습니다.`);
                                  }
                                }
                              }}
                              className="px-2 py-0.5 text-xs rounded border border-blue-500 bg-slate-950 text-white outline-none flex-1"
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingTreeId(null);
                              }}
                              className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold"
                            >
                              완료
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs truncate flex-1">{item.name}</span>
                        )}

                        {/* 건수 표기 */}
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono shrink-0 ${themeSubpanelClasses}`}>
                          {item.count}
                        </span>

                        {/* 1.4 삭제버튼 클릭 시 수정버튼을 삭제버튼으로 전환 표시 */}
                        <div className="flex items-center gap-1 shrink-0">
                          {isTreeDeleteMode ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteItem(item.id);
                              }}
                              className="p-1 rounded bg-rose-500/20 text-rose-300 hover:bg-rose-500/40 hover:text-white text-[10px] cursor-pointer flex items-center gap-0.5"
                              title="항목 삭제"
                            >
                              <Trash2 className="w-3 h-3 text-rose-400" />
                              <span>삭제</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingTreeId(editingTreeId === item.id ? null : item.id);
                              }}
                              className="p-1 rounded hover:bg-blue-500/20 hover:text-blue-300 text-slate-400 text-[10px] cursor-pointer flex items-center gap-0.5"
                              title="항목 수정"
                            >
                              <Pencil className="w-3 h-3" />
                              <span className="opacity-70 group-hover:opacity-100">수정</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* 1.4 등록 시 선택한 항목의 레벨로 바로 아래 입력항목 추가 */}
                      {newChildParentId === item.id && (
                        <div
                          style={{ paddingLeft: `${(item.depth + 1) * 18 + 6}px` }}
                          className="flex items-center gap-1.5 py-1 pr-2 animate-fadeIn"
                        >
                          <Folder className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <input
                            type="text"
                            value={newChildName}
                            onChange={(e) => setNewChildName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleConfirmAddChild();
                            }}
                            placeholder="새 폴더 이름 입력..."
                            autoFocus
                            className="px-2 py-0.5 text-xs rounded border border-emerald-500 bg-slate-950 text-white outline-none flex-1"
                          />
                          <button
                            type="button"
                            onClick={handleConfirmAddChild}
                            className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold cursor-pointer"
                          >
                            등록
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewChildParentId(null)}
                            className="px-1.5 py-0.5 rounded hover:bg-slate-700 text-slate-400 text-[11px] cursor-pointer"
                          >
                            취소
                          </button>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}

                {/* 루트 레벨 추가 입력창 (선택 항목 없을 때) */}
                {newChildParentId === null && (
                  <div className="flex items-center gap-1.5 py-1 px-2 border-t border-dashed border-inherit/40 animate-fadeIn mt-2">
                    <Folder className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <input
                      type="text"
                      value={newChildName}
                      onChange={(e) => setNewChildName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleConfirmAddChild();
                      }}
                      placeholder="루트 레벨 새 폴더 이름..."
                      className="px-2 py-0.5 text-xs rounded border border-emerald-500 bg-slate-950 text-white outline-none flex-1"
                    />
                    <button
                      type="button"
                      onClick={handleConfirmAddChild}
                      className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold cursor-pointer"
                    >
                      등록
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* 1.4 평문보기모드 (폴더구조를 path로 표시) */
              <div className="space-y-1 font-mono text-xs">
                {treeData.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedTreeId(item.id)}
                    className={`p-1.5 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                      selectedTreeId === item.id
                        ? 'bg-blue-600/20 text-blue-300 font-bold'
                        : 'hover:bg-blue-500/10 text-inherit'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span className="truncate">{getNodePath(item)}</span>
                    </div>
                    <span className={`px-1.5 py-0.2 rounded text-[10px] ${themeSubpanelClasses}`}>
                      {item.count}건
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );

    // 1.7 COMP-20 프로필 아바타 (수정아이콘 표시 상태유형 4종 추가)
    case 'COMP-20':
      return (
        <div className={`w-full space-y-2 select-text`}>
          {/* 상태유형 스위처 */}
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold">프로필 아바타 (ProfileAvatarEditable)</span>
            <div className="flex items-center gap-1 text-[10px] font-mono">
              <span className="opacity-60">상태유형:</span>
              {[
                { id: 'readonly', label: '기본/조회' },
                { id: 'hover', label: '호버 표시' },
                { id: 'badge', label: '우하단 뱃지' },
                { id: 'overlay', label: '상시 오버레이' },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => {
                    setAvatarStateType(st.id as any);
                    onShowToast?.(`아바타 상태유형이 [${st.label}]로 설정되었습니다.`);
                  }}
                  className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                    avatarStateType === st.id
                      ? 'bg-blue-600 text-white font-bold'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          <div
            className={`w-full flex items-center gap-4 p-3.5 rounded-xl border select-text transition-all ${themeCardClasses} ${getStateOverlay()}`}
          >
            <div className="relative w-14 h-14 rounded-2xl overflow-hidden border-2 border-inherit bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg group shrink-0 shadow-sm">
              <span>JK</span>

              {/* 1) 호버 시 수정 오버레이 */}
              {avatarStateType === 'hover' && (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onShowToast?.('아바타 HTML5 Canvas 크롭 모달 호출')}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] cursor-pointer"
                  title="프로필 사진 수정"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}

              {/* 2) 상시 오버레이 */}
              {avatarStateType === 'overlay' && (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onShowToast?.('아바타 HTML5 Canvas 크롭 모달 호출')}
                  className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white text-[9px] cursor-pointer"
                  title="프로필 사진 수정"
                >
                  <Pencil className="w-3.5 h-3.5 mb-0.5" />
                  <span>수정</span>
                </button>
              )}

              {/* 3) 우하단 뱃지 상시 표시 */}
              {avatarStateType === 'badge' && (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onShowToast?.('아바타 HTML5 Canvas 크롭 모달 호출')}
                  className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-blue-600 hover:bg-blue-500 border-2 border-white flex items-center justify-center shadow-md cursor-pointer transition-transform hover:scale-110"
                  title="프로필 사진 수정 뱃지"
                >
                  <Pencil className="w-2.5 h-2.5 text-white" />
                </button>
              )}
            </div>

            <div className="space-y-0.5 flex-1 min-w-0">
              <div className="text-xs font-bold flex items-center gap-1.5 truncate">
                <span className="truncate">jkok2j2m@gmail.com</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-blue-500/20 text-blue-400 font-mono">
                  ADMIN
                </span>
              </div>
              <div className="text-[11px] opacity-70">
                {avatarStateType === 'readonly' && '수정 아이콘 미노출 (순수 프로필 뷰어 상태)'}
                {avatarStateType === 'hover' && '호버 시 연필 수정 오버레이 노출'}
                {avatarStateType === 'badge' && '우하단 연필 수정 뱃지 상시 노출'}
                {avatarStateType === 'overlay' && '아바타 전면 수정 오버레이 상시 활성화'}
                {' · Canvas 이미지 크롭 연동'}
              </div>
            </div>
          </div>
        </div>
      );

    case 'COMP-21': // 수평 진행상태 스테퍼 (HorizontalStatusStepper)
      return (
        <div className={`w-full flex items-center justify-between p-3.5 rounded-xl border select-text transition-all ${themeCardClasses} ${getStateOverlay()}`}>
          {[
            { step: 1, label: '1. 본인인증' },
            { step: 2, label: '2. 계정설정' },
            { step: 3, label: '3. 가입완료' },
          ].map((st, idx) => {
            const isDone = stepperStep > st.step;
            const isCurrent = stepperStep === st.step;
            return (
              <React.Fragment key={st.step}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    setStepperStep(st.step);
                    onShowToast?.(`스테퍼 [${st.label}] 단계로 전환`);
                  }}
                  className="flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shadow-xs transition-colors ${
                      isDone
                        ? 'bg-emerald-500 text-white'
                        : isCurrent
                        ? 'bg-blue-600 text-white animate-pulse'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {isDone ? '✓' : st.step}
                  </div>
                  <span
                    className={`text-xs ${
                      isCurrent ? 'font-bold text-blue-400' : isDone ? 'text-slate-300' : 'opacity-40'
                    }`}
                  >
                    {st.label}
                  </span>
                </button>
                {idx < 2 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 ${
                      stepperStep > idx + 1 ? 'bg-blue-500' : 'bg-slate-700'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      );

    // 1.8 COMP-22 슬라이드 드래그휠 (첫/끝 경계 도달 전 상하 스크롤 전파 격리, 경계 도달 시만 화면 스크롤 허용)
    case 'COMP-22':
      const slidePresets = [
        { id: 1, title: '1페이지 단면 뷰', desc: '표준 100% 렌더링', tag: '기본' },
        { id: 2, title: '단면 줌 150%', desc: '선명한 텍스트 확대', tag: '확대' },
        { id: 3, title: '2-Way OCR 레이어', desc: '바운딩박스 교정', tag: '스튜디오' },
        { id: 4, title: '양면 펼침 모드', desc: '책자 형태 2페이지', tag: '인쇄' },
        { id: 5, title: '주석 레이어 내보내기', desc: 'PDF 하이라이트', tag: '내보내기' },
        { id: 6, title: '2FA 암호화 잠금', desc: '보안 메타데이터', tag: '보안' },
        { id: 7, title: '가상화 800쪽 렌더러', desc: '초고속 메모리 가드', tag: '성능' },
        { id: 8, title: '워터마크 스탬프', desc: '대외비 인증 도장', tag: '보안' },
        { id: 9, title: '전자서명 파이프라인', desc: 'SHA-256 서명', tag: '인증' },
        { id: 10, title: '인덱스 메타 추출', desc: 'GIN 전문 검색', tag: '인덱서' },
        { id: 11, title: '흑백 이진화 필터', desc: '고대비 스캔 보정', tag: '전처리' },
        { id: 12, title: '자동 백업 아카이빙', desc: '로컬 스냅샷 보존', tag: '재해복구' },
      ];

      return (
        <div className="w-full space-y-2 select-text">
          {/* 상단 상태 인디케이터 바 및 수동 이동 화살표 */}
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold flex items-center gap-1.5">
              <span>슬라이드 드래그휠 (SlideDragWheel)</span>
            </span>

            <div className="flex items-center gap-2 font-mono text-[10px]">
              {/* 스크롤 진행률 */}
              <span className="opacity-70">위치: {scrollPercent}%</span>

              {/* 경계 상태 뱃지 */}
              <span
                className={`px-2 py-0.5 rounded font-bold transition-colors ${
                  wheelStatus === 'start'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : wheelStatus === 'end'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                }`}
              >
                {wheelStatus === 'start'
                  ? '🟢 첫 요소 (화면 상하 스크롤 허용)'
                  : wheelStatus === 'end'
                  ? '🔴 끝 요소 (화면 상하 스크롤 허용)'
                  : '⚡ 내부 가로스크롤 (화면 스크롤 차단)'}
              </span>

              {/* 수동 슬라이드 버튼 */}
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => {
                    if (wheelContainerRef.current) {
                      wheelContainerRef.current.scrollLeft -= 220;
                    }
                  }}
                  className="px-1.5 py-0.5 rounded border border-inherit hover:bg-blue-500/20 text-[10px] cursor-pointer"
                  title="왼쪽으로 이동"
                >
                  ◀
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (wheelContainerRef.current) {
                      wheelContainerRef.current.scrollLeft += 220;
                    }
                  }}
                  className="px-1.5 py-0.5 rounded border border-inherit hover:bg-blue-500/20 text-[10px] cursor-pointer"
                  title="오른쪽으로 이동"
                >
                  ▶
                </button>
              </div>
            </div>
          </div>

          {/* 1.8 휠 이벤트 전파 격리 컨테이너 (overscroll-contain 적용) */}
          <div
            ref={wheelContainerRef}
            style={{ overscrollBehavior: 'contain' }}
            className="w-full overflow-x-auto flex items-center gap-3 py-2 px-1 scrollbar-thin select-text overscroll-contain transition-all"
          >
            {slidePresets.map((item) => (
              <div
                key={item.id}
                onClick={() => onShowToast?.(`[${item.title}] 프리셋이 선택되었습니다.`)}
                className={`shrink-0 w-44 p-3 rounded-xl border text-xs cursor-pointer transition-all ${themeCardClasses} hover:border-blue-500 hover:shadow-md shadow-xs`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-[10px] opacity-60">#{item.id}</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-blue-500/20 text-blue-400">
                    {item.tag}
                  </span>
                </div>
                <div className="font-bold truncate text-xs">{item.title}</div>
                <div className="text-[10px] opacity-70 mt-0.5 truncate">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      );

    // -------------------------------------------------------------
    // 6. 팝오버 및 오버레이 (4종)
    // -------------------------------------------------------------
    case 'COMP-23': // 롱프레스 툴팁 & 클립보드 원클릭 복사 (LongPressTooltipCopy)
      const sampleUrl = 'https://pdfrend.com/s/secure-7x9Q';
      return (
        <div className="w-full space-y-1.5 select-text">
          <label className="text-xs font-semibold flex items-center justify-between">
            <span>롱프레스 툴팁 & 원클릭 복사 (LongPressTooltipCopy)</span>
            <span className="text-[10px] opacity-60">원클릭 클립보드 연동</span>
          </label>
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              navigator.clipboard?.writeText(sampleUrl);
              setCopied(true);
              onShowToast?.('공유 링크가 클립보드에 복사되었습니다!');
              setTimeout(() => setCopied(false), 2000);
            }}
            className={`w-full px-3.5 py-2 rounded-xl border flex items-center justify-between text-xs font-mono transition-colors cursor-pointer shadow-xs ${themeInputClasses} hover:border-blue-500 ${getStateOverlay()}`}
            title="클릭 시 즉시 클립보드 복사"
          >
            <span className="truncate">{sampleUrl}</span>
            <span className="flex items-center gap-1 text-blue-400 font-semibold shrink-0 ml-2">
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className={copied ? 'text-emerald-400' : ''}>{copied ? '복사됨!' : '복사'}</span>
            </span>
          </button>
        </div>
      );

    case 'COMP-24': // ? 안내 팝업 레이어 (InfoHelpPopoverLayer)
      return (
        <div className={`w-full flex items-center justify-between p-3 rounded-xl border select-text relative transition-all ${themeCardClasses} ${getStateOverlay()}`}>
          <div className="flex items-center gap-2 text-xs font-medium">
            <span>워터마크 투명도 정책</span>
            <button
              type="button"
              onClick={() => setIsHelpOpen(!isHelpOpen)}
              className="text-slate-400 hover:text-blue-400 cursor-pointer"
              title="도움말 토글"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
          <span className="text-xs font-mono opacity-70">0.35 Alpha</span>
          {isHelpOpen && (
            <div className={`absolute left-4 right-4 top-full mt-1.5 p-3 rounded-xl shadow-xl border text-xs z-30 animate-fadeIn space-y-1.5 ${themeCardClasses}`}>
              <div className="font-bold flex items-center justify-between">
                <span className="text-blue-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> 안내 가이드라인
                </span>
                <button onClick={() => setIsHelpOpen(false)} className="opacity-50 hover:opacity-100 cursor-pointer">
                  ✕
                </button>
              </div>
              <p className="opacity-80 leading-relaxed">
                투명도를 0.2~0.4 범위로 설정해야 본문 텍스트 가독성을 저해하지 않고 문서 유출을 효과적으로 방어할 수 있습니다.
              </p>
            </div>
          )}
        </div>
      );

    case 'COMP-25': // 모바일 바텀시트 모달 (MobileBottomSheetModal)
      return (
        <div className="w-full space-y-2 select-text">
          <label className="text-xs font-semibold flex items-center justify-between">
            <span>모바일 바텀시트 모달 (Bottom Sheet)</span>
            <span className="text-[10px] text-blue-400 font-mono">📱 모바일 전용 시뮬레이터</span>
          </label>
          <Button
            variant="outline"
            size="md"
            className="w-full"
            disabled={disabled}
            onClick={() => setIsBottomSheetOpen(true)}
          >
            <span>📱 모바일 바텀시트 열기 시뮬레이터</span>
          </Button>
          {isBottomSheetOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex flex-col justify-end p-2 select-text animate-fadeIn">
              <div className={`w-full max-w-lg mx-auto rounded-t-2xl p-4 shadow-2xl border-t space-y-3 animate-slideUp ${themeCardClasses}`}>
                <div className="w-12 h-1 bg-slate-500 rounded-full mx-auto" />
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold">모바일 내보내기 포맷</h4>
                  <button
                    onClick={() => setIsBottomSheetOpen(false)}
                    className="text-xs opacity-60 hover:opacity-100 cursor-pointer"
                  >
                    닫기
                  </button>
                </div>
                <div className="space-y-2">
                  <div
                    onClick={() => {
                      setIsBottomSheetOpen(false);
                      onShowToast?.('PDF 원본 다운로드를 시작합니다.');
                    }}
                    className={`p-3 rounded-xl border text-xs font-medium cursor-pointer hover:border-blue-500 ${themeSubpanelClasses}`}
                  >
                    📄 PDF 원본 문서 다운로드
                  </div>
                  <div
                    onClick={() => {
                      setIsBottomSheetOpen(false);
                      onShowToast?.('OCR 텍스트 레이어 (JSON) 다운로드를 시작합니다.');
                    }}
                    className={`p-3 rounded-xl border text-xs font-medium cursor-pointer hover:border-blue-500 ${themeSubpanelClasses}`}
                  >
                    🔍 OCR 텍스트 레이어 (TXT / JSON)
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      );

    case 'COMP-26': // 플로팅 상태 피드백 토스트 (FloatingToastFeedbackLayer)
      return (
        <div className={`w-full p-3 rounded-xl border shadow-md flex items-center justify-between select-text transition-all ${themeCardClasses} ${getStateOverlay()}`}>
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs font-medium">설정 변경사항이 성공적으로 저장되었습니다.</span>
          </div>
          <span className="text-[10px] font-mono opacity-50">3초 Auto-dismiss</span>
        </div>
      );

    // -------------------------------------------------------------
    // 7. 컨테이너 & 도크 (4종)
    // -------------------------------------------------------------
    case 'COMP-27': // Bento 플랫 카드 컨테이너 (BentoCardContainer)
      return (
        <div className={`w-full p-4 rounded-2xl border backdrop-blur-md shadow-sm space-y-2 select-text hover:border-blue-500/60 transition-all ${themeCardClasses} ${getStateOverlay()}`}>
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold opacity-70">월간 OCR 토큰 쿼터 (Bento)</span>
            <Badge variant="primary">78% 소진</Badge>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-xl font-black font-mono">1,950 / 2,500</div>
            <span className="text-[11px] text-emerald-400 font-semibold">Tier 2 Flash</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full" style={{ width: '78%' }} />
          </div>
        </div>
      );

    case 'COMP-28': // 반응형 라벨·금액 분리 표시 Row (ResponsiveLabelValueRow)
      return (
        <div className={`w-full flex ${isMobile ? 'flex-col items-start gap-1' : 'flex-row items-center justify-between'} p-3 rounded-xl border select-text transition-all ${themeCardClasses} ${getStateOverlay()}`}>
          <span className="text-xs opacity-80 font-medium">대용량 800쪽 가상 뷰어 라이선스</span>
          <span className="text-sm font-bold font-mono text-blue-400">₩ 24,000 / 월</span>
        </div>
      );

    case 'COMP-29': // 플로팅 빠른등록 도크 (FloatingQuickDock)
      return (
        <div className={`w-full p-2 rounded-xl border flex items-center justify-end select-text ${themeSubpanelClasses} ${getStateOverlay()}`}>
          <div className={`flex items-center gap-2 p-1.5 rounded-2xl border shadow-md ${themeCardClasses}`}>
            <span className="text-xs font-semibold px-2 opacity-70">퀵 도크</span>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onShowToast?.('빠른 PDF 등록 모달을 실행합니다.')}
              className="h-8 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>새 문서 등록</span>
            </button>
          </div>
        </div>
      );

    case 'COMP-30': // 모바일 하단 네비게이션바 (MobileBottomNavbar)
      return (
        <div className={`w-full rounded-xl border overflow-hidden shadow-xs select-text ${themeCardClasses} ${getStateOverlay()}`}>
          <div className="grid grid-cols-4 items-center p-1 text-center">
            {[
              { id: 'home', label: '홈', icon: Home },
              { id: 'docs', label: '문서함', icon: Folder },
              { id: 'viewer', label: '뷰어', icon: FileText },
              { id: 'settings', label: '설정', icon: Settings },
            ].map((nav) => {
              const Icon = nav.icon;
              const isActive = activeBottomNav === nav.id;
              return (
                <button
                  key={nav.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    setActiveBottomNav(nav.id);
                    onShowToast?.(`모바일 네비: [${nav.label}] 이동`);
                  }}
                  className={`py-2 flex flex-col items-center gap-0.5 cursor-pointer transition-colors ${
                    isActive ? 'text-blue-400 font-bold' : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-[10px]">{nav.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      );

    default:
      return (
        <div className="p-4 text-xs opacity-50 flex items-center gap-2">
          <Layers className="w-4 h-4" />
          <span>컴포넌트 렌더러 준비 중 ({meta.id})</span>
        </div>
      );
  }
};
