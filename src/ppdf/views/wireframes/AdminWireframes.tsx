import { useState } from 'react';
import { ViewerConfigRegistry } from '../../domain/ViewerConfigRegistry';
import { IconResourceRegistry } from '../../domain/IconResourceRegistry';
import { HorizontalSlideContainer } from '../../components/HorizontalSlideContainer';
import { WireframeTopLayer } from '../../components/WireframeTopLayer';

export const ADMIN_PROGRAMS = [
  { id: 'PG-ADM-01', name: '보안관리', desc: 'IP접근제어, 2FA 강제화, 세션만료, 오프라인 토큰기간 설정' },
  { id: 'PG-ADM-02', name: '프로그램관리', desc: '화면 프로그램 계층, 부모-자식 트리, DAG 순환참조 방지' },
  { id: 'PG-ADM-03', name: '사용자관리', desc: '회원상태, 오프라인 사용허용, 스토리지(NAS/FTP/Drive), 개인정보 불변원칙' },
  { id: 'PG-ADM-04', name: '약관·동의·정책', desc: '웹문서 기반 8대 약관 에디터, 문서그룹ID 기반 버전 발행, 동의이력' },
  { id: 'PG-ADM-05', name: '사용자 권한관리', desc: 'RBAC 권한그룹 우선순위, 개별 프로그램 권한 최우선 오버라이드' },
  { id: 'PG-ADM-06', name: '메뉴관리', desc: '프로그램ID 기반 메뉴순서 드래그, 관리자/사용자 메뉴 분리, 노출/숨김' },
  { id: 'PG-ADM-07', name: '로그관리', desc: '다차원 감사로그 필터, PDF 다운로드 및 주석 변경 추적 타임라인' },
  { id: 'PG-ADM-08', name: '알림관리', desc: '이메일/푸시/인앱 3대 채널 발송, 긴급/일반 공지 모달, 수신확인율' },
  { id: 'PG-ADM-09', name: '서비스 API관리', desc: 'PDF Core 엔진 헬스, OCR API 지연시간, 보안 엔드포인트 모니터링' },
  { id: 'PG-ADM-10', name: '외부 API관리', desc: '소셜 OAuth 자격증명 상태, 외부 번역 API, 클라우드 스토리지 연동' },
  { id: 'PG-ADM-11', name: '사용자설정 항목관리', desc: '사용자 환경설정 메타데이터 등록(체크박스/드롭다운), 기본값 배포' },
  { id: 'PG-ADM-12', name: '게시판·배너관리', desc: '일반/긴급/이벤트 공지, 롤링 배너 등록(HTML/이미지/URL) 및 통계' },
  { id: 'PG-ADM-13', name: '고객관리', desc: '고객센터 운영시간, 1:1 상담 예약, 리뷰 승인, 실시간 채팅(파일첨부)' },
  { id: 'PG-ADM-14', name: '무료글꼴관리', desc: 'WOFF2/TTF 웹폰트 등록, 폰트 별명(Alias) 지정, 텍스트 프리뷰' },
  { id: 'PG-ADM-15', name: '단축키 및 도구아이콘 관리', desc: 'PC/태블릿용 기본 단축키 매핑, 도구별 디자인 리소스 아이콘 지정 및 배포' },
  { id: 'PG-ADM-16', name: '도구그룹관리', desc: '8대 뷰어모드별 기본도구 편성, 그룹간 중복허용 정책, 도구그룹 기본값 배포' },
];

export interface AdminWireframesProps {
  isMobileMode?: boolean;
}

