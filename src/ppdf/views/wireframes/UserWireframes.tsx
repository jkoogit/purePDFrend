import { useState } from 'react';
import { ViewerConfigRegistry, ViewerConfigState } from '../../domain/ViewerConfigRegistry';

export const USER_PROGRAMS = [
  { id: 'PG-USR-01', name: '첫화면 (랜딩)', desc: '공개 문서조회 바, 롤링배너, 공지/리뷰/가이드 탭, 고객센터 푸터' },
  { id: 'PG-USR-02', name: '로그인 / 회원가입', desc: 'ID/PW + 소셜/이메일 2FA 탭 전환, 회원가입 프로필 및 약관동의' },
  { id: 'PG-USR-03', name: '홈화면 (대시보드)', desc: '관리자/에이전트 이동 아이콘, 프로필 위젯, 7대 PDF 핵심도구 퀵 그리드' },
  { id: 'PG-USR-04', name: '마이페이지 > 사용자관리', desc: '비밀번호 변경, 2FA 소셜/이메일 탭 설정, 프로필 이미지/닉네임 수정' },
  { id: 'PG-USR-05', name: '문서관리 (라이브러리)', desc: '8대 상세필터, 문서등록(PDF/이미지), 4종 다운로드 모달, 주석 내보내기/불러오기' },
  { id: 'PG-USR-06', name: '문서뷰어 & 주석스튜디오', desc: '단일줄 툴바+가로 슬라이더, 툴바 순서설정 팝업, 8대 모드, 3단계 주석 이벤트' },
  { id: 'PG-USR-07', name: '문서공유 및 협업작업뷰', desc: '공유권한(읽기/열람자쓰기/관리자) 설정, 동시접속자 목록, 실시간 이벤트 피드' },
  { id: 'PG-USR-08', name: '오프라인 모드 & 충돌머지', desc: '오프라인 감지, 수동 즉시재연결 버튼, 로컬 큐, Last-Write-Wins & diff 머지' },
  { id: 'PG-USR-09', name: '정밀 사용자 환경설정', desc: '단축키설정(PC/태블릿), 도구그룹설정(그룹간 중복허용/초기화), 뷰어/테마옵션' },
];

