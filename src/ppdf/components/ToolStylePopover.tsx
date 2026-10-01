import React, { useState } from 'react';
import { X, ChevronRight, ArrowLeft, Check } from 'lucide-react';

export interface StylePreset {
  id: string;
  name: string;
  color: string;
  strokeWidth: number;
  opacity: number;
}

export interface ToolStyleState {
  color: string;
  strokeWidth: number; // in pt or px (e.g. 1.0, 1.5, 3.0)
  opacity: number; // 10 ~ 100 (%)
  presets: StylePreset[];
}

interface ToolStylePopoverProps {
  isOpen: boolean;
  onClose: () => void;
  toolName?: string;
  styleState: ToolStyleState;
  onChangeStyle: (updated: Partial<ToolStyleState>) => void;
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
  // 팝오버 내부 네비게이션: 'main' (스타일 메인) | 'color' (색상 피커 세부)
  const [subView, setSubView] = useState<'main' | 'color'>('main');
  const [colorTab, setColorTab] = useState<'presets' | 'custom'>('presets');
  const [customHex, setCustomHex] = useState(styleState.color);

  if (!isOpen) return null;

  return (
    <div className="absolute top-12 left-2 z-50 w-72 sm:w-80 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 shadow-2xl text-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
      {/* 1단계 메인 뷰: 스타일 (색상, 획, 불투명도, 프리셋) */}
      {subView === 'main' && (
        <div className="p-4 space-y-4">
          {/* 헤더: 타이틀 + 닫기 */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <span>스타일</span>
              <span className="text-[10px] font-normal text-slate-400">({toolName})</span>
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

          {/* 색상 선택 행 (원형 칩 + Chevron으로 서브화면 진입) */}
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

          {/* 4대 퀵 프리셋 슬롯 [A][A][A][A] */}
          <div className="pt-2 border-t border-slate-800 space-y-1.5">
            <div className="flex justify-between items-center text-[11px] text-slate-400">
              <span>프리셋</span>
              <span className="text-[10px] text-slate-500">원클릭 바로적용</span>
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
                        textDecoration: toolName.includes('취소선') ? 'line-through' : 'none',
                        borderBottom: toolName.includes('밑줄') ? `2px solid ${p.color}` : 'none',
                      }}
                    >
                      A
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
        </div>
      )}

      {/* 2단계 서브화면: 색상 상세 피커 (프리셋 24색 & 직접입력 HEX) */}
      {subView === 'color' && (
        <div className="p-4 space-y-3">
          {/* 상단 뒤로가기 헤더 */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <button
              type="button"
              onClick={() => setSubView('main')}
              className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 font-bold cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>색상</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

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
                const isSelected = styleState.color.toLowerCase() === col.toLowerCase();
                return (
                  <button
                    key={col}
                    type="button"
                    onClick={() => {
                      onChangeStyle({ color: col });
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
                  style={{ backgroundColor: styleState.color }}
                />
                <input
                  type="text"
                  value={customHex}
                  onChange={(e) => {
                    setCustomHex(e.target.value);
                    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                      onChangeStyle({ color: e.target.value });
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
  );
};
