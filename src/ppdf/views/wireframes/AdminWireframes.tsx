import { useState, useEffect } from 'react';
import { Button, Badge, Card } from '@shared/components/ui';
import { ViewerConfigRegistry } from '../../domain/ViewerConfigRegistry';
import { IconResourceRegistry } from '../../domain/IconResourceRegistry';
import { WireframeTopLayer } from '../../components/WireframeTopLayer';
import { ThemeMode, resolveThemeMode, getThemeAdaptiveClasses } from '../../../styles/tokens';

// Modular Admin Views (13대 개선 요구사항 반영)
import { AdminSecurityView } from './admin/AdminSecurityView';
import { AdminProgramsView } from './admin/AdminProgramsView';
import { AdminUsersView } from './admin/AdminUsersView';
import { AdminTermsView } from './admin/AdminTermsView';
import { AdminRolesView, AdminMenusView } from './admin/AdminRolesAndMenusView';
import { AdminLogsView } from './admin/AdminLogsView';
import { AdminUserSettingsView } from './admin/AdminUserSettingsView';
import {
  AdminNotificationsView,
  AdminApiManagerView,
  AdminBoardsAndBannersView,
  AdminCustomerSupportView,
  AdminFontsView,
} from './admin/AdminExtendedModulesView';

import { AdminShell } from './shells/AdminShell';

export const ADMIN_PROGRAMS = [
  { id: 'PG-ADM-01', name: '보안관리', desc: '화이트리스트 & 블랙리스트, 2FA 강제화, 세션만료, 오프라인 토큰' },
  { id: 'PG-ADM-02', name: '프로그램관리', desc: '프로그램 등록/수정/삭제, DAG 순환방지, 다중권한 설정' },
  { id: 'PG-ADM-03', name: '사용자관리', desc: '프로필 사진, 상세조회, 다중 권한 부여, 스토리지/오프라인 관리' },
  { id: 'PG-ADM-04', name: '약관·동의·정책', desc: '약관검색, 적용버전만 보기, 이전약관 수정 새파일등록 v1.0/v1.1 버전발행' },
  { id: 'PG-ADM-05', name: '사용자 권한관리', desc: '3대 탭: 권한관리 / 프로그램권한관리 / 사용자권한관리' },
  { id: 'PG-ADM-06', name: '메뉴관리', desc: '메뉴 등록/수정/삭제, 위치 관리, 화면 프로그램 매핑' },
  { id: 'PG-ADM-07', name: '로그관리', desc: '다차원 감사로그 필터, PDF 다운로드 및 주석 변경 추적 타임라인' },
  { id: 'PG-ADM-08', name: '알림관리', desc: '공지(점검안내), OCR 완료안내, 개인알림 대상여부 설정' },
  { id: 'PG-ADM-09', name: 'API 연동관리 (내부/외부 통합)', desc: '내부 서비스 API(OCR 배치, Core 엔진) 및 외부 연동 API(OAuth, Gemini AI) 단일 통합 관리' },
  { id: 'PG-ADM-11', name: '사용자설정 항목관리', desc: '사용자 환경설정 메타데이터 등록(체크박스/드롭다운), 기본값 배포' },
  { id: 'PG-ADM-12', name: '게시판·배너관리', desc: '예약공지, 다시열지않기(하루/주/월), 배너 텍스트/이미지 순서 설정' },
  { id: 'PG-ADM-13', name: '고객관리', desc: '3대 탭: FAQ 그룹관리, 공개 QNA 관리자/등록자 알림, 1:1 비공개 상담' },
  { id: 'PG-ADM-14', name: '무료글꼴관리', desc: '글꼴 등록/수정/삭제, 웹폰트 WOFF2/TTF, 적용여부, 실시간 프리뷰' },
  { id: 'PG-ADM-15', name: '단축키 및 도구아이콘 관리', desc: '시스템 기본 vs 사용자 커스텀 우선, 도구별 아이콘 디자인 리소스 변경' },
  { id: 'PG-ADM-16', name: '도구그룹관리', desc: '8대 뷰어모드별 기본도구 편성, 변경 시 영향도 검토(Impact Analysis)' },
];

