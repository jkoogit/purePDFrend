import { useState, useEffect } from 'react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  Sparkles,
  Database,
  X,
  HardDrive,
  Eye,
} from 'lucide-react';
import { ThemeMode, resolveThemeMode } from '../../styles/tokens';

export interface OfflineWorkDoc {
  docId: string;
  docName: string;
  docVersion: string;
  workMode: '리소스모드' | '문서모드';
  offlineTime: string;
  startTime: string;
  endTime: string;
  author: string;
  cachedPages: number | null;
  totalPages: number;
  status: '충돌감지' | '바로머지가능' | '온라인등록대기' | '머지완료';
  hasConflict: boolean;
  offlineChangeDesc: string;
  externalChangeDesc: string | null;
  hiddenMetadata: {
    startTime: string;
    updateTime: string;
    modifier: string;
    docNo: string;
    docTitle: string;
    docVersion: string;
    endTime: string;
    annotationCount: number;
    targetSystem: string;
  } | null;
}

export interface OfflineTaskCleanStudioProps {
  themeMode?: ThemeMode;
  onNavigateToViewer?: (docId: string) => void;
}

const INITIAL_OFFLINE_DOCS: OfflineWorkDoc[] = [
  {
    docId: 'DOC-0091',
    docName: '2026_아키텍처_설계_표준서.pdf',
    docVersion: 'v2.1',
    workMode: '리소스모드',
    offlineTime: '2026-10-05 14:05:00',
    startTime: '14:10:12',
    endTime: '14:18:22',
    author: 'jkoogit@gmail.com',
    cachedPages: 10,
    totalPages: 120,
    status: '충돌감지',
    hasConflict: true,
    offlineChangeDesc: 'p.14 주석 2건 (형광펜 주황색, "낙관적 락 충돌 검토" 메모)',
    externalChangeDesc: 'p.14 주석 (클라우드 OCR 텍스트 레이어 교정 v2.1, 수정자: reviewer@pdfrend.com)',
    hiddenMetadata: null,
  },
  {
    docId: 'DOC-0094',
    docName: '한국근현대사_사료집_발췌본.pdf',
    docVersion: 'v1.0',
    workMode: '문서모드',
    offlineTime: '2026-10-05 13:30:00',
    startTime: '13:35:10',
    endTime: '13:52:00',
    author: 'jkoogit@gmail.com',
    cachedPages: null,
    totalPages: 85,
    status: '온라인등록대기',
    hasConflict: false,
    offlineChangeDesc: '로컬 독립 PDF 파일 열람 및 주석 5건 작성',
    externalChangeDesc: null,
    hiddenMetadata: {
      startTime: '2026-10-05 13:35:10',
      updateTime: '2026-10-05 13:48:20',
      modifier: 'jkoogit@gmail.com',
      docNo: 'DOC-0094',
      docTitle: '한국근현대사_사료집_발췌본.pdf',
      docVersion: 'v1.0',
      endTime: '2026-10-05 13:52:00',
      annotationCount: 5,
      targetSystem: 'purePDFrend Production',
    },
  },
  {
    docId: 'DOC-0088',
    docName: 'purePDFrend_API_개발가이드.pdf',
    docVersion: 'v3.0',
    workMode: '리소스모드',
    offlineTime: '2026-10-05 14:15:00',
    startTime: '14:16:00',
    endTime: '14:20:00',
    author: 'jkoogit@gmail.com',
    cachedPages: 25,
    totalPages: 40,
    status: '바로머지가능',
    hasConflict: false,
    offlineChangeDesc: 'p.3~5 북마크 순서 변경 및 목차 보정',
    externalChangeDesc: null,
    hiddenMetadata: null,
  },
];

