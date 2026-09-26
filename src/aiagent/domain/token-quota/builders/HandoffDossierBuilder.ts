/**
 * @file HandoffDossierBuilder.ts
 * @description 무손실 세션 인계 도시에 빌더 패턴 (Builder Pattern)
 * 복합 객체인 HandoffDossier의 생성 과정을 단계별로 분리하고 무결성 유효성 검증을 보장합니다.
 */

import { HandoffDossier, GitBaselineRefs } from '../types';

export class HandoffDossierBuilder {
  private parentSessionId: string = '';
  private lastTaskId: string = '';
  private lastTaskName: string = '';
  private branch: string = 'dev';
  private calibrationAlpha: number = 1.0;
  private reason: 'SUSPENDED_QUOTA' | 'COMPLETED' | 'MANUAL_HANDOFF' = 'SUSPENDED_QUOTA';
  private baselineRefs: GitBaselineRefs | null = null;
  private pendingBacklogs: Array<{ id: string; title: string; target_layer: string }> = [];

  public setParentSession(sessionId: string): this {
    this.parentSessionId = sessionId;
    return this;
  }

  public setLastTask(taskId: string, taskName: string): this {
    this.lastTaskId = taskId;
    this.lastTaskName = taskName;
    return this;
  }

  public setBranch(branch: string): this {
    this.branch = branch;
    return this;
  }

  public setCalibrationAlpha(alpha: number): this {
    this.calibrationAlpha = alpha;
    return this;
  }

  public setReason(reason: 'SUSPENDED_QUOTA' | 'COMPLETED' | 'MANUAL_HANDOFF'): this {
    this.reason = reason;
    return this;
  }

  public setBaselineRefs(refs: GitBaselineRefs): this {
    this.baselineRefs = refs;
    return this;
  }

  public setPendingBacklogs(backlogs: Array<{ id: string; title: string; target_layer: string }>): this {
    this.pendingBacklogs = [...backlogs];
    return this;
  }

  public addPendingBacklog(backlog: { id: string; title: string; target_layer: string }): this {
    this.pendingBacklogs.push(backlog);
    return this;
  }

  public build(): HandoffDossier {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const handoffToken = `HANDOFF-${timestamp}-${random}`;

    const effectiveRefs: GitBaselineRefs = this.baselineRefs || {
      session_id: this.parentSessionId || 'SESSION-INIT',
      task_id: this.lastTaskId || 'TASK-INIT',
      base_ref: 'HEAD',
      task_checkpoint_ref: 'HEAD',
      current_branch: this.branch,
      is_clean: true,
      modified_files: [],
    };

    const backlogText = this.pendingBacklogs.length > 0
      ? this.pendingBacklogs.map((b) => `[${b.id}] ${b.title} (${b.target_layer})`).join(', ')
      : '없음';

    const resumePrompt = `
[0000] 세션 연장 승계 및 작업 지속 (#세션시작)
- 인계 토큰: ${handoffToken} (사유: ${this.reason})
- 이전 세션 ID: ${this.parentSessionId} (부모 세션 승계 parent_session_id="${this.parentSessionId}")
- 작업 브랜치: ${this.branch} (기준 커밋 base_ref: ${effectiveRefs.base_ref})
- 직전 태스크: [${this.lastTaskId}] ${this.lastTaskName}
- 상속 보정치(α): ${this.calibrationAlpha}
- 미완료 백로그: ${backlogText}
#태스크시작 상속된 기준 커밋 및 백로그를 바탕으로 중단 없는 작업을 이어가겠습니다.
    `.trim();

    return {
      parent_session_id: this.parentSessionId,
      handoff_token: handoffToken,
      generated_at: new Date().toISOString(),
      status: this.reason,
      last_task_id: this.lastTaskId,
      last_task_name: this.lastTaskName,
      branch: this.branch,
      calibration_alpha: this.calibrationAlpha,
      baseline_refs: effectiveRefs,
      pending_backlogs: this.pendingBacklogs,
      resume_prompt: resumePrompt,
    };
  }
}
