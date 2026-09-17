import { useState } from 'react';
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
  Layers
} from 'lucide-react';

interface NavbarProps {
  currentTab: 'scenarios' | 'system' | 'viewer' | 'ocr';
  onSelectTab: (tab: 'scenarios' | 'system' | 'viewer' | 'ocr') => void;
  dbStatus: string;
}

export default function Navbar({ currentTab, onSelectTab, dbStatus }: NavbarProps) {
  const [hoveredBadge, setHoveredBadge] = useState<'db' | 'branch' | 'status' | null>(null);

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
            onClick={() => onSelectTab('system')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              currentTab === 'system'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            시스템 관리 (AI에이전트 / OCR / DB)
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
              <span className="text-amber-400 font-semibold text-[11px]">연결 확인중</span>
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
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> 정상 작동 (Bridge OK)
                  </span>
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
            <span>task/바이브코딩환경...</span>
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
                    task/바이브코딩환경-문서-에이전트관리UI
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">최근 커밋:</span>
                  <span className="font-mono text-slate-200">8a283a1 (feat: governance)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">작업 하네스:</span>
                  <span className="text-indigo-300 font-semibold">SESSION-20260917-001</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">상태 전이:</span>
                  <span className="text-emerald-400 font-semibold">승급/정리 단계 준비</span>
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
      </div>
    </header>
  );
}