export function UserWireframes() {
  const [selectedProg, setSelectedProg] = useState('PG-USR-06');

  // Viewer Config Registry
  const registry = ViewerConfigRegistry.getInstance();
  const [viewerConfig, setViewerConfig] = useState<ViewerConfigState>(() => registry.getConfig());
  const [activeGroup, setActiveGroup] = useState('annot');

  // PG-USR-06 Viewer Toolbar state
  const [isToolbarModalOpen, setIsToolbarModalOpen] = useState(false);
  const [activeViewerTab, setActiveViewerTab] = useState<'bookmarks' | 'toc' | 'annots'>('toc');
  const [currentTool, setCurrentTool] = useState('pen');

  // PG-USR-08 Offline state
  const [isOfflineSimulated, setIsOfflineSimulated] = useState(true);
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);

  // PG-USR-09 Settings state
  const [settingsTab, setSettingsTab] = useState<'general' | 'shortcuts' | 'groups'>('groups');
  const [targetGroupForAdd, setTargetGroupForAdd] = useState('annot');
  const [selectedToolToAdd, setSelectedToolToAdd] = useState('rect');

  const handleResetConfig = () => {
    const fresh = registry.resetToDefault();
    setViewerConfig(fresh);
  };

  const handleAddToolToGroup = () => {
    const updated = registry.addToolToGroup(targetGroupForAdd, selectedToolToAdd);
    setViewerConfig(updated);
  };

  const handleRemoveToolFromGroup = (grp: string, idx: number) => {
    const updated = registry.removeToolFromGroup(grp, idx);
    setViewerConfig(updated);
  };

  const handleMoveTool = (grp: string, fromIdx: number, toIdx: number) => {
    const updated = registry.reorderTools(grp, fromIdx, toIdx);
    setViewerConfig(updated);
  };

  const handleShortcutChange = (toolId: string, val: string) => {
    const updated = registry.updateShortcut(toolId, val);
    setViewerConfig(updated);
  };

  const activeTools = registry.getToolsForGroup(activeGroup);

  return (
    <div className="space-y-6">
      {/* 9대 사용자 프로그램 선택 칩 바 */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-lg">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs text-slate-400">
          <span className="font-semibold text-sky-400">9대 사용자 핵심 서비스 화면 (User Portal Modules)</span>
          <span>선택: <strong className="text-white">{selectedProg}</strong></span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {USER_PROGRAMS.map((p) => {
            const active = p.id === selectedProg;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedProg(p.id)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 ${
                  active
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span className="opacity-75">{p.id}</span>
                <span className="font-sans font-medium">{p.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 메인 와이어프레임 캔버스 */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-6 min-h-[540px]">
        {/* 헤더 정보 */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-xs font-mono bg-sky-500/20 text-sky-400 border border-sky-500/30">
                {selectedProg}
              </span>
              <h2 className="text-lg font-bold text-white">
                {USER_PROGRAMS.find((p) => p.id === selectedProg)?.name}
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {USER_PROGRAMS.find((p) => p.id === selectedProg)?.desc}
            </p>
          </div>
          <span className="text-xs px-2 py-1 bg-slate-800 text-slate-300 rounded font-mono">
            /user/{selectedProg.toLowerCase().replace('pg-usr-', '')}
          </span>
        </div>

        {/* PG-USR-01: 첫화면 (랜딩) */}
        {selectedProg === 'PG-USR-01' && (
          <div className="space-y-5 text-xs">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
              <span className="font-bold text-white text-sm">purePDFrend</span>
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-slate-800 text-slate-200 rounded">공개 읽기모드 뷰어</button>
                <button className="px-3 py-1 bg-sky-600 text-white rounded font-medium">로그인 / 회원가입</button>
              </div>
            </div>

            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
              <span className="text-slate-400 font-medium">🔍 공개 열람 문서 조회 바</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="문서 고유번호(DOC-xxxx) 또는 공유 링크를 입력하세요..."
                  className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200"
                />
                <button className="px-4 py-1.5 bg-indigo-600 text-white rounded font-medium">열람</button>
              </div>
            </div>

            <div className="h-28 bg-gradient-to-r from-sky-950/50 to-indigo-950/50 border border-sky-900/30 rounded-xl flex items-center justify-center text-slate-300">
              🎠 중앙 롤링 이벤트 배너 슬라이더 (관리자 배너관리 시스템 연동)
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <div className="flex gap-4 border-b border-slate-800 pb-2 text-slate-400 font-medium">
                <span className="text-sky-400 border-b-2 border-sky-400 pb-1">공지사항</span>
                <span>사용자 리뷰</span>
                <span>단계별 이용 가이드</span>
              </div>
              <div className="pt-2 text-slate-500">[공지] purePDFrend 3대 도메인 및 오프라인 주석 동기화 v2.0 정식 런칭 안내</div>
            </div>
          </div>
        )}

        {/* PG-USR-03: 홈화면 (대시보드 및 7대 PDF 도구) */}
        {selectedProg === 'PG-USR-03' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-600/40 border border-indigo-500/50 flex items-center justify-center font-bold text-white">
                  JK
                </div>
                <div>
                  <div className="text-sm font-bold text-white">jkok2j2m (시스템관리자)</div>
                  <div className="text-xs text-slate-400 font-mono">ROLE_SYSADMIN · .env 인증 완료</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="px-2.5 py-1 bg-purple-600/20 text-purple-300 border border-purple-500/30 rounded text-xs flex items-center gap-1">
                  🤖 에이전트 서비스
                </button>
                <button className="px-2.5 py-1 bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 rounded text-xs flex items-center gap-1">
                  🛠 관리자 서비스
                </button>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-400 block mb-2">
                ⚡ 7대 PDF 핵심 문서 도구 (Quick Action Grid)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {[
                  { name: '1. 카메라 문서스캔', icon: '📷', desc: '실물 촬영 후 PDF 즉시 추가' },
                  { name: '2. 이미지 ➔ PDF', icon: '🖼', desc: '다중 이미지 병합 변환' },
                  { name: '3. PDF OCR', icon: '🔤', desc: '투명 텍스트 레이어 생성' },
                  { name: '4. PDF OCR ➔ TEXT', icon: '📝', desc: '텍스트 추출 및 .txt 다운로드' },
                  { name: '5. PDF 문서관리', icon: '📑', desc: '병합/추출/순서재배열/삭제' },
                  { name: '6. PDF 압축', icon: '🗜', desc: '이미지 최적화 및 용량 축소' },
                  { name: '7. PDF 보안', icon: '🔒', desc: '비밀번호 및 권한 암호화' },
                ].map((tool) => (
                  <div
                    key={tool.name}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-xl hover:border-sky-500/50 transition-all cursor-pointer group"
                  >
                    <div className="text-xl mb-1.5">{tool.icon}</div>
                    <div className="font-semibold text-slate-200 group-hover:text-sky-400">{tool.name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{tool.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PG-USR-05: 문서관리 (라이브러리) */}
        {selectedProg === 'PG-USR-05' && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <span className="text-slate-400 font-semibold">🔍 8대 상세 검색 필터 바</span>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <select className="bg-slate-900 border border-slate-700 rounded p-1.5 text-slate-200">
                  <option>문서구분: 전체</option>
                  <option>등록문서</option>
                  <option>내가 공유한 문서</option>
                  <option>공유받은 문서</option>
                </select>
                <input type="text" placeholder="문서명 / 등록자" className="bg-slate-900 border border-slate-700 rounded p-1.5 text-slate-200" />
                <input type="text" placeholder="출판사 / 저자 / 역자" className="bg-slate-900 border border-slate-700 rounded p-1.5 text-slate-200" />
                <input type="text" placeholder="ISBN 번호" className="bg-slate-900 border border-slate-700 rounded p-1.5 text-slate-200" />
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-sky-600 text-white rounded">+ PDF/이미지 신규 등록</button>
                <button className="px-3 py-1 bg-slate-800 text-slate-300 rounded">주석 불러오기 (.json/.xfdf)</button>
              </div>
              <div className="flex gap-1 text-[11px] text-slate-400">
                <button className="px-2 py-0.5 bg-slate-800 text-white rounded">카드뷰</button>
                <button className="px-2 py-0.5 bg-slate-900 text-slate-500 rounded">테이블뷰</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { title: 'ISO 32000-2 표준 가이드북', pages: 840, version: 'v1.4', hash: 'e3b0c442...855', round: '2회독 진행중' },
                { title: 'TDD 및 도메인 주도 설계 핸드북', pages: 320, version: 'v2.0', hash: 'a1f89bc2...112', round: '완독 (3회독)' },
              ].map((doc) => (
                <div key={doc.title} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-white text-sm">{doc.title}</span>
                    <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 rounded text-[11px] font-mono">{doc.round}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex gap-3 font-mono">
                    <span>{doc.pages} 쪽</span>
                    <span>버전 {doc.version}</span>
                    <span>해시: {doc.hash}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                    <span className="text-slate-500 text-[11px]">4종 다운로드: 원본 / 주석 / 최종본 / 보안압축</span>
                    <button className="px-2.5 py-1 bg-sky-600/30 text-sky-300 rounded hover:bg-sky-600/50">뷰어로 열기 ➔</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PG-USR-06: 문서뷰어 & 주석 스튜디오 (단일줄 툴바 + 가로 슬라이더 + 순서설정 팝업) */}
        {selectedProg === 'PG-USR-06' && (
          <div className="space-y-3">
            {/* 8대 뷰어 모드 그룹 전환 칩 바 (모바일/PC 지원) */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs pb-1">
              {[
                { id: 'annot', name: '주석달기' },
                { id: 'draw', name: '그리기' },
                { id: 'sign', name: '작성및서명' },
                { id: 'view', name: '보기' },
                { id: 'favorite', name: '즐겨찾기' },
                { id: 'insert', name: '삽입' },
                { id: 'convert', name: '변환' },
                { id: 'form', name: '양식준비' },
              ].map((grp) => {
                const active = grp.id === activeGroup;
                return (
                  <button
                    key={grp.id}
                    onClick={() => setActiveGroup(grp.id)}
                    className={`shrink-0 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                      active
                        ? 'bg-sky-600 text-white font-bold shadow-sm'
                        : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {grp.name} ({registry.getToolsForGroup(grp.id).length})
                  </button>
                );
              })}
            </div>

            {/* 단일줄 상단 툴바 + 가로 슬라이더 (ERR-04 보완) */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-2 flex items-center gap-2 overflow-hidden shadow-inner">
              <button className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded text-slate-400 shrink-0" title="뒤로가기">
                ◀
              </button>
              <div className="font-bold text-slate-200 text-xs shrink-0 max-w-[120px] truncate" title="ISO 32000-2 표준 가이드북">
                ISO 32000-2...
              </div>

              {/* 가로 스크롤 스냅 슬라이더 (아이콘 전용, 텍스트 생략, 사용자 설정 및 중복 도구 인메모리 반영) */}
              <div className="flex-1 flex gap-1.5 overflow-x-auto no-scrollbar scroll-smooth px-1">
                {activeTools.map((item, idx) => (
                  <button
                    key={`${item.id}-${idx}`}
                    onClick={() => setCurrentTool(item.id)}
                    title={`${item.name} (${viewerConfig.shortcuts[item.id] || item.defaultKey})`}
                    className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all relative ${
                      currentTool === item.id
                        ? 'bg-sky-600 text-white shadow-md shadow-sky-600/50 ring-2 ring-sky-400/50'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span>{item.icon}</span>
                  </button>
                ))}
              </div>

              {/* 툴바 순서 설정 팝업 버튼 (⚙) */}
              <button
                onClick={() => setIsToolbarModalOpen(true)}
                className="p-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 rounded text-xs shrink-0 flex items-center gap-1"
                title="툴바 순서 및 그룹 설정 팝업"
              >
                <span>⚙</span>
                <span className="hidden sm:inline text-[11px]">순서설정</span>
              </button>

              <button className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded text-slate-400 shrink-0 text-xs" title="더보기">
                ⋮
              </button>
            </div>

            {/* 뷰어 메인 워크스페이스: 좌측 드로어 + 중앙 캔버스 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 h-[380px]">
              {/* 좌측 패널 (북마크 / 목차 / 주석) */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col text-xs">
                <div className="flex border-b border-slate-800 pb-2 mb-2 gap-2 text-slate-400">
                  <button
                    onClick={() => setActiveViewerTab('bookmarks')}
                    className={`pb-1 ${activeViewerTab === 'bookmarks' ? 'text-sky-400 border-b-2 border-sky-400 font-bold' : ''}`}
                  >
                    북마크
                  </button>
                  <button
                    onClick={() => setActiveViewerTab('toc')}
                    className={`pb-1 ${activeViewerTab === 'toc' ? 'text-sky-400 border-b-2 border-sky-400 font-bold' : ''}`}
                  >
                    목차(TOC)
                  </button>
                  <button
                    onClick={() => setActiveViewerTab('annots')}
                    className={`pb-1 ${activeViewerTab === 'annots' ? 'text-sky-400 border-b-2 border-sky-400 font-bold' : ''}`}
                  >
                    주석(42)
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-1.5 text-slate-300 font-mono text-[11px]">
                  {activeViewerTab === 'toc' && (
                    <>
                      <div className="p-1.5 bg-slate-900 rounded text-sky-300">1. 개요 및 스코프 (p.1)</div>
                      <div className="pl-3 p-1.5 hover:bg-slate-900/50 rounded">1.1 아키텍처 원칙 (p.4)</div>
                      <div className="pl-3 p-1.5 hover:bg-slate-900/50 rounded">1.2 무결성 락 체계 (p.12)</div>
                      <div className="p-1.5 hover:bg-slate-900/50 rounded">2. PDF 주석 표준 사양 (p.45)</div>
                    </>
                  )}
                  {activeViewerTab === 'annots' && (
                    <div className="space-y-1">
                      <div className="p-1.5 bg-slate-900 rounded border-l-2 border-sky-400">
                        <span className="text-[10px] text-slate-500">p.14 | 형광펜 (jkok2j2m)</span>
                        <div className="text-slate-200">"하이브리드 아키텍처 설계 원칙"</div>
                      </div>
                    </div>
                  )}
                  {activeViewerTab === 'bookmarks' && (
                    <div className="text-slate-500 text-center py-4">등록된 북마크 0건</div>
                  )}
                </div>
              </div>

              {/* 중앙 PDF 페이지 캔버스 & 3단계 인터랙션 메뉴 프리뷰 */}
              <div className="md:col-span-3 bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
                {/* 3단계 인터랙션 플로팅 툴팁 (시각적 프리뷰) */}
                <div className="p-2 bg-slate-900/95 border border-sky-500/40 rounded-lg shadow-xl flex items-center gap-2 text-xs mb-2">
                  <span className="text-sky-400 font-semibold">1단계: OCR 텍스트 선택 툴팁 ➔</span>
                  <div className="flex gap-1">
                    <button className="px-2 py-0.5 bg-yellow-500/20 text-yellow-300 rounded text-[11px]">강조</button>
                    <button className="px-2 py-0.5 bg-sky-500/20 text-sky-300 rounded text-[11px]">밑줄</button>
                    <button className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[11px]">복사</button>
                    <button className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[11px]">번역</button>
                  </div>
                </div>

                {/* 본문 캔버스 영역 */}
                <div className="flex-1 bg-white text-slate-900 p-6 rounded-lg shadow-inner flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-1/3" />
                    <div className="h-3 bg-slate-100 rounded w-full" />
                    <div className="h-3 bg-yellow-200/80 rounded w-4/5 text-[11px] text-slate-800 px-1 font-serif">
                      * 선택된 텍스트: "네트워크 단절 시에도 뷰어와 로컬 주석 이벤트 큐는 연속 실행된다."
                    </div>
                    <div className="h-3 bg-slate-100 rounded w-full" />
                    <div className="h-3 bg-slate-100 rounded w-2/3" />
                  </div>
                  <div className="text-center text-slate-400 text-[11px] font-mono">
                    - Page 14 of 482 -
                  </div>
                </div>

                {/* 하단 스크롤 앵커 및 페이지 네비게이터 */}
                <div className="mt-2 pt-2 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
                  <span>스크롤 앵커 가이드라인 활성</span>
                  <div className="flex items-center gap-2">
                    <button className="px-2 py-0.5 bg-slate-900 rounded">이전</button>
                    <span className="font-mono text-white">14 / 482</span>
                    <button className="px-2 py-0.5 bg-slate-900 rounded">다음</button>
                  </div>
                </div>
              </div>
            </div>

            {/* 툴바 순서 설정 팝업 (모달) */}
            {isToolbarModalOpen && (
              <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                      <span>⚙ 뷰어 툴바 순서 및 사용자 설정</span>
                      <span className="text-xs px-2 py-0.5 bg-sky-500/20 text-sky-400 rounded">User Custom</span>
                    </h3>
                    <button onClick={() => setIsToolbarModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
                  </div>
                  <p className="text-xs text-slate-400">
                    툴바 아이콘의 공식 명칭과 단축키를 확인하고, 그룹 내 순서를 변경하거나 자주 쓰지 않는 도구를 숨길 수 있습니다.
                  </p>
                  <div className="space-y-2 max-h-60 overflow-y-auto text-xs pr-1">
                    {activeTools.map((item, idx) => (
                      <div key={`${item.id}-${idx}`} className="p-2 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2.5 truncate">
                          <span className="text-slate-500 font-mono text-[11px] w-4">{idx + 1}</span>
                          <span className="text-base">{item.icon}</span>
                          <div className="truncate">
                            <div className="text-slate-200 font-medium truncate">{item.name}</div>
                            <div className="text-[10px] text-amber-300/80 font-mono">단축키: {viewerConfig.shortcuts[item.id] || item.defaultKey}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {idx > 0 && (
                            <button
                              onClick={() => handleMoveTool(activeGroup, idx, idx - 1)}
                              className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px]"
                              title="위로 이동"
                            >
                              ▲
                            </button>
                          )}
                          {idx < activeTools.length - 1 && (
                            <button
                              onClick={() => handleMoveTool(activeGroup, idx, idx + 1)}
                              className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px]"
                              title="아래로 이동"
                            >
                              ▼
                            </button>
                          )}
                          <button
                            onClick={() => handleRemoveToolFromGroup(activeGroup, idx)}
                            className="px-1.5 py-0.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded text-[11px]"
                            title="툴바에서 숨기기"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-xs">
                    <button
                      onClick={() => {
                        setIsToolbarModalOpen(false);
                        setSelectedProg('PG-USR-09');
                        setSettingsTab('groups');
                      }}
                      className="text-sky-400 hover:underline text-[11px]"
                    >
                      + 다른 그룹 도구 중복추가 (설정창 열기) ➔
                    </button>
                    <div className="flex gap-2">
                      <button onClick={handleResetConfig} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px]">
                        초기화 (Reset)
                      </button>
                      <button onClick={() => setIsToolbarModalOpen(false)} className="px-4 py-1.5 bg-sky-600 text-white rounded font-medium text-[11px]">
                        완료
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PG-USR-08: 오프라인 모드 & 충돌머지 (수동 즉시재연결 버튼 + diff 미리보기) */}
        {selectedProg === 'PG-USR-08' && (
          <div className="space-y-4 text-xs">
            {/* 오프라인 감지 상태바 및 수동 재연결 버튼 (ERR-05 보완) */}
            <div className={`p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 ${
              isOfflineSimulated
                ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
                : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-base">{isOfflineSimulated ? '📡' : '🌐'}</span>
                <div>
                  <span className="font-bold">
                    {isOfflineSimulated ? '현재 네트워크가 오프라인 상태입니다' : '현재 온라인 네트워크에 정상 연결되었습니다'}
                  </span>
                  <p className={`text-[11px] ${isOfflineSimulated ? 'text-amber-400/80' : 'text-emerald-400/80'}`}>
                    {isOfflineSimulated
                      ? '로컬 뷰어 작업(주석 이벤트 소싱)은 중단 없이 유지되며, 재연결 시 안전하게 동기화됩니다.'
                      : '모든 로컬 주석 및 변경 내역이 실시간 동기화됩니다.'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsOfflineSimulated(!isOfflineSimulated)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px]"
                >
                  {isOfflineSimulated ? '온라인 전환' : '오프라인 전환'}
                </button>
                <button
                  onClick={() => setIsDiffModalOpen(true)}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded font-semibold flex items-center gap-1 shadow"
                >
                  <span>🔄</span>
                  <span>지금 다시 연결 (수동)</span>
                </button>
              </div>
            </div>

            {/* 오프라인 로컬 이벤트 큐 현황 */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-200">📦 로컬 이벤트 소싱 큐 (IndexedDB 대기열: 3건)</span>
                <span className="text-[11px] text-emerald-400 font-mono">Draft Quarantine 보호 중</span>
              </div>
              <div className="space-y-2 font-mono text-[11px]">
                <div className="p-2 bg-slate-900 rounded flex justify-between items-center text-slate-300">
                  <span>1. [2026-09-27 06:40:12] ADD_ANNOTATION (p.14 형광펜)</span>
                  <span className="text-amber-400">로컬 대기</span>
                </div>
                <div className="p-2 bg-slate-900 rounded flex justify-between items-center text-slate-300">
                  <span>2. [2026-09-27 06:41:05] UPDATE_COMMENT (p.14 메모 추가)</span>
                  <span className="text-amber-400">로컬 대기</span>
                </div>
              </div>
            </div>

            {/* 충돌 diff 머지 모달 */}
            {isDiffModalOpen && (
              <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                      <span>⚠️ 주석 충돌(Conflict) 해결 및 diff 머지</span>
                      <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded font-mono">DOC-0091</span>
                    </h3>
                    <button onClick={() => setIsDiffModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
                  </div>
                  <p className="text-xs text-slate-300">
                    오프라인 작업 중 다른 사용자가 서버 문서를 수정하였습니다. 보존할 버전을 선택하거나 수동 diff를 병합하세요.
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
                      <span className="text-indigo-400 font-semibold">내 로컬 오프라인 작업본</span>
                      <div className="text-[11px] text-slate-400">최종수정: 06:41:05</div>
                      <div className="text-[11px] text-slate-300 p-1.5 bg-slate-900 rounded mt-1 font-mono">
                        + 주석 2건 추가 (형광펜, 메모)
                      </div>
                    </div>
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
                      <span className="text-emerald-400 font-semibold">원격 서버 최신본 (권장)</span>
                      <div className="text-[11px] text-slate-400">최종수정: 06:40:50 (Last-Write)</div>
                      <div className="text-[11px] text-slate-300 p-1.5 bg-slate-900 rounded mt-1 font-mono">
                        + 텍스트 레이어 교정 v2.1
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-800 text-xs">
                    <button onClick={() => setIsDiffModalOpen(false)} className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded">원격본 유지</button>
                    <button onClick={() => setIsDiffModalOpen(false)} className="px-4 py-1.5 bg-indigo-600 text-white rounded font-medium">로컬 변경 스마트 병합(Merge)</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PG-USR-09: 정밀 사용자 환경설정 (단축키설정 & 도구그룹설정) */}
        {selectedProg === 'PG-USR-09' && (
          <div className="space-y-4 text-xs">
            {/* 설정 탭 전환 바 */}
            <div className="flex border-b border-slate-800 pb-2 gap-3 text-slate-400">
              <button
                onClick={() => setSettingsTab('groups')}
                className={`pb-1 flex items-center gap-1.5 ${
                  settingsTab === 'groups' ? 'text-sky-400 border-b-2 border-sky-400 font-bold' : 'hover:text-slate-200'
                }`}
              >
                <span>🗂️ 도구그룹 설정 (모바일/전체)</span>
                <span className="text-[10px] px-1.5 py-0.5 bg-sky-500/20 rounded text-sky-300">그룹간 중복허용</span>
              </button>
              <button
                onClick={() => setSettingsTab('shortcuts')}
                className={`pb-1 flex items-center gap-1.5 ${
                  settingsTab === 'shortcuts' ? 'text-sky-400 border-b-2 border-sky-400 font-bold' : 'hover:text-slate-200'
                }`}
              >
                <span>⌨️ 단축키 설정 (PC·태블릿)</span>
              </button>
              <button
                onClick={() => setSettingsTab('general')}
                className={`pb-1 ${
                  settingsTab === 'general' ? 'text-sky-400 border-b-2 border-sky-400 font-bold' : 'hover:text-slate-200'
                }`}
              >
                <span>🎨 뷰어 및 테마 일반 옵션</span>
              </button>

              <button
                onClick={handleResetConfig}
                className="ml-auto px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded text-[11px] flex items-center gap-1 font-medium"
                title="기본 설정값으로 전체 초기화"
              >
                <span>↺</span>
                <span>설정 초기화 (Reset)</span>
              </button>
            </div>

            {/* 1. 도구그룹 설정 탭: 모바일 뷰어 8대 그룹 관리 & 그룹간 중복 추가 */}
            {settingsTab === 'groups' && (
              <div className="space-y-4">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-white text-sm">🗂️ 모바일·태블릿 문서뷰어 도구그룹 커스터마이징</span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        * 그리기에 있는 도구(예: 직사각형)를 주석달기 그룹에 <strong>'중복'</strong>으로 추가하거나, 자주 쓰는 순서대로 재배치할 수 있습니다.
                      </p>
                    </div>
                    {/* 그룹 간 중복 도구 추가 폼 */}
                    <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-lg border border-slate-800">
                      <span className="text-[11px] text-slate-400">대상 그룹:</span>
                      <select
                        value={targetGroupForAdd}
                        onChange={(e) => setTargetGroupForAdd(e.target.value)}
                        className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs"
                      >
                        <option value="annot">주석달기 (Annotate)</option>
                        <option value="draw">그리기 (Draw)</option>
                        <option value="sign">작성 및 서명 (Sign)</option>
                        <option value="view">보기 (View)</option>
                        <option value="convert">변환 (Convert)</option>
                        <option value="form">양식 준비 (Form)</option>
                        <option value="insert">삽입 (Insert)</option>
                        <option value="favorite">즐겨찾기 (Favorite)</option>
                      </select>
                      <span className="text-[11px] text-slate-400">추가할 도구:</span>
                      <select
                        value={selectedToolToAdd}
                        onChange={(e) => setSelectedToolToAdd(e.target.value)}
                        className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs"
                      >
                        {registry.getAllTools().map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.icon} {t.name} ({t.id})
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={handleAddToolToGroup}
                        className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded font-medium text-xs flex items-center gap-1 shadow"
                      >
                        <span>+</span>
                        <span>도구 추가</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 8대 그룹별 현재 편성 현황 그리드 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { id: 'annot', label: '주석달기 (Annotate)' },
                    { id: 'draw', label: '그리기 (Draw)' },
                    { id: 'sign', label: '작성 및 서명 (Sign)' },
                    { id: 'view', label: '보기 (View)' },
                    { id: 'favorite', label: '즐겨찾기 (Favorite)' },
                    { id: 'insert', label: '삽입 (Insert)' },
                    { id: 'convert', label: '변환 (Convert)' },
                    { id: 'form', label: '양식 준비 (Form)' },
                  ].map((grp) => {
                    const tools = registry.getToolsForGroup(grp.id);
                    return (
                      <div key={grp.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-center pb-1.5 border-b border-slate-800">
                            <span className="font-semibold text-slate-200">{grp.label}</span>
                            <span className="px-2 py-0.5 bg-slate-800 text-sky-400 rounded text-[10px] font-mono">
                              {tools.length}개 도구
                            </span>
                          </div>
                          <div className="space-y-1 mt-2 max-h-48 overflow-y-auto pr-1 no-scrollbar">
                            {tools.map((t, idx) => (
                              <div
                                key={`${grp.id}-${t.id}-${idx}`}
                                className="p-1.5 bg-slate-900/90 rounded border border-slate-800 flex items-center justify-between text-[11px]"
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  <span>{t.icon}</span>
                                  <span className="text-slate-300 truncate">{t.name}</span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  {idx > 0 && (
                                    <button
                                      onClick={() => handleMoveTool(grp.id, idx, idx - 1)}
                                      className="text-slate-500 hover:text-white"
                                      title="위로 이동"
                                    >
                                      ▲
                                    </button>
                                  )}
                                  {idx < tools.length - 1 && (
                                    <button
                                      onClick={() => handleMoveTool(grp.id, idx, idx + 1)}
                                      className="text-slate-500 hover:text-white"
                                      title="아래로 이동"
                                    >
                                      ▼
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleRemoveToolFromGroup(grp.id, idx)}
                                    className="text-rose-400 hover:text-rose-300 ml-1"
                                    title="제거"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 flex justify-between">
                          <span>메모리 & JSON 연동</span>
                          <span className="text-indigo-400">자동 저장됨</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. 단축키 설정 탭 (PC·태블릿용 키보드 매핑) */}
            {settingsTab === 'shortcuts' && (
              <div className="space-y-3">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white text-sm">⌨️ PC·태블릿 뷰어 키보드 단축키 커스텀 설정</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      각 도구별 단축키를 입력창에서 직접 수정할 수 있으며, 변경 즉시 뷰어 인메모리 레지스트리에 반영됩니다.
                    </p>
                  </div>
                  <span className="text-xs px-2.5 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded font-mono">
                    키보드 모드 활성
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[420px] overflow-y-auto pr-1">
                  {registry.getAllTools().map((t) => {
                    const currentKey = viewerConfig.shortcuts[t.id] || t.defaultKey;
                    return (
                      <div key={t.id} className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{t.icon}</span>
                          <div>
                            <div className="text-slate-200 font-medium">{t.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono">ID: {t.id}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={currentKey}
                            onChange={(e) => handleShortcutChange(t.id, e.target.value)}
                            className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center font-mono text-amber-300 text-xs font-bold"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. 일반 옵션 탭 */}
            {settingsTab === 'general' && (
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <span className="font-semibold text-slate-200">뷰어 보기 및 테마 일반 옵션</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex justify-between items-center">
                    <span>테마 모드</span>
                    <select className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200">
                      <option>다크 모드 (기본값)</option>
                      <option>라이트 모드</option>
                      <option>세피아 모드</option>
                    </select>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex justify-between items-center">
                    <span>초기 첫화면 지정</span>
                    <select className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200">
                      <option>홈 대시보드 (PG-USR-03)</option>
                      <option>문서관리 라이브러리 (PG-USR-05)</option>
                      <option>마지막 열람 문서 뷰어</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 기타 서브화면 프리뷰 안내 */}
        {['PG-USR-02', 'PG-USR-04', 'PG-USR-07'].includes(selectedProg) && (
          <div className="p-6 bg-slate-950/60 border border-slate-800 rounded-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-sm font-semibold text-slate-200">
                {USER_PROGRAMS.find((p) => p.id === selectedProg)?.name} 반응형 와이어프레임 구조
              </span>
              <span className="text-xs px-2.5 py-1 bg-sky-500/10 text-sky-400 rounded-full border border-sky-500/20">
                모바일·데스크톱 최적화
              </span>
            </div>
            <div className="h-44 bg-slate-900/50 rounded-xl border border-dashed border-slate-800 flex flex-col items-center justify-center text-slate-400 text-xs space-y-2">
              <span className="font-semibold text-white">[{selectedProg}] 반응형 레이아웃 프로토타입</span>
              <span className="text-[11px] text-slate-500 max-w-md text-center">
                모바일 환경에서는 1열 스택 카드 및 바텀시트로 자동 축소되며, 터치 타겟 최소 44px 및 가로 스크롤 차단 가드레일이 적용됩니다.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
