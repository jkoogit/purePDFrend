// 30대 표준 원자/분자 컴포넌트 메타데이터 정의
export interface StandardComponentMeta {
  id: string;
  name: string;
  enName: string;
  category: 'layout' | 'form' | 'select' | 'indicator' | 'interaction' | 'overlay' | 'container';
  categoryLabel: string;
  usedScreens: { id: string; name: string }[];
  description: string;
  sampleCode: string;
  tokenRules: string[];
  themeSupport?: string;
  viewportCondition?: string;
}

export const STANDARD_COMPONENTS_30: StandardComponentMeta[] = [
  // 1. 레이아웃 & 쉘 (4종)
  {
    id: 'COMP-01',
    name: 'Top 레이어 (헤더)',
    enName: 'TopHeaderLayer',
    category: 'layout',
    categoryLabel: '레이아웃 & 쉘',
    usedScreens: [
      { id: 'PG-USR-01', name: '사용자 첫화면' },
      { id: 'PG-ADM-01', name: '관리자 보안' },
      { id: 'PG-SET-01', name: 'OCR 엔진 설정' },
      { id: 'PG-AGN-01', name: '하네스 작업그래프' },
    ],
    description: '브랜드 로고, 통합 네비게이션, 테마 스위처, 사용자 프로필 액션이 배치되는 글로벌 상단 1~2단 고정 헤더.',
    sampleCode: `<header className="h-14 px-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 z-40 select-text">\n  <BrandLogo />\n  <NavigationTools />\n</header>`,
    tokenRules: ['h-14 (56px) 또는 h-16 (64px) 규격', 'sticky top-0 z-40', 'themeClasses.panel'],
  },
  {
    id: 'COMP-02',
    name: 'Body 레이어 (컨테이너)',
    enName: 'ContentBodyLayer',
    category: 'layout',
    categoryLabel: '레이아웃 & 쉘',
    usedScreens: [
      { id: 'PG-USR-03', name: '홈 대시보드' },
      { id: 'PG-USR-05', name: '문서 라이브러리' },
      { id: 'PG-ADM-02', name: '프로그램 DAG' },
    ],
    description: '3단 반응형 그리드 및 단일 메인 워크스페이스를 담는 4pt 그리드 기반 본문 레이아웃 컨테이너.',
    sampleCode: `<main className="w-full max-w-7xl mx-auto px-4 py-6 space-y-6 select-text">\n  <section className="grid grid-cols-1 md:grid-cols-3 gap-4">\n    {/* 콘텐츠 */}\n  </section>\n</main>`,
    tokenRules: ['max-w-7xl mx-auto', '4pt 기반 패딩(py-6, px-4)', '반응형 grid-cols-1 md:grid-cols-3'],
  },
  {
    id: 'COMP-03',
    name: 'Footer 레이어 (상태바)',
    enName: 'FooterLayer',
    category: 'layout',
    categoryLabel: '레이아웃 & 쉘',
    usedScreens: [
      { id: 'PG-USR-01', name: '랜딩 첫화면' },
      { id: 'PG-USR-06', name: '가상스크롤 뷰어' },
      { id: 'PG-AGN-04', name: '무결성 감사실' },
    ],
    description: '시스템 상태, DB 연결 상태, 저작권 및 뷰어 쪽수/줌 정보를 표시하는 경량 푸터 바.',
    sampleCode: `<footer className="h-10 px-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 select-text">\n  <span>© 2026 purePDFrend. All rights reserved.</span>\n  <span className="flex items-center gap-2">DB: 정상 · KST 16:00 동기화</span>\n</footer>`,
    tokenRules: ['min-h-[40px]', 'themeClasses.subPanel', 'Zero-Pill 사각 라운딩'],
  },
  {
    id: 'COMP-04',
    name: '화면타이틀영역 (브레드크럼)',
    enName: 'BreadcrumbTitleArea',
    category: 'layout',
    categoryLabel: '레이아웃 & 쉘',
    usedScreens: [
      { id: 'PG-USR-04', name: '마이페이지' },
      { id: 'PG-ADM-03', name: '사용자관리' },
      { id: 'PG-ADM-07', name: '로그관리' },
    ],
    description: '현재 화면의 도메인 위치(Home > Category > Page)와 타이틀, 서브 소개문구를 일체형으로 제공.',
    sampleCode: `<div className="space-y-1.5 select-text">\n  <div className="flex items-center gap-1.5 text-xs text-slate-400">\n    <span>사용자</span> <span>/</span> <span className="text-blue-500 font-medium">마이페이지</span>\n  </div>\n  <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">계정 보안 및 2FA 설정</h1>\n  <p className="text-xs text-slate-500 dark:text-slate-400">안전한 전자문서 관리를 위한 2단계 인증 정책을 관리합니다.</p>\n</div>`,
    tokenRules: ['font-bold text-xl', 'text-slate-400 계층 구분자', 'Zero-Pill'],
  },

  // 2. 입력 및 폼 필드 (6종)
  {
    id: 'COMP-05',
    name: '입력필드 (기본 Input)',
    enName: 'InputField',
    category: 'form',
    categoryLabel: '입력 및 폼 필드',
    usedScreens: [
      { id: 'PG-USR-02', name: '로그인/가입' },
      { id: 'PG-USR-04', name: '비밀번호 수정' },
      { id: 'PG-ADM-04', name: '약관 등록' },
    ],
    description: '라벨, 헬퍼 텍스트, 에러 메시지, 포커스 링, 비활성 상태를 완비한 44px 터치 보장 텍스트 필드.',
    sampleCode: `<div className="space-y-1.5 select-text">\n  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">사용자 이름</label>\n  <input type="text" className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="이름을 입력하세요" />\n</div>`,
    tokenRules: ['min-h-[44px]', 'rounded-xl (Zero-Pill)', 'focus:ring-2 focus:ring-blue-500/20'],
  },
  {
    id: 'COMP-06',
    name: '검색입력필드 (Search Input)',
    enName: 'SearchInputField',
    category: 'form',
    categoryLabel: '입력 및 폼 필드',
    usedScreens: [
      { id: 'PG-USR-01', name: '랜딩 공개문서 검색' },
      { id: 'PG-USR-05', name: '문서 라이브러리 검색' },
      { id: 'PG-ADM-06', name: '메뉴트리 검색' },
    ],
    description: '돋보기 Search 아이콘, 입력 시 즉각 노출되는 클리어(X) 버튼, 2px 명확한 보더를 갖춘 검색 전용 인풋.',
    sampleCode: `<div className="relative flex items-center select-text">\n  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />\n  <input type="text" className="w-full h-11 pl-10 pr-9 rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm focus:border-blue-500 outline-none" placeholder="문서명, 태그, 본문 검색..." />\n  <button type="button" className="absolute right-3 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>\n</div>`,
    tokenRules: ['border-2 고대비 보더', 'pl-10 좌측 아이콘 여백', '원터치 X 클리어'],
  },
  {
    id: 'COMP-07',
    name: '선택목록 (Select / Dropdown)',
    enName: 'SelectDropdown',
    category: 'form',
    categoryLabel: '입력 및 폼 필드',
    usedScreens: [
      { id: 'PG-USR-05', name: '문서 카테고리 필터' },
      { id: 'PG-USR-06', name: '뷰어 확대배율 선택' },
      { id: 'PG-ADM-05', name: '역할 매핑 선택' },
    ],
    description: '시스템 브라우저 기본 셀렉트의 이질감을 배제한 4모드 테마 커스텀 드롭다운 팝오버.',
    sampleCode: `<div className="relative select-text">\n  <button type="button" className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-between text-sm">\n    <span>전체 카테고리 (기본값)</span>\n    <ChevronDown className="w-4 h-4 text-slate-400" />\n  </button>\n</div>`,
    tokenRules: ['min-h-[44px]', 'rounded-xl', 'themeClasses.input'],
  },
  {
    id: 'COMP-08',
    name: '실시간 필터목록 (Filter List)',
    enName: 'RealtimeFilterList',
    category: 'form',
    categoryLabel: '입력 및 폼 필드',
    usedScreens: [
      { id: 'PG-USR-05', name: '상세 태그 필터' },
      { id: 'PG-ADM-07', name: '감사로그 필터' },
      { id: 'PG-AGN-02', name: '태스크 목록 검색' },
    ],
    description: '키워드 타이핑 시 목록 항목이 실시간으로 필터링되며 매칭된 글자가 하이라이팅되는 리스트.',
    sampleCode: `<div className="space-y-2 select-text">\n  <input type="text" placeholder="필터링할 항목 입력..." className="w-full h-9 px-3 rounded-lg border text-xs" />\n  <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border rounded-xl p-1">\n    <div className="p-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer">매칭 결과 항목 1</div>\n  </div>\n</div>`,
    tokenRules: ['실시간 인라인 매칭', 'max-h-48 스크롤 가드', 'Zero-Pill'],
  },
  {
    id: 'COMP-09',
    name: '선택형 직접입력 콤보박스 (ComboBox)',
    enName: 'IconSelectComboBox',
    category: 'form',
    categoryLabel: '입력 및 폼 필드',
    usedScreens: [
      { id: 'PG-USR-09', name: '단축키 바인딩' },
      { id: 'PG-ADM-15', name: '도구 아이콘 매핑' },
      { id: 'PG-SET-04', name: '폰트 직접입력' },
    ],
    description: '좌측 아이콘 선택 프리픽스 버튼과 직접 텍스트 입력, 드롭다운 추천 선택이 일체화된 복합 콤보박스.',
    sampleCode: `<div className="flex items-center rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden select-text">\n  <button type="button" className="px-3 py-2.5 bg-slate-100 dark:bg-slate-800 border-r border-slate-300 dark:border-slate-700 text-xs flex items-center gap-1">📂 아이콘</button>\n  <input type="text" className="w-full h-11 px-3 text-sm bg-transparent outline-none" placeholder="직접 입력하거나 추천을 선택하세요" />\n</div>`,
    tokenRules: ['프리픽스 아이콘 드롭다운', '직접입력 호환', 'min-h-[44px]'],
  },
  {
    id: 'COMP-10',
    name: '라디오버튼 그룹 (Radio Group)',
    enName: 'RadioButtonGroup',
    category: 'form',
    categoryLabel: '입력 및 폼 필드',
    usedScreens: [
      { id: 'PG-USR-06', name: '뷰어 단면/양면 모드' },
      { id: 'PG-USR-08', name: '머지 충돌 해결 전략' },
      { id: 'PG-SET-02', name: '보안 암호화 알고리즘' },
    ],
    description: '단일 배타적 선택 옵션을 명확한 불렛 인디케이터와 함께 제공하는 접근성 준수 라디오 버튼.',
    sampleCode: `<div className="space-y-2 select-text">\n  <label className="flex items-center gap-2.5 cursor-pointer text-sm">\n    <input type="radio" name="view-mode" className="w-4 h-4 text-blue-600 focus:ring-blue-500" defaultChecked />\n    <span>단면 보기 (연속 스크롤)</span>\n  </label>\n</div>`,
    tokenRules: ['w-4 h-4 표준 인디케이터', 'cursor-pointer 44px 터치 영역', '포커스 링'],
  },

  // 3. 선택 및 스위치 (4종)
  {
    id: 'COMP-11',
    name: '필터선택 칩 (Filter Chip)',
    enName: 'FilterSelectChip',
    category: 'select',
    categoryLabel: '선택 및 스위치',
    usedScreens: [
      { id: 'PG-USR-05', name: '문서 상태 칩' },
      { id: 'PG-ADM-07', name: '로그 심각도 칩' },
      { id: 'PG-AGN-03', name: '모델 티어 칩' },
    ],
    description: '체크 아이콘과 선택 상태에 따른 시맨틱 테두리 및 배경색 전환을 지원하는 직사각형 칩.',
    sampleCode: `<button type="button" className="min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-medium border border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center gap-1.5 select-text">\n  <Check className="w-3.5 h-3.5" />\n  <span>완료 문서 (12)</span>\n</button>`,
    tokenRules: ['Zero-Pill (rounded-xl)', 'min-h-[36px] 터치영역', '체크 아이콘 연동'],
  },
  {
    id: 'COMP-12',
    name: '체크박스 컨트롤 (Checkbox)',
    enName: 'CheckboxControl',
    category: 'select',
    categoryLabel: '선택 및 스위치',
    usedScreens: [
      { id: 'PG-USR-02', name: '약관 동의 체크' },
      { id: 'PG-USR-05', name: '일괄 다운로드 선택' },
      { id: 'PG-ADM-05', name: '권한 매트릭스 체크' },
    ],
    description: '전체 선택(Indeterminate 상태 지원), 단일 항목 체크, 포커스 아웃라인을 지원하는 사각 체크박스.',
    sampleCode: `<label className="flex items-center gap-2.5 cursor-pointer text-sm select-text">\n  <input type="checkbox" className="w-4 h-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500" />\n  <span>개인정보 수집 및 이용에 동의합니다. (필수)</span>\n</label>`,
    tokenRules: ['rounded-md (Zero-Pill)', 'w-4 h-4 터치 센터링', 'indeterminate 지원'],
  },
  {
    id: 'COMP-13',
    name: '토글스위치 (Toggle Switch)',
    enName: 'ToggleSwitch',
    category: 'select',
    categoryLabel: '선택 및 스위치',
    usedScreens: [
      { id: 'PG-USR-04', name: '2FA OTP 강제화' },
      { id: 'PG-ADM-01', name: 'IP 차단 활성화' },
      { id: 'PG-SET-01', name: 'GPU 하드웨어 가속' },
    ],
    description: '즉각적인 기능 온/오프 상태 전환과 부드러운 슬라이딩 모션 피드백을 제공하는 현대적 스위치.',
    sampleCode: `<button type="button" className="w-12 h-6 p-0.5 rounded-xl bg-blue-600 transition-colors flex items-center relative select-text">\n  <span className="w-5 h-5 bg-white rounded-lg shadow-md transform translate-x-6 transition-transform" />\n</button>`,
    tokenRules: ['Zero-Pill (사각 둥글기 rounded-xl/lg)', 'smooth translate 애니메이션', '포커스 링'],
  },
  {
    id: 'COMP-14',
    name: '탭 네비게이션 (Tab Navigation)',
    enName: 'TabNavigation',
    category: 'select',
    categoryLabel: '선택 및 스위치',
    usedScreens: [
      { id: 'PG-USR-01', name: '3대 정보 탭' },
      { id: 'PG-USR-06', name: '북마크/목차/주석 탭' },
      { id: 'PG-ADM-05', name: '권한/프로그램/사용자 탭' },
    ],
    description: '고대비 언더라인 및 세그먼트 버튼 형태를 지원하는 4모드 테마 반응형 탭 스위처.',
    sampleCode: `<div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 select-text">\n  <button className="pb-2.5 px-3 border-b-2 border-blue-600 text-blue-600 font-semibold text-xs">북마크</button>\n  <button className="pb-2.5 px-3 border-b-2 border-transparent text-slate-500 hover:text-slate-700 text-xs">목차 (TOC)</button>\n</div>`,
    tokenRules: ['border-b-2 활성 인디케이터', 'min-h-[44px] 터치영역', 'themeClasses.textPrimary'],
  },

  // 4. 뱃지 및 인디케이터 (4종)
  {
    id: 'COMP-15',
    name: '건수 뱃지 (Count Badge)',
    enName: 'CountBadge',
    category: 'indicator',
    categoryLabel: '뱃지 및 인디케이터',
    usedScreens: [
      { id: 'PG-USR-05', name: '보관함 총 건수' },
      { id: 'PG-ADM-08', name: '미확인 알림 건수' },
      { id: 'PG-AGN-02', name: '활성 태스크 수' },
    ],
    description: '숫자 카운트를 직관적으로 표시하며 pill(타원) 형태를 배제한 규격 사각 라운딩 카운터 뱃지.',
    sampleCode: `<span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 select-text">800P</span>`,
    tokenRules: ['rounded-md (Zero-Pill 규격)', 'font-mono 숫자 가독성', 'border 명도 보정'],
  },
  {
    id: 'COMP-16',
    name: '상태 뱃지 (Status Badge)',
    enName: 'StatusBadge',
    category: 'indicator',
    categoryLabel: '뱃지 및 인디케이터',
    usedScreens: [
      { id: 'PG-USR-07', name: '협업 권한 상태' },
      { id: 'PG-ADM-01', name: '보안 화이트리스트 상태' },
      { id: 'PG-AGN-04', name: '무결성 감사 합격 상태' },
    ],
    description: '성공(Success), 경고(Warning), 위험(Danger), 정보(Info)를 펄스 점(dot)과 함께 표시.',
    sampleCode: `<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 select-text">\n  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />\n  정상 가동 (Online)\n</span>`,
    tokenRules: ['dot 펄스 인디케이터', 'WCAG AA 명도 대비 4.5:1', 'Zero-Pill'],
  },
  {
    id: 'COMP-17',
    name: '오프라인 인디케이터 바 (Offline Bar)',
    enName: 'OfflineIndicatorBar',
    category: 'indicator',
    categoryLabel: '뱃지 및 인디케이터',
    usedScreens: [
      { id: 'PG-USR-08', name: '오프라인 큐 관리' },
      { id: 'PG-USR-06', name: '뷰어 오프라인 캐시' },
      { id: 'PG-AGN-06', name: '로컬 스냅샷 복구실' },
    ],
    description: '네트워크 단절 또는 IndexedDB 로컬 큐에 보관 중인 변경 건수를 경고색 펄스와 함께 알림.',
    sampleCode: `<div className="w-full px-4 py-2 bg-amber-500/10 border-b border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs flex items-center justify-between select-text">\n  <span className="flex items-center gap-2">⚠️ 현재 오프라인 모드입니다. 변경사항이 로컬 큐에 안전하게 저장됩니다. (대기: 3건)</span>\n  <button className="underline font-semibold">동기화 시도</button>\n</div>`,
    tokenRules: ['amber 시맨틱 경고', 'w-full 인라인 상단 부착', '44px 최소 터치 액션'],
  },
  {
    id: 'COMP-18',
    name: '인라인 시맨틱 피드백 배너 (Banner)',
    enName: 'InlineSemanticBanner',
    category: 'indicator',
    categoryLabel: '뱃지 및 인디케이터',
    usedScreens: [
      { id: 'PG-USR-03', name: '홈 알림 배너' },
      { id: 'PG-ADM-08', name: '시스템 긴급 공지' },
      { id: 'PG-AGN-03', name: '토큰 소진 알림' },
    ],
    description: '작업 결과 피드백이나 중요 경고를 4대 시맨틱 컬러와 닫기 액션 버튼으로 표현.',
    sampleCode: `<div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/30 flex items-start justify-between gap-3 select-text">\n  <div className="flex items-center gap-2 text-xs text-blue-800 dark:text-blue-300">\n    <Info className="w-4 h-4 shrink-0" />\n    <span>PDF 텍스트 레이어 OCR 추출 작업이 백그라운드에서 완료되었습니다.</span>\n  </div>\n  <button className="text-blue-500 hover:text-blue-700"><X className="w-3.5 h-3.5" /></button>\n</div>`,
    tokenRules: ['rounded-xl (Zero-Pill)', '4대 시맨틱 팔레트', 'X 닫기 버튼 연동'],
  },

  // 5. 고급 인터랙션 분자 (4종)
  {
    id: 'COMP-19',
    name: '카테고리 트리 (드래그 앵커 & 인라인 수정)',
    enName: 'DraggableCategoryTree',
    category: 'interaction',
    categoryLabel: '고급 인터랙션 분자',
    usedScreens: [
      { id: 'PG-USR-05', name: '문서 카테고리 관리' },
      { id: 'PG-ADM-06', name: '메뉴 계층 트리뷰' },
      { id: 'PG-ADM-02', name: '프로그램 DAG 의존성' },
    ],
    description: '드래그 핸들로 항목 위치 이동 시 타겟 앵커선 표시, 인라인 이름 수정 모드, 계층 접힘/펼침 완비.',
    sampleCode: `<div className="space-y-1.5 select-text">\n  <div className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-500 transition-colors">\n    <GripVertical className="w-4 h-4 text-slate-400 cursor-grab" />\n    <Folder className="w-4 h-4 text-blue-500" />\n    <span className="text-xs font-medium text-slate-800 dark:text-slate-200 flex-1">법률·계약 전자문서 (8)</span>\n    <button className="text-xs text-slate-400 hover:text-blue-500">수정</button>\n  </div>\n  {/* 드롭 타겟 앵커선 표시: h-0.5 bg-blue-500 rounded */}\n</div>`,
    tokenRules: ['cursor-grab 핸들', '타겟 앵커선 시각 피드백', '인라인 폼 전환'],
  },
  {
    id: 'COMP-20',
    name: '프로필 아바타 (수정 옵션)',
    enName: 'ProfileAvatarEditable',
    category: 'interaction',
    categoryLabel: '고급 인터랙션 분자',
    usedScreens: [
      { id: 'PG-USR-04', name: '프로필 사진 변경' },
      { id: 'PG-USR-07', name: '협업 참여자 아바타' },
      { id: 'PG-ADM-03', name: '사용자 상세 사진' },
    ],
    description: '이미지/이니셜 표시, 호버 시 연필 수정 오버레이 및 HTML5 Canvas 크롭 모달 트리거 지원.',
    sampleCode: `<div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-slate-300 dark:border-slate-700 group select-text">\n  <img src="/avatar.jpg" alt="프로필" className="w-full h-full object-cover" />\n  <button type="button" className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium cursor-pointer">\n    <Pencil className="w-4 h-4" />\n  </button>\n</div>`,
    tokenRules: ['rounded-2xl (Zero-Pill 사각 둥글기)', 'group-hover 오버레이', 'Pencil 수정 아이콘'],
  },
  {
    id: 'COMP-21',
    name: '수평 진행상태 스테퍼 (Stepper)',
    enName: 'HorizontalStatusStepper',
    category: 'interaction',
    categoryLabel: '고급 인터랙션 분자',
    usedScreens: [
      { id: 'PG-USR-02', name: '4단계 가입 위저드' },
      { id: 'PG-USR-08', name: '3-Way 머지 3단계' },
      { id: 'PG-SET-01', name: 'OCR 엔진 설치 마법사' },
    ],
    description: '완료(체크), 현재 진행 중(펄스), 대기(회색) 단계와 연결 바를 수평으로 시각화한 상태 스테퍼.',
    sampleCode: `<div className="flex items-center justify-between w-full select-text">\n  <div className="flex items-center gap-2">\n    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold">1</div>\n    <span className="text-xs font-semibold">약관동의</span>\n  </div>\n  <div className="flex-1 h-0.5 bg-blue-600 mx-3" />\n  <div className="flex items-center gap-2 opacity-50">\n    <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center text-xs">2</div>\n    <span className="text-xs">계정입력</span>\n  </div>\n</div>`,
    tokenRules: ['rounded-lg 스텝 배지 (Zero-Pill)', 'h-0.5 연결 진행선', '반응형 라벨'],
  },
  {
    id: 'COMP-22',
    name: '슬라이드 드래그휠 (이벤트 격리 & 스크롤 폴백)',
    enName: 'SlideDragWheel',
    category: 'interaction',
    categoryLabel: '고급 인터랙션 분자',
    usedScreens: [
      { id: 'PG-USR-01', name: '롤링 썸네일 캐러셀' },
      { id: 'PG-USR-06', name: '뷰어 하단 툴 프리셋' },
      { id: 'PG-ADM-14', name: '글꼴 미리보기 캐러셀' },
    ],
    description: '가로 휠 스크롤 컨테이너. 내부에서는 상하 스크롤 전파를 차단하되, 첫/끝 경계 도달 시 상하 화면 스크롤 허용.',
    sampleCode: `<div className="w-full overflow-x-auto flex items-center gap-3 py-2 scrollbar-none select-text"\n  onWheel={(e) => {\n    const atLeft = e.currentTarget.scrollLeft === 0 && e.deltaY < 0;\n    const atRight = e.currentTarget.scrollLeft + e.currentTarget.clientWidth >= e.currentTarget.scrollWidth && e.deltaY > 0;\n    if (!atLeft && !atRight) {\n      e.stopPropagation();\n      e.currentTarget.scrollLeft += e.deltaY;\n    }\n  }}>\n  <div className="shrink-0 w-36 h-20 rounded-xl bg-slate-100 dark:bg-slate-800 border flex items-center justify-center text-xs">카드 1</div>\n</div>`,
    tokenRules: ['stopPropagation 이벤트 격리', '첫/끝 경계 화면 스크롤 폴백', 'Zero-Pill'],
  },

  // 6. 팝오버 및 오버레이 (4종)
  {
    id: 'COMP-23',
    name: '롱프레스 툴팁 & 클립보드 원클릭 복사',
    enName: 'LongPressTooltipCopy',
    category: 'overlay',
    categoryLabel: '팝오버 및 오버레이',
    usedScreens: [
      { id: 'PG-USR-07', name: '공유 링크 복사' },
      { id: 'PG-ADM-09', name: 'API Key 원클릭 복사' },
      { id: 'PG-AGN-02', name: 'Trace ID 복사' },
    ],
    description: '호버/터치 롱프레스 시 안내 툴팁 노출, 클릭 시 즉시 클립보드에 복사되고 "복사됨!" 피드백 표시.',
    sampleCode: `<button type="button" onClick={() => navigator.clipboard.writeText("https://pdfrend.com/s/7x9Q")}\n  className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono flex items-center gap-1.5 hover:border-blue-500 select-text">\n  <Copy className="w-3.5 h-3.5 text-slate-400" />\n  <span>https://pdfrend.com/s/7x9Q</span>\n</button>`,
    tokenRules: ['navigator.clipboard 복사', '1.5초 복사됨 토스트 피드백', 'Zero-Pill'],
  },
  {
    id: 'COMP-24',
    name: '? 안내 팝업 레이어 (Info Popover)',
    enName: 'InfoHelpPopoverLayer',
    category: 'overlay',
    categoryLabel: '팝오버 및 오버레이',
    usedScreens: [
      { id: 'PG-USR-04', name: '2FA 복구코드 안내' },
      { id: 'PG-ADM-01', name: 'IP 서브넷 규칙 도움말' },
      { id: 'PG-SET-02', name: '워터마크 투명도 도움말' },
    ],
    description: 'HelpCircle (?) 아이콘 클릭/호버 시 상세한 설명과 가이드라인을 제공하는 컨텍스트 팝오버.',
    sampleCode: `<div className="relative inline-block select-text">\n  <button type="button" className="text-slate-400 hover:text-blue-500"><HelpCircle className="w-4 h-4" /></button>\n  <div className="absolute left-6 top-0 w-64 p-3 rounded-xl shadow-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs z-50">\n    보안 정책에 따라 5회 연속 인증 실패 시 15분간 접속이 차단됩니다.\n  </div>\n</div>`,
    tokenRules: ['rounded-xl 팝오버', 'shadow-xl 엘리베이션', 'z-50'],
  },
  {
    id: 'COMP-25',
    name: '모바일 바텀시트 모달 (Bottom Sheet)',
    enName: 'MobileBottomSheetModal',
    category: 'overlay',
    categoryLabel: '팝오버 및 오버레이',
    usedScreens: [
      { id: 'PG-USR-05', name: '모바일 다운로드 포맷 선택' },
      { id: 'PG-USR-06', name: '모바일 주석 속성 시트' },
      { id: 'PG-ADM-11', name: '모바일 설정 서랍' },
    ],
    description: '모바일 화면 하단에서 슬라이드 업되는 인터랙티브 시트 (상단 핸들바, 제스처 닫기, 백드롭 블러).',
    sampleCode: `<div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex flex-col justify-end select-text">\n  <div className="w-full bg-white dark:bg-slate-900 rounded-t-2xl p-4 shadow-2xl border-t border-slate-200 dark:border-slate-800 animate-slideUp">\n    <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-3" />\n    <h3 className="text-sm font-bold mb-3">내보내기 옵션 선택</h3>\n  </div>\n</div>`,
    tokenRules: ['rounded-t-2xl 상단 라운딩', '슬라이드업 애니메이션', '백드롭 블러'],
  },
  {
    id: 'COMP-26',
    name: '플로팅 상태 피드백 토스트 (Toast)',
    enName: 'FloatingToastFeedbackLayer',
    category: 'overlay',
    categoryLabel: '팝오버 및 오버레이',
    usedScreens: [
      { id: 'PG-USR-04', name: '정보 수정 저장 완료' },
      { id: 'PG-ADM-04', name: '약관 저장 완료' },
      { id: 'PG-AGN-06', name: '긴급 Push 성공 피드백' },
    ],
    description: '화면 우하단/상단에 일시적으로 노출된 후 3초 뒤 페이드아웃되는 가벼운 상태 알림 토스트.',
    sampleCode: `<div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xl border text-xs font-medium animate-fadeIn select-text">\n  <CheckCircle className="w-4 h-4 text-emerald-400" />\n  <span>설정 변경사항이 성공적으로 저장되었습니다.</span>\n</div>`,
    tokenRules: ['fixed z-50', '3초 자동 소멸', 'Zero-Pill (rounded-xl)'],
  },

  // 7. 컨테이너 & 도크 (4종)
  {
    id: 'COMP-27',
    name: 'Bento 플랫 카드 컨테이너',
    enName: 'BentoCardContainer',
    category: 'container',
    categoryLabel: '컨테이너 & 도크',
    usedScreens: [
      { id: 'PG-USR-03', name: '홈 도구 Bento 그리드' },
      { id: 'PG-ADM-01', name: '보안 메트릭스 카드' },
      { id: 'PG-AGN-03', name: '토큰 쿼터 Bento 요약' },
    ],
    description: '최신 웹 디자인 트렌드인 비대칭 모듈러 Bento 그리드 기반 카드 (호버 발광, 은은한 하이라이트 보더).',
    sampleCode: `<div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md shadow-lg hover:border-blue-500/50 transition-all select-text">\n  <div className="flex items-center justify-between mb-2">\n    <span className="text-xs font-bold text-slate-500">스토리지 사용량</span>\n    <Badge variant="primary">72%</Badge>\n  </div>\n  <div className="text-2xl font-black text-slate-900 dark:text-white">14.8 GB</div>\n</div>`,
    tokenRules: ['rounded-2xl', 'backdrop-blur-md', 'Zero-Pill 사각 둥글기'],
  },
  {
    id: 'COMP-28',
    name: '반응형 라벨·금액 분리 표시 Row',
    enName: 'ResponsiveLabelValueRow',
    category: 'container',
    categoryLabel: '컨테이너 & 도크',
    usedScreens: [
      { id: 'PG-USR-04', name: '구독 플랜 요금제' },
      { id: 'PG-USR-08', name: '파일 크기/변경량 표시' },
      { id: 'PG-ADM-03', name: '사용자별 스토리지 요율' },
    ],
    description: '가로 화면에서는 좌우 정렬(1행), 모바일 등 협소 화면에서는 2행으로 깔끔하게 줄바꿈 분리되는 행 레이아웃.',
    sampleCode: `<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 select-text">\n  <span className="text-xs text-slate-500 dark:text-slate-400">월간 프리미엄 OCR 토큰</span>\n  <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">₩ 12,000 / 월</span>\n</div>`,
    tokenRules: ['flex-col sm:flex-row 반응형', '텍스트 분리 정렬', '44px 최소 높이'],
  },
  {
    id: 'COMP-29',
    name: '플로팅 빠른등록 도크 (Quick Dock)',
    enName: 'FloatingQuickDock',
    category: 'container',
    categoryLabel: '컨테이너 & 도크',
    usedScreens: [
      { id: 'PG-USR-05', name: '빠른 PDF 업로드 도크' },
      { id: 'PG-USR-06', name: '뷰어 퀵 주석 도크' },
      { id: 'PG-ADM-07', name: '로그 필터 플로팅 바' },
    ],
    description: '우하단에 플로팅되어 빠른 작업 추가 모달이나 액션 팝업을 트리거하는 도크 컴포넌트.',
    sampleCode: `<div className="fixed bottom-6 right-6 z-40 flex items-center gap-2 p-1.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 shadow-2xl backdrop-blur-md select-text">\n  <button className="h-10 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md">\n    <Plus className="w-4 h-4" />\n    <span>문서 추가</span>\n  </button>\n</div>`,
    tokenRules: ['fixed bottom-6 right-6 z-40', 'rounded-2xl 도크', 'Zero-Pill'],
  },
  {
    id: 'COMP-30',
    name: '모바일 하단 네비게이션바 (Bottom Bar)',
    enName: 'MobileBottomNavbar',
    category: 'container',
    categoryLabel: '컨테이너 & 도크',
    usedScreens: [
      { id: 'PG-USR-01', name: '모바일 메인 탭바' },
      { id: 'PG-USR-03', name: '모바일 홈 탭바' },
      { id: 'PG-USR-05', name: '모바일 라이브러리 바' },
    ],
    description: '모바일 뷰포트에서 엄지손가락 터치 영역을 완벽하게 만족하는 5대 메뉴 하단 고정 네비게이션 바.',
    sampleCode: `<nav className="fixed bottom-0 inset-x-0 h-16 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 grid grid-cols-5 items-center px-1 z-40 select-text md:hidden">\n  <button className="flex flex-col items-center justify-center gap-1 text-[10px] text-blue-600 font-semibold">\n    <Home className="w-5 h-5" /> <span>홈</span>\n  </button>\n</nav>`,
    tokenRules: ['h-16 (64px) 엄지손가락 터치영역', 'grid grid-cols-5', 'md:hidden 모바일 전용'],
  },
];

export function getComponentViewportCondition(comp: StandardComponentMeta): string {
  if (comp.viewportCondition) return comp.viewportCondition;
  if (comp.id === 'COMP-25') return '📱 모바일 특화 (바텀시트 슬라이드업)';
  if (comp.id === 'COMP-30') return '📱 모바일 전용 (하단 네비게이션바)';
  if (comp.id === 'COMP-28') return '🖥️ PC 1행 분리 / 📱 모바일 2행 분리';
  if (comp.id === 'COMP-02') return '🖥️ PC 3단 그리드 / 📱 모바일 1단 스택';
  if (comp.id === 'COMP-29') return '🖥️ PC 우하단 플로팅 / 📱 모바일 도크';
  return '🖥️ PC/태블릿 · 📱 모바일 반응형';
}
