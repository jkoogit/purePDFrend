import { useState } from 'react';
import { SystemSettings } from '../../types';
import {
  Settings,
  Database,
  Layers,
  Save,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sliders,
  ShieldAlert,
} from 'lucide-react';

interface SystemConfigManagerProps {
  settings: SystemSettings | null;
  onUpdateSettings: (newSettings: SystemSettings) => Promise<void>;
  dbStatus: string;
}

export default function SystemConfigManager({
  settings,
  onUpdateSettings,
  dbStatus,
}: SystemConfigManagerProps) {
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Local editable settings
  const [spacing, setSpacing] = useState<number>(
    settings?.graphView?.defaultSpacing || 60
  );
  const [viewModes, setViewModes] = useState<{
    session: boolean;
    task: boolean;
    loop: boolean;
  }>({
    session: settings?.graphView?.defaultViewModes?.session ?? true,
    task: settings?.graphView?.defaultViewModes?.task ?? true,
    loop: settings?.graphView?.defaultViewModes?.loop ?? true,
  });

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    try {
      const updated: SystemSettings = {
        ...settings,
        graphView: {
          defaultSpacing: spacing,
          defaultViewModes: viewModes,
        },
      };
      await onUpdateSettings(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e: any) {
      setErrorMessage(e?.message || '설정 저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-xl p-4 sm:p-6 backdrop-blur-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              시스템 환경설정 및 인프라 프로필
              <span className="text-xs px-2 py-0.5 rounded font-mono font-normal bg-indigo-950 text-indigo-300 border border-indigo-800">
                Knowledge & System
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              데이터베이스 연결 상태 모니터링, 작업그래프 뷰어 기본값 및 세션 스토어 파라미터 관리
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !settings}
          className="min-h-[44px] px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/20 active:scale-98 disabled:opacity-50"
        >
          {saving ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{saving ? '설정 저장중...' : '설정 저장하기'}</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>시스템 설정이 안전하게 데이터베이스 및 로컬 스토어에 영속화되었습니다.</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Grid Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* 1. Database & Infrastructure Profile */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 font-bold text-white text-sm pb-3 border-b border-slate-800">
            <Database className="w-4 h-4 text-indigo-400" />
            <span>데이터베이스 및 인프라 프로필</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-400">데이터베이스 상태</span>
              {dbStatus === 'CONNECTED' ? (
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  CONNECTED (Bridge OK)
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-amber-400 font-semibold font-mono">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  LOCAL FALLBACK
                </span>
              )}
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-400">대상 데이터베이스</span>
              <span className="font-mono text-indigo-300 font-semibold">purepdfrend_dev</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-400">적용 스키마</span>
              <span className="font-mono text-slate-200">aiagent, public</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-400">핵심 관리 테이블</span>
              <span className="font-mono text-slate-300">6개 테이블 (7종 복합 인덱스 가속)</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-400">로컬 세션 스토어</span>
              <span className="font-mono text-slate-300 text-[11px]">data/local_agent_store.json</span>
            </div>
          </div>
        </div>

        {/* 2. Graph View Default Settings */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 font-bold text-white text-sm pb-3 border-b border-slate-800">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <span>작업그래프 시각화 기본 설정</span>
          </div>

          <div className="space-y-4 text-xs">
            {/* Spacing Slider */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-slate-300 font-medium">카드 간격 (Spacing)</span>
                <span className="font-mono text-indigo-400 font-bold">{spacing}px</span>
              </div>
              <input
                type="range"
                min={40}
                max={120}
                step={5}
                value={spacing}
                onChange={(e) => setSpacing(Number(e.target.value))}
                className="w-full accent-indigo-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>좁게 (40px)</span>
                <span>보통 (60px)</span>
                <span>넓게 (120px)</span>
              </div>
            </div>

            {/* View Modes Toggle */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-slate-300 font-medium block">기본 표시 계층 (다중 선택 뷰모드)</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setViewModes((prev) => ({ ...prev, session: !prev.session }))
                  }
                  className={`min-h-[40px] px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border ${
                    viewModes.session
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                      : 'bg-slate-950/60 border-slate-800 text-slate-500'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>세션 계층</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setViewModes((prev) => ({ ...prev, task: !prev.task }))
                  }
                  className={`min-h-[40px] px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border ${
                    viewModes.task
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                      : 'bg-slate-950/60 border-slate-800 text-slate-500'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>태스크 계층</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setViewModes((prev) => ({ ...prev, loop: !prev.loop }))
                  }
                  className={`min-h-[40px] px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border ${
                    viewModes.loop
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                      : 'bg-slate-950/60 border-slate-800 text-slate-500'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>루프 계층</span>
                </button>
              </div>
            </div>

            {/* Zero-Hang Principle Note */}
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center gap-1 text-slate-300 font-semibold">
                <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
                <span>무중단 거버넌스 원칙 (Zero-Hang)</span>
              </div>
              <p>
                DB 브릿지 지연 시에도 비동기 로컬 캐시로 자동 폴백되어 사용자 경험이 멈추지 않습니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
