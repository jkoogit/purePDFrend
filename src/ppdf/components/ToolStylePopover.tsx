import React, { useState } from 'react';
import {
  X,
  ChevronRight,
  ArrowLeft,
  Check,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Slash,
} from 'lucide-react';

export type ToolKind =
  | 'pen'
  | 'highlighter'
  | 'eraser'
  | 'shape'
  | 'text'
  | 'underline'
  | 'strike'
  | 'squiggly';

export interface StylePreset {
  id: string;
  name: string;
  color: string;
  strokeWidth: number;
  opacity: number;
  fillColor?: string;
}

export interface ToolStyleState {
  toolKind: ToolKind;
  color: string;
  strokeWidth: number; // in pt (e.g. 0.5 ~ 20)
  opacity: number; // 10 ~ 100 (%)
  fillColor?: string; // for shapes ('transparent' or hex)
  fillOpacity?: number; // 0 ~ 100 (%)
  fontSize?: number; // for text (8 ~ 48pt)
  textAlign?: 'left' | 'center' | 'right'; // for text
  fontFamily?: 'sans' | 'serif' | 'mono';
  eraserSize?: number; // 5 ~ 50 pt
  eraserMode?: 'stroke' | 'partial'; // 'stroke' = 획 지우기, 'partial' = 영역 지우기
  presets: StylePreset[];
}

interface ToolStylePopoverProps {
  isOpen: boolean;
  onClose: () => void;
  toolName?: string;
  styleState: ToolStyleState;
  onChangeStyle: (updated: Partial<ToolStyleState>) => void;
  isMobile?: boolean;
}

// 24색 표준 팔레트 프리셋
const PALETTE_24_COLORS = [
  '#f87171', '#fb923c', '#facc15', '#4ade80', '#38bdf8', '#818cf8', '#c084fc',
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#0ea5e9', '#6366f1', '#a855f7',
  '#991b1b', '#c2410c', '#a16207', '#15803d', '#0369a1', '#4338ca', '#6b21a8',
  '#ffffff', '#cbd5e1', '#64748b', '#334155', '#0f172a'
];

