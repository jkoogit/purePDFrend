/**
 * @file OcrBatchProgressModal.tsx
 * @description 다국어 OCR 병렬 배치 처리 실시간 프로그레스 모달 컴포넌트
 */

import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  XSquare, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Zap, 
  Layers, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { 
  OcrBatchQueueManager, 
  OcrBatchProgressState, 
  PageOcrJob 
} from '../services/ocr/OcrBatchQueueManager';
import { OcrEngineType } from '../../types';

interface OcrBatchProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  pages: { pageNumber: number; imageBlobUrl?: string; imageBase64?: string }[];
  language?: string;
  engineType?: OcrEngineType;
  concurrency?: number;
  onComplete?: (jobs: PageOcrJob[]) => void;
}

export const OcrBatchProgressModal: React.FC<OcrBatchProgressModalProps> = ({
  isOpen,
  onClose,
  pages,
  language = 'kor+eng',
  engineType = 'ensemble',
  concurrency = 3,
  onComplete,
}) => {
  const [state, setState] = useState<OcrBatchProgressState>(() => 
    OcrBatchQueueManager.getInstance().getState()
  );
  const [selectedJob, setSelectedJob] = useState<PageOcrJob | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const manager = OcrBatchQueueManager.getInstance();
    const unsubscribe = manager.subscribe((st) => {
      setState(st);
      if (st.status === 'COMPLETED' && onComplete) {
        onComplete(st.jobs);
      }
    });

    // 모달이 열리고 아직 IDLE 상태이면 자동 시작
    if (manager.getState().status === 'IDLE' && pages.length > 0) {
      manager.startBatch(pages, {
        concurrency,
        language,
        engineType,
      }).catch((err) => {
        console.error('[OcrBatchProgressModal] Start batch error:', err);
      });
    }

    return () => {
      unsubscribe();
    };
  }, [isOpen, pages, language, engineType, concurrency, onComplete]);

  if (!isOpen) return null;

  const manager = OcrBatchQueueManager.getInstance();

  const handlePauseResume = () => {
    if (state.status === 'RUNNING') {
      manager.pause();
    } else if (state.status === 'PAUSED') {
      manager.resume();
    }
  };

  const handleCancel = () => {
    if (confirm('진행 중인 다국어 OCR 배치 작업을 즉시 취소하시겠습니까?')) {
      manager.cancel();
    }
  };

  const handleClose = () => {
    if (state.status === 'RUNNING') {
      if (!confirm('작업이 아직 진행 중입니다. 모달을 닫으면 백그라운드에서 계속 실행됩니다.')) {
        return;
      }
    }
    onClose();
  };

  const formatSeconds = (sec: number) => {
    if (sec <= 0) return '0초';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m > 0) return `약 ${m}분 ${s}초`;
    return `약 ${s}초`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-slate-100">
        
        {/* 상단 헤더 */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                다국어 OCR 병렬 배치 파이프라인
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono border border-purple-500/30">
                  Worker Pool ({state.activeConcurrency}/{concurrency} 스레드)
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                엔진: <span className="text-slate-200 uppercase font-semibold">{engineType}</span> | 언어: <span className="text-slate-200 font-semibold">{language}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-xs px-3 py-1 rounded-full font-semibold border flex items-center gap-1.5 ${
              state.status === 'RUNNING' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse' :
              state.status === 'PAUSED' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
              state.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
              state.status === 'CANCELLED' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
              'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                state.status === 'RUNNING' ? 'bg-blue-400 animate-ping' :
                state.status === 'PAUSED' ? 'bg-amber-400' :
                state.status === 'COMPLETED' ? 'bg-emerald-400' :
                state.status === 'CANCELLED' ? 'bg-rose-400' : 'bg-slate-400'
              }`} />
              {state.status === 'RUNNING' ? '병렬 처리 중' :
               state.status === 'PAUSED' ? '일시 정지됨' :
               state.status === 'COMPLETED' ? '배치 완료' :
               state.status === 'CANCELLED' ? '작업 취소됨' : '대기 중'}
            </span>
            <button
              onClick={handleClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
              title="닫기"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 대시보드 통계 카드 */}
        <div className="p-6 bg-slate-950/40 border-b border-slate-800/80 flex flex-col gap-4">
          {/* 프로그레스 바 */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-sm">
              <span className="font-semibold text-slate-200">
                진행 현황: {state.completedPages + state.failedPages} / {state.totalPages} 쪽 ({state.progressPercent}%)
              </span>
              <span className="text-xs text-slate-400 font-mono">
                완료: <span className="text-emerald-400 font-bold">{state.completedPages}</span> | 실패: <span className="text-rose-400 font-bold">{state.failedPages}</span> | 대기: <span className="text-slate-300">{state.pendingPages}</span>
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-3.5 p-0.5 overflow-hidden border border-slate-700">
              <div
                className="bg-gradient-to-r from-purple-600 via-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-300 ease-out shadow-lg"
                style={{ width: `${state.progressPercent}%` }}
              />
            </div>
          </div>

          {/* 4대 메트릭 카드 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400">처리 속도</p>
                <p className="text-sm font-bold text-slate-100 font-mono">{state.currentTps} 쪽/초</p>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400">남은 예상 시간</p>
                <p className="text-sm font-bold text-slate-100 font-mono">
                  {state.status === 'COMPLETED' ? '완료됨' : formatSeconds(state.estimatedSecondsLeft)}
                </p>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400">경과 시간</p>
                <p className="text-sm font-bold text-slate-100 font-mono">
                  {Math.round(state.elapsedTimeMs / 1000)}초
                </p>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400">성공률</p>
                <p className="text-sm font-bold text-slate-100 font-mono">
                  {state.completedPages + state.failedPages > 0 
                    ? Math.round((state.completedPages / (state.completedPages + state.failedPages)) * 100) 
                    : 100}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 중앙 페이지 미니 그리드 (Visual Map) */}
        <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-3">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span className="font-semibold text-slate-300">페이지별 실시간 처리 상태 맵</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-slate-700" /> 대기</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-blue-500 animate-pulse" /> 처리중</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500" /> 완료</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-rose-500" /> 실패</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-500" /> 건너뜀</span>
            </div>
          </div>

          <div className="grid grid-cols-8 sm:grid-cols-12 md:grid-cols-16 gap-1.5 p-3 bg-slate-950/60 rounded-xl border border-slate-800 max-h-60 overflow-y-auto">
            {state.jobs.map((job) => {
              let bgClass = 'bg-slate-800 text-slate-400 border-slate-700';
              if (job.status === 'PROCESSING') {
                bgClass = 'bg-blue-600/30 text-blue-300 border-blue-500 shadow-md animate-pulse font-bold';
              } else if (job.status === 'COMPLETED') {
                bgClass = 'bg-emerald-600/20 text-emerald-300 border-emerald-500/50';
              } else if (job.status === 'FAILED') {
                bgClass = 'bg-rose-600/30 text-rose-300 border-rose-500 font-bold';
              } else if (job.status === 'SKIPPED') {
                bgClass = 'bg-amber-600/20 text-amber-300 border-amber-500/40';
              }

              return (
                <button
                  key={job.pageNumber}
                  onClick={() => setSelectedJob(job)}
                  className={`h-8 rounded text-xs font-mono border flex items-center justify-center transition-all hover:scale-105 ${bgClass}`}
                  title={`P.${job.pageNumber} (${job.status}) ${job.error ? `: ${job.error}` : ''}`}
                >
                  {job.pageNumber}
                </button>
              );
            })}
          </div>

          {/* 선택된 페이지 상세 정보 */}
          {selectedJob && (
            <div className="p-3 bg-slate-900/90 border border-slate-700 rounded-xl text-xs flex justify-between items-center animate-fade-in">
              <div>
                <span className="font-bold text-white mr-2">P.{selectedJob.pageNumber} 상세:</span>
                <span className="text-slate-300 mr-3">상태: <span className="font-semibold text-purple-300">{selectedJob.status}</span></span>
                {selectedJob.durationMs && <span className="text-slate-400 mr-3">소요: {selectedJob.durationMs}ms</span>}
                {selectedJob.retryCount > 0 && <span className="text-amber-400 mr-3">재시도: {selectedJob.retryCount}회</span>}
                {selectedJob.error && <span className="text-rose-400">오류: {selectedJob.error}</span>}
                {selectedJob.result && <span className="text-emerald-400">인식 텍스트: {selectedJob.result.text.slice(0, 30)}...</span>}
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="text-slate-400 hover:text-white px-2 py-0.5 rounded hover:bg-slate-800"
              >
                닫기
              </button>
            </div>
          )}
        </div>

        {/* 하단 액션 툴바 */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900 flex justify-between items-center">
          <div className="flex items-center gap-2">
            {(state.status === 'RUNNING' || state.status === 'PAUSED') && (
              <>
                <button
                  onClick={handlePauseResume}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                    state.status === 'RUNNING'
                      ? 'bg-amber-600/20 text-amber-300 border border-amber-500/30 hover:bg-amber-600/30'
                      : 'bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600/30'
                  }`}
                >
                  {state.status === 'RUNNING' ? (
                    <>
                      <Pause className="w-3.5 h-3.5" /> 일시 정지
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" /> 작업 재개
                    </>
                  )}
                </button>

                <button
                  onClick={handleCancel}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600/20 text-rose-300 border border-rose-500/30 hover:bg-rose-600/30 transition flex items-center gap-1.5"
                >
                  <XSquare className="w-3.5 h-3.5" /> 배치 취소
                </button>
              </>
            )}

            {(state.status === 'COMPLETED' || state.status === 'CANCELLED') && (
              <button
                onClick={() => {
                  manager.reset();
                  manager.startBatch(pages, { concurrency, language, engineType });
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" /> 다시 실행
              </button>
            )}
          </div>

          <button
            onClick={handleClose}
            className={`px-6 py-2 rounded-xl text-xs font-semibold transition ${
              state.status === 'COMPLETED'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg hover:from-emerald-500 hover:to-teal-500'
                : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
            }`}
          >
            {state.status === 'COMPLETED' ? '완료 및 닫기' : '닫기'}
          </button>
        </div>

      </div>
    </div>
  );
};