export interface AdminWireframesProps {
  isMobileMode?: boolean;
  initialProgId?: string;
  themeMode?: ThemeMode;
}

export function AdminWireframes({ isMobileMode = false, initialProgId, themeMode: propThemeMode }: AdminWireframesProps) {
  const [selectedProg, setSelectedProg] = useState('PG-ADM-01');

  useEffect(() => {
    if (initialProgId && ADMIN_PROGRAMS.some((p) => p.id === initialProgId)) {
      setSelectedProg(initialProgId);
    }
  }, [initialProgId]);

  // 4모드 테마 실시간 감지 및 동기화 (Light, Dark, Dawn, System)
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('purepdfrend_theme_mode');
      if (saved && ['light', 'dark', 'dawn', 'system'].includes(saved)) {
        return saved as ThemeMode;
      }
    } catch {}
    return propThemeMode || 'dark';
  });

  useEffect(() => {
    const handleThemeChange = () => {
      try {
        const saved = localStorage.getItem('purepdfrend_theme_mode');
        if (saved && ['light', 'dark', 'dawn', 'system'].includes(saved)) {
          setThemeMode(saved as ThemeMode);
        }
      } catch {}
    };
    window.addEventListener('storage', handleThemeChange);

    const observer = new MutationObserver(() => {
      const domTheme = document.documentElement.getAttribute('data-theme-mode') as ThemeMode;
      if (domTheme && ['light', 'dark', 'dawn', 'system'].includes(domTheme)) {
        setThemeMode(domTheme);
      }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme-mode', 'class'] });

    return () => {
      window.removeEventListener('storage', handleThemeChange);
      observer.disconnect();
    };
  }, []);

  const resolvedTheme = resolveThemeMode(themeMode);
  const themeClasses = getThemeAdaptiveClasses(resolvedTheme);

  const [shortcutPriority, setShortcutPriority] = useState<'SYSTEM' | 'CUSTOM'>('CUSTOM');
  const [shortcutViewMode, setShortcutViewMode] = useState<'CARDS' | 'TABLE'>('CARDS');

  // Registry for PG-ADM-15 & PG-ADM-16
  const registry = ViewerConfigRegistry.getInstance();
  const [configState, setConfigState] = useState(() => registry.getConfig());
  const [impactNotice, setImpactNotice] = useState<string | null>(null);
  const [customUploadedIcons, setCustomUploadedIcons] = useState<Record<string, string>>({});

  // 단축키 복합 기능키 조합 파서 & 빌더
  const parseShortcut = (sc: string) => {
    const parts = (sc || '').split('+').map((p) => p.trim());
    const hasCtrl = parts.some((p) => p.toLowerCase() === 'ctrl' || p.toLowerCase() === 'control');
    const hasShift = parts.some((p) => p.toLowerCase() === 'shift');
    const hasAlt = parts.some((p) => p.toLowerCase() === 'alt');
    const mainKey = parts.filter((p) => !['ctrl', 'control', 'shift', 'alt'].includes(p.toLowerCase())).pop() || '';
    return { hasCtrl, hasShift, hasAlt, mainKey };
  };

  const buildShortcut = (hasCtrl: boolean, hasShift: boolean, hasAlt: boolean, mainKey: string) => {
    const parts: string[] = [];
    if (hasCtrl) parts.push('Ctrl');
    if (hasShift) parts.push('Shift');
    if (hasAlt) parts.push('Alt');
    const cleanKey = (mainKey || '').trim().toUpperCase();
    if (cleanKey) parts.push(cleanKey);
    return parts.join(' + ') || cleanKey;
  };

  const handleToolIconChange = (toolId: string, resKey: string) => {
    const updated = registry.updateToolIcon(toolId, resKey);
    setConfigState(updated);
  };

  const handleShortcutChange = (toolId: string, key: string) => {
    const updated = registry.updateShortcut(toolId, key);
    setConfigState(updated);
  };

  const handleResetShortcutsAndIcons = () => {
    const updated = registry.resetToDefault();
    setConfigState(updated);
  };

  return (
    <AdminShell
      currentProgId={selectedProg}
      programs={ADMIN_PROGRAMS}
      onSelectProg={setSelectedProg}
      isMobileMode={isMobileMode}
      themeMode={themeMode}
    >
      {/* 실제 프로덕션 대상 순수 화면 캔버스 */}
      <div className={`${themeClasses.container} border ${themeClasses.panel} rounded-2xl ${isMobileMode ? 'p-2.5 sm:p-4' : 'p-5'} shadow-2xl space-y-6 min-h-[540px] ${themeClasses.textMain}`}>
        {/* 모든 화면 공통 상단 탑 레이어 */}
        <WireframeTopLayer
          currentProgramId={selectedProg}
          isLoggedIn={true}
          userRole="시스템총괄관리자"
          isMobileMode={isMobileMode}
          onNavigate={(progId) => setSelectedProg(progId)}
        />

        {/* 현재 활성 프로그램 타이틀 헤더 */}
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/40 gap-2`}>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {selectedProg}
              </span>
              <h2 className="text-base font-bold">
                {ADMIN_PROGRAMS.find((p) => p.id === selectedProg)?.name}
              </h2>
            </div>
            <p className={`text-xs mt-1 ${themeClasses.textMuted}`}>
              {ADMIN_PROGRAMS.find((p) => p.id === selectedProg)?.desc}
            </p>
          </div>
        </div>

        {/* 1. PG-ADM-01: 보안관리 (화이트리스트 & 블랙리스트, 2FA, 토큰) */}
        {selectedProg === 'PG-ADM-01' && <AdminSecurityView themeMode={themeMode} />}

        {/* 2 & 3. PG-ADM-02: 프로그램관리 (프로그램 등록/수정/삭제, DAG 순환방지, 다중권한) */}
        {selectedProg === 'PG-ADM-02' && <AdminProgramsView themeMode={themeMode} />}

        {/* 4. PG-ADM-03: 사용자관리 (프로필 사진, 상세조회, 다중권한 설정, 스토리지/오프라인) */}
        {selectedProg === 'PG-ADM-03' && <AdminUsersView themeMode={themeMode} />}

        {/* 7. PG-ADM-04: 약관·동의·정책 (약관검색, 적용버전만 보기, 이전약관 수정 새파일등록 v1.0/v1.1) */}
        {selectedProg === 'PG-ADM-04' && <AdminTermsView themeMode={themeMode} />}

        {/* 6. PG-ADM-05: 사용자 권한관리 (3대 서브탭: 권한관리 / 프로그램권한관리 / 사용자권한관리) */}
        {selectedProg === 'PG-ADM-05' && <AdminRolesView themeMode={themeMode} />}

        {/* 5. PG-ADM-06: 메뉴관리 (메뉴 등록/수정/삭제, 위치 관리, 화면 매핑) */}
        {selectedProg === 'PG-ADM-06' && <AdminMenusView themeMode={themeMode} />}

        {/* PG-ADM-07: 로그관리 & PG-ADM-08 에러 스택 추적 모달 */}
        {selectedProg === 'PG-ADM-07' && <AdminLogsView themeMode={themeMode} />}

        {/* 8. PG-ADM-08: 알림관리 */}
        {selectedProg === 'PG-ADM-08' && <AdminNotificationsView themeMode={themeMode} />}

        {/* 9. PG-ADM-09 & PG-ADM-10: API 관리 */}
        {(selectedProg === 'PG-ADM-09' || selectedProg === 'PG-ADM-10') && <AdminApiManagerView themeMode={themeMode} />}

        {/* PG-ADM-11: 사용자설정 항목관리 */}
        {selectedProg === 'PG-ADM-11' && <AdminUserSettingsView themeMode={themeMode} />}

        {/* 10. PG-ADM-12: 게시판·배너관리 */}
        {selectedProg === 'PG-ADM-12' && <AdminBoardsAndBannersView themeMode={themeMode} />}

        {/* 11. PG-ADM-13: 고객관리 */}
        {selectedProg === 'PG-ADM-13' && <AdminCustomerSupportView themeMode={themeMode} />}

        {/* 12. PG-ADM-14: 무료글꼴관리 */}
        {selectedProg === 'PG-ADM-14' && <AdminFontsView themeMode={themeMode} />}

        {/* 13. PG-ADM-15: 단축키 및 도구아이콘 관리 */}
        {selectedProg === 'PG-ADM-15' && (
          <div className="space-y-4 text-xs">
            <Card variant="subtle" className={`p-4 space-y-3 border ${themeClasses.card}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/40">
                <div>
                  <span className="font-bold text-sm block">🎨 뷰어 도구별 아이콘 디자인 리소스 및 단축키 관리</span>
                  <p className={`text-[11px] mt-0.5 ${themeClasses.textMuted}`}>
                    도구별 아이콘 디자인 리소스(Filled, Outlined, Modern) 변경 및 시스템 기본 vs 사용자 커스텀 단축키 우선순위를 설정합니다.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={handleResetShortcutsAndIcons} className="text-xs min-h-[36px] sm:min-h-[28px]">
                    기본값 복원
                  </Button>
                  <Button variant="primary" size="sm" className="text-xs min-h-[36px] sm:min-h-[28px]">
                    전체 사용자 배포
                  </Button>
                </div>
              </div>

              {/* 보기 모드 및 단축키 우선순위 정책 컨트롤 */}
              <div className={`p-3 rounded-xl border flex flex-col md:flex-row justify-between items-center gap-3 ${themeClasses.panel}`}>
                <div>
                  <span className="font-bold text-indigo-400">⌨️ 단축키 우선순위 정책 (Shortcut Priority Policy)</span>
                  <p className={`text-[11px] ${themeClasses.textMuted}`}>사용자가 개인 설정한 커스텀 단축키와 시스템 기본 단축키 간의 충돌 시 우선 적용할 기준입니다.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className={`flex gap-1 p-1 rounded-lg border ${themeClasses.card}`}>
                    <Button
                      variant={shortcutPriority === 'SYSTEM' ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => setShortcutPriority('SYSTEM')}
                      className="text-xs px-2.5 py-1 min-h-[32px]"
                    >
                      시스템 기본 우선
                    </Button>
                    <Button
                      variant={shortcutPriority === 'CUSTOM' ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => setShortcutPriority('CUSTOM')}
                      className="text-xs px-2.5 py-1 min-h-[32px]"
                    >
                      사용자 커스텀 우선
                    </Button>
                  </div>
                  <div className={`flex gap-1 p-1 rounded-lg border ${themeClasses.card}`}>
                    <Button
                      variant={shortcutViewMode === 'CARDS' ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => setShortcutViewMode('CARDS')}
                      className="text-xs px-2.5 py-1 min-h-[32px]"
                    >
                      🗂️ 가로형 카드
                    </Button>
                    <Button
                      variant={shortcutViewMode === 'TABLE' ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => setShortcutViewMode('TABLE')}
                      className="text-xs px-2.5 py-1 min-h-[32px]"
                    >
                      📋 테이블 보기
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* 가로형 카드 목록 - 너비 초과 시 자동 줄바꿈 */}
            {shortcutViewMode === 'CARDS' ? (
              <div className="flex flex-wrap gap-3.5 items-stretch">
                {registry.getAllTools().slice(0, 10).map((tool) => {
                  const availableResources = IconResourceRegistry.getResourcesForTool(tool.id);
                  const currentResKey = configState.toolIcons?.[tool.id] || (availableResources[0]?.resourceKey ?? '');
                  const currentShortcut = configState.shortcuts?.[tool.id] || tool.defaultKey;
                  const scInfo = parseShortcut(currentShortcut);
                  const customIconFile = customUploadedIcons[tool.id];

                  return (
                    <Card
                      key={tool.id}
                      variant="subtle"
                      className={`p-3.5 flex flex-col justify-between gap-2.5 min-w-[280px] flex-1 basis-[320px] max-w-[460px] shadow-sm border ${themeClasses.card}`}
                    >
                      {/* 상단: 아이콘 + 도구명 + ID + 단축키 칩 */}
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className={`text-2xl p-1.5 rounded-lg border text-center w-10 h-10 flex items-center justify-center flex-shrink-0 ${themeClasses.panel}`}>
                            {tool.icon}
                          </span>
                          <div>
                            <div className="font-bold text-xs">{tool.name}</div>
                            <div className="font-mono opacity-60 text-[10px]">{tool.id}</div>
                          </div>
                        </div>
                        <Badge variant="warning" size="sm" className="font-mono">
                          {currentShortcut || '미설정'}
                        </Badge>
                      </div>

                      {/* 단축키 복합키 조합 설정 */}
                      <div className={`p-2 rounded-lg border space-y-1 ${themeClasses.panel}`}>
                        <span className={`text-[10px] block font-medium ${themeClasses.textMuted}`}>단축키 복합키 조합 (Ctrl+Shift):</span>
                        <div className="flex items-center gap-2 text-[10px]">
                          <label className="flex items-center gap-0.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={scInfo.hasCtrl}
                              onChange={(e) => {
                                const next = buildShortcut(e.target.checked, scInfo.hasShift, scInfo.hasAlt, scInfo.mainKey);
                                handleShortcutChange(tool.id, next);
                              }}
                              className="accent-indigo-500 w-3 h-3 cursor-pointer"
                            />
                            <span>Ctrl</span>
                          </label>
                          <label className="flex items-center gap-0.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={scInfo.hasShift}
                              onChange={(e) => {
                                const next = buildShortcut(scInfo.hasCtrl, e.target.checked, scInfo.hasAlt, scInfo.mainKey);
                                handleShortcutChange(tool.id, next);
                              }}
                              className="accent-indigo-500 w-3 h-3 cursor-pointer"
                            />
                            <span>Shift</span>
                          </label>
                          <label className="flex items-center gap-0.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={scInfo.hasAlt}
                              onChange={(e) => {
                                const next = buildShortcut(scInfo.hasCtrl, scInfo.hasShift, e.target.checked, scInfo.mainKey);
                                handleShortcutChange(tool.id, next);
                              }}
                              className="accent-indigo-500 w-3 h-3 cursor-pointer"
                            />
                            <span>Alt</span>
                          </label>
                          <span className="opacity-50">+</span>
                          <input
                            type="text"
                            maxLength={3}
                            value={scInfo.mainKey}
                            onChange={(e) => {
                              const next = buildShortcut(scInfo.hasCtrl, scInfo.hasShift, scInfo.hasAlt, e.target.value);
                              handleShortcutChange(tool.id, next);
                            }}
                            className={`w-10 rounded px-1 py-0.5 text-center font-mono text-amber-400 text-xs font-bold border focus:border-indigo-500 outline-none ${themeClasses.input}`}
                          />
                        </div>
                      </div>

                      <div className={`text-[11px] line-clamp-2 ${themeClasses.textMuted}`}>{tool.desc}</div>

                      {/* 하단: 아이콘 리소스 및 파일 첨부 */}
                      <div className="pt-2 border-t border-slate-800/40 space-y-1.5">
                        {availableResources.length > 0 && (
                          <select
                            value={currentResKey}
                            onChange={(e) => handleToolIconChange(tool.id, e.target.value)}
                            className={`w-full rounded-lg px-2 py-1 text-xs min-h-[44px] sm:min-h-[32px] ${themeClasses.input}`}
                          >
                            {availableResources.map((res) => (
                              <option key={res.resourceKey} value={res.resourceKey}>
                                {res.symbol} {res.label} ({res.style})
                              </option>
                            ))}
                          </select>
                        )}

                        <div className="flex items-center gap-1.5 pt-0.5">
                          <label className={`px-2 py-1 rounded border text-[10px] cursor-pointer flex items-center gap-1 whitespace-nowrap min-h-[32px] ${themeClasses.buttonSecondary}`}>
                            <span>📎 아이콘 첨부</span>
                            <input
                              type="file"
                              accept=".svg,.png,.webp,.ico"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  const fn = e.target.files[0].name;
                                  setCustomUploadedIcons((prev) => ({ ...prev, [tool.id]: fn }));
                                }
                              }}
                            />
                          </label>
                          {customIconFile ? (
                            <span className="text-[10px] text-emerald-400 font-mono truncate max-w-[140px]" title={customIconFile}>
                              ✓ {customIconFile}
                            </span>
                          ) : (
                            <span className={`text-[10px] ${themeClasses.textMuted}`}>기본/프리셋</span>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              /* 데스크톱 테이블 뷰 */
              <div className={`overflow-x-auto rounded-xl border shadow-sm ${themeClasses.panel}`}>
                <table className="w-full text-left">
                  <thead className={`border-b border-slate-800 ${themeClasses.shellBg} ${themeClasses.textMuted}`}>
                    <tr>
                      <th className="p-3">도구 ID</th>
                      <th className="p-3">도구 명칭</th>
                      <th className="p-3">현재 아이콘</th>
                      <th className="p-3">아이콘 리소스 & 파일 첨부</th>
                      <th className="p-3">단축키 (Ctrl+Shift 조합)</th>
                      <th className="p-3">기능 설명</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 font-mono text-[11px]">
                    {registry.getAllTools().slice(0, 10).map((tool) => {
                      const availableResources = IconResourceRegistry.getResourcesForTool(tool.id);
                      const currentResKey = configState.toolIcons?.[tool.id] || (availableResources[0]?.resourceKey ?? '');
                      const currentShortcut = configState.shortcuts?.[tool.id] || tool.defaultKey;
                      const scInfo = parseShortcut(currentShortcut);
                      const customIconFile = customUploadedIcons[tool.id];

                      return (
                        <tr key={tool.id} className="hover:bg-slate-800/20 transition-colors">
                          <td className={`p-3 ${themeClasses.textMuted}`}>{tool.id}</td>
                          <td className="p-3 font-sans font-medium">{tool.name}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xl inline-block w-7 text-center">{tool.icon}</span>
                              {customIconFile && (
                                <Badge variant="primary" size="sm">
                                  📎 파일
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="p-3 space-y-1">
                            {availableResources.length > 0 ? (
                              <select
                                value={currentResKey}
                                onChange={(e) => handleToolIconChange(tool.id, e.target.value)}
                                className={`rounded-lg px-2 py-1 text-xs font-sans w-full min-h-[44px] sm:min-h-[32px] ${themeClasses.input}`}
                              >
                                {availableResources.map((res) => (
                                  <option key={res.resourceKey} value={res.resourceKey}>
                                    {res.symbol} {res.label} ({res.style})
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className={`font-sans block ${themeClasses.textMuted}`}>단일 기본 리소스</span>
                            )}

                            <div className="flex items-center gap-1.5 pt-0.5">
                              <label className={`px-2 py-0.5 rounded border text-[10px] cursor-pointer flex items-center gap-1 whitespace-nowrap min-h-[28px] ${themeClasses.buttonSecondary}`}>
                                <span>📎 파일 첨부</span>
                                <input
                                  type="file"
                                  accept=".svg,.png,.webp,.ico"
                                  className="hidden"
                                  onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                      const fn = e.target.files[0].name;
                                      setCustomUploadedIcons((prev) => ({ ...prev, [tool.id]: fn }));
                                    }
                                  }}
                                />
                              </label>
                              {customIconFile ? (
                                <span className="text-[10px] text-emerald-400 font-mono truncate max-w-[120px]" title={customIconFile}>
                                  ✓ {customIconFile}
                                </span>
                              ) : (
                                <span className={`text-[10px] ${themeClasses.textMuted}`}>기본/프리셋</span>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5 text-[10px]">
                                <label className="flex items-center gap-0.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={scInfo.hasCtrl}
                                    onChange={(e) => {
                                      const next = buildShortcut(e.target.checked, scInfo.hasShift, scInfo.hasAlt, scInfo.mainKey);
                                      handleShortcutChange(tool.id, next);
                                    }}
                                    className="accent-indigo-500 w-3 h-3"
                                  />
                                  <span>Ctrl</span>
                                </label>
                                <label className="flex items-center gap-0.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={scInfo.hasShift}
                                    onChange={(e) => {
                                      const next = buildShortcut(scInfo.hasCtrl, e.target.checked, scInfo.hasAlt, scInfo.mainKey);
                                      handleShortcutChange(tool.id, next);
                                    }}
                                    className="accent-indigo-500 w-3 h-3"
                                  />
                                  <span>Shift</span>
                                </label>
                                <label className="flex items-center gap-0.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={scInfo.hasAlt}
                                    onChange={(e) => {
                                      const next = buildShortcut(scInfo.hasCtrl, scInfo.hasShift, e.target.checked, scInfo.mainKey);
                                      handleShortcutChange(tool.id, next);
                                    }}
                                    className="accent-indigo-500 w-3 h-3"
                                  />
                                  <span>Alt</span>
                                </label>
                                <input
                                  type="text"
                                  maxLength={3}
                                  value={scInfo.mainKey}
                                  onChange={(e) => {
                                    const next = buildShortcut(scInfo.hasCtrl, scInfo.hasShift, scInfo.hasAlt, e.target.value);
                                    handleShortcutChange(tool.id, next);
                                  }}
                                  className={`w-8 rounded px-1 py-0.5 text-center font-mono text-amber-400 text-xs font-bold border ${themeClasses.input}`}
                                />
                              </div>
                              <span className="font-mono text-amber-400 font-bold text-[11px]">
                                {currentShortcut || '미설정'}
                              </span>
                            </div>
                          </td>
                          <td className={`p-3 font-sans ${themeClasses.textMuted}`}>{tool.desc}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 13. PG-ADM-16: 도구그룹관리 */}
        {selectedProg === 'PG-ADM-16' && (
          <div className="space-y-4 text-xs">
            <Card variant="subtle" className={`p-4 space-y-3 border ${themeClasses.card}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/40">
                <div>
                  <span className="font-bold text-sm block">🗂️ 8대 뷰어 모드별 기본 도구 그룹 편성 관리</span>
                  <p className={`text-[11px] mt-0.5 ${themeClasses.textMuted}`}>
                    보기, 주석달기, 그리기, 작성및서명, 변환, 양식준비, 삽입, 즐겨찾기 그룹의 기본 도구 구성을 정의합니다.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" defaultChecked className="accent-indigo-500" />
                    <span>그룹 간 도구 중복 편성 허용</span>
                  </label>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setImpactNotice('✅ 도구그룹 기본값이 성공적으로 배포되었습니다. 활성 세션 사용자 3,820명의 툴바에 자동 반영됩니다.')}
                    className="text-xs min-h-[36px] sm:min-h-[28px]"
                  >
                    그룹 기본값 배포
                  </Button>
                </div>
              </div>

              {/* 변경 시 영향도 검토 패널 */}
              <div className={`p-3.5 rounded-xl border space-y-2 ${themeClasses.panel}`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-400 flex items-center gap-1.5">
                    <span>⚠️</span>
                    <span>도구 그룹 변경 시 영향도 검토 (Impact Analysis)</span>
                  </span>
                  <Badge variant="primary" size="sm">실시간 연동 영향도 분석</Badge>
                </div>
                <p className={`text-[11px] ${themeClasses.textMuted}`}>
                  설정한 도구 그룹을 변경하여 배포할 경우, 사용자의 커스텀 툴바 프리셋에 즉각적인 레이아웃 변동이 발생합니다.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
                  <div className={`p-2 rounded-lg border ${themeClasses.card}`}>
                    <span className={`block ${themeClasses.textMuted}`}>영향받는 활성 사용자:</span>
                    <strong className="text-emerald-400">3,820명</strong>
                  </div>
                  <div className={`p-2 rounded-lg border ${themeClasses.card}`}>
                    <span className={`block ${themeClasses.textMuted}`}>영향받는 뷰어 모드:</span>
                    <strong className="text-sky-400">8대 모드 전체 (View, Annotate, Draw...)</strong>
                  </div>
                  <div className={`p-2 rounded-lg border ${themeClasses.card}`}>
                    <span className={`block ${themeClasses.textMuted}`}>동기화 전파 지연:</span>
                    <strong className="text-indigo-400">&lt; 0.2초 (WebSocket/SSE)</strong>
                  </div>
                </div>
              </div>
            </Card>

            {impactNotice && (
              <div className="p-3 bg-emerald-950/70 border border-emerald-500/40 rounded-xl text-emerald-200 flex justify-between items-center shadow-lg">
                <span className="font-medium">{impactNotice}</span>
                <button onClick={() => setImpactNotice(null)} className="text-emerald-400 hover:text-white px-2">✕</button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { grp: '보기 (View)', count: 2, tools: ['손 도구 (✋)', '텍스트 선택 (🔤)'] },
                { grp: '주석달기 (Annotate)', count: 6, tools: ['펜 (✏️)', '붓 (🖌️)', '형광펜 (🖍️)', '밑줄 (➖)', '취소선 (❌)', '직사각형 (▭)'] },
                { grp: '그리기 (Draw)', count: 5, tools: ['직사각형 (▭)', '원형 (◯)', '화살표 (➔)', '직선 (╱)', '지우개 (🧹)'] },
                { grp: '작성 및 서명 (Sign)', count: 4, tools: ['서명 패드 (🖋️)', '날짜 스탬프 (📅)', '체크 (✔️)', '승인 도장 (💮)'] },
                { grp: '변환 (Convert)', count: 2, tools: ['JPG 이미지 (🖼️)', 'Word 변환 (📄)'] },
                { grp: '양식 준비 (Form)', count: 2, tools: ['입력 필드 (📝)', '체크박스 (☑️)'] },
                { grp: '삽입 (Insert)', count: 3, tools: ['빈 페이지 (➕)', '외부 이미지 (📎)', '스캔 (📷)'] },
                { grp: '즐겨찾기 (Favorite)', count: 5, tools: ['펜', '형광펜', '댓글', '직사각형', '서명'] },
              ].map((g) => (
                <Card key={g.grp} variant="subtle" className={`p-3 space-y-2 border ${themeClasses.card}`}>
                  <div className="flex justify-between items-center pb-1.5 border-b border-slate-800/40">
                    <span className="font-semibold">{g.grp}</span>
                    <Badge variant="neutral" size="sm">{g.count}개</Badge>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {g.tools.map((t) => (
                      <span key={t} className={`px-1.5 py-0.5 rounded text-[11px] border ${themeClasses.panel}`}>
                        {t}
                      </span>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
