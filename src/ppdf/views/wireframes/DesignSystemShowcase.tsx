import { useState } from 'react';
import { tokens } from '../../../styles/tokens';
import { Button } from '../../../shared/components/ui/Button';
import { Badge } from '../../../shared/components/ui/Badge';
import { Card } from '../../../shared/components/ui/Card';
import { Input } from '../../../shared/components/ui/Input';

export function DesignSystemShowcase() {
  const [activeSubTab, setActiveSubTab] = useState<'tokens' | 'primitives' | 'comparison'>('tokens');
  const [sampleInput, setSampleInput] = useState('purepdfrend.sample.pdf');
  const [selectedVariant, setSelectedVariant] = useState<'primary' | 'secondary' | 'danger'>('primary');

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. 디자인 시스템 헤더 */}
      <div className="bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 border border-blue-900/40 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 text-xs font-mono font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-md">
                Phase 1 & 2 Completed
              </span>
              <span className="text-xs text-slate-400 font-mono">tokens.ts (SSOT)</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              🎨 purePDFrend 통합 디자인 토큰 & 컴포넌트 쇼케이스
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              정책 03-23 가이드라인에 의거하여 50여 개 난립 색상을 Brand/Gray/Semantic 3단계로 표준화하고, 
              4pt 그리드 시스템과 Zero-pill 규율을 실시간으로 확인하는 인터랙티브 쇼케이스입니다.
            </p>
          </div>

          {/* 탭 전환 스위처 */}
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center text-xs shrink-0">
            <button
              onClick={() => setActiveSubTab('tokens')}
              className={`px-3.5 py-2 min-h-[40px] rounded-lg font-medium transition-all ${
                activeSubTab === 'tokens'
                  ? 'bg-blue-600 text-white shadow-md font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              📐 디자인 토큰 규격
            </button>
            <button
              onClick={() => setActiveSubTab('primitives')}
              className={`px-3.5 py-2 min-h-[40px] rounded-lg font-medium transition-all ${
                activeSubTab === 'primitives'
                  ? 'bg-blue-600 text-white shadow-md font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🧩 표준 원자 컴포넌트
            </button>
            <button
              onClick={() => setActiveSubTab('comparison')}
              className={`px-3.5 py-2 min-h-[40px] rounded-lg font-medium transition-all ${
                activeSubTab === 'comparison'
                  ? 'bg-blue-600 text-white shadow-md font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ⚖️ 전환 전/후 비교
            </button>
          </div>
        </div>
      </div>

      {/* 2. 서브 탭 1: 디자인 토큰 규격 (Tokens) */}
      {activeSubTab === 'tokens' && (
        <div className="space-y-6">
          {/* 색상 팔레트 섹션 */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
                  1. 표준 색상 시스템 (Brand / Neutral / Semantic)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  난립하던 임의 Hex 색상을 단일 토큰 딕셔너리로 강제 제한 (WCAG AA 명도 대비 4.5:1 준수)
                </p>
              </div>
              <Badge variant="primary">tokens.colors</Badge>
            </div>

            {/* 브랜드 팔레트 */}
            <div>
              <span className="text-xs font-semibold text-slate-300 mb-2 block font-mono">Brand Palette (Core Blue-600)</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-11 gap-2">
                {Object.entries(tokens.colors.brand).map(([key, hex]) => (
                  <div key={key} className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex flex-col items-center">
                    <div className="w-full h-10 rounded-md shadow-inner mb-2 border border-slate-700/50" style={{ backgroundColor: hex }} />
                    <span className="text-[11px] font-mono text-slate-200 font-semibold">{key}</span>
                    <span className="text-[10px] font-mono text-slate-500">{hex}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 뉴트럴 팔레트 */}
            <div className="pt-2">
              <span className="text-xs font-semibold text-slate-300 mb-2 block font-mono">Gray / Neutral Palette (Slate)</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
                {Object.entries(tokens.colors.gray).map(([key, hex]) => (
                  <div key={key} className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex flex-col items-center">
                    <div className="w-full h-10 rounded-md shadow-inner mb-2 border border-slate-700/50" style={{ backgroundColor: hex }} />
                    <span className="text-[11px] font-mono text-slate-200 font-semibold">{key}</span>
                    <span className="text-[10px] font-mono text-slate-500">{hex}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 시맨틱 팔레트 */}
            <div className="pt-2">
              <span className="text-xs font-semibold text-slate-300 mb-2 block font-mono">Semantic Status Palette</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(tokens.colors.semantic).map(([statusKey, val]) => (
                  <div key={statusKey} className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white capitalize">{statusKey}</span>
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: val.solid }} />
                    </div>
                    <div className="p-2 rounded border text-xs" style={{ backgroundColor: val.darkBg, borderColor: val.darkBorder, color: val.darkText }}>
                      상태 알림 미리보기
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 space-y-0.5">
                      <div>Solid: {val.solid}</div>
                      <div>Text: {val.darkText}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 4pt 스페이싱 & 모서리 규율 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" />
                  2. 4pt 그리드 스페이싱 시스템
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  여백과 패딩을 4px 배수로 완전 고정하여 정렬 오차 제거
                </p>
              </div>
              <div className="space-y-2">
                {Object.entries(tokens.spacing).slice(1, 9).map(([step, px]) => (
                  <div key={step} className="flex items-center gap-3 text-xs">
                    <span className="w-12 font-mono text-slate-400 font-semibold">{step} ({px})</span>
                    <div className="flex-1 bg-slate-950 rounded p-1 border border-slate-800">
                      <div className="bg-blue-600/80 h-3 rounded-sm" style={{ width: px }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                  3. 모서리 둥글기 (Zero-Pill 규율)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  직사각형 컨테이너에 pill(둥근알약) 남발 금지 (최대 16px 이내)
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(tokens.radius).filter(([k]) => k !== 'none').map(([name, r]) => (
                  <div key={name} className="bg-slate-950 p-3 border border-slate-800 flex items-center justify-between" style={{ borderRadius: r }}>
                    <span className="text-xs font-mono text-slate-300 font-medium">{name} ({r})</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 text-slate-400 font-mono rounded">규격 준수</span>
                  </div>
                ))}
              </div>
              <div className="p-3 bg-rose-950/30 border border-rose-900/50 rounded-lg text-xs text-rose-300 flex items-center gap-2">
                <span>🚫</span>
                <span>비권장(Anti-pattern): 직사각형 버튼/패널에 `rounded-full` 적용 금지</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. 서브 탭 2: 표준 원자 컴포넌트 갤러리 (Primitives) */}
      {activeSubTab === 'primitives' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 버튼 컴포넌트 규격 */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>🔘</span> Button (모바일 터치 44px 보장 & 규격 변형)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">tokens 기반 6대 베리언트 및 사이즈</p>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-xs font-medium text-slate-400 block mb-2">Variants:</span>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="primary" size="md">Primary</Button>
                    <Button variant="secondary" size="md">Secondary</Button>
                    <Button variant="outline" size="md">Outline</Button>
                    <Button variant="ghost" size="md">Ghost</Button>
                    <Button variant="danger" size="md">Danger</Button>
                    <Button variant="success" size="md">Success</Button>
                  </div>
                </div>

                <div>
                  <span className="text-xs font-medium text-slate-400 block mb-2">Sizes (with Touch Target):</span>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="primary" size="sm">Small (30px)</Button>
                    <Button variant="primary" size="md">Medium (38px)</Button>
                    <Button variant="primary" size="lg">Large (44px 터치)</Button>
                    <Button variant="primary" size="md" isLoading>로딩 중</Button>
                  </div>
                </div>
              </div>
            </div>

            {/* 인풋 & 폼 컨트롤 규격 */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>⌨️</span> Input (4pt 그리드 & 명확한 포커스 링)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">WCAG AA 기준 명도 대비 및 에러 상태</p>
              </div>

              <div className="space-y-3">
                <Input
                  label="문서 파일명"
                  value={sampleInput}
                  onChange={(e) => setSampleInput(e.target.value)}
                  placeholder="파일명 입력"
                />
                <Input
                  label="보안 정책 (에러 상태 예시)"
                  defaultValue="INV-PASS"
                  error="보안 암호화 규칙이 유효하지 않습니다."
                />
              </div>
            </div>

            {/* 뱃지 & 상태 표시 규격 */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>🏷️</span> Badge (시맨틱 상태 표시)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">상태 알림 및 점(dot) 표시 지원</p>
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="neutral">Neutral</Badge>
                  <Badge variant="primary">Primary</Badge>
                  <Badge variant="success" dot>Success (Active)</Badge>
                  <Badge variant="warning" dot>Warning (Pending)</Badge>
                  <Badge variant="danger" dot>Danger (Error)</Badge>
                  <Badge variant="info">Info</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="success" size="md">Large Success</Badge>
                  <Badge variant="danger" size="md">Large Danger</Badge>
                </div>
              </div>
            </div>

            {/* 카드 & 컨테이너 엘리베이션 */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>🃏</span> Card & Panel (엘레베이션 & 모서리 규율)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">다크 배경 계층화 및 은은한 테두리 하이라이트</p>
              </div>

              <div className="space-y-3">
                <Card variant="default">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">표준 카드 (Default)</span>
                    <Badge variant="neutral">tokens.radius.lg</Badge>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">배경 slate-900 + border slate-800 + 미세 그림자</p>
                </Card>

                <Card variant="default" interactive onClick={() => setSelectedVariant(selectedVariant === 'primary' ? 'secondary' : 'primary')}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">인터랙티브 카드 (클릭 가능)</span>
                    <Badge variant="primary">Interactive Hover</Badge>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">호버 시 테두리 반응 및 부드러운 전환 효과</p>
                </Card>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. 서브 탭 3: 전환 전/후 비교 (Comparison) */}
      {activeSubTab === 'comparison' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 전환 전: 임의 스타일 와이어프레임 */}
            <div className="bg-slate-950 border border-rose-900/40 rounded-xl p-5 space-y-4 relative">
              <div className="flex items-center justify-between border-b border-rose-900/30 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-rose-400 flex items-center gap-2">
                    <span>⚠️</span> 전환 전: 임의 Tailwind 스타일 (비표준)
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">화면마다 제각각인 색상, 알약형 버튼, 불일치 여백</p>
                </div>
                <span className="px-2 py-0.5 text-[11px] font-mono bg-rose-950 text-rose-400 border border-rose-800 rounded">
                  AS-IS (난립 상태)
                </span>
              </div>

              <div className="space-y-4 opacity-80">
                <div className="p-4 bg-gray-800 rounded-full border border-gray-600 flex items-center justify-between">
                  <span className="text-xs text-yellow-300">비표준 알약형 컨테이너 (Anti-pattern)</span>
                  <button className="px-5 py-1 bg-purple-600 text-xs rounded-full text-white">알약 버튼</button>
                </div>

                <div className="p-3 bg-neutral-900 rounded-none border border-cyan-700 space-y-2">
                  <span className="text-xs text-cyan-400 font-serif">불일치 폰트 & 0px 각진 테두리</span>
                  <div className="flex gap-1">
                    <input className="bg-black text-xs text-green-400 p-1 border border-green-700 w-full" defaultValue="임의 입력창" />
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed bg-slate-900/60 p-3 rounded">
                  • 문제점: 색상 코드 50종 이상 중복, 컴포넌트 재사용 불가, 모바일 터치 영역 24px로 접근성 결여.
                </p>
              </div>
            </div>

            {/* 전환 후: tokens.ts 및 디자인 시스템 적용 */}
            <div className="bg-slate-900 border border-blue-900/60 rounded-xl p-5 space-y-4 shadow-lg shadow-blue-950/20">
              <div className="flex items-center justify-between border-b border-blue-900/40 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-blue-400 flex items-center gap-2">
                    <span>✨</span> 전환 후: tokens.ts 기반 단일 표준 (TO-BE)
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">일관된 4pt 여백, 브랜드 통일, 44px 터치 보장</p>
                </div>
                <span className="px-2 py-0.5 text-[11px] font-mono bg-blue-950 text-blue-300 border border-blue-800 rounded-md">
                  TO-BE (모아보고 정책)
                </span>
              </div>

              <div className="space-y-4">
                <Card variant="default">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-semibold text-white">규격 카드 컴포넌트</span>
                      <p className="text-xs text-slate-400">Zero-pill 규율 준수 (radius.lg: 8px)</p>
                    </div>
                    <Button variant="primary" size="md">표준 버튼</Button>
                  </div>
                </Card>

                <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3">
                  <Input
                    label="표준 폼 인풋 (44px 터치 타겟)"
                    defaultValue="purePDFrend-official-policy.pdf"
                  />
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-slate-400">상태 모니터링:</span>
                    <Badge variant="success" dot>규격 검증 완료</Badge>
                  </div>
                </div>

                <p className="text-xs text-blue-300/90 leading-relaxed bg-blue-950/30 border border-blue-900/30 p-3 rounded-lg">
                  • 개선점: `tokens.ts` 1곳에서 전역 테마 및 스타일 통제, 44px 모바일 터치 완벽 지원, 23개 화면 공통 쉘 전환 기반 완성.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
