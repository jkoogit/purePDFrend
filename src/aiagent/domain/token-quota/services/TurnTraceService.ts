/**
 * TurnTraceService: 대화 턴 전수 영속화 및 No-LLM 경량 요약 추출 도메인 서비스
 * - user_prompt / agent_response 100% 전문(Full Markdown) 무손실 보존
 * - response_summary: LLM 추가 호출 없이 정규식 기반 첫 줄/헤딩 추출 (토큰 소비 0)
 * - 자유 대화(하네스 외)의 경우 TASK-FREE 식별자 매핑 지원
 * - 태스크 승급 및 세션 마감 시 미적재 턴 일괄 보정(Reconciliation)
 */

export interface TurnTraceData {
  trace_id: string;
  session_id: string;
  task_id: string;
  loop_id?: string | null;
  step_index: number;
  agent_name: string;
  model_name: string;
  operator_account?: string;
  agent_account?: string;
  user_email?: string;
  user_prompt: string;
  agent_response: string;
  response_summary?: string;
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  created_at?: string;
}

export class TurnTraceService {
  /**
   * No-LLM 요약 추출: 별도 LLM API 호출 없이 정규식을 통해 첫 번째 헤딩(#) 또는 핵심 문단을 추출
   * 토큰 소모를 0으로 원천 방어합니다.
   */
  public static extractResponseSummary(agentResponse: string, maxLength: number = 140): string {
    if (!agentResponse || typeof agentResponse !== 'string') {
      return '';
    }

    const lines = agentResponse.split('\n');

    // 1. 헤딩 라인(# 또는 ##) 우선 탐색
    for (const line of lines) {
      const trimmed = line.trim();
      const headingMatch = trimmed.match(/^#+\s+(.+)$/);
      if (headingMatch && headingMatch[1]) {
        const title = headingMatch[1].replace(/[*`]/g, '').trim();
        return title.length > maxLength ? title.slice(0, maxLength) + '...' : title;
      }
    }

    // 2. 헤딩이 없을 경우 첫 번째 의미 있는 텍스트 문단 추출
    for (const line of lines) {
      const trimmed = line.trim();
      if (
        trimmed &&
        !trimmed.startsWith('```') &&
        !trimmed.startsWith('---') &&
        !trimmed.startsWith('>') &&
        !trimmed.startsWith('|')
      ) {
        const cleanText = trimmed.replace(/[*`]/g, '');
        return cleanText.length > maxLength ? cleanText.slice(0, maxLength) + '...' : cleanText;
      }
    }

    return agentResponse.slice(0, maxLength).trim();
  }

  /**
   * 자유 대화 또는 하네스 대화에 적합한 task_id 정규화
   */
  public static normalizeTaskId(taskId?: string | null, activeTaskId?: string | null): string {
    if (taskId && taskId.trim()) {
      return taskId.trim();
    }
    if (activeTaskId && activeTaskId.trim()) {
      return activeTaskId.trim();
    }
    return 'TASK-FREE';
  }

  /**
   * 대화 턴 레코드 전수 검증 및 빌드
   */
  public static buildTraceRecord(params: {
    trace_id?: string;
    session_id: string;
    task_id?: string | null;
    loop_id?: string | null;
    step_index: number;
    agent_name?: string;
    model_name?: string;
    operator_account?: string;
    agent_account?: string;
    user_email?: string;
    user_prompt: string;
    agent_response: string;
    response_summary?: string;
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  }): TurnTraceData {
    const finalTaskId = this.normalizeTaskId(params.task_id);
    const finalSummary = params.response_summary && params.response_summary.trim()
      ? params.response_summary.trim()
      : this.extractResponseSummary(params.agent_response);

    const promptTok = Number(params.prompt_tokens) || 0;
    const compTok = Number(params.completion_tokens) || 0;
    const totalTok = Number(params.total_tokens) || (promptTok + compTok);

    const finalTraceId = params.trace_id || `TRACE-${params.session_id.replace(/^SESSION-/, '')}-${finalTaskId.replace(/^TASK-/, '')}-${String(params.step_index).padStart(2, '0')}`;

    return {
      trace_id: finalTraceId,
      session_id: params.session_id,
      task_id: finalTaskId,
      loop_id: params.loop_id || null,
      step_index: params.step_index,
      agent_name: params.agent_name || 'gemini',
      model_name: params.model_name || 'models/gemini-3.8-flash',
      operator_account: params.operator_account || 'jkoogit',
      agent_account: params.agent_account || 'purePDFrend-agent',
      user_email: params.user_email || 'jkoogit@gmail.com',
      user_prompt: params.user_prompt,
      agent_response: params.agent_response,
      response_summary: finalSummary,
      prompt_tokens: promptTok,
      completion_tokens: compTok,
      total_tokens: totalTok,
      created_at: new Date().toISOString(),
    };
  }
}
