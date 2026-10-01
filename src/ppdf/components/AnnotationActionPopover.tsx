import React, { useState } from 'react';
import { Palette, MessageSquare, Trash2, Copy, MoreHorizontal, ChevronDown, Check } from 'lucide-react';

export type AnnotationKind = 'highlight' | 'underline' | 'strike' | 'squiggly';

interface AnnotationActionPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  selectedText?: string;
  currentType?: AnnotationKind;
  currentColor?: string;
  onUpdateType?: (newType: AnnotationKind) => void;
  onUpdateColor?: (color: string) => void;
  onAddComment?: (comment: string) => void;
  onDelete?: () => void;
  onCopy?: () => void;
}

const PRESET_QUICK_COLORS = [
  '#facc15', // yellow
  '#38bdf8', // sky
  '#4ade80', // green
  '#f87171', // red
  '#c084fc', // purple
  '#fb923c', // orange
  '#ffffff', // white
  '#0f172a', // dark slate
];

export const AnnotationActionPopover: React.FC<AnnotationActionPopoverProps> = ({
  isOpen,
  onClose,
  selectedText = '코드를 바로 실행해볼 수도 있습니다.',
  currentType = 'underline',
  currentColor = '#38bdf8',
  onUpdateType,
  onUpdateColor,
  onAddComment,
  onDelete,
  onCopy,
}) => {
  // 서브 팝오버 상태: 'none' | 'palette' | 'type_switch' | 'comment'
  const [activeSub, setActiveSub] = useState<'none' | 'palette' | 'type_switch' | 'comment'>('none');
  const [commentInput, setCommentInput] = useState('');

  if (!isOpen) return null;

  return (
    <div className="absolute -top-14 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center">
      {/* 2차 서브 팝오버: 팔레트 or 형태전환 or 댓글 */}
      {activeSub === 'palette' && (
        <div className="mb-2 p-2 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl shadow-xl flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-100">
          {PRESET_QUICK_COLORS.map((col) => (
            <button
              key={col}
              type="button"
              onClick={() => {
                onUpdateColor?.(col);
                setActiveSub('none');
              }}
              className="w-5 h-5 rounded-full border border-white/30 hover:scale-125 transition-transform cursor-pointer relative"
              style={{ backgroundColor: col }}
            >
              {currentColor === col && <Check className={`w-3 h-3 ${col === '#ffffff' ? 'text-black' : 'text-white'}`} />}
            </button>
          ))}
        </div>
      )}

      {/* 3번째 아이콘 클릭 시: [형광펜 / 취소선 / 물결선] 형태 상호전환 서브 팝오버 (슬라이드 캡처 1 핵심!) */}
      {activeSub === 'type_switch' && (
        <div className="mb-2 px-3 py-1.5 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl shadow-xl flex items-center gap-3 text-xs font-bold text-slate-200 animate-in fade-in zoom-in-95 duration-100">
          <button
            type="button"
            onClick={() => {
              onUpdateType?.('highlight');
              setActiveSub('none');
            }}
            className={`px-2 py-1 rounded flex items-center gap-1 cursor-pointer transition-colors ${
              currentType === 'highlight' ? 'bg-sky-600 text-white' : 'hover:bg-slate-800 text-slate-300'
            }`}
            title="형광펜 강조로 전환"
          >
            <span className="bg-yellow-400/80 text-black px-1 rounded text-[10px]">A</span>
            <span>형광펜</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onUpdateType?.('strike');
              setActiveSub('none');
            }}
            className={`px-2 py-1 rounded flex items-center gap-1 cursor-pointer transition-colors ${
              currentType === 'strike' ? 'bg-sky-600 text-white' : 'hover:bg-slate-800 text-slate-300'
            }`}
            title="취소선으로 전환"
          >
            <span className="line-through text-rose-400 text-[11px]">A</span>
            <span>취소선</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onUpdateType?.('squiggly');
              setActiveSub('none');
            }}
            className={`px-2 py-1 rounded flex items-center gap-1 cursor-pointer transition-colors ${
              currentType === 'squiggly' ? 'bg-sky-600 text-white' : 'hover:bg-slate-800 text-slate-300'
            }`}
            title="물결선 밑줄로 전환"
          >
            <span className="underline decoration-wavy decoration-sky-400 text-[11px]">A</span>
            <span>물결선</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onUpdateType?.('underline');
              setActiveSub('none');
            }}
            className={`px-2 py-1 rounded flex items-center gap-1 cursor-pointer transition-colors ${
              currentType === 'underline' ? 'bg-sky-600 text-white' : 'hover:bg-slate-800 text-slate-300'
            }`}
            title="일반 밑줄로 전환"
          >
            <span className="underline text-sky-400 text-[11px]">A</span>
            <span>밑줄</span>
          </button>
        </div>
      )}

      {/* 댓글 메모 입력 서브 창 */}
      {activeSub === 'comment' && (
        <div className="mb-2 p-2 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl shadow-xl flex items-center gap-2 text-xs w-64 animate-in fade-in zoom-in-95 duration-100">
          <input
            type="text"
            placeholder="주석에 메모 추가..."
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && commentInput.trim()) {
                onAddComment?.(commentInput);
                setCommentInput('');
                setActiveSub('none');
              }
            }}
            className="flex-1 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white focus:outline-none focus:border-sky-500"
          />
          <button
            type="button"
            onClick={() => {
              if (commentInput.trim()) {
                onAddComment?.(commentInput);
                setCommentInput('');
                setActiveSub('none');
              }
            }}
            className="px-2 py-1 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded text-xs cursor-pointer"
          >
            저장
          </button>
        </div>
      )}

      {/* 1차 메인 다크 플로팅 미니바 (Xodo 캡처 2 실사용 판박이 레이아웃) */}
      <div className="px-2 py-1.5 bg-slate-950/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl flex items-center gap-1.5 text-slate-300">
        {/* 1. 팔레트 색상 변경 아이콘 */}
        <button
          type="button"
          onClick={() => setActiveSub(activeSub === 'palette' ? 'none' : 'palette')}
          className={`p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors cursor-pointer ${
            activeSub === 'palette' ? 'bg-slate-800 text-sky-400' : ''
          }`}
          title="색상 변경"
        >
          <Palette className="w-4 h-4" />
        </button>

        {/* 2. 댓글/메모 아이콘 */}
        <button
          type="button"
          onClick={() => setActiveSub(activeSub === 'comment' ? 'none' : 'comment')}
          className={`p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors cursor-pointer ${
            activeSub === 'comment' ? 'bg-slate-800 text-sky-400' : ''
          }`}
          title="댓글/메모 추가"
        >
          <MessageSquare className="w-4 h-4" />
        </button>

        {/* 3. [핵심] 주석 형태 전환 아이콘 (3번째 아이콘 -> 형광펜/취소선/물결 전환) */}
        <button
          type="button"
          onClick={() => setActiveSub(activeSub === 'type_switch' ? 'none' : 'type_switch')}
          className={`p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors cursor-pointer flex items-center gap-0.5 ${
            activeSub === 'type_switch' ? 'bg-sky-600/30 text-sky-400 ring-1 ring-sky-500/50' : ''
          }`}
          title="주석 형태 전환 (형광펜, 취소선, 물결선)"
        >
          <span className="font-serif font-bold text-xs underline decoration-sky-400">A</span>
          <ChevronDown className="w-2.5 h-2.5 opacity-60" />
        </button>

        {/* 4. 삭제 아이콘 */}
        <button
          type="button"
          onClick={() => {
            onDelete?.();
            onClose();
          }}
          className="p-1.5 rounded-lg hover:bg-rose-950/50 hover:text-rose-400 text-slate-400 transition-colors cursor-pointer"
          title="주석 삭제"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <div className="w-px h-3.5 bg-slate-800 mx-0.5" />

        {/* 5. 복사 아이콘 */}
        <button
          type="button"
          onClick={() => {
            onCopy?.();
            onClose();
          }}
          className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          title="텍스트 복사"
        >
          <Copy className="w-4 h-4" />
        </button>

        {/* 6. 더보기 */}
        <button
          type="button"
          onClick={() => alert(`선택된 텍스트: "${selectedText}"`)}
          className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          title="더보기"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* 하단 툴팁 삼각 화살표 */}
      <div className="w-2 h-2 bg-slate-950 border-r border-b border-slate-700/80 rotate-45 -mt-1" />
    </div>
  );
};