export function OfflineTaskCleanStudio({
  themeMode = 'dark',
  onNavigateToViewer,
}: OfflineTaskCleanStudioProps) {
  const resolvedTheme = resolveThemeMode(themeMode);

  // 1. 오프라인 시뮬레이션 및 실제 네트워크 감지 상태
  const [isOfflineSimulated, setIsOfflineSimulated] = useState<boolean>(true);
  const [realOnline, setRealOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setRealOnline(true);
    const handleOffline = () => setRealOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 2. 오프라인 작업문서 데이터 상태
  const [offlineDocs, setOfflineDocs] = useState<OfflineWorkDoc[]>(() => {
    try {
      const saved = localStorage.getItem('purepdfrend_offline_work_docs');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_OFFLINE_DOCS;
  });

  const saveDocs = (newDocs: OfflineWorkDoc[]) => {
    setOfflineDocs(newDocs);
    try {
      localStorage.setItem('purepdfrend_offline_work_docs', JSON.stringify(newDocs));
    } catch {}
  };

  // 3. 토스트 알림 상태
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  // 4. 충돌 머지 및 히든 주석 상세 검토 모달 상태
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);
  const [selectedConflictDoc, setSelectedConflictDoc] = useState<OfflineWorkDoc | null>(null);

  // 5. 검색 및 상세 필터 상태
  const [filterDocId, setFilterDocId] = useState('');
  const [filterDocTitle, setFilterDocTitle] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterWorkMode, setFilterWorkMode] = useState<string>('ALL');
  const [filterTimeFrom, setFilterTimeFrom] = useState('');
  const [filterTimeTo, setFilterTimeTo] = useState('');
  const [filterAuthor, setFilterAuthor] = useState('');

  // 6. 필터링 로직
  const filteredDocs = offlineDocs.filter((doc) => {
    if (filterDocId && !doc.docId.toLowerCase().includes(filterDocId.toLowerCase())) return false;
    if (filterDocTitle && !doc.docName.toLowerCase().includes(filterDocTitle.toLowerCase())) return false;
    if (filterStatus !== 'ALL' && doc.status !== filterStatus) return false;
    if (filterWorkMode !== 'ALL' && doc.workMode !== filterWorkMode) return false;
    if (filterAuthor && !doc.author.toLowerCase().includes(filterAuthor.toLowerCase())) return false;
    if (filterTimeFrom && doc.offlineTime.slice(0, 10) < filterTimeFrom) return false;
    if (filterTimeTo && doc.offlineTime.slice(0, 10) > filterTimeTo) return false;
    return true;
  });

  const handleResetFilters = () => {
    setFilterDocId('');
    setFilterDocTitle('');
    setFilterStatus('ALL');
    setFilterWorkMode('ALL');
    setFilterTimeFrom('');
    setFilterTimeTo('');
    setFilterAuthor('');
  };

  // 7. 즉시 머지 핸들러
  const handleQuickMerge = (doc: OfflineWorkDoc) => {
    const updated = offlineDocs.map((d) =>
      d.docId === doc.docId ? { ...d, status: '머지완료' as const, hasConflict: false } : d
    );
    saveDocs(updated);
    showToast(`✅ ${doc.docId} (${doc.docName}) 변경 내역이 충돌 없이 원격 정본에 즉시 머지되었습니다.`);
  };

  // 8. 로컬 우선 머지 (Local-Wins)
  const handleLocalWinsMerge = (doc: OfflineWorkDoc) => {
    const updated = offlineDocs.map((d) =>
      d.docId === doc.docId ? { ...d, status: '머지완료' as const, hasConflict: false } : d
    );
    saveDocs(updated);
    setIsDiffModalOpen(false);
    showToast(`✅ [로컬 작업 반영] ${doc.docId} 로컬 작업내용이 서버에 우선 반영(Local-Wins)되었습니다.`);
  };

  // 9. 원격 우선 머지 (Remote-Wins)
  const handleRemoteWinsMerge = (doc: OfflineWorkDoc) => {
    const updated = offlineDocs.map((d) =>
      d.docId === doc.docId ? { ...d, status: '머지완료' as const, hasConflict: false } : d
    );
    saveDocs(updated);
    setIsDiffModalOpen(false);
    showToast(`✅ [외부 작업 반영] ${doc.docId} 외부 원격본이 채택되고 내 작업본은 로컬 아카이브로 보관되었습니다.`);
  };

  // 10. 스마트 3-Way 병합
  const handleSmartMerge = (doc: OfflineWorkDoc) => {
    const updated = offlineDocs.map((d) =>
      d.docId === doc.docId ? { ...d, status: '머지완료' as const, hasConflict: false } : d
    );
    saveDocs(updated);
    setIsDiffModalOpen(false);
    showToast(`🎉 [스마트 3-Way 병합] ${doc.docId} 로컬 주석과 원격 OCR 교정본이 상호 보존되어 통합 정본으로 병합되었습니다.`);
  };

  // 11. 히든 주석 검증 및 등록
  const handleRegisterHiddenMetadata = (doc: OfflineWorkDoc) => {
    const updated = offlineDocs.map((d) =>
      d.docId === doc.docId ? { ...d, status: '머지완료' as const, hasConflict: false } : d
    );
    saveDocs(updated);
    setIsDiffModalOpen(false);
    showToast(`🎉 [히든주석 정본 등록] ${doc.docId} 파일 각인 메타데이터 검증 완료 및 클라우드 라이브러리 정본으로 머지 등록되었습니다.`);
  };

  // 모바일 뷰 감지
  const [isMobileMode, setIsMobileMode] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  });

  useEffect(() => {
    const handleResize = () => setIsMobileMode(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      className={`w-full space-y-4 font-sans text-xs transition-colors duration-200 ${
        resolvedTheme === 'light'
          ? 'text-slate-800'
          : resolvedTheme === 'dawn'
          ? 'text-slate-100'
          : 'text-slate-100'
      }`}
    >
      {/* 토스트 알림 */}
      {toastMessage && (
        <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg flex items-center justify-between transition-all animate-fadeIn font-medium">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-white/80 hover:text-white text-xs cursor-pointer px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. 네트워크 감지 상태바 및 오프라인/온라인 제어 패널 */}
      <div
        className={`p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-md transition-all border ${
          isOfflineSimulated
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isOfflineSimulated ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
            }`}
          >
            {isOfflineSimulated ? <WifiOff className="w-5 h-5" /> : <Wifi className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm">
                {isOfflineSimulated
                  ? '네트워크 오프라인 격리 상태 (로컬 단독 캐시 구동 중)'
                  : '네트워크 온라인 연결 정상 (클라우드 동기화 대기)'}
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold ${
                  isOfflineSimulated
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                }`}
              >
                {isOfflineSimulated ? 'OFFLINE_CACHE_ACTIVE' : 'ONLINE_SYNC_LIVE'}
              </span>
              {!realOnline && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                  물리망 단절 감지
                </span>
              )}
            </div>
            <p
              className={`text-[11px] mt-0.5 ${
                isOfflineSimulated ? 'text-amber-400/80' : 'text-emerald-400/80'
              }`}
            >
              {isOfflineSimulated
                ? '오프라인 중 작업된 문서는 IndexedDB/로컬 큐에 안전 보관되며, 온라인 복구 시 "오프라인 작업 정리" 대상 목록으로 취합됩니다.'
                : '온라인 상태입니다. 오프라인 중 진행된 작업문서의 충돌 여부를 검토하고 서버 정본에 안전하게 머지하세요.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const next = !isOfflineSimulated;
              setIsOfflineSimulated(next);
              showToast(
                next
                  ? '📡 오프라인 모드로 전환되었습니다. 로컬 캐시 격리 활성화'
                  : '🌐 온라인 모드로 복귀되었습니다. 오프라인 작업문서 현행화 대기'
              );
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
              resolvedTheme === 'light'
                ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            {isOfflineSimulated ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span>{isOfflineSimulated ? '온라인 전환' : '오프라인 전환'}</span>
          </button>
          <button
            onClick={() => {
              showToast('🔄 오프라인 작업문서의 원격 상태를 조회하여 동기화 및 3Way 충돌을 분석 중입니다...');
            }}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-semibold flex items-center gap-1.5 shadow-md transition active:scale-95 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>작업목록 새로고침</span>
          </button>
        </div>
      </div>

      {/* 2. 오프라인 작업문서 검색 및 상세 필터 */}
      <div
        className={`p-4 rounded-2xl space-y-3 shadow-md border ${
          resolvedTheme === 'light'
            ? 'bg-white border-slate-200'
            : resolvedTheme === 'dawn'
            ? 'bg-[#0b142d] border-[#1e3066]'
            : 'bg-slate-900 border-slate-800'
        }`}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1) 문서 ID */}
          <div>
            <label className="block text-[11px] text-slate-400 mb-1 font-medium">문서 ID</label>
            <input
              type="text"
              value={filterDocId}
              onChange={(e) => setFilterDocId(e.target.value)}
              placeholder="예: DOC-0091"
              className={`w-full px-3 py-1.5 rounded-xl text-xs font-mono border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                resolvedTheme === 'light'
                  ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
                  : 'bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-600'
              }`}
            />
          </div>

          {/* 2) 문서 제목 */}
          <div>
            <label className="block text-[11px] text-slate-400 mb-1 font-medium">문서제목</label>
            <input
              type="text"
              value={filterDocTitle}
              onChange={(e) => setFilterDocTitle(e.target.value)}
              placeholder="문서제목 검색"
              className={`w-full px-3 py-1.5 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                resolvedTheme === 'light'
                  ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
                  : 'bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-600'
              }`}
            />
          </div>

          {/* 3) 상태 선택목록 */}
          <div>
            <label className="block text-[11px] text-slate-400 mb-1 font-medium">상태</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`w-full px-3 py-1.5 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                resolvedTheme === 'light'
                  ? 'bg-slate-50 border-slate-300 text-slate-900'
                  : 'bg-slate-950 border-slate-800 text-slate-200'
              }`}
            >
              <option value="ALL">전체 상태</option>
              <option value="충돌감지">⚠️ 충돌감지</option>
              <option value="바로머지가능">⚡ 바로머지가능</option>
              <option value="온라인등록대기">🔍 온라인등록대기</option>
              <option value="머지완료">✓ 머지완료</option>
            </select>
          </div>

          {/* 4) 작업유형 선택목록 */}
          <div>
            <label className="block text-[11px] text-slate-400 mb-1 font-medium">작업유형</label>
            <select
              value={filterWorkMode}
              onChange={(e) => setFilterWorkMode(e.target.value)}
              className={`w-full px-3 py-1.5 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                resolvedTheme === 'light'
                  ? 'bg-slate-50 border-slate-300 text-slate-900'
                  : 'bg-slate-950 border-slate-800 text-slate-200'
              }`}
            >
              <option value="ALL">전체 작업유형</option>
              <option value="리소스모드">리소스모드</option>
              <option value="문서모드">문서모드</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1 items-end">
          {/* 5) 오프라인시간 시작 */}
          <div>
            <label className="block text-[11px] text-slate-400 mb-1 font-medium">오프라인시간 (시작)</label>
            <input
              type="date"
              value={filterTimeFrom}
              onChange={(e) => setFilterTimeFrom(e.target.value)}
              className={`w-full px-3 py-1.5 rounded-xl text-xs font-mono border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                resolvedTheme === 'light'
                  ? 'bg-slate-50 border-slate-300 text-slate-900'
                  : 'bg-slate-950 border-slate-800 text-slate-200'
              }`}
            />
          </div>

          {/* 6) 오프라인시간 종료 */}
          <div>
            <label className="block text-[11px] text-slate-400 mb-1 font-medium">오프라인시간 (종료)</label>
            <input
              type="date"
              value={filterTimeTo}
              onChange={(e) => setFilterTimeTo(e.target.value)}
              className={`w-full px-3 py-1.5 rounded-xl text-xs font-mono border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                resolvedTheme === 'light'
                  ? 'bg-slate-50 border-slate-300 text-slate-900'
                  : 'bg-slate-950 border-slate-800 text-slate-200'
              }`}
            />
          </div>

          {/* 7) 작업자 검색 */}
          <div>
            <label className="block text-[11px] text-slate-400 mb-1 font-medium">작업자</label>
            <input
              type="text"
              value={filterAuthor}
              onChange={(e) => setFilterAuthor(e.target.value)}
              placeholder="작업자 이메일/ID"
              className={`w-full px-3 py-1.5 rounded-xl text-xs font-mono border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                resolvedTheme === 'light'
                  ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
                  : 'bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-600'
              }`}
            />
          </div>

          {/* 8) 초기화 버튼 */}
          <div>
            <button
              type="button"
              onClick={handleResetFilters}
              className={`w-full py-1.5 rounded-xl text-xs font-semibold border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                resolvedTheme === 'light'
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>필터 초기화</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. 오프라인 작업 정리 문서 목록 */}
      <div
        className={`p-4 rounded-2xl space-y-3 shadow-md border ${
          resolvedTheme === 'light'
            ? 'bg-white border-slate-200'
            : resolvedTheme === 'dawn'
            ? 'bg-[#0b142d] border-[#1e3066]'
            : 'bg-slate-900 border-slate-800'
        }`}
      >
        <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
          <span className="font-bold text-sm flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-indigo-400" />
            <span>오프라인 작업 문서 정리 목록</span>
            <span className="text-[10px] px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-md font-mono border border-indigo-500/30">
              총 {filteredDocs.length}건
            </span>
          </span>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
              <span>충돌감지 ({offlineDocs.filter((d) => d.status === '충돌감지').length})</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-sky-400 inline-block" />
              <span>바로머지가능 ({offlineDocs.filter((d) => d.status === '바로머지가능').length})</span>
            </span>
          </div>
        </div>

        {/* 모바일 모드: 카드 뷰 (Table-to-Card Pattern per Policy 03-14) */}
        {isMobileMode ? (
          <div className="space-y-3">
            {filteredDocs.length === 0 ? (
              <div className="p-8 text-center text-slate-500 font-sans bg-slate-900/40 rounded-xl border border-slate-800">
                조회된 결과가 없습니다.
              </div>
            ) : (
              filteredDocs.map((doc) => (
                <div
                  key={doc.docId}
                  className={`p-3.5 rounded-xl space-y-2.5 transition shadow-sm border ${
                    doc.hasConflict
                      ? 'border-amber-500/50 bg-amber-950/20'
                      : resolvedTheme === 'light'
                      ? 'bg-slate-50 border-slate-200'
                      : 'bg-slate-950/80 border-slate-800'
                  }`}
                >
                  {/* 상단 헤더: 문서 ID + 작업모드 + 상태 */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sky-400 font-mono text-xs">{doc.docId}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          doc.workMode === '리소스모드'
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {doc.workMode}
                      </span>
                    </div>
                    <div>
                      {doc.status === '충돌감지' && (
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded text-[10px] font-bold">
                          ⚠️ 충돌감지
                        </span>
                      )}
                      {doc.status === '바로머지가능' && (
                        <span className="px-2 py-0.5 bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded text-[10px] font-bold">
                          ⚡ 바로머지가능
                        </span>
                      )}
                      {doc.status === '온라인등록대기' && (
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-[10px] font-bold">
                          🔍 등록대기
                        </span>
                      )}
                      {doc.status === '머지완료' && (
                        <span className="px-2 py-0.5 bg-slate-800 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-bold">
                          ✓ 머지완료
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 문서명 & 버전 */}
                  <div className="flex items-start justify-between gap-2 border-t border-slate-800/60 pt-2">
                    <div className="font-medium text-slate-200 text-xs flex items-center gap-1.5 flex-wrap">
                      <span>{doc.docName}</span>
                      {doc.cachedPages && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          ({doc.cachedPages}p 캐시)
                        </span>
                      )}
                      {onNavigateToViewer && (
                        <button
                          type="button"
                          onClick={() => onNavigateToViewer(doc.docId)}
                          className="p-1 rounded hover:bg-slate-800 text-sky-400 hover:text-sky-300 transition cursor-pointer"
                          title="뷰어에서 문서 열기"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono shrink-0">{doc.docVersion}</span>
                  </div>

                  {/* 시간 이력 */}
                  <div className="grid grid-cols-1 gap-1 text-[11px] text-slate-400 font-mono bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/40">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">⏱️ 오프라인시간</span>
                      <span className="text-slate-300">{doc.offlineTime}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">✏️ 작업시간</span>
                      <span className="text-slate-300">
                        {doc.startTime} ~ {doc.endTime}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">👤 작업자</span>
                      <span className="text-slate-300 truncate max-w-[180px]">{doc.author}</span>
                    </div>
                  </div>

                  {/* 액션 버튼 */}
                  <div className="pt-1">
                    {doc.status === '충돌감지' && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedConflictDoc(doc);
                          setIsDiffModalOpen(true);
                        }}
                        className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold text-xs shadow flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>주석 비교 & 3Way 충돌 머지</span>
                      </button>
                    )}
                    {doc.status === '바로머지가능' && (
                      <button
                        type="button"
                        onClick={() => handleQuickMerge(doc)}
                        className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold text-xs shadow flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                        <span>원격 서버로 바로 머지</span>
                      </button>
                    )}
                    {doc.status === '온라인등록대기' && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedConflictDoc(doc);
                          setIsDiffModalOpen(true);
                        }}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs shadow flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>히든주석 메타데이터 정본 등록</span>
                      </button>
                    )}
                    {doc.status === '머지완료' && (
                      <div className="w-full py-1.5 text-center bg-slate-800 text-emerald-400 rounded-lg text-xs font-bold font-mono">
                        ✓ 클라우드 서버 머지 완료됨
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* 데스크톱 모드: 표준 테이블 */
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-[11px] border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/50">
                  <th className="p-2.5 whitespace-nowrap">문서 ID</th>
                  <th className="p-2.5 whitespace-nowrap">문서명</th>
                  <th className="p-2.5 whitespace-nowrap leading-tight">문서<br />버전</th>
                  <th className="p-2.5 whitespace-nowrap">작업모드</th>
                  <th className="p-2.5 whitespace-nowrap leading-tight">오프라인<br />시간</th>
                  <th className="p-2.5 whitespace-nowrap leading-tight">작업시작시간<br />(최초수정)</th>
                  <th className="p-2.5 whitespace-nowrap leading-tight">작업종료시간<br />(저장)</th>
                  <th className="p-2.5 whitespace-nowrap">작업자</th>
                  <th className="p-2.5 text-center whitespace-nowrap">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredDocs.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500 font-sans">
                      조회된 결과가 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredDocs.map((doc) => (
                    <tr
                      key={doc.docId}
                      className={`hover:bg-slate-900/40 transition ${
                        doc.hasConflict ? 'bg-amber-950/10' : ''
                      }`}
                    >
                      <td className="p-2.5 font-bold text-sky-400 whitespace-nowrap align-middle">
                        {doc.docId}
                      </td>
                      <td className="p-2.5 font-sans font-medium text-slate-200 align-middle">
                        <div className="flex items-center gap-1.5">
                          <span>{doc.docName}</span>
                          {doc.cachedPages && (
                            <span className="text-[10px] text-slate-500 font-mono">
                              ({doc.cachedPages}p 캐시)
                            </span>
                          )}
                          {onNavigateToViewer && (
                            <button
                              type="button"
                              onClick={() => onNavigateToViewer(doc.docId)}
                              className="p-1 rounded hover:bg-slate-800 text-sky-400 hover:text-sky-300 transition cursor-pointer"
                              title="뷰어로 이동하여 열람"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="p-2.5 text-slate-300 whitespace-nowrap align-middle">
                        {doc.docVersion}
                      </td>
                      <td className="p-2.5 whitespace-nowrap align-middle">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap inline-block ${
                            doc.workMode === '리소스모드'
                              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {doc.workMode}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-400 whitespace-nowrap align-middle">
                        {doc.offlineTime}
                      </td>
                      <td className="p-2.5 text-slate-300 whitespace-nowrap align-middle">
                        {doc.startTime}
                      </td>
                      <td className="p-2.5 text-slate-300 whitespace-nowrap align-middle">
                        {doc.endTime}
                      </td>
                      <td
                        className="p-2.5 text-slate-400 truncate max-w-[130px] whitespace-nowrap align-middle"
                        title={doc.author}
                      >
                        {doc.author}
                      </td>
                      <td className="p-2.5 text-center whitespace-nowrap align-middle">
                        {doc.status === '충돌감지' && (
                          <button
                            onClick={() => {
                              setSelectedConflictDoc(doc);
                              setIsDiffModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold text-[10px] shadow flex items-center gap-1 mx-auto whitespace-nowrap transition cursor-pointer"
                          >
                            <AlertTriangle className="w-3 h-3" />
                            <span>충돌 머지</span>
                          </button>
                        )}
                        {doc.status === '바로머지가능' && (
                          <button
                            onClick={() => handleQuickMerge(doc)}
                            className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold text-[10px] shadow flex items-center gap-1 mx-auto whitespace-nowrap transition cursor-pointer"
                          >
                            <ArrowRight className="w-3 h-3" />
                            <span>바로 머지</span>
                          </button>
                        )}
                        {doc.status === '온라인등록대기' && (
                          <button
                            onClick={() => {
                              setSelectedConflictDoc(doc);
                              setIsDiffModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[10px] shadow flex items-center gap-1 mx-auto whitespace-nowrap transition cursor-pointer"
                          >
                            <Search className="w-3 h-3" />
                            <span>히든주석 등록</span>
                          </button>
                        )}
                        {doc.status === '머지완료' && (
                          <span className="px-2 py-0.5 bg-slate-800 text-emerald-400 rounded text-[10px] font-bold whitespace-nowrap inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>머지완료</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. 작업 문서 충돌 머지 & 히든 주석 상세 검토 모달 */}
      {isDiffModalOpen && selectedConflictDoc && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-5 space-y-4 shadow-2xl animate-fadeIn max-h-[90vh] overflow-y-auto">
            {/* 모달 헤더 */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <span>
                    {selectedConflictDoc.workMode === '리소스모드'
                      ? '⚠️ 리소스모드 주석 충돌 비교 & 3Way 머지'
                      : '📑 문서모드 히든 주석 검증 & 서버 정본 등록'}
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded font-mono border border-indigo-500/30">
                    {selectedConflictDoc.docId} ({selectedConflictDoc.docVersion})
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  {selectedConflictDoc.workMode === '리소스모드'
                    ? '오프라인 중 로컬에서 수정한 주석과 외부에서 원격 수정한 주석 간의 충돌을 비교하고 반영 방향을 결정합니다.'
                    : '디바이스의 PDF 파일에 각인된 히든 주석 메타데이터를 검증하고 온라인 시스템 정본으로 안전하게 등록합니다.'}
                </p>
              </div>
              <button
                onClick={() => setIsDiffModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 리소스 모드 충돌 시: 주석 양자 비교 카드 & 한쪽 반영 기능 */}
            {selectedConflictDoc.workMode === '리소스모드' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {/* 내 오프라인 작업내용 (Local) */}
                  <div className="p-3.5 bg-indigo-950/20 border border-indigo-500/40 rounded-xl space-y-2">
                    <div className="flex justify-between items-center border-b border-indigo-500/20 pb-1.5">
                      <span className="text-indigo-400 font-bold flex items-center gap-1.5">
                        <HardDrive className="w-3.5 h-3.5" />
                        <span>내 오프라인 작업내용 (Local)</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        저장: {selectedConflictDoc.endTime}
                      </span>
                    </div>
                    <div className="p-2 bg-slate-950 rounded font-mono text-[11px] text-slate-200 space-y-1">
                      <div className="text-amber-300 font-bold">• {selectedConflictDoc.offlineChangeDesc}</div>
                      <div className="text-slate-400 text-[10px]">작업자: {selectedConflictDoc.author}</div>
                    </div>
                    <button
                      onClick={() => handleLocalWinsMerge(selectedConflictDoc)}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-xs shadow transition active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>👉 내 오프라인 작업 100% 반영 (Local-Wins)</span>
                    </button>
                  </div>

                  {/* 외부 원격 작업내용 (Remote) */}
                  <div className="p-3.5 bg-emerald-950/20 border border-emerald-500/40 rounded-xl space-y-2">
                    <div className="flex justify-between items-center border-b border-emerald-500/20 pb-1.5">
                      <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5" />
                        <span>외부 원격 작업내용 (Remote)</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">원격저장: 14:14:00</span>
                    </div>
                    <div className="p-2 bg-slate-950 rounded font-mono text-[11px] text-slate-200 space-y-1">
                      <div className="text-sky-300 font-bold">• {selectedConflictDoc.externalChangeDesc}</div>
                      <div className="text-slate-400 text-[10px]">수정자: reviewer@pdfrend.com (동시 수정자)</div>
                    </div>
                    <button
                      onClick={() => handleRemoteWinsMerge(selectedConflictDoc)}
                      className="w-full py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-bold text-xs shadow transition active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>👈 외부 원격 작업 100% 반영 (Remote-Wins)</span>
                    </button>
                  </div>
                </div>

                {/* 스마트 양방향 병합 옵션 */}
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>양방향 스마트 3-Way 병합 (Smart Merge)</span>
                    </span>
                    <p className="text-[11px] text-slate-400">
                      내 오프라인 형광펜/메모와 외부 OCR 레이어 교정본을 상호 보존하며 하나의 통합 주석으로 병합합니다.
                    </p>
                  </div>
                  <button
                    onClick={() => handleSmartMerge(selectedConflictDoc)}
                    className="px-4 py-2 bg-indigo-700 hover:bg-indigo-600 text-white font-bold rounded-lg text-xs shrink-0 shadow transition cursor-pointer"
                  >
                    양방향 스마트 병합 확정
                  </button>
                </div>
              </div>
            )}

            {/* 문서 모드 등록 시: 히든 주석 메타데이터 확인 및 등록 */}
            {selectedConflictDoc.workMode === '문서모드' && selectedConflictDoc.hiddenMetadata && (
              <div className="space-y-3">
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <span className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-sky-400" />
                    <span>PDF 파일 각인 히든 주석 (Hidden Annotation Metadata) 추출 결과</span>
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono p-3 bg-slate-900 rounded-lg border border-slate-800/80">
                    <div>
                      <span className="text-slate-500">문서번호:</span>{' '}
                      <span className="text-sky-300 font-bold">{selectedConflictDoc.hiddenMetadata.docNo}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">문서버전:</span>{' '}
                      <span className="text-slate-200">{selectedConflictDoc.hiddenMetadata.docVersion}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">작업시작:</span>{' '}
                      <span className="text-slate-300">{selectedConflictDoc.hiddenMetadata.startTime}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">수정일시:</span>{' '}
                      <span className="text-slate-300">{selectedConflictDoc.hiddenMetadata.updateTime}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">종료일시:</span>{' '}
                      <span className="text-slate-300">{selectedConflictDoc.hiddenMetadata.endTime}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">수정자:</span>{' '}
                      <span className="text-slate-300">{selectedConflictDoc.hiddenMetadata.modifier}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">생성주석:</span>{' '}
                      <span className="text-emerald-400 font-bold">
                        {selectedConflictDoc.hiddenMetadata.annotationCount}건
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">대상시스템:</span>{' '}
                      <span className="text-slate-300">{selectedConflictDoc.hiddenMetadata.targetSystem}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    오프라인 환경에서 로컬 디바이스에 저장된 파일 내에 위 메타데이터가 보존되어 있으며, 온라인 연결 시 원격 라이브러리에 신규 정본으로 일괄 머지됩니다.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => setIsDiffModalOpen(false)}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition cursor-pointer"
                  >
                    취소
                  </button>
                  <button
                    onClick={() => handleRegisterHiddenMetadata(selectedConflictDoc)}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs shadow transition cursor-pointer"
                  >
                    ✓ 히든주석 검증 및 시스템 정본으로 머지 등록
                  </button>
                </div>
              </div>
            )}

            {/* 하단 닫기 (리소스 모드 전용) */}
            {selectedConflictDoc.workMode === '리소스모드' && (
              <div className="flex justify-end pt-2 border-t border-slate-800">
                <button
                  onClick={() => setIsDiffModalOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition cursor-pointer"
                >
                  닫기
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default OfflineTaskCleanStudio;
