import { useState, useEffect } from 'react';
import {
  Layout,
  Settings,
  Database,
  GitBranch,
  Activity,
  CheckCircle2,
  Server,
  ShieldCheck,
  Radio,
  Layers,
  Bot,
  AlertTriangle,
  Stethoscope,
  RefreshCw,
  X,
} from 'lucide-react';

export type AppTab = 'agent' | 'scenarios' | 'system' | 'viewer' | 'ocr';

interface NavbarProps {
  currentTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  dbStatus: string;
}

interface CheckResultItem {
  step: string;
  name: string;
  passed: boolean;
  message: string;
  durationMs: number;
}

export default function Navbar({ currentTab, onSelectTab, dbStatus }: NavbarProps) {
  const [hoveredBadge, setHoveredBadge] = useState<'db' | 'branch' | 'status' | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string>('SESSION-20260921-003');
  const [activeBranch, setActiveBranch] = useState<string>('task/db-index-turn-sync_gemini');
  
  // Service Health Check state
  const [isCheckModalOpen, setIsCheckModalOpen] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(false);
  const [checkResults, setCheckResults] = useState<CheckResultItem[] | null>(null);
  const [allPassed, setAllPassed] = useState<boolean | null>(null);

  const runServiceCheck = async () => {
    setChecking(true);
    try {
      const res = await fetch('/api/agent/check/service');
      const data = await res.json();
      if (data.success) {
        setCheckResults(data.results);
        setAllPassed(data.allPassed);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    fetch('/api/agent/sessions')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.sessions && data.sessions.length > 0) {
          const latest = data.sessions[data.sessions.length - 1];
          setActiveSessionId(latest.session_id);
          if (latest.doc_payload?.gitBranch) {
            setActiveBranch(latest.doc_payload.gitBranch);
          }
        }
      })
      .catch(() => {});
  }, []);

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Brand & Identity */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onSelectTab('scenarios')}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-black text-base shadow-lg shadow-indigo-500/20">
            P
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white tracking-tight text-sm">purePDFrend</span>
              <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60 font-mono">
                v1.0 Dev
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              대용량 스캔 PDF & OCR 교정 하네스 스튜디오
            </div>
          </div>
        </div>

        {/* Global Nav Tabs */}
        <nav className="flex items-center gap-1.5 ml-6 border-l border-slate-800 pl-6">
          <button
            id="nav-tab-agent"
            onClick={() => onSelectTab('agent')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              currentTab === 'agent'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-indigo-300" />
            에이전트 정보 (하네스/그래프/토큰)
          </button>

          <button
            id="nav-tab-scenarios"
            onClick={() => onSelectTab('scenarios')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              currentTab === 'scenarios'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Layout className="w-3.5 h-3.5" />
            서비스 시나리오 & 화면설계
          </button>

          <button
            id="nav-tab-system"
            onClick={() => onSelectTab('system')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              currentTab === 'system'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            시스템 관리 (OCR / DB)
          </button>
        </nav>
      </div>

      {/* Right Top Status Indicators with Hover Layer Popups */}
      <div className="flex items-center gap-3">
        {/* 1. DB Connection Indicator with Hover Layer Popup */}
        <div
          className="relative"
          onMouseEnter={() => setHoveredBadge('db')}
          onMouseLeave={() => setHoveredBadge(null)}
        >
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 hover:border-indigo-500/50 cursor-pointer transition-colors text-xs">
            <Database className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-400 font-mono text-[11px]">DB:</span>
            {dbStatus === 'CONNECTED' ? (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> 정상 연결
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> 로컬 폴백 (점검필요)
              </span>
            )}
          </div>

          {/* Hover Layer Popup: DB Details */}
          {hoveredBadge === 'db' && (
            <div className="absolute right-0 top-full mt-2 w-72 p-3 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-2 font-bold text-white pb-2 border-b border-slate-800">
                <Server className="w-4 h-4 text-indigo-400" />
                <span>데이터베이스 연결 상세정보</span>
              </div>
              <div className="mt-2 space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">타겟 DB:</span>
                  <span className="font-mono text-indigo-300 font-semibold">purepdfrend_dev</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">스키마:</span>
                  <span className="font-mono text-slate-200">aiagent, public</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">연결 상태:</span>
                  {dbStatus === 'CONNECTED' ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> 정상 작동 (Bridge OK)
                    </span>
                  ) : (
                    <span className="text-amber-400 font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> 로컬 캐시 모드 (영속화 점검필요)
                    </span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">동기화 테이블:</span>
                  <span className="font-mono text-slate-300">agent_docs_meta (30건)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">추적 테이블:</span>
                  <span className="font-mono text-slate-300">agent_conversation_trace</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 2. Git Branch Badge with Hover Layer Popup */}
        <div
          className="relative"
          onMouseEnter={() => setHoveredBadge('branch')}
          onMouseLeave={() => setHoveredBadge(null)}
        >
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/40 border border-amber-800/40 hover:border-amber-500/60 cursor-pointer transition-colors text-xs text-amber-300 font-mono text-[11px]">
            <GitBranch className="w-3.5 h-3.5 text-amber-400" />
            <span className="truncate max-w-[140px]">{activeBranch}</span>
          </div>

          {/* Hover Layer Popup: Git Branch Details */}
          {hoveredBadge === 'branch' && (
            <div className="absolute right-0 top-full mt-2 w-80 p-3 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-2 font-bold text-white pb-2 border-b border-slate-800">
                <GitBranch className="w-4 h-4 text-amber-400" />
                <span>형상관리 및 진행 브랜치</span>
              </div>
              <div className="mt-2 space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">브랜치명:</span>
                  <span className="font-mono text-amber-300 font-semibold truncate max-w-[180px]">
                    {activeBranch}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">최근 커밋:</span>
                  <span className="font-mono text-slate-200">5a39f1c (feat: session-isolate)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">작업 하네스:</span>
                  <span className="text-indigo-300 font-semibold">{activeSessionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">상태 전이:</span>
                  <span className="text-emerald-400 font-semibold">#태스크처리 (진행중)</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. Task / Harness Status Badge with Hover Layer Popup */}
        <div
          className="relative"
          onMouseEnter={() => setHoveredBadge('status')}
          onMouseLeave={() => setHoveredBadge(null)}
        >
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 hover:border-indigo-400 cursor-pointer transition-colors text-indigo-300 text-xs font-semibold">
            <Radio className="w-3 h-3 text-indigo-400 animate-pulse" />
            <span>#태스크처리</span>
          </div>

          {/* Hover Layer Popup: Harness Status Details */}
          {hoveredBadge === 'status' && (
            <div className="absolute right-0 top-full mt-2 w-72 p-3 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-2 font-bold text-white pb-2 border-b border-slate-800">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>하네스 생명주기 및 상태</span>
              </div>
              <div className="mt-2 space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">실행 상태:</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> #태스크처리 정상 진행중
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">거버넌스 원칙:</span>
                  <span className="text-indigo-300 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-indigo-400" /> AGENTS.md 규정 준수
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">후속턴 체크:</span>
                  <span className="text-amber-300 font-semibold">DB 온전 반영 검증 활성화</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">작업 계층:</span>
                  <span className="font-mono text-slate-300 flex items-center gap-1">
                    <Layers className="w-3 h-3 text-slate-400" /> 세션 1 / 태스크 1 / 루프 1
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. Comprehensive Service Health Check Button */}
        <button
          id="btn-service-health-check"
          onClick={() => {
            setIsCheckModalOpen(true);
            if (!checkResults) runServiceCheck();
          }}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/50 border border-emerald-700/60 hover:border-emerald-400 hover:bg-emerald-900/40 cursor-pointer transition-all text-emerald-300 text-xs font-semibold shadow-sm"
          title="서비스 전수 점검 및 가드레일 진단"
        >
          <Stethoscope className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden lg:inline">서비스 정밀점검</span>
          {allPassed === true && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
          {allPassed === false && <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />}
        </button>
      </div>

      {/* Service Health Check Modal */}
      {isCheckModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    서비스 전수 점검 & 상시 가드레일 진단
                    {allPassed === true && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        100% ALL PASSED
                      </span>
                    )}
                    {allPassed === false && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                        점검필요
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    인프라/DB, 데이터 정합성, 거버넌스 100점 감사, 문서 및 GIN 검색 4단계 종합 검증
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={runServiceCheck}
                  disabled={checking}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${checking ? 'animate-spin text-emerald-400' : ''}`} />
                  <span>{checking ? '점검 실행중...' : '재점검'}</span>
                </button>
                <button
                  onClick={() => setIsCheckModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-3">
              {checking && !checkResults ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
                  <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                  <p className="text-xs">4단계 서비스 전수 점검을 수행하고 있습니다...</p>
                </div>
              ) : checkResults && checkResults.length > 0 ? (
                <div className="space-y-2.5">
                  {checkResults.map((item, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                        item.passed
                          ? 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                          : 'bg-rose-950/20 border-rose-900/60'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5">
                          {item.passed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-rose-400" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                              {item.step}
                            </span>
                            <span className="text-xs font-bold text-white">{item.name}</span>
                          </div>
                          <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                            {item.message}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap mt-0.5">
                        {item.durationMs}ms
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  점검 결과가 없습니다. 재점검을 실행해 주세요.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>정기 CLI 점검 명령어: <code className="text-slate-200 font-mono px-1 py-0.5 bg-slate-800 rounded">npm run check:service</code></span>
              </div>
              <button
                onClick={() => setIsCheckModalOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-md"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
