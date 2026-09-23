import { useState, useEffect } from 'react';
import { SystemSettings, OcrEngineType, ImagePreprocessingOptions } from '../../types';
import {
  Cpu,
  Zap,
  Check,
  Play,
  RefreshCw,
  HardDrive,
  DollarSign,
  Globe,
  Award,
  Server,
  Sliders,
  Layers,
  Activity,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface OcrEngineManagerProps {
  settings: SystemSettings | null;
  onUpdateSettings: (newSettings: SystemSettings) => Promise<void>;
  dbStatus?: string;
}

export default function OcrEngineManager({
  settings,
  onUpdateSettings,
  dbStatus = 'CONNECTED',
}: OcrEngineManagerProps) {
  const [localSettings, setLocalSettings] = useState<SystemSettings | null>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Preprocessing options state
  const [prepOptions, setPrepOptions] = useState<ImagePreprocessingOptions>({
    grayscale: true,
    deskew: true,
    binarization: true,
    binarizationThreshold: 128,
    denoise: true,
    contrastEnhance: true,
  });

  // Benchmark test state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);
  const [testSampleText, setTestSampleText] = useState(
    '제1장 엔터프라이즈 PDF 제작 및 다국어 OCR 파이프라인\n1.1 스캔 이미지 바운딩 박스 정규화 및 텍스트 교정 엔진\n1.2 우분투 Docker PaddleOCR 및 클라우드 Gemini 멀티모달 듀얼 어댑터'
  );

  // PaddleOCR server ping state
  const [isPinging, setIsPinging] = useState(false);
  const [pingResult, setPingResult] = useState<{ online: boolean; message: string } | null>(null);

  useEffect(() => {
    if (settings) {
      // Ensure paddleocr default structure exists if upgrading from older store
      const ensuredSettings: SystemSettings = {
        ...settings,
        ocr: {
          ...settings.ocr,
          paddleocr: settings.ocr.paddleocr || {
            enabled: true,
            name: 'PaddleOCR (우분투 Docker CPU)',
            type: 'onpremise_docker',
            cost: '0원 (온프레미스 CPU 무료 연산)',
            languages: ['korean', 'ch', 'en', 'japan'],
            defaultLanguage: 'korean',
            cacheStatus: 'DOCKER READY',
            accuracyRating: '96.5% ~ 98.6%',
            serverUrl: 'http://localhost:8000',
            timeoutMs: 8000,
            cpuMode: true,
            isOnline: false,
          },
        },
      };
      setLocalSettings(ensuredSettings);
    }
  }, [settings]);

  if (!localSettings) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 text-xs">
        설정 정보를 불러오는 중입니다...
      </div>
    );
  }

  const handleToggle = (engine: OcrEngineType) => {
    setLocalSettings((prev) => {
      if (!prev) return prev;
      const targetConfig = prev.ocr[engine];
      if (!targetConfig) return prev;
      const currentVal = targetConfig.enabled;

      // Ensure at least one engine is active
      const otherEnginesActive = Object.entries(prev.ocr)
        .filter(([k]) => k !== engine && (k === 'tesseract' || k === 'gemini' || k === 'paddleocr'))
        .some(([_, v]: any) => v && v.enabled);

      if (currentVal && !otherEnginesActive) {
        alert('최소 하나의 OCR 엔진은 활성화되어 있어야 합니다.');
        return prev;
      }

      const updated = {
        ...prev,
        ocr: {
          ...prev.ocr,
          [engine]: {
            ...targetConfig,
            enabled: !currentVal,
          },
          primaryEngine:
            !currentVal === false && prev.ocr.primaryEngine === engine
              ? (['tesseract', 'gemini', 'paddleocr'] as OcrEngineType[]).find(
                  (e) => e !== engine && prev.ocr[e]?.enabled
                ) || 'tesseract'
              : prev.ocr.primaryEngine,
        },
      };
      return updated;
    });
  };

  const handleSetPrimary = (engine: OcrEngineType) => {
    if (!localSettings.ocr[engine]?.enabled) {
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

  const handleUpdatePaddleUrl = (url: string) => {
    setLocalSettings((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        ocr: {
          ...prev.ocr,
          paddleocr: {
            ...prev.ocr.paddleocr,
            serverUrl: url,
          },
        },
      };
    });
  };

  const handlePingPaddleServer = async () => {
    setIsPinging(true);
    setPingResult(null);
    try {
      const targetUrl = localSettings.ocr.paddleocr?.serverUrl || 'http://localhost:8000';
      const res = await fetch(`/api/ocr/paddle/health?serverUrl=${encodeURIComponent(targetUrl)}`);
      const data = await res.json();
      setPingResult({
        online: !!data.online,
        message: data.message || (data.online ? '연결 성공' : '연결 실패'),
      });
    } catch (err: any) {
      setPingResult({ online: false, message: `서버 연결 대기: ${err.message}` });
    } finally {
      setIsPinging(false);
    }
  };

  const handleSave = async () => {
    if (!localSettings) return;

    if (dbStatus !== 'CONNECTED') {
      alert('영속화 상태 점검필요 (DB 연결이 원활하지 않아 설정 영속화를 수행할 수 없습니다)');
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);
    try {
      await onUpdateSettings(localSettings);
      setSaveMessage('OCR 3대 엔진 및 전처리 설정이 성공적으로 저장되었습니다.');
      setTimeout(() => setSaveMessage(null), 3500);
    } catch (err: any) {
      alert('영속화 상태 점검필요: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const runBenchmarkTest = async (engine: OcrEngineType) => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/ocr/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          engine,
          sampleText: testSampleText,
          preprocessing: prepOptions,
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
  const paddleocr = localSettings.ocr.paddleocr || {
    enabled: true,
    name: 'PaddleOCR (우분투 Docker CPU)',
    type: 'onpremise_docker',
    cost: '0원 (온프레미스 CPU 무료 연산)',
    languages: ['korean', 'ch', 'en', 'japan'],
    defaultLanguage: 'korean',
    cacheStatus: 'DOCKER READY',
    accuracyRating: '96.5% ~ 98.6%',
    serverUrl: 'http://localhost:8000',
    timeoutMs: 8000,
    cpuMode: true,
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-xl p-3.5 sm:p-5 md:p-6 space-y-4 sm:space-y-6 overflow-y-auto">
      {/* Header & Save Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3.5">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm sm:text-base font-bold text-white flex flex-wrap items-center gap-2 leading-snug break-keep">
            <Cpu className="w-5 h-5 text-indigo-400 shrink-0" />
            <span>OCR 3대 엔진 관리 & 고정밀 이미지 전처리 파이프라인</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 break-keep leading-relaxed">
            로컬 WASM 오프라인 엔진, 클라우드 멀티모달 AI, 우분투 Docker 온프레미스 PaddleOCR 엔진의 라우팅 및 실시간 스캔 전처리 설정을 제어합니다.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0 w-full sm:w-auto">
          {saveMessage && (
            <span className="text-xs text-emerald-400 font-medium flex items-center gap-1 bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-800/60 break-keep">
              <Check className="w-3.5 h-3.5 shrink-0" /> <span>{saveMessage}</span>
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full sm:w-auto justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-1.5 break-keep"
          >
            <Check className="w-4 h-4 shrink-0" />
            <span>{isSaving ? '저장 중...' : '설정 저장 및 즉시 적용'}</span>
          </button>
        </div>
      </div>

      {/* 3 Engine Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Engine 1: Tesseract.js (Local WASM) */}
        <div
          className={`p-4 sm:p-5 rounded-xl border transition-all flex flex-col justify-between ${
            tesseract.enabled
              ? 'border-indigo-500/60 bg-slate-900/90 ring-1 ring-indigo-500/20'
              : 'border-slate-800/80 bg-slate-900/40 opacity-75'
          }`}
        >
          <div>
            <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold text-white flex flex-wrap items-center gap-1.5 break-keep">
                    <span>{tesseract.name}</span>
                    {localSettings.ocr.primaryEngine === 'tesseract' && (
                      <span className="px-1.5 py-0.5 rounded-full bg-indigo-500 text-white text-[9px] font-bold">
                        기본 엔진
                      </span>
                    )}
                  </h3>
                  <span className="text-[10px] text-slate-400">클라이언트 WASM 완전 오프라인 구동</span>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={tesseract.enabled}
                  onChange={() => handleToggle('tesseract')}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            <div className="space-y-2 text-[11px] text-slate-300 mb-4 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1"><DollarSign className="w-3 h-3 text-emerald-400" /> 비용 정책:</span>
                <strong className="text-emerald-400">{tesseract.cost}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1"><Award className="w-3 h-3 text-indigo-400" /> 정확도:</span>
                <span>{tesseract.accuracyRating}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1"><Globe className="w-3 h-3 text-blue-400" /> 지원 언어:</span>
                <span className="font-mono text-slate-300">kor, eng, jpn, chi</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
            <button
              onClick={() => handleSetPrimary('tesseract')}
              disabled={!tesseract.enabled || localSettings.ocr.primaryEngine === 'tesseract'}
              className="flex-1 justify-center px-2.5 py-1.5 rounded text-[11px] font-semibold transition-all border disabled:opacity-40 bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
            >
              {localSettings.ocr.primaryEngine === 'tesseract' ? '✓ 기본 엔진' : '기본 설정'}
            </button>
            <button
              onClick={() => runBenchmarkTest('tesseract')}
              disabled={!tesseract.enabled || isTesting}
              className="flex-1 justify-center px-2.5 py-1.5 rounded text-[11px] font-semibold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition-all flex items-center gap-1 disabled:opacity-40"
            >
              <Play className="w-3 h-3" />
              <span>테스트</span>
            </button>
          </div>
        </div>

        {/* Engine 2: Gemini 2.5 Flash (Cloud AI) */}
        <div
          className={`p-4 sm:p-5 rounded-xl border transition-all flex flex-col justify-between ${
            gemini.enabled
              ? 'border-amber-500/60 bg-slate-900/90 ring-1 ring-amber-500/20'
              : 'border-slate-800/80 bg-slate-900/40 opacity-75'
          }`}
        >
          <div>
            <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold text-white flex flex-wrap items-center gap-1.5 break-keep">
                    <span>{gemini.name}</span>
                    {localSettings.ocr.primaryEngine === 'gemini' && (
                      <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[9px] font-bold">
                        기본 엔진
                      </span>
                    )}
                  </h3>
                  <span className="text-[10px] text-slate-400">클라우드 멀티모달 고정밀 BBox 추출</span>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={gemini.enabled}
                  onChange={() => handleToggle('gemini')}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            <div className="space-y-2 text-[11px] text-slate-300 mb-4 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1"><DollarSign className="w-3 h-3 text-emerald-400" /> 비용 정책:</span>
                <strong className="text-amber-400">{gemini.cost}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1"><Award className="w-3 h-3 text-indigo-400" /> 정확도:</span>
                <span className="text-emerald-400 font-semibold">{gemini.accuracyRating}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1"><Globe className="w-3 h-3 text-blue-400" /> 지원 범위:</span>
                <span className="text-slate-300">필기체, 수식, 100+ 다국어</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
            <button
              onClick={() => handleSetPrimary('gemini')}
              disabled={!gemini.enabled || localSettings.ocr.primaryEngine === 'gemini'}
              className="flex-1 justify-center px-2.5 py-1.5 rounded text-[11px] font-semibold transition-all border disabled:opacity-40 bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
            >
              {localSettings.ocr.primaryEngine === 'gemini' ? '✓ 기본 엔진' : '기본 설정'}
            </button>
            <button
              onClick={() => runBenchmarkTest('gemini')}
              disabled={!gemini.enabled || isTesting}
              className="flex-1 justify-center px-2.5 py-1.5 rounded text-[11px] font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 transition-all flex items-center gap-1 disabled:opacity-40"
            >
              <Play className="w-3 h-3" />
              <span>테스트</span>
            </button>
          </div>
        </div>

        {/* Engine 3: PaddleOCR (Ubuntu Docker CPU) */}
        <div
          className={`p-4 sm:p-5 rounded-xl border transition-all flex flex-col justify-between ${
            paddleocr.enabled
              ? 'border-emerald-500/60 bg-slate-900/90 ring-1 ring-emerald-500/20'
              : 'border-slate-800/80 bg-slate-900/40 opacity-75'
          }`}
        >
          <div>
            <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                  <Server className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold text-white flex flex-wrap items-center gap-1.5 break-keep">
                    <span>{paddleocr.name}</span>
                    {localSettings.ocr.primaryEngine === 'paddleocr' && (
                      <span className="px-1.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[9px] font-bold">
                        기본 엔진
                      </span>
                    )}
                  </h3>
                  <span className="text-[10px] text-slate-400">우분투 도커 컨테이너 CPU 전용 고속 배치</span>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={paddleocr.enabled}
                  onChange={() => handleToggle('paddleocr')}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {/* Docker Server URL & Ping Test */}
            <div className="space-y-2 text-[11px] text-slate-300 mb-4 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 flex items-center justify-between">
                  <span>우분투 Docker 엔드포인트 URL:</span>
                  <span className="text-[9px] text-emerald-400 font-mono">CPU MKLDNN 가속</span>
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={paddleocr.serverUrl || 'http://localhost:8000'}
                    onChange={(e) => handleUpdatePaddleUrl(e.target.value)}
                    placeholder="http://<ubuntu-ip>:8000"
                    className="flex-1 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-[11px] text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={handlePingPaddleServer}
                    disabled={isPinging}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 rounded text-[10px] font-semibold flex items-center gap-1"
                  >
                    <Activity className="w-3 h-3" />
                    <span>{isPinging ? '확인 중' : '핑 테스트'}</span>
                  </button>
                </div>
              </div>

              {pingResult && (
                <div
                  className={`text-[10px] p-1.5 rounded flex items-center gap-1 border ${
                    pingResult.online
                      ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50'
                      : 'bg-amber-950/40 text-amber-300 border-amber-800/50'
                  }`}
                >
                  {pingResult.online ? (
                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                  ) : (
                    <AlertCircle className="w-3 h-3 shrink-0" />
                  )}
                  <span className="truncate">{pingResult.message}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-400">비용: <strong className="text-emerald-400">{paddleocr.cost}</strong></span>
                <span className="text-slate-400">정확도: <strong className="text-slate-200">{paddleocr.accuracyRating}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
            <button
              onClick={() => handleSetPrimary('paddleocr')}
              disabled={!paddleocr.enabled || localSettings.ocr.primaryEngine === 'paddleocr'}
              className="flex-1 justify-center px-2.5 py-1.5 rounded text-[11px] font-semibold transition-all border disabled:opacity-40 bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
            >
              {localSettings.ocr.primaryEngine === 'paddleocr' ? '✓ 기본 엔진' : '기본 설정'}
            </button>
            <button
              onClick={() => runBenchmarkTest('paddleocr')}
              disabled={!paddleocr.enabled || isTesting}
              className="flex-1 justify-center px-2.5 py-1.5 rounded text-[11px] font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition-all flex items-center gap-1 disabled:opacity-40"
            >
              <Play className="w-3 h-3" />
              <span>테스트</span>
            </button>
          </div>
        </div>
      </div>

      {/* Image Preprocessing Pipeline Controls */}
      <div className="p-4 sm:p-5 rounded-xl border border-slate-800 bg-slate-900/70 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-400" />
          <span>스캔 도서 고정밀 이미지 전처리 옵션 (Pre-processing Pipeline)</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <label className="flex items-center gap-2 p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg cursor-pointer hover:border-indigo-500/40">
            <input
              type="checkbox"
              checked={prepOptions.deskew}
              onChange={(e) => setPrepOptions((p) => ({ ...p, deskew: e.target.checked }))}
              className="rounded text-indigo-600 focus:ring-0"
            />
            <div>
              <div className="font-semibold text-white">기울기 자동 보정 (Deskew)</div>
              <div className="text-[10px] text-slate-400">투영 분산 기반 ±15° 회전 교정</div>
            </div>
          </label>

          <label className="flex items-center gap-2 p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg cursor-pointer hover:border-indigo-500/40">
            <input
              type="checkbox"
              checked={prepOptions.binarization}
              onChange={(e) => setPrepOptions((p) => ({ ...p, binarization: e.target.checked }))}
              className="rounded text-indigo-600 focus:ring-0"
            />
            <div>
              <div className="font-semibold text-white">적응형 흑백 이진화</div>
              <div className="text-[10px] text-slate-400">조명/그림자 보정 Binarize</div>
            </div>
          </label>

          <label className="flex items-center gap-2 p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg cursor-pointer hover:border-indigo-500/40">
            <input
              type="checkbox"
              checked={prepOptions.denoise}
              onChange={(e) => setPrepOptions((p) => ({ ...p, denoise: e.target.checked }))}
              className="rounded text-indigo-600 focus:ring-0"
            />
            <div>
              <div className="font-semibold text-white">미디언 노이즈 제거</div>
              <div className="text-[10px] text-slate-400">스캔 잡티/얼룩 필터링</div>
            </div>
          </label>

          <label className="flex items-center gap-2 p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg cursor-pointer hover:border-indigo-500/40">
            <input
              type="checkbox"
              checked={prepOptions.contrastEnhance}
              onChange={(e) => setPrepOptions((p) => ({ ...p, contrastEnhance: e.target.checked }))}
              className="rounded text-indigo-600 focus:ring-0"
            />
            <div>
              <div className="font-semibold text-white">대비 향상 (Contrast)</div>
              <div className="text-[10px] text-slate-400">히스토그램 평활화 선명화</div>
            </div>
          </label>
        </div>
      </div>

      {/* Real-time Benchmark & Quality Inspection Panel with Bounding Box Visualizer */}
      <div className="p-4 sm:p-5 rounded-xl border border-slate-800 bg-slate-900/60">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex flex-wrap items-center gap-2 break-keep">
          <Play className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>OCR 전처리 품질 및 바운딩 박스(Bounding Box) 벤치마크 테스트 패널</span>
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
                <RefreshCw className="w-4 h-4 animate-spin" /> OCR 및 전처리 파이프라인 연산 중...
              </span>
            ) : testResult ? (
              <div className="space-y-1.5">
                <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  <span>인식 성공 ({testResult.executionTimeMs}ms)</span>
                </div>
                <div className="text-slate-300">엔진: <strong>{testResult.engineName}</strong></div>
                <div className="text-slate-300">정확도 추정: <strong className="text-indigo-300">{testResult.accuracyEstimated}</strong></div>
                <div className="text-slate-400">감지된 바운딩 박스: <strong>{testResult.boxesDetected}개 라인</strong></div>
                {testResult.preprocessed && (
                  <div className="text-[10px] text-emerald-400 font-mono">
                    ✓ 전처리 완료 (보정 각도: {testResult.deskewAngle}°)
                  </div>
                )}
              </div>
            ) : (
              <span className="text-slate-500">상단 각 엔진 카드의 '테스트' 버튼을 클릭하세요.</span>
            )}
          </div>
        </div>

        {/* Bounding Box Result Visualization Preview */}
        {testResult && testResult.boxes && testResult.boxes.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-800">
            <div className="text-xs text-slate-400 font-semibold mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>추출된 바운딩 박스(Bounding Box) 오버레이 프리뷰:</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[11px] space-y-1.5 max-h-40 overflow-y-auto">
              {testResult.boxes.map((b: any) => (
                <div key={b.id} className="flex items-center justify-between p-1.5 bg-slate-900/60 rounded border border-slate-800/80 hover:border-indigo-500/40">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold shrink-0">
                      #{b.id}
                    </span>
                    <span className="text-slate-200 truncate">{b.text}</span>
                  </div>
                  <div className="text-slate-400 text-[10px] shrink-0 font-mono">
                    x:{b.x}% y:{b.y}% w:{b.w}% (신뢰도: {Math.round(b.confidence * 100)}%)
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
