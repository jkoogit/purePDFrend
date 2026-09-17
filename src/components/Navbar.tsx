import { Layout, Settings, Database, GitBranch } from 'lucide-react';

interface NavbarProps {
  currentTab: 'scenarios' | 'system' | 'viewer' | 'ocr';
  onSelectTab: (tab: 'scenarios' | 'system' | 'viewer' | 'ocr') => void;
  dbStatus: string;
}

export default function Navbar({ currentTab, onSelectTab, dbStatus }: NavbarProps) {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Brand & Identity */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onSelectTab('scenarios')}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-black text-base shadow-lg shadow-indigo-500/20">
            P
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white tracking-tight text-sm">purePDFrend</span>
              <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60">
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

      {/* Right Badges & Indicators */}
      <div className="flex items-center gap-3">
        {/* DB Connection Indicator */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs">
          <Database className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-slate-400 font-mono text-[11px]">purepdfrend_dev:</span>
          {dbStatus === 'CONNECTED' ? (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> 정상 연결
            </span>
          ) : (
            <span className="text-amber-400 font-semibold text-[11px]">연결 확인중</span>
          )}
        </div>

        {/* Git Branch Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/40 border border-amber-800/40 text-xs text-amber-300 font-mono text-[11px]">
          <GitBranch className="w-3.5 h-3.5 text-amber-400" />
          <span>task/바이브코딩환경...</span>
        </div>

        {/* Task In Progress Badge */}
        <div className="px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
          #태스크처리중
        </div>
      </div>
    </header>
  );
}
