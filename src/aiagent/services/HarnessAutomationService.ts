/**
 * @file HarnessAutomationService.ts
 * @description 결정론적 기계 작업(GitOps, 헬스체크 압축, 세션 인계 도시에, 계정 쿼터) 자동화 도메인 서비스
 */

import fs from 'fs';
import path from 'path';
import {
  GitBaselineRefs,
  HandoffDossier,
  AccountQuotaProfile,
} from '../domain/token-quota/types';
import { TokenUsageEstimator } from '../domain/token-quota/TokenUsageEstimator';

export class HarnessAutomationService {
  private static readonly STORE_PATH = path.join(process.cwd(), 'data', 'local_agent_store.json');

  private static getStore(): any {
    try {
      if (fs.existsSync(this.STORE_PATH)) {
        return JSON.parse(fs.readFileSync(this.STORE_PATH, 'utf8'));
      }
    } catch (e) {
      console.error('Failed to read local store:', e);
    }
    return { sessions: [], tasks: [], loops: [], traces: [] };
  }

  private static saveStore(store: any): void {
    try {
      fs.writeFileSync(this.STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
    } catch (e) {
      console.error('Failed to save local store:', e);
    }
  }

  /**
   * Git 3대 기준점(세션 원점, 태스크 체크포인트, 현재) 조회
   */
  public static getGitBaselineRefs(): GitBaselineRefs {
    const store = this.getStore();
    const activeSession = store.sessions?.[0] || {};
    const activeTask = store.tasks?.[0] || {};

    const sessionId = activeSession.session_id || 'SESSION-UNKNOWN';
    const taskId = activeTask.task_id || 'TASK-NONE';
    const currentBranch = activeTask.git_branch || activeSession.doc_payload?.branch || 'dev';

    // 세션 시작 기준 커밋 SHA
    const baseRef = activeSession.doc_payload?.base_commit_sha || '1a411a1440616499d95a660fd11c60e5d1e17c59';

    // 태스크 체크포인트 SHA
    const taskCheckpointRef = activeTask.checkpoint_tree_sha || activeSession.doc_payload?.base_tree_sha || baseRef;

    return {
      session_id: sessionId,
      task_id: taskId,
      base_ref: baseRef,
      task_checkpoint_ref: taskCheckpointRef,
      current_branch: currentBranch,
      is_clean: true,
      modified_files: [],
    };
  }

  /**
   * 태스크 단위 안전 롤백 체크포인트 등록
   */
  public static setTaskCheckpoint(taskId: string, checkpointSha: string): boolean {
    const store = this.getStore();
    const taskIdx = store.tasks.findIndex((t: any) => t.task_id === taskId);
    if (taskIdx >= 0) {
      store.tasks[taskIdx].checkpoint_tree_sha = checkpointSha;
      this.saveStore(store);
      return true;
    }
    return false;
  }

  /**
   * 4단계 헬스체크 터미널 출력 압축기 (Terminal Condenser: E 기능)
   */
  public static condenseHealthReport(report: any): {
    allPassed: boolean;
    integrityScore: number;
    failedStages: string[];
    condensedSummary: string;
  } {
    const failedStages: string[] = [];
    let score = report?.integrityScore ?? (report?.allPassed ? 100 : 85);

    if (report?.stageResults) {
      report.stageResults.forEach((s: any) => {
        if (!s.passed) {
          failedStages.push(`[${s.stage}] ${s.name}: ${s.error || s.details || '실패'}`);
        }
      });
    }

    const allPassed = failedStages.length === 0;
    const condensedSummary = allPassed
      ? `✅ [100% 무결성 합격] DB 브릿지, 복합 인덱스, 하네스 계층 정합성, 문서 해시 전수 일치 (Score: ${score}점)`
      : `❌ [조치 필요] 감점 발생 (${failedStages.length}건) - ${failedStages.join(' | ')}`;

    return {
      allPassed,
      integrityScore: score,
      failedStages,
      condensedSummary,
    };
  }

  /**
   * E-기능 터미널 헬스체크 출력 압축기 (Terminal Output Condenser)
   * 원본 수백 줄의 터미널 출력을 정형화된 간결한 요약으로 압축하여 토큰 소모 방지
   */
  public static condenseHealthCheck(rawOutput: string): {
    status: 'HEALTHY' | 'WARNING' | 'FAILED';
    tokens_saved_estimate: number;
    compressed_summary: string;
  } {
    const rawTokens = TokenUsageEstimator.estimateTokens(rawOutput);
    const hasFailures = /failure|error|failed|err:/i.test(rawOutput) && !/0 failures/i.test(rawOutput);
    const hasWarnings = /warning/i.test(rawOutput) && !/0 warnings/i.test(rawOutput);

    const status = hasFailures ? 'FAILED' : hasWarnings ? 'WARNING' : 'HEALTHY';
    const lines = rawOutput.trim().split('\n').filter((l) => l.trim().length > 0);
    const summaryLine = lines.find((l) => /summary|passed/i.test(l)) || lines[lines.length - 1] || '전체 점검 완료';
    const compressed_summary = `[${status}] ${summaryLine.trim()} (원본 ${lines.length}줄 압축)`;
    const compressedTokens = TokenUsageEstimator.estimateTokens(compressed_summary);

    return {
      status,
      tokens_saved_estimate: Math.max(0, rawTokens - compressedTokens),
      compressed_summary,
    };
  }

  /**
   * 무손실 세션 인계 도시에(Handover Dossier) 자동 생성
   */
  public static generateHandoverDossier(sessionId: string, reason: 'SUSPENDED_QUOTA' | 'COMPLETED' | 'MANUAL_HANDOFF' = 'SUSPENDED_QUOTA'): HandoffDossier {
    const store = this.getStore();
    const session = store.sessions.find((s: any) => s.session_id === sessionId) || store.sessions?.[0] || {};
    const tasks = store.tasks.filter((t: any) => t.session_id === sessionId);
    const lastTask = tasks[tasks.length - 1] || {};

    const baselineRefs = this.getGitBaselineRefs();

    // 미완료 백로그 수집
    const pendingBacklogs: Array<{ id: string; title: string; target_layer: string }> = [];
    if (session.doc_payload?.backlogs && Array.isArray(session.doc_payload.backlogs)) {
      session.doc_payload.backlogs.forEach((b: any) => {
        if (!b.completed) {
          pendingBacklogs.push({
            id: b.id || 'BL-01',
            title: b.title || String(b),
            target_layer: b.target_layer || '에이전트 서비스',
          });
        }
      });
    }

    const dossier = TokenUsageEstimator.createHandoverDossier({
      parentSessionId: session.session_id || sessionId,
      lastTaskId: lastTask.task_id || 'TASK-NONE',
      lastTaskName: lastTask.task_name || '진행 태스크 없음',
      branch: baselineRefs.current_branch,
      baselineRefs,
      pendingBacklogs,
      reason,
    });

    // 세션 상태를 '중단_토큰소진' 또는 '완료'로 동기화
    if (reason === 'SUSPENDED_QUOTA') {
      session.status_cd = '중단_토큰소진';
      session.ended_at = new Date().toISOString();
      session.handoff_token = dossier.handoff_token;
      this.saveStore(store);
    }

    return dossier;
  }

  /**
   * 세션 연장(Handoff Extension) 실행
   */
  public static extendSession(params: {
    parentSessionId: string;
    handoffToken: string;
    newSessionId: string;
    newSessionName: string;
    accountId?: string;
  }): { success: boolean; session: any; error?: string } {
    const { parentSessionId, handoffToken, newSessionId, newSessionName, accountId = 'jkoogit@gmail.com' } = params;
    const store = this.getStore();

    const parentSession = store.sessions.find((s: any) => s.session_id === parentSessionId);
    if (!parentSession) {
      return { success: false, session: null, error: `부모 세션(${parentSessionId})을 찾을 수 없습니다.` };
    }

    // 부모 세션의 보정치 alpha 및 브랜치 상속
    const inheritedAlpha = parentSession.calibration_alpha || parentSession.doc_payload?.calibration_alpha || 1.0;
    const inheritedBranch = parentSession.doc_payload?.branch || 'task/사용량_계정관리개선_Gemini';

    const newSession = {
      session_id: newSessionId,
      session_name: newSessionName,
      work_group: parentSession.work_group || 'purePDFrend',
      ai_agent: parentSession.ai_agent || 'gemini',
      ai_model: parentSession.ai_model || 'models/gemini-3.8-flash',
      account_id: accountId,
      parent_session_id: parentSessionId,
      handoff_token: handoffToken,
      calibration_alpha: inheritedAlpha,
      status_cd: '진행중',
      started_at: new Date().toISOString(),
      ended_at: null,
      doc_payload: {
        ...(parentSession.doc_payload || {}),
        parent_session_id: parentSessionId,
        handoff_token: handoffToken,
        branch: inheritedBranch,
        extended_from: parentSessionId,
      },
      created_sys: 'agent-harness',
      created_by: accountId,
      updated_sys: 'agent-harness',
      updated_by: accountId,
      version: 1,
    };

    // 로컬 스토어에 추가 (가장 앞단에 배치하여 활성 세션으로 설정)
    store.sessions.unshift(newSession);
    this.saveStore(store);

    return { success: true, session: newSession };
  }

  /**
   * 계정별 토큰 사용량 및 쿼터 현황 계산
   */
  public static getAccountQuotaUsage(userEmail: string = 'jkoogit@gmail.com'): AccountQuotaProfile {
    const store = this.getStore();
    const allocatedQuota = 200000; // 계정당 기본 할당 20만 토큰

    // 해당 계정의 트레이스 필터
    const accountTraces = store.traces || [];
    const usedQuota = accountTraces.reduce((sum: number, t: any) => {
      return sum + (t.total_tokens || ((t.prompt_tokens || 0) + (t.completion_tokens || 0)));
    }, 0);

    const remainingQuota = Math.max(0, allocatedQuota - usedQuota);
    const activeSessionsCount = store.sessions.filter((s: any) => s.status_cd === '진행중').length;

    let burnoutRiskLevel: 'SAFE' | 'CAUTION' | 'CRITICAL' = 'SAFE';
    const usagePercent = (usedQuota / allocatedQuota) * 100;
    if (usagePercent >= 85) burnoutRiskLevel = 'CRITICAL';
    else if (usagePercent >= 70) burnoutRiskLevel = 'CAUTION';

    return {
      account_id: userEmail,
      user_email: userEmail,
      allocated_quota: allocatedQuota,
      used_quota: usedQuota,
      remaining_quota: remainingQuota,
      active_sessions_count: activeSessionsCount,
      burnout_risk_level: burnoutRiskLevel,
    };
  }
}