export function AdminWireframes({ isMobileMode = false }: AdminWireframesProps) {
  const [selectedProg, setSelectedProg] = useState('PG-ADM-01');

  // Registry
  const registry = ViewerConfigRegistry.getInstance();
  const [configState, setConfigState] = useState(() => registry.getConfig());

  // PG-ADM-01 state
  const [offlineTokenDays, setOfflineTokenDays] = useState(30);
  const [twoFactorEnforced, setTwoFactorEnforced] = useState(true);
  const [geoBlockEnabled, setGeoBlockEnabled] = useState(false);

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
    <div className="space-y-6">
      {/* 16대 관리자 프로그램 선택 칩 바 (가로 슬라이드 컨테이너 적용) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-lg">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs text-slate-400">
          <span className="font-semibold text-indigo-400">16대 관리자 운영관리 프로그램 (Admin Modules)</span>
          <span>선택: <strong className="text-white">{selectedProg}</strong></span>
        </div>
        <HorizontalSlideContainer scrollStep={280} className="w-full">
          {ADMIN_PROGRAMS.map((p) => {
            const active = p.id === selectedProg;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedProg(p.id)}
                className={`shrink-0 px-3.5 py-2.5 min-h-[44px] rounded-lg text-xs font-mono transition-all flex items-center gap-2 ${
                  active
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400 font-semibold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <span className="opacity-80 px-1 py-0.5 rounded bg-black/25 text-[11px]">{p.id}</span>
                <span className="font-sans font-medium whitespace-nowrap">{p.name}</span>
              </button>
            );
          })}
        </HorizontalSlideContainer>
      </div>

      {/* 실제 프로덕션 대상 순수 화면 캔버스 (설명 배제, 화면 컴포넌트만 정확히 렌더링) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-6 min-h-[540px]">
        {/* 모든 화면 공통 상단 탑 레이어 (WireframeTopLayer): 관리자 모드 기본 로그인 상태 */}
        <WireframeTopLayer
          currentProgramId={selectedProg}
          isLoggedIn={true}
          userRole="시스템총괄관리자"
          isMobileMode={isMobileMode}
          onNavigate={(progId) => setSelectedProg(progId)}
        />

        {/* PG-ADM-01: 보안관리 */}
        {selectedProg === 'PG-ADM-01' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-4">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center justify-between">
                <span>🔐 접근 통제 및 2FA 정책</span>
                <span className="text-xs text-indigo-400">보안 1등급</span>
              </h3>
              <div className="space-y-3 text-xs">
                <label className="flex items-center justify-between p-2.5 bg-slate-900 rounded-lg border border-slate-800 cursor-pointer">
                  <span>2단계 인증(2FA: 소셜/이메일 OTP) 강제화</span>
                  <input
                    type="checkbox"
                    checked={twoFactorEnforced}
                    onChange={(e) => setTwoFactorEnforced(e.target.checked)}
                    className="accent-indigo-500"
                  />
                </label>
                <label className="flex items-center justify-between p-2.5 bg-slate-900 rounded-lg border border-slate-800 cursor-pointer">
                  <span>해외 IP 접근 차단 (Geo-Blocking)</span>
                  <input
                    type="checkbox"
                    checked={geoBlockEnabled}
                    onChange={(e) => setGeoBlockEnabled(e.target.checked)}
                    className="accent-indigo-500"
                  />
                </label>
                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-slate-400">허용 IP 화이트리스트 (CIDR)</span>
                  <input
                    type="text"
                    defaultValue="192.168.1.0/24, 211.234.120.0/24"
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-4">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center justify-between">
                <span>⏱ 세션 타임아웃 및 오프라인 토큰 수명주기</span>
                <span className="text-xs text-emerald-400">시스템 속성</span>
              </h3>
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 font-medium">Offline Refresh Token 유효기간</span>
                    <span className="text-indigo-400 font-bold font-mono">{offlineTokenDays}일</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="180"
                    value={offlineTokenDays}
                    onChange={(e) => setOfflineTokenDays(Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                  <p className="text-[11px] text-slate-500">
                    * 시스템 속성 <code className="text-indigo-300">OFFLINE_REFRESH_TOKEN_DAYS</code>: 온라인 로그인 시 사용자 디바이스에 부여할 오프라인 로컬 작업 보장 기간 (기본 30일, 1~180일 설정 가능)
                  </p>
                </div>
                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex justify-between items-center">
                  <span>온라인 유휴 세션 만료 시간</span>
                  <select className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200">
                    <option>30분</option>
                    <option>60분 (기본값)</option>
                    <option>120분</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PG-ADM-02: 프로그램관리 */}
        {selectedProg === 'PG-ADM-02' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">
                모듈형 프로그램 트리 계층 및 DAG 비순환 검증 구조
              </span>
              <button className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs">
                + 신규 프로그램 등록
              </button>
            </div>
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center gap-2 p-2.5 bg-slate-900/90 rounded border border-slate-800 text-xs font-mono">
                <span className="text-emerald-400">ROOT</span>
                <span className="text-slate-500">➔</span>
                <span className="text-indigo-300 font-semibold">PG-ADM-ROOT (관리자 포털)</span>
                <span className="ml-auto text-[11px] text-slate-500">부모 프로그램 (14개 자식 노드 연결)</span>
              </div>
              <div className="ml-6 pl-4 border-l-2 border-indigo-500/30 space-y-2 text-xs font-mono">
                <div className="p-2 bg-slate-900 rounded border border-slate-800 flex justify-between items-center">
                  <span>├─ PG-ADM-01 (보안관리) - v1.2</span>
                  <span className="text-[11px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded">DAG 순환검증 통과</span>
                </div>
                <div className="p-2 bg-slate-900 rounded border border-slate-800 flex justify-between items-center">
                  <span>├─ PG-ADM-02 (프로그램관리) - v1.0</span>
                  <span className="text-[11px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded">DAG 순환검증 통과</span>
                </div>
                <div className="p-2 bg-slate-900 rounded border border-slate-800 flex justify-between items-center">
                  <span>├─ PG-ADM-03 (사용자관리) - v2.1</span>
                  <span className="text-[11px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded">DAG 순환검증 통과</span>
                </div>
              </div>
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded text-xs text-amber-300">
                🛡️ <strong>DAG 가드레일 활성화</strong>: 자기 자신 또는 자신의 직계/방계 자식 노드를 부모 프로그램으로 지정할 수 없도록 원천 차단됩니다.
              </div>
            </div>
          </div>
        )}

        {/* PG-ADM-03: 사용자관리 */}
        {selectedProg === 'PG-ADM-03' && (
          <div className="space-y-4">
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-300 flex items-center justify-between">
              <span>⚠️ <strong>개인정보 임의변경 불가 원칙</strong>: 관리자라도 사용자의 프로필 사진, 실명, 연락처, 소셜 연동 정보를 임의로 수정할 수 없습니다.</span>
              <span className="px-2 py-0.5 bg-rose-500/20 rounded text-[11px]">무결성 보장</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">사용자 ID</th>
                    <th className="p-2.5">계정 상태</th>
                    <th className="p-2.5">오프라인 사용</th>
                    <th className="p-2.5">연동 스토리지</th>
                    <th className="p-2.5">권한 그룹</th>
                    <th className="p-2.5">조치</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  <tr>
                    <td className="p-2.5 font-mono">user_0921@corp.com</td>
                    <td className="p-2.5"><span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">정상</span></td>
                    <td className="p-2.5"><span className="text-emerald-400 font-semibold">허용 (30일)</span></td>
                    <td className="p-2.5 font-mono text-[11px]">QNAP NAS (/volume1/pdf)</td>
                    <td className="p-2.5 font-mono">ROLE_EDITOR</td>
                    <td className="p-2.5"><button className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-[11px]">비번초기화</button></td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-mono">guest_8812@gmail.com</td>
                    <td className="p-2.5"><span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400">제한</span></td>
                    <td className="p-2.5"><span className="text-slate-500">비활성</span></td>
                    <td className="p-2.5 font-mono text-[11px]">Google Drive 연동</td>
                    <td className="p-2.5 font-mono">ROLE_USER</td>
                    <td className="p-2.5"><button className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-[11px]">접근제한해제</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PG-ADM-04: 약관·동의·정책 */}
        {selectedProg === 'PG-ADM-04' && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {['이용약관', '개인정보 수집·이용', '마케팅 수신동의', '저작권 안내', '면책조항', '쿠키 정책', '청소년 보호정책', '고객지원 정책'].map((t, idx) => (
                <div key={t} className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-200">{t}</div>
                    <div className="text-[11px] text-slate-500 font-mono">DOC_GRP_0{idx + 1} (v2.4)</div>
                  </div>
                  <button className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-[11px]">편집</button>
                </div>
              ))}
            </div>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
              <span className="text-slate-400 font-semibold">웹 문서 기반 약관 실시간 에디터 & 버전 배포</span>
              <textarea
                rows={3}
                defaultValue="제1조 (목적) 본 약관은 purePDFrend 서비스의 이용조건 및 절차, 이용자와 회사의 권리, 의무, 책임사항을 규정함을 목적으로 합니다."
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-300 font-mono text-xs"
              />
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-indigo-400">* 배포 시 사용자 동의 이력 원장에 문서그룹ID 및 개정버전번호가 증빙으로 자동 기록됩니다.</span>
                <button className="px-3 py-1 bg-indigo-600 text-white rounded text-xs">신규 개정버전 발행</button>
              </div>
            </div>
          </div>
        )}

        {/* PG-ADM-15: 단축키 및 도구아이콘 관리 */}
        {selectedProg === 'PG-ADM-15' && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-bold text-white text-sm">🎨 뷰어 도구별 아이콘 디자인 리소스 및 단축키 통합 관리</span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  도구별로 미리 정의된 다양한 디자인 리소스 아이콘 중 하나를 지정하여 UI에 반영하고, PC/태블릿 기본 단축키를 설정합니다.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleResetShortcutsAndIcons}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                >
                  기본값 복원 (Reset)
                </button>
                <button className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium">
                  전체 사용자 배포
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">도구 ID</th>
                    <th className="p-2.5">도구 명칭</th>
                    <th className="p-2.5">현재 아이콘</th>
                    <th className="p-2.5">아이콘 디자인 리소스 지정</th>
                    <th className="p-2.5">단축키 (PC/태블릿)</th>
                    <th className="p-2.5">기능 설명</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300 font-mono text-[11px]">
                  {registry.getAllTools().slice(0, 10).map((tool) => {
                    const availableResources = IconResourceRegistry.getResourcesForTool(tool.id);
                    const currentResKey = configState.toolIcons?.[tool.id] || (availableResources[0]?.resourceKey ?? '');
                    const currentShortcut = configState.shortcuts?.[tool.id] || tool.defaultKey;

                    return (
                      <tr key={tool.id} className="hover:bg-slate-900/40">
                        <td className="p-2.5 text-slate-400">{tool.id}</td>
                        <td className="p-2.5 font-sans font-medium text-slate-200">{tool.name}</td>
                        <td className="p-2.5">
                          <span className="text-xl inline-block w-7 text-center">{tool.icon}</span>
                        </td>
                        <td className="p-2.5">
                          {availableResources.length > 0 ? (
                            <select
                              value={currentResKey}
                              onChange={(e) => handleToolIconChange(tool.id, e.target.value)}
                              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs font-sans"
                            >
                              {availableResources.map((res) => (
                                <option key={res.resourceKey} value={res.resourceKey}>
                                  {res.symbol} {res.label} ({res.style})
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-slate-500 font-sans">단일 기본 리소스</span>
                          )}
                        </td>
                        <td className="p-2.5">
                          <input
                            type="text"
                            value={currentShortcut}
                            onChange={(e) => handleShortcutChange(tool.id, e.target.value)}
                            className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-center font-mono text-amber-300 text-xs font-bold"
                          />
                        </td>
                        <td className="p-2.5 font-sans text-slate-400">{tool.desc}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PG-ADM-16: 도구그룹관리 */}
        {selectedProg === 'PG-ADM-16' && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-bold text-white text-sm">🗂️ 8대 뷰어 모드별 기본 도구 그룹 편성 관리</span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  보기, 주석달기, 그리기, 작성및서명, 변환, 양식준비, 삽입, 즐겨찾기 그룹의 기본 도구 구성을 정의합니다.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                  <input type="checkbox" defaultChecked className="accent-indigo-500" />
                  <span>그룹 간 도구 중복 편성 허용</span>
                </label>
                <button className="px-3 py-1 bg-indigo-600 text-white rounded font-medium">그룹 기본값 배포</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { grp: '보기 (View)', count: 2, tools: ['손 도구 (✋)', '텍스트 선택 (🔤)'] },
                { grp: '주석달기 (Annotate)', count: 9, tools: ['펜 (✏️)', '붓 (🖌️)', '형광펜 (🖍️)', '밑줄 (➖)', '취소선 (❌)', '직사각형 (▭)*중복*'] },
                { grp: '그리기 (Draw)', count: 6, tools: ['직사각형 (▭)', '원형 (◯)', '화살표 (➔)', '직선 (╱)', '지우개 (🧹)'] },
                { grp: '작성 및 서명 (Sign)', count: 4, tools: ['서명 패드 (🖋️)', '날짜 스탬프 (📅)', '체크 (✔️)', '승인 도장 (💮)'] },
                { grp: '변환 (Convert)', count: 2, tools: ['JPG 이미지 (🖼️)', 'Word 변환 (📄)'] },
                { grp: '양식 준비 (Form)', count: 2, tools: ['입력 필드 (📝)', '체크박스 (☑️)'] },
                { grp: '삽입 (Insert)', count: 3, tools: ['빈 페이지 (➕)', '외부 이미지 (📎)', '스캔 (📷)'] },
                { grp: '즐겨찾기 (Favorite)', count: 5, tools: ['펜', '형광펜', '댓글', '직사각형', '서명'] },
              ].map((g) => (
                <div key={g.grp} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex justify-between items-center pb-1.5 border-b border-slate-800">
                    <span className="font-semibold text-slate-200">{g.grp}</span>
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded text-[10px] font-mono">{g.count}개</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {g.tools.map((t) => (
                      <span key={t} className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-[11px] text-slate-300">
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="pt-1 flex justify-between items-center text-[10px] text-slate-500">
                    <span>드래그 순서 재배치 지원</span>
                    <button className="text-indigo-400 hover:underline">+ 도구 추가</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PG-ADM-05 ~ 14 탭별 직관적 와이어프레임 프리뷰 */}
        {['PG-ADM-05', 'PG-ADM-06', 'PG-ADM-07', 'PG-ADM-08', 'PG-ADM-09', 'PG-ADM-10', 'PG-ADM-11', 'PG-ADM-12', 'PG-ADM-13', 'PG-ADM-14'].includes(selectedProg) && (
          <div className="p-6 bg-slate-950/60 border border-slate-800 rounded-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-sm font-semibold text-slate-200">
                {ADMIN_PROGRAMS.find((p) => p.id === selectedProg)?.name} 세부 와이어프레임 구조
              </span>
              <span className="text-xs px-2.5 py-1 bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20">
                표준 프로토타입 뷰
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                <span className="text-slate-500">입력 및 검색 바</span>
                <div className="h-8 bg-slate-950 rounded border border-slate-700 flex items-center px-2 text-slate-400 font-mono">
                  검색조건 / 필터 / 타겟팅 ...
                </div>
              </div>
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                <span className="text-slate-500">상태 모니터링 위젯</span>
                <div className="h-8 bg-slate-950 rounded border border-slate-700 flex items-center px-2 text-emerald-400 font-mono">
                  정상 가동 (ACTIVE)
                </div>
              </div>
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                <span className="text-slate-500">액션 커맨드</span>
                <div className="h-8 bg-indigo-950/40 rounded border border-indigo-800/40 flex items-center justify-center text-indigo-300 font-medium">
                  + 신규 등록 / 일괄 동기화
                </div>
              </div>
            </div>
            <div className="h-44 bg-slate-900/50 rounded-xl border border-dashed border-slate-800 flex flex-col items-center justify-center text-slate-500 text-xs space-y-1">
              <span className="text-slate-400 font-medium">[{selectedProg}] 데이터 그리드 및 반응형 대시보드 뷰</span>
              <span className="text-[11px] text-slate-600">모바일 접속 시 1열 카드뷰로 자동 전환되며, PC에서는 다단 테이블로 표시됩니다.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
