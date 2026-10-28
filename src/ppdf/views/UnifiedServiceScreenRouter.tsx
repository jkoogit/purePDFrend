import { useState, useEffect } from 'react';
import {
  Sparkles,
  Eye,
  Home,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { UserSystemRole, SystemSettings, GraphNode, GraphEdge } from '../../types';
import { ThemeMode, resolveThemeMode } from '../../styles/tokens';
import {
  isRealServiceScreen,
  getProgramMeta,
} from '../../shared/constants/menuRegistry';

// 1. 실서비스 컴포넌트 임포트 (Service Screens)
import PurePdfServicePortal from '../components/PurePdfServicePortal';
import { DocumentLibraryViewer } from '../components/DocumentLibraryViewer';
import { VirtualViewerStudio } from '../components/VirtualViewerStudio';
import OCRCorrectionStudio from '../components/OCRCorrectionStudio';
import OcrEngineManager from '../components/OcrEngineManager';
import OfflineTaskCleanStudio from '../components/OfflineTaskCleanStudio';
import {
  WorkGraphViewer,
  TaskInfoManager,
  AgentUsageViewer,
  IntegrityAuditManager,
  DocsGovernanceManager,
  SystemConfigManager,
} from '../../aiagent';

// 2. 관리자 실서비스 컴포넌트 임포트 (Admin Service Views)
import { AdminUsersView } from './wireframes/admin/AdminUsersView';
import { AdminProgramsView } from './wireframes/admin/AdminProgramsView';
import { AdminSecurityView } from './wireframes/admin/AdminSecurityView';
import { AdminTermsView } from './wireframes/admin/AdminTermsView';
import { AdminLogsView } from './wireframes/admin/AdminLogsView';
import { AdminUserSettingsView } from './wireframes/admin/AdminUserSettingsView';
import { AdminRolesView, AdminMenusView } from './wireframes/admin/AdminRolesAndMenusView';
import {
  AdminNotificationsView,
  AdminApiManagerView,
  AdminBoardsAndBannersView,
  AdminCustomerSupportView,
  AdminFontsView,
} from './wireframes/admin/AdminExtendedModulesView';

// 3. 와이어프레임 소스 컴포넌트 임포트 (Wireframe Fallbacks & Comparative Inspection)
import { UserWireframes } from './wireframes/UserWireframes';
import { AdminWireframes } from './wireframes/AdminWireframes';
import { DesignSystemShowcase } from './wireframes/DesignSystemShowcase';

export interface UnifiedServiceScreenRouterProps {
  currentProgId: string;
  onNavigateProgram: (type: string, progId: string) => void;
  userRole?: UserSystemRole;
  onSelectRole?: (role: UserSystemRole) => void;
  themeMode?: ThemeMode;
  onChangeThemeMode?: (mode: ThemeMode) => void;
  systemSettings?: SystemSettings | null;
  onUpdateSettings?: (settings: SystemSettings) => Promise<void>;
  dbStatus?: string;
  graphNodes?: GraphNode[];
  graphEdges?: GraphEdge[];
  isLoadingGraph?: boolean;
  onRefreshGraph?: () => void;
  traceFilter?: string;
  onNavigateToTrace?: (keyword: string) => void;
}

export function UnifiedServiceScreenRouter({
  currentProgId = 'PG-USR-01',
  onNavigateProgram,
  userRole = 'ROLE_ADMIN',
  onSelectRole,
  themeMode = 'dark',
  onChangeThemeMode,
  systemSettings = null,
  onUpdateSettings = async () => {},
  dbStatus = 'ONLINE',
  graphNodes = [],
  graphEdges = [],
  isLoadingGraph = false,
  onRefreshGraph = () => {},
  traceFilter = '',
  onNavigateToTrace = () => {},
}: UnifiedServiceScreenRouterProps) {
  const resolvedTheme = resolveThemeMode(themeMode);

  // 실서비스 화면 vs 와이어프레임 원본 비교 토글 모드
  // 실서비스가 없는 화면은 자동으로 wireframe 모드로 표시
  const [showWireframeFallback, setShowWireframeFallback] = useState(false);

  // 프로그램 변경 시 비교 모드 초기화
  useEffect(() => {
    setShowWireframeFallback(false);
  }, [currentProgId]);

  // 프로그램 메타데이터 조회 (단일 진실 원장 기준)
  const progMeta = getProgramMeta(currentProgId);

  // 각 프로그램별 실서비스 구현 여부 판정 (단일 진실 원장 기준)
  const isRealServiceAvailable = isRealServiceScreen(currentProgId);
  const isCurrentlyShowingWireframe = !isRealServiceAvailable || showWireframeFallback;


  // 홈(첫화면)으로 바로가기
  const handleGoHome = () => {
    onNavigateProgram('user', 'PG-USR-01');
  };

  // 실서비스 화면 렌더러
  const renderServiceContent = () => {
    // [1. 사용자 화면군]
    if (currentProgId === 'PG-USR-01') {
      return (
        <PurePdfServicePortal
          initialTab="landing"
          userRole={userRole}
          onSelectRole={onSelectRole}
          themeMode={themeMode}
          onChangeThemeMode={onChangeThemeMode}
          onSelectProgram={onNavigateProgram}
        />
      );
    }
    if (currentProgId === 'PG-USR-02') {
      return (
        <PurePdfServicePortal
          initialTab="landing"
          autoOpenLogin={true}
          userRole={userRole}
          onSelectRole={onSelectRole}
          themeMode={themeMode}
          onChangeThemeMode={onChangeThemeMode}
          onSelectProgram={onNavigateProgram}
        />
      );
    }
    if (currentProgId === 'PG-USR-03') {
      return (
        <PurePdfServicePortal
          initialTab="dashboard"
          userRole={userRole}
          onSelectRole={onSelectRole}
          themeMode={themeMode}
          onChangeThemeMode={onChangeThemeMode}
          onSelectProgram={onNavigateProgram}
        />
      );
    }
    if (currentProgId === 'PG-USR-04') {
      return <DocumentLibraryViewer />;
    }
    if (currentProgId === 'PG-USR-05') {
      return (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-800/40 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                대용량 스캔 PDF 듀얼 OCR 및 서치어블 PDF 변환 파이프라인
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Tesseract.js WASM 로컬 오프라인 ↔ Gemini 2.5 클라우드 멀티모달 자동 폴백 엔진
              </p>
            </div>
            <button
              onClick={() => onNavigateProgram('user', 'PG-USR-06')}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all cursor-pointer"
            >
              뷰어로 이동 ➔
            </button>
          </div>
          <OCRCorrectionStudio />
        </div>
      );
    }
    if (currentProgId === 'PG-USR-06') {
      return (
        <VirtualViewerStudio
          onNavigateToCorrection={() => onNavigateProgram('user', 'PG-USR-07')}
        />
      );
    }
    if (currentProgId === 'PG-USR-07') {
      return (
        <OCRCorrectionStudio
          onBackToViewer={() => onNavigateProgram('user', 'PG-USR-06')}
        />
      );
    }
    if (currentProgId === 'PG-USR-08') {
      return (
        <OfflineTaskCleanStudio
          themeMode={themeMode}
          onNavigateToViewer={() => onNavigateProgram('user', 'PG-USR-06')}
        />
      );
    }

    // [2. 관리자 화면군 (실서비스 뷰)]
    if (currentProgId === 'PG-ADM-01') return <AdminSecurityView />;
    if (currentProgId === 'PG-ADM-02') return <AdminProgramsView />;
    if (currentProgId === 'PG-ADM-03') return <AdminUsersView />;
    if (currentProgId === 'PG-ADM-04') return <AdminTermsView />;
    if (currentProgId === 'PG-ADM-05') return <AdminRolesView />;
    if (currentProgId === 'PG-ADM-06') return <AdminMenusView />;
    if (currentProgId === 'PG-ADM-07') return <AdminLogsView />;
    if (currentProgId === 'PG-ADM-08') return <AdminNotificationsView />;
    if (currentProgId === 'PG-ADM-09' || currentProgId === 'PG-ADM-10') return <AdminApiManagerView />;
    if (currentProgId === 'PG-ADM-11') return <AdminUserSettingsView />;
    if (currentProgId === 'PG-ADM-12') return <AdminBoardsAndBannersView />;
    if (currentProgId === 'PG-ADM-13') return <AdminCustomerSupportView />;
    if (currentProgId === 'PG-ADM-14') return <AdminFontsView />;

    // [3. 설정 시스템군 (실서비스)]
    if (currentProgId === 'PG-SET-01') {
      return (
        <OcrEngineManager
          settings={systemSettings}
          onUpdateSettings={onUpdateSettings}
          dbStatus={dbStatus}
        />
      );
    }
    if (currentProgId === 'PG-SET-02') {
      return (
        <SystemConfigManager
          settings={systemSettings}
          onUpdateSettings={onUpdateSettings}
          dbStatus={dbStatus}
        />
      );
    }
    if (currentProgId === 'PG-SET-04') {
      return <AdminFontsView />;
    }
    if (currentProgId === 'PG-SET-05') {
      return (
        <OfflineTaskCleanStudio
          themeMode={themeMode}
          onNavigateToViewer={() => onNavigateProgram('user', 'PG-USR-06')}
        />
      );
    }

    // [4. 에이전트 하네스 시스템군 (실서비스)]
    if (currentProgId === 'PG-AGN-01') {
      return (
        <WorkGraphViewer
          nodes={graphNodes}
          edges={graphEdges}
          onRefresh={onRefreshGraph}
          isLoading={isLoadingGraph}
          dbStatus={dbStatus}
        />
      );
    }
    if (currentProgId === 'PG-AGN-02') {
      return <TaskInfoManager onNavigateToTrace={onNavigateToTrace} dbStatus={dbStatus} />;
    }
    if (currentProgId === 'PG-AGN-03') {
      return <AgentUsageViewer initialFilter={traceFilter} dbStatus={dbStatus} />;
    }
    if (currentProgId === 'PG-AGN-04') {
      return <IntegrityAuditManager dbStatus={dbStatus} />;
    }
    if (currentProgId === 'PG-AGN-05') {
      return <DocsGovernanceManager dbStatus={dbStatus} />;
    }
    if (currentProgId === 'PG-AGN-06') {
      return (
        <SystemConfigManager
          settings={systemSettings}
          onUpdateSettings={onUpdateSettings}
          dbStatus={dbStatus}
        />
      );
    }

    // [5. 디자인 시스템 쇼케이스]
    if (currentProgId === 'DS-SHOWCASE') {
      return <DesignSystemShowcase />;
    }

    // 실서비스 화면이 아직 없는 경우 와이어프레임 렌더러로 폴백
    return renderWireframeContent();
  };

  // 와이어프레임 화면 렌더러 (실서비스 화면이 없거나, 기획 비교 검토용 모드)
  const renderWireframeContent = () => {
    if (currentProgId.startsWith('PG-USR-') || currentProgId === 'PG-SET-03' || currentProgId === 'PG-SET-05') {
      const targetProg =
        currentProgId === 'PG-SET-03' ? 'PG-USR-09' :
        currentProgId === 'PG-SET-05' ? 'PG-USR-08' :
        currentProgId;
      return <UserWireframes initialProgId={targetProg} />;
    }
    if (currentProgId.startsWith('PG-ADM-')) {
      return <AdminWireframes initialProgId={currentProgId} />;
    }
    return <DesignSystemShowcase />;
  };

  const isDefaultLanding = currentProgId === 'PG-USR-01' && !showWireframeFallback;

  return (
    <div className={`w-full flex flex-col ${isDefaultLanding ? 'space-y-0 pb-6' : 'space-y-4 pb-16'} animate-fadeIn`}>
      {/* =================================================================== */}
      {/* 통합 라우터 상태 & 소스 분리 컨트롤 바 (Router Status & Dual View Bar) */}
      {/* 첫화면(PG-USR-01) 실서비스 모드에서는 컨트롤바를 숨겨 완전한 순수 랜딩 화면 보장 */}
      {/* =================================================================== */}
      {!isDefaultLanding && (
        <div
          className={`w-full p-3 sm:p-4 rounded-2xl border transition-colors duration-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-md ${
            resolvedTheme === 'light'
              ? 'bg-white border-slate-200 text-slate-800'
              : resolvedTheme === 'dawn'
              ? 'bg-[#0b142d] border-[#1e3066] text-slate-100'
              : 'bg-slate-900 border-slate-800 text-slate-100'
          }`}
        >
        {/* 좌측: 프로그램 식별자 및 서비스 뱃지 */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-bold">
            {progMeta.id}
          </span>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold leading-tight">
                {progMeta.name}
              </h2>

              {/* 서비스 화면 vs 와이어프레임 성격 뱃지 */}
              {isCurrentlyShowingWireframe ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <AlertCircle className="w-3 h-3 text-amber-400" />
                  와이어프레임 설계 화면 (실서비스 미구현 검토용)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  실제 서비스 화면 구동 중
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 leading-tight mt-0.5">
              {progMeta.desc}
            </p>
          </div>
        </div>

        {/* 우측: 듀얼 모드 비교 토글 및 첫화면 홈 복귀 액션 */}
        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          {/* 실서비스 화면이 존재할 때: 와이어프레임 원본과 1:1 비교 검토 토글 스위치 */}
          {isRealServiceAvailable && (
            <button
              onClick={() => setShowWireframeFallback((prev) => !prev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                showWireframeFallback
                  ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-600/30'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title="기획/설계 와이어프레임 원본과 1:1 비교 검토 모드 전환"
            >
              {showWireframeFallback ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>실서비스 화면으로 복귀</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>와이어프레임 원본 비교</span>
                </>
              )}
            </button>
          )}

          {/* 첫 화면(랜딩) 즉시 복귀 버튼 */}
          {currentProgId !== 'PG-USR-01' && (
            <button
              onClick={handleGoHome}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
              title="기본 엔드유저 실제 첫화면(랜딩)으로 즉시 복귀"
            >
              <Home className="w-3.5 h-3.5" />
              <span>첫화면(랜딩)</span>
            </button>
          )}
        </div>
      </div>
      )}

      {/* =================================================================== */}
      {/* 메인 화면 렌더링 영역 (실서비스 우선, 부재 시 와이어프레임 소스 가져옴) */}
      {/* =================================================================== */}
      <div className="w-full">
        {isCurrentlyShowingWireframe ? renderWireframeContent() : renderServiceContent()}
      </div>
    </div>
  );
}

export default UnifiedServiceScreenRouter;
