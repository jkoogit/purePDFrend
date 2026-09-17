import { useState, useEffect } from 'react';
import { SystemSettings } from '../types';
import { Cpu, Zap, Check, Play, RefreshCw, HardDrive, DollarSign, Globe, Award } from 'lucide-react';

interface OcrEngineManagerProps {
  settings: SystemSettings | null;
  onUpdateSettings: (newSettings: SystemSettings) => Promise<void>;
}

export default function OcrEngineManager({ settings, onUpdateSettings }: OcrEngineManagerProps) {
  const [localSettings, setLocalSettings] = useState<SystemSettings | null>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Benchmark test state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);
  const [testSampleText, setTestSampleText] = useState(
    '제1장 엔터프라이즈 PDF 제작 및 다국어 OCR 파이프라인\n1.1 스캔 이미지 바운딩 박스 정규화 및 텍스트 교정 엔진'
  );

  useEffect(() => {
    if (settings) setLocalSettings(settings);
  }, [settings]);

  if (!localSettings) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 text-xs">
        설정 정보를 불러오는 중입니다...
      </div>
    );
  }

  const handleToggle = (engine: 'tesseract' | 'gemini') => {
    setLocalSettings((prev) => {
      if (!prev) return prev;
      const currentVal = prev.ocr[engine].enabled;
      // Do not allow disabling both
      if (currentVal && !prev.ocr[engine === 'tesseract' ? 'gemini' : 'tesseract'].enabled) {
        alert('최소 하나의 OCR 엔진은 활성화되어 있어야 합니다.');
        return prev;
      }

      const updated = {
        ...prev,
        ocr: {
          ...prev.ocr,
          [engine]: {
            ...prev.ocr[engine],
            enabled: !currentVal,
          },
          // If active engine is disabled, switch primary to the other
          primaryEngine:
            !currentVal === false && prev.ocr.primaryEngine === engine
              ? engine === 'tesseract'
                ? 'gemini'
                : 'tesseract'
              : prev.ocr.primaryEngine,
        },
      };
      return updated;
    });
  };

  const handleSetPrimary = (engine: 'tesseract' | 'gemini') => {
    if (!localSettings.ocr[engine].enabled) {
      alert('비활성화된 엔진은 기본 엔진으로 지정할 수 없습니다. 먼저 활성화해 주세요.');
      return;
    }
    setLocalSettings((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        ocr: {
          ...prev.ocr,
          primaryEngine: engine,
        },
      };
    });
  };

  const handleSave = async () => {
    if (!localSettings) return;
    setIsSaving(true);
    setSaveMessage(null);
    try {
      await onUpdateSettings(localSettings);
      setSaveMessage('OCR 엔진 설정이 성공적으로 적용되었습니다.');
      setTimeout(() => setSaveMessage(null), 3500);
    } catch (err: any) {
      alert('설정 저장 실패: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const runBenchmarkTest = async (engine: 'tesseract' | 'gemini') => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/ocr/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          engine,
          sampleText: testSampleText,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestResult(data.result);
      }
    } catch (err: any) {
      alert('OCR 테스트 실패: ' + err.message);
    } finally {
      setIsTesting(false);
    }
  };

  const tesseract = localSettings.ocr.tesseract;
  const gemini = localSettings.ocr.gemini;

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-xl p-6 space-y-6 overflow-y-auto">
      {/* Header & Save Action */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-400" />
            OCR 엔진 관리 및 사용여부 설정
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            로컬 WASM 기반 무료 오프라인 엔진과 고정밀 클라우드 AI 엔진의 사용여부 및 기본 우선순위를 제어합니다.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {saveMessage && (
            <span className="text-xs text-emerald-400 font-medium flex items-center gap-1 bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-800/60">
              <Check className="w-3.5 h-3.5" /> {saveMessage}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            {isSaving ? '저장 중...' : '설정 저장 및 즉시 적용'}
          </button>
        </div>
      </div>

      {/* 2 Engine Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Engine 1: Tesseract.js */}
        <div
          className={`p-5 rounded-xl border transition-all ${
            tesseract.enabled
              ? 'border-indigo-500/60 bg-slate-900/90 ring-1 ring-indigo-500/20'
              : 'border-slate-800/80 bg-slate-900/40 opacity-75'
          }`}
        >
          <div className="flex items-start justify-between gap-2 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  {tesseract.name}
                  {localSettings.ocr.primaryEngine === 'tesseract' && (
                    <span className="px-2 py-0.5 rounded-full bg-indigo-500 text-white text-[10px] font-bold">
                      기본 엔진
                    </span>
                  )}
                </h3>
                <span className="text-[11px] text-slate-400">클라이언트 브라우저 WASM 오프라인 구동</span>
              </div>
            </div>

            {/* Toggle Switch */}
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={tesseract.enabled}
                onChange={() => handleToggle('tesseract')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="space-y-2.5 text-xs text-slate-300 mb-4 bg-slate-950/60 p-3.5 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5 text-emerald-400" /> 비용 정책:</span>
              <strong className="text-emerald-400">{tesseract.cost}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-indigo-400" /> 정확도 등급:</span>
              <span>{tesseract.accuracyRating}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-blue-400" /> 지원 언어:</span>
              <span className="font-mono text-[11px] text-slate-300">한국어(kor), 영어(eng), 일본어(jpn)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5"><HardDrive className="w-3.5 h-3.5 text-amber-400" /> 캐시 상태:</span>
              <span className="font-mono text-indigo-300">{tesseract.cacheStatus}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => handleSetPrimary('tesseract')}
              disabled={!tesseract.enabled || localSettings.ocr.primaryEngine === 'tesseract'}
              className="px-3 py-1.5 rounded text-xs font-semibold transition-all border disabled:opacity-50 disabled:cursor-not-allowed bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
            >
              {localSettings.ocr.primaryEngine === 'tesseract' ? '✓ 기본 엔진 지정됨' : '기본 엔진으로 설정'}
            </button>

            <button
              onClick={() => runBenchmarkTest('tesseract')}
              disabled={!tesseract.enabled || isTesting}
              className="px-3 py-1.5 rounded text-xs font-semibold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition-all flex items-center gap-1 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              엔진 벤치마크 테스트
            </button>
          </div>
        </div>

        {/* Engine 2: Gemini 2.5 Flash */}
        <div
          className={`p-5 rounded-xl border transition-all ${
            gemini.enabled
              ? 'border-indigo-500/60 bg-slate-900/90 ring-1 ring-indigo-500/20'
              : 'border-slate-800/80 bg-slate-900/40 opacity-75'
          }`}
        >
          <div className="flex items-start justify-between gap-2 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  {gemini.name}
                  {localSettings.ocr.primaryEngine === 'gemini' && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold">
                      기본 엔진
                    </span>
                  )}
                </h3>
                <span className="text-[11px] text-slate-400">클라우드 멀티모달 고정밀 바운딩 박스 추출</span>
              </div>
            </div>

            {/* Toggle Switch */}
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={gemini.enabled}
                onChange={() => handleToggle('gemini')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          <div className="space-y-2.5 text-xs text-slate-300 mb-4 bg-slate-950/60 p-3.5 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5 text-emerald-400" /> 비용 정책:</span>
              <strong className="text-amber-400">{gemini.cost}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-indigo-400" /> 정확도 등급:</span>
              <span className="text-emerald-400 font-semibold">{gemini.accuracyRating} (필기체/수식 포함)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-blue-400" /> 지원 언어:</span>
              <span className="text-slate-300">전 세계 100+ 언어 자동 감지</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5"><HardDrive className="w-3.5 h-3.5 text-amber-400" /> API 연결 상태:</span>
              <span className="font-mono text-emerald-400">{gemini.cacheStatus}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => handleSetPrimary('gemini')}
              disabled={!gemini.enabled || localSettings.ocr.primaryEngine === 'gemini'}
              className="px-3 py-1.5 rounded text-xs font-semibold transition-all border disabled:opacity-50 disabled:cursor-not-allowed bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
            >
              {localSettings.ocr.primaryEngine === 'gemini' ? '✓ 기본 엔진 지정됨' : '기본 엔진으로 설정'}
            </button>

            <button
              onClick={() => runBenchmarkTest('gemini')}
              disabled={!gemini.enabled || isTesting}
              className="px-3 py-1.5 rounded text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 transition-all flex items-center gap-1 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              엔진 벤치마크 테스트
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Benchmark & Quality Inspection Panel */}
      <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
          <Play className="w-4 h-4 text-emerald-400" />
          OCR 품질 및 레이턴시 벤치마크 테스트 패널
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs text-slate-400">테스트용 텍스트/표본 문장:</label>
            <textarea
              value={testSampleText}
              onChange={(e) => setTestSampleText(e.target.value)}
              rows={3}
              className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex flex-col justify-center text-xs">
            <span className="text-slate-400 mb-1 font-semibold">테스트 상태:</span>
            {isTesting ? (
              <span className="text-indigo-400 flex items-center gap-2 animate-pulse">
                <RefreshCw className="w-4 h-4 animate-spin" /> OCR 엔진 실행 및 결과 분석 중...
              </span>
            ) : testResult ? (
              <div className="space-y-1">
                <div className="text-emerald-400 font-bold">인식 성공 ({testResult.executionTimeMs}ms)</div>
                <div className="text-slate-300">정확도 추정: <strong>{testResult.accuracyEstimated}</strong></div>
                <div className="text-slate-400">감지된 바운딩 박스: {testResult.boxesDetected}개</div>
              </div>
            ) : (
              <span className="text-slate-500">상단 각 엔진 카드의 '벤치마크 테스트'를 클릭하세요.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
