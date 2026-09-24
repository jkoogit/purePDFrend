import {
  Settings,
  Zap,
  Target,
  BookOpen,
  RotateCcw,
  X,
  Sparkles,
  FileText,
  Eye,
} from 'lucide-react';
import {
  PdfConfigManager,
  usePdfConfig,
  CONFIG_PRESETS,
  PresetProfileName,
} from '../services/PdfConfigManager';

interface PdfSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PdfSettingsModal({ isOpen, onClose }: PdfSettingsModalProps) {
  const config = usePdfConfig();
  const manager = PdfConfigManager.getInstance();

  if (!isOpen) return null;

  const handleToggle = (key: keyof typeof config) => {
    manager.updateConfig({ [key]: !config[key] });
  };

  const handleChange = (key: keyof typeof config, value: any) => {
    manager.updateConfig({ [key]: value });
  };

  const handleApplyPreset = (preset: PresetProfileName) => {
    manager.applyPreset(preset);
  };

  const handleReset = () => {
    if (confirm('모든 PDF 시스템 설정을 초기 기본값으로 복원하시겠습니까?')) {
      manager.resetToDefaults();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                PDF 시스템 환경설정
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  In-Memory 0ms Write-Through
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                OCR 교정, 뷰어 윈도잉, Searchable PDF 임베딩 및 메모리가드 동작 방식을 선택적으로 제어합니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Preset Profiles */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              원클릭 프리셋 프로파일 (Preset Profiles)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(Object.keys(CONFIG_PRESETS) as PresetProfileName[]).map((key) => {
                const preset = CONFIG_PRESETS[key];
                return (
                  <button
                    key={key}
                    onClick={() => handleApplyPreset(key)}
                    className="flex flex-col text-left p-3.5 rounded-xl border border-slate-700/60 bg-slate-800/40 hover:bg-slate-800 hover:border-indigo-500/50 transition group"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-semibold text-white group-hover:text-indigo-400">
                        {preset.name}
                      </span>
                      {key === 'precision' && <Target className="w-4 h-4 text-emerald-400" />}
                      {key === 'performance' && <Zap className="w-4 h-4 text-amber-400" />}
                      {key === 'massive_book' && <BookOpen className="w-4 h-4 text-blue-400" />}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{preset.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 1: OCR 교정기 설정 */}
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4.5 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-700/40">
              <Target className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-semibold text-slate-200">2-Way OCR 교정 스튜디오 설정</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/60 border border-slate-700/30">
                <div>
                  <div className="text-sm font-medium text-slate-200">실시간 즉시 반영 (Live Sync)</div>
                  <div className="text-xs text-slate-400">교정 텍스트/BBox 변경 즉시 뷰어에 동기화 (OFF 시 저장 버튼 클릭 시 반영)</div>
                </div>
                <input
                  type="checkbox"
                  checked={config.liveSyncCorrection}
                  onChange={() => handleToggle('liveSyncCorrection')}
                  className="w-5 h-5 accent-indigo-500 cursor-pointer rounded"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/60 border border-slate-700/30">
                <div>
                  <div className="text-sm font-medium text-slate-200">2-Way 자동 스크롤 포커스</div>
                  <div className="text-xs text-slate-400">캔버스 BBox 클릭 시 에디터 자동 스크롤 및 포커스 동기화</div>
                </div>
                <input
                  type="checkbox"
                  checked={config.autoScrollSync}
                  onChange={() => handleToggle('autoScrollSync')}
                  className="w-5 h-5 accent-indigo-500 cursor-pointer rounded"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/60 border border-slate-700/30">
                <div>
                  <div className="text-sm font-medium text-slate-200">BBox 4px 그리드 스냅</div>
                  <div className="text-xs text-slate-400">마우스 드래그/리사이즈 시 정렬 스냅 지원 (Shift 누르면 일시 해제)</div>
                </div>
                <input
                  type="checkbox"
                  checked={config.enableBBoxSnap}
                  onChange={() => handleToggle('enableBBoxSnap')}
                  className="w-5 h-5 accent-indigo-500 cursor-pointer rounded"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/60 border border-slate-700/30">
                <div>
                  <div className="text-sm font-medium text-slate-200">저신뢰도 경고 배지 표시</div>
                  <div className="text-xs text-slate-400">신뢰도 80% 미만 단어에 주황/빨강 경고 뱃지 강조</div>
                </div>
                <input
                  type="checkbox"
                  checked={config.showConfidenceBadges}
                  onChange={() => handleToggle('showConfidenceBadges')}
                  className="w-5 h-5 accent-indigo-500 cursor-pointer rounded"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/60 border border-slate-700/30">
                <div>
                  <div className="text-sm font-medium text-slate-200">단축키 가이드 (Ctrl+Z/Y/Del/M/S)</div>
                  <div className="text-xs text-slate-400">무제한 Undo/Redo, 병합, 분할, 삭제 키보드 단축키 활성화</div>
                </div>
                <input
                  type="checkbox"
                  checked={config.enableKeyboardShortcuts}
                  onChange={() => handleToggle('enableKeyboardShortcuts')}
                  className="w-5 h-5 accent-indigo-500 cursor-pointer rounded"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/60 border border-slate-700/30">
                <div>
                  <div className="text-sm font-medium text-slate-200">고대비 BBox 펄스 링 모드</div>
                  <div className="text-xs text-slate-400">시각적 가독성 극대화를 위한 네온 하이라이트 테두리 적용</div>
                </div>
                <input
                  type="checkbox"
                  checked={config.highContrastBBox}
                  onChange={() => handleToggle('highContrastBBox')}
                  className="w-5 h-5 accent-indigo-500 cursor-pointer rounded"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Searchable PDF 내보내기 & 레이아웃 */}
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4.5 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-700/40">
              <FileText className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-slate-200">Searchable PDF 내보내기 & 페이지 레이아웃</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/30">
                <label className="text-sm font-medium text-slate-200 block mb-1">기본 임베딩 폰트</label>
                <select
                  value={config.defaultExportFont}
                  onChange={(e) => handleChange('defaultExportFont', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="Helvetica">Helvetica (표준 라틴/영문 초고속)</option>
                  <option value="Noto Sans KR">Noto Sans KR (한글/다국어 정밀)</option>
                  <option value="Times">Times-Roman (명조체 계열)</option>
                  <option value="Courier">Courier (고정폭 코드/수식)</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/60 border border-slate-700/30">
                <div>
                  <div className="text-sm font-medium text-slate-200">디버그 텍스트 레이어 생성</div>
                  <div className="text-xs text-slate-400">투명 텍스트 대신 붉은 반투명(30%) 레이어로 시각적 검증</div>
                </div>
                <input
                  type="checkbox"
                  checked={config.exportDebugTextLayer}
                  onChange={() => handleToggle('exportDebugTextLayer')}
                  className="w-5 h-5 accent-indigo-500 cursor-pointer rounded"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/60 border border-slate-700/30">
                <div>
                  <div className="text-sm font-medium text-slate-200">소프트 삭제 페이지 영구 클린징</div>
                  <div className="text-xs text-slate-400">저장 시 삭제 표시된 페이지를 메모리/스토리지에서 완전 정리</div>
                </div>
                <input
                  type="checkbox"
                  checked={config.autoCleanOnSave}
                  onChange={() => handleToggle('autoCleanOnSave')}
                  className="w-5 h-5 accent-indigo-500 cursor-pointer rounded"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/60 border border-slate-700/30">
                <div>
                  <div className="text-sm font-medium text-slate-200">내보내기 시 삭제 페이지 포함</div>
                  <div className="text-xs text-slate-400">기본 OFF: 소프트 삭제된 페이지는 PDF 생성 시 자동 제외</div>
                </div>
                <input
                  type="checkbox"
                  checked={config.includeSoftDeletedInExport}
                  onChange={() => handleToggle('includeSoftDeletedInExport')}
                  className="w-5 h-5 accent-indigo-500 cursor-pointer rounded"
                />
              </div>
            </div>
          </div>

          {/* Section 3: 가상 뷰어 & 메모리가드 */}
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4.5 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-700/40">
              <Eye className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-slate-200">가상 뷰어 & LRU 메모리가드</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/30">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-medium text-slate-200">LRU 메모리 캐시 상한</label>
                  <span className="text-xs font-bold text-indigo-400">{config.lruCacheSize} 페이지</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="30"
                  step="5"
                  value={config.lruCacheSize}
                  onChange={(e) => handleChange('lruCacheSize', parseInt(e.target.value, 10))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>5P (최소 메모리)</span>
                  <span>10P (표준)</span>
                  <span>30P (부드러운 스크롤)</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/30">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-medium text-slate-200">캔버스 렌더링 해상도 배율</label>
                  <span className="text-xs font-bold text-indigo-400">{config.renderResolutionDpi}x DPI</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="2.0"
                  step="0.25"
                  value={config.renderResolutionDpi}
                  onChange={(e) => handleChange('renderResolutionDpi', parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>1.0x (초고속)</span>
                  <span>1.5x (권장 고화질)</span>
                  <span>2.0x (Retina)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/80">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-medium transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            초기 기본값 복원
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-indigo-600/30 transition"
          >
            설정 완료 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
}
