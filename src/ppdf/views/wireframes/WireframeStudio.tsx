import { useState } from 'react';
import { AdminWireframes } from './AdminWireframes';
import { UserWireframes } from './UserWireframes';

export function WireframeStudio() {
  const [activeTab, setActiveTab] = useState<'admin' | 'user'>('user');
  const [viewportMode, setViewportMode] = useState<'full' | 'tablet' | 'mobile'>('full');

  return (
    <div className="space-y-6">
      {/* 상단 컨트롤 바: 도메인 전환 & 뷰포트 프리뷰 스위처 */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
            UI
          </div>
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              <span>purePDFrend 와이어프레임 스튜디오</span>
              <span className="text-[11px] font-mono px-2 py-0.5 bg-indigo-500/20 text-indigo-400 rounded-full border border-indigo-500/30">
                PROTOTYPE v1.0
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              관리자 16개 기능 & 사용자 9개 핵심 화면 반응형 레이아웃 프로토타입
            </p>
          </div>
        </div>

        {/* 도메인 선택 탭 & 뷰포트 스위처 */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 도메인 전환 버튼 */}
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center text-xs">
            <button
              onClick={() => setActiveTab('user')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'user'
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              📱 사용자 서비스 (9개 화면)
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'admin'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🛠 관리자 서비스 (16개 화면)
            </button>
          </div>

          {/* 뷰포트 시뮬레이션 */}
          <div className="hidden sm:flex bg-slate-950 p-1 rounded-xl border border-slate-800 items-center text-xs">
            <button
              onClick={() => setViewportMode('full')}
              className={`px-2.5 py-1.5 rounded-lg transition-all ${
                viewportMode === 'full' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="데스크톱 100% 뷰"
            >
              🖥 PC (100%)
            </button>
            <button
              onClick={() => setViewportMode('tablet')}
              className={`px-2.5 py-1.5 rounded-lg transition-all ${
                viewportMode === 'tablet' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="태블릿 768px 뷰"
            >
              📟 태블릿 (768px)
            </button>
            <button
              onClick={() => setViewportMode('mobile')}
              className={`px-2.5 py-1.5 rounded-lg transition-all ${
                viewportMode === 'mobile' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="모바일 390px 뷰"
            >
              📱 모바일 (390px)
            </button>
          </div>
        </div>
      </div>

      {/* 뷰포트 래퍼 (시뮬레이션 모드 반영) */}
      <div
        className={`mx-auto transition-all duration-300 ${
          viewportMode === 'mobile'
            ? 'max-w-[410px] p-2 bg-slate-950/80 rounded-3xl border-4 border-slate-800 shadow-2xl'
            : viewportMode === 'tablet'
            ? 'max-w-[800px] p-3 bg-slate-950/50 rounded-2xl border-2 border-slate-800 shadow-xl'
            : 'w-full'
        }`}
      >
        {activeTab === 'user' ? <UserWireframes /> : <AdminWireframes />}
      </div>
    </div>
  );
}
