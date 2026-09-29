import { useState } from 'react';
import { AdminWireframes } from './AdminWireframes';
import { UserWireframes } from './UserWireframes';
import { HorizontalSlideContainer } from '../../components/HorizontalSlideContainer';

export function WireframeStudio() {
  const [activeTab, setActiveTab] = useState<'admin' | 'user'>('user');
  const [viewportMode, setViewportMode] = useState<'full' | 'tablet' | 'mobile'>('full');

  return (
    <div className="space-y-6">
      {/* 상단 컨트롤 바: 도메인 전환 & 뷰포트 프리뷰 스위처 */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20 shrink-0">
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

        {/* 도메인 선택 탭 & 뷰포트 스위처 (가로 슬라이드 래퍼 적용) */}
        <div className="w-full md:w-auto overflow-hidden">
          <HorizontalSlideContainer showScrollButtons={false} className="w-full md:w-auto">
            {/* 도메인 전환 버튼 */}
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center text-xs shrink-0">
              <button
                onClick={() => setActiveTab('user')}
                className={`px-3.5 py-2 min-h-[40px] rounded-lg font-medium transition-all shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'user'
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>📱</span>
                <span>사용자 서비스 (9개 화면)</span>
              </button>
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-3.5 py-2 min-h-[40px] rounded-lg font-medium transition-all shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'admin'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>🛠</span>
                <span>관리자 서비스 (16개 화면)</span>
              </button>
            </div>

            {/* 뷰포트 시뮬레이션 */}
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center text-xs shrink-0">
              <button
                onClick={() => setViewportMode('full')}
                className={`px-3 py-2 min-h-[40px] rounded-lg transition-all shrink-0 flex items-center gap-1 ${
                  viewportMode === 'full' ? 'bg-slate-800 text-white font-medium shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="데스크톱 100% 뷰"
              >
                <span>🖥</span>
                <span>PC (100%)</span>
              </button>
              <button
                onClick={() => setViewportMode('tablet')}
                className={`px-3 py-2 min-h-[40px] rounded-lg transition-all shrink-0 flex items-center gap-1 ${
                  viewportMode === 'tablet' ? 'bg-slate-800 text-white font-medium shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="태블릿 768px 뷰"
              >
                <span>📟</span>
                <span>태블릿 (768px)</span>
              </button>
              <button
                onClick={() => setViewportMode('mobile')}
                className={`px-3 py-2 min-h-[40px] rounded-lg transition-all shrink-0 flex items-center gap-1 ${
                  viewportMode === 'mobile' ? 'bg-slate-800 text-white font-medium shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="모바일 390px 뷰"
              >
                <span>📱</span>
                <span>모바일 (390px)</span>
              </button>
            </div>
          </HorizontalSlideContainer>
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
        {activeTab === 'user' ? (
          <UserWireframes isMobileMode={viewportMode === 'mobile'} />
        ) : (
          <AdminWireframes isMobileMode={viewportMode === 'mobile'} />
        )}
      </div>
    </div>
  );
}