export const ToolStylePopover: React.FC<ToolStylePopoverProps> = ({
  isOpen,
  onClose,
  toolName = '펜',
  styleState,
  onChangeStyle,
}) => {
  // 팝오버 내부 네비게이션: 'main' (스타일 메인) | 'color' (선/텍스트 색상) | 'fillColor' (채우기 색상)
  const [subView, setSubView] = useState<'main' | 'color' | 'fillColor'>('main');
  const [colorTab, setColorTab] = useState<'presets' | 'custom'>('presets');
  const [customHex, setCustomHex] = useState(styleState.color);

  if (!isOpen) return null;

  const currentKind: ToolKind = styleState.toolKind || 'pen';

  const isEraser = currentKind === 'eraser';
  const isShape = currentKind === 'shape';
  const isText = currentKind === 'text';
  const isMarkup = ['underline', 'strike', 'squiggly', 'highlighter'].includes(currentKind);

  const activeColorTarget = subView === 'fillColor' ? 'fill' : 'stroke';
  const activeColorValue = activeColorTarget === 'fill' ? (styleState.fillColor || 'transparent') : styleState.color;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-2xs" onClick={onClose} />
      <div className="fixed top-24 right-2 sm:right-6 z-50 w-80 sm:w-84 max-w-[calc(100vw-24px)] max-h-[85vh] overflow-y-auto rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        {/* 1단계 메인 뷰: 도구별 맞춤 스타일 제어 */}
      {subView === 'main' && (
        <div className="p-4 space-y-4">
          {/* 헤더: 타이틀 + 도구명 배지 + 닫기 */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <span>속성 설정</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-800 text-sky-400 font-mono font-medium">
                {toolName || currentKind}
              </span>
            </h4>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="닫기"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* ========================================================================= */}
          {/* 1. 지우개 (Eraser) 전용 설정 뷰 */}
          {/* ========================================================================= */}
          {isEraser && (
            <div className="space-y-4">
              {/* 지우개 크기 슬라이더 + 원형 미리보기 */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-medium">지우개 반경</span>
                  <span className="font-mono text-sky-400 font-bold text-xs">{styleState.eraserSize || 20} pt</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={5}
                    max={50}
                    step={1}
                    value={styleState.eraserSize || 20}
                    onChange={(e) => onChangeStyle({ eraserSize: parseInt(e.target.value, 10) })}
                    className="w-full accent-rose-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                    <span
                      className="rounded-full bg-rose-400/80 shadow-xs"
                      style={{
                        width: `${Math.min(26, Math.max(6, (styleState.eraserSize || 20) * 0.55))}px`,
                        height: `${Math.min(26, Math.max(6, (styleState.eraserSize || 20) * 0.55))}px`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* 지우개 모드 세그먼트: 획 지우기 vs 영역 지우기 */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-slate-400">지우기 동작 방식</label>
                <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs">
                  <button
                    type="button"
                    onClick={() => onChangeStyle({ eraserMode: 'stroke' })}
                    className={`py-1.5 px-2 rounded-lg font-medium text-center transition-all cursor-pointer ${
                      (styleState.eraserMode || 'stroke') === 'stroke'
                        ? 'bg-rose-600 text-white font-bold shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    획 단위 지우개
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeStyle({ eraserMode: 'partial' })}
                    className={`py-1.5 px-2 rounded-lg font-medium text-center transition-all cursor-pointer ${
                      styleState.eraserMode === 'partial'
                        ? 'bg-rose-600 text-white font-bold shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    영역 분할 지우개
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 pt-0.5">
                  {(styleState.eraserMode || 'stroke') === 'stroke'
                    ? '터치한 펜 획이나 도형 전체를 깔끔하게 일괄 삭제합니다.'
                    : '지우개 궤적이 닿은 픽셀 및 선분 구간만 부분 분할 삭제합니다.'}
                </p>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. 텍스트 (Text / FreeText) 전용 설정 뷰 */}
          {/* ========================================================================= */}
          {isText && (
            <div className="space-y-3.5">
              {/* 글자 색상 선택 */}
              <div
                onClick={() => setSubView('color')}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 cursor-pointer transition-colors border border-slate-700/50"
              >
                <span className="text-xs font-medium text-slate-300">글자 색상</span>
                <div className="flex items-center gap-2">
                  <span
                    className="w-5 h-5 rounded-full border-2 border-white/60 shadow-xs"
                    style={{ backgroundColor: styleState.color }}
                  />
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>

              {/* 폰트 크기 슬라이더 */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-medium">글자 크기</span>
                  <span className="font-mono text-sky-400 font-bold text-xs">{styleState.fontSize || 14} pt</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={8}
                    max={36}
                    step={1}
                    value={styleState.fontSize || 14}
                    onChange={(e) => onChangeStyle({ fontSize: parseInt(e.target.value, 10) })}
                    className="w-full accent-sky-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              {/* 텍스트 정렬 (좌/중/우) */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-slate-400">문단 정렬</label>
                <div className="flex rounded-xl bg-slate-800/80 p-1 border border-slate-700/60 gap-1">
                  {(['left', 'center', 'right'] as const).map((align) => (
                    <button
                      key={align}
                      type="button"
                      onClick={() => onChangeStyle({ textAlign: align })}
                      className={`flex-1 py-1 flex items-center justify-center rounded-lg transition-all cursor-pointer ${
                        (styleState.textAlign || 'left') === align
                          ? 'bg-sky-600 text-white font-bold shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {align === 'left' && <AlignLeft className="w-3.5 h-3.5" />}
                      {align === 'center' && <AlignCenter className="w-3.5 h-3.5" />}
                      {align === 'right' && <AlignRight className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* 텍스트 배경 채우기 선택 */}
              <div
                onClick={() => setSubView('fillColor')}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 cursor-pointer transition-colors border border-slate-700/50"
              >
                <span className="text-xs font-medium text-slate-300">배경 채우기</span>
                <div className="flex items-center gap-2">
                  {styleState.fillColor && styleState.fillColor !== 'transparent' ? (
                    <span
                      className="w-5 h-5 rounded-md border border-white/60 shadow-xs"
                      style={{ backgroundColor: styleState.fillColor }}
                    />
                  ) : (
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Slash className="w-3 h-3 text-rose-400" /> 투명
                    </span>
                  )}
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. 도형 (Shape - 사각형, 타원, 화살표) 전용 설정 뷰 */}
          {/* ========================================================================= */}
          {isShape && (
            <div className="space-y-3.5">
              {/* 테두리 선 색상 */}
              <div
                onClick={() => setSubView('color')}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 cursor-pointer transition-colors border border-slate-700/50"
              >
                <span className="text-xs font-medium text-slate-300">테두리 색상</span>
                <div className="flex items-center gap-2">
                  <span
                    className="w-5 h-5 rounded-full border-2 border-white/60 shadow-xs"
                    style={{ backgroundColor: styleState.color }}
                  />
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>

              {/* 내부 채우기 (Fill) 색상 */}
              <div
                onClick={() => setSubView('fillColor')}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 cursor-pointer transition-colors border border-slate-700/50"
              >
                <span className="text-xs font-medium text-slate-300">내부 채우기</span>
                <div className="flex items-center gap-2">
                  {styleState.fillColor && styleState.fillColor !== 'transparent' ? (
                    <span
                      className="w-5 h-5 rounded-md border border-white/60 shadow-xs"
                      style={{ backgroundColor: styleState.fillColor }}
                    />
                  ) : (
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Slash className="w-3 h-3 text-rose-400" /> 투명
                    </span>
                  )}
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>

              {/* 테두리 두께 슬라이더 */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-medium">선 굵기</span>
                  <span className="font-mono text-sky-400 font-bold text-xs">{styleState.strokeWidth} pt</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0.5}
                    max={15}
                    step={0.5}
                    value={styleState.strokeWidth}
                    onChange={(e) => onChangeStyle({ strokeWidth: parseFloat(e.target.value) })}
                    className="w-full accent-sky-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              {/* 불투명도 슬라이더 */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-medium">전체 불투명도</span>
                  <span className="font-mono text-sky-400 font-bold text-xs">{styleState.opacity} %</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={10}
                    max={100}
                    step={5}
                    value={styleState.opacity}
                    onChange={(e) => onChangeStyle({ opacity: parseInt(e.target.value, 10) })}
                    className="w-full accent-sky-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 4. 자유펜 (Pen) & 텍스트 마크업 (Highlight/Underline) 기본 설정 뷰 */}
          {/* ========================================================================= */}
          {!isEraser && !isShape && !isText && (
            <div className="space-y-3.5">
              {/* 색상 선택 행 */}
              <div
                onClick={() => setSubView('color')}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 cursor-pointer transition-colors border border-slate-700/50"
              >
                <span className="text-xs font-medium text-slate-300">색상</span>
                <div className="flex items-center gap-2">
                  <span
                    className="w-5 h-5 rounded-full border-2 border-white/60 shadow-xs"
                    style={{ backgroundColor: styleState.color }}
                  />
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>

              {/* 획 (두께) 슬라이더 */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-medium">획</span>
                  <span className="font-mono text-sky-400 font-bold text-xs">{styleState.strokeWidth} pt</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0.5}
                    max={15}
                    step={0.5}
                    value={styleState.strokeWidth}
                    onChange={(e) => onChangeStyle({ strokeWidth: parseFloat(e.target.value) })}
                    className="w-full accent-sky-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              {/* 불투명도 슬라이더 */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-medium">불투명도</span>
                  <span className="font-mono text-sky-400 font-bold text-xs">{styleState.opacity} %</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={10}
                    max={100}
                    step={5}
                    value={styleState.opacity}
                    onChange={(e) => onChangeStyle({ opacity: parseInt(e.target.value, 10) })}
                    className="w-full accent-sky-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 4대 퀵 프리셋 슬롯 (지우개 제외 공통 적용) */}
          {!isEraser && styleState.presets && styleState.presets.length > 0 && (
            <div className="pt-2 border-t border-slate-800 space-y-1.5">
              <div className="flex justify-between items-center text-[11px] text-slate-400">
                <span>자주 쓰는 프리셋</span>
                <span className="text-[10px] text-slate-500">원클릭 즉시 적용</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {styleState.presets.map((p, idx) => {
                  const isSelected =
                    p.color === styleState.color &&
                    p.strokeWidth === styleState.strokeWidth &&
                    p.opacity === styleState.opacity;
                  return (
                    <button
                      key={p.id || idx}
                      type="button"
                      onClick={() =>
                        onChangeStyle({
                          color: p.color,
                          strokeWidth: p.strokeWidth,
                          opacity: p.opacity,
                          fillColor: p.fillColor || styleState.fillColor,
                        })
                      }
                      className={`h-9 rounded-xl border flex items-center justify-center font-bold text-xs transition-all cursor-pointer relative ${
                        isSelected
                          ? 'border-sky-400 bg-sky-950/70 ring-2 ring-sky-500/50 shadow-md'
                          : 'border-slate-700/80 bg-slate-800/70 hover:bg-slate-700/70'
                      }`}
                    >
                      <span
                        style={{
                          color: p.color,
                          opacity: p.opacity / 100,
                          textDecoration: isMarkup && toolName.includes('취소선') ? 'line-through' : 'none',
                          borderBottom: isMarkup && toolName.includes('밑줄') ? `2px solid ${p.color}` : 'none',
                        }}
                      >
                        {isShape ? '■' : isText ? 'T' : 'A'}
                      </span>
                      <span
                        className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: p.color }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2단계 서브화면: 색상 상세 피커 (선 색상 or 채우기 색상) */}
      {(subView === 'color' || subView === 'fillColor') && (
        <div className="p-4 space-y-3">
          {/* 상단 뒤로가기 헤더 */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <button
              type="button"
              onClick={() => setSubView('main')}
              className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 font-bold cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{subView === 'fillColor' ? '채우기 색상' : '색상'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 채우기 색상일 때 [투명] 옵션 버튼 */}
          {subView === 'fillColor' && (
            <button
              type="button"
              onClick={() => onChangeStyle({ fillColor: 'transparent' })}
              className={`w-full py-1.5 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                styleState.fillColor === 'transparent'
                  ? 'bg-rose-950/60 border-rose-500 text-rose-300 ring-1 ring-rose-500/50'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Slash className="w-3.5 h-3.5 text-rose-400" />
              <span>채우기 없음 (투명)</span>
            </button>
          )}

          {/* 탭: 프리셋 24색 vs 컬러 휠/HEX */}
          <div className="flex rounded-lg bg-slate-800 p-0.5 border border-slate-700/60 text-[11px]">
            <button
              type="button"
              onClick={() => setColorTab('presets')}
              className={`flex-1 py-1 rounded font-medium transition-colors ${
                colorTab === 'presets' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              팔레트
            </button>
            <button
              type="button"
              onClick={() => setColorTab('custom')}
              className={`flex-1 py-1 rounded font-medium transition-colors ${
                colorTab === 'custom' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              HEX 직접지정
            </button>
          </div>

          {colorTab === 'presets' ? (
            <div className="grid grid-cols-7 gap-1.5 pt-1">
              {PALETTE_24_COLORS.map((col) => {
                const isSelected = activeColorValue.toLowerCase() === col.toLowerCase();
                return (
                  <button
                    key={col}
                    type="button"
                    onClick={() => {
                      if (subView === 'fillColor') {
                        onChangeStyle({ fillColor: col });
                      } else {
                        onChangeStyle({ color: col });
                      }
                      setCustomHex(col);
                    }}
                    className="w-7 h-7 rounded-full border border-white/20 transition-all flex items-center justify-center hover:scale-110 cursor-pointer relative"
                    style={{ backgroundColor: col }}
                  >
                    {isSelected && <Check className={`w-3.5 h-3.5 ${col === '#ffffff' ? 'text-black' : 'text-white'}`} />}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-2">
                <span
                  className="w-8 h-8 rounded-lg border border-white/30 shrink-0"
                  style={{ backgroundColor: activeColorValue === 'transparent' ? '#1e293b' : activeColorValue }}
                />
                <input
                  type="text"
                  value={customHex}
                  onChange={(e) => {
                    setCustomHex(e.target.value);
                    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                      if (subView === 'fillColor') {
                        onChangeStyle({ fillColor: e.target.value });
                      } else {
                        onChangeStyle({ color: e.target.value });
                      }
                    }
                  }}
                  placeholder="#38bdf8"
                  className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-sky-500"
                />
              </div>
              <div className="text-[10px] text-slate-400">
                원하는 RGB Hex 코드를 직접 입력하면 실시간으로 도구 색상이 반영됩니다.
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-slate-800 flex justify-end">
            <button
              type="button"
              onClick={() => setSubView('main')}
              className="px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              완료
            </button>
          </div>
        </div>
      )}
    </div>
    </>
  );
};
