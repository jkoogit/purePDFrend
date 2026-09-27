/**
 * @file GovernanceIdGenerator.ts
 * @description AGENTS.md v2.1 거버넌스 4대 식별자(세션, 태스크, 루프, 대화턴) 표준 채번 및 검증 엔진
 * 
 * 1. 세션 ID: SESSION-YYMMDD-[세션번호 0000] (예: SESSION-260924-0011)
 * 2. 태스크 ID: TASK-YYMMDD-[세션번호 0000]-[태스크번호 00] (예: TASK-260924-0011-01)
 * 3. 루프 ID: LOOP-YYMMDD-[세션번호 0000]-[태스크번호 00]-[루프번호 000] (예: LOOP-260924-0011-01-001)
 * 4. 대화턴 ID: TRACE-[세션번호 0000]-[턴번호 0000] (예: TRACE-0011-0001)
 */

export class GovernanceIdGenerator {
  /**
   * 날짜 포맷 YYMMDD 반환 (기본값: 오늘 날짜)
   */
  public static getFormatDate(date: Date = new Date()): string {
    const yy = String(date.getFullYear()).slice(2);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yy}${mm}${dd}`;
  }

  /**
   * 세션번호를 4자리 '0000' 포맷으로 정규화 (숫자 또는 문자열 입력)
   */
  public static formatSessionNumber(sessionNum: number | string): string {
    const clean = String(sessionNum).replace(/[^0-9]/g, '');
    return clean.padStart(4, '0');
  }

  /**
   * 태스크번호를 2자리 '00' 포맷으로 정규화
   */
  public static formatTaskNumber(taskNum: number | string): string {
    const clean = String(taskNum).replace(/[^0-9]/g, '');
    return clean.padStart(2, '0');
  }

  /**
   * 루프번호를 3자리 '000' 포맷으로 정규화
   */
  public static formatLoopNumber(loopNum: number | string): string {
    const clean = String(loopNum).replace(/[^0-9]/g, '');
    return clean.padStart(3, '0');
  }

  /**
   * 턴번호를 4자리 '0000' 포맷으로 정규화
   */
  public static formatTurnNumber(turnNum: number | string): string {
    const clean = String(turnNum).replace(/[^0-9]/g, '');
    return clean.padStart(4, '0');
  }

  /**
   * 1. 세션 ID 생성: SESSION-[세션번호(4자리)]
   * 예: SESSION-0015
   */
  public static generateSessionId(sessionNum: number | string): string {
    const numStr = this.formatSessionNumber(sessionNum);
    return `SESSION-${numStr}`;
  }

  /**
   * 2. 태스크 ID 생성: TASK-[세션번호(4자리)]-[태스크번호(2자리)]
   * 예: TASK-0015-03
   */
  public static generateTaskId(sessionNum: number | string, taskNum: number | string): string {
    const sNumStr = this.extractSessionNumber(sessionNum);
    const tNumStr = this.formatTaskNumber(taskNum);
    return `TASK-${sNumStr}-${tNumStr}`;
  }

  /**
   * 3. 루프 ID 생성: LOOP-[세션번호(4자리)]-[태스크번호(2자리)]-[루프번호(2자리)]
   * 예: LOOP-0015-03-01
   */
  public static generateLoopId(sessionNum: number | string, taskNum: number | string, loopNum: number | string): string {
    const sNumStr = this.extractSessionNumber(sessionNum);
    const tNumStr = this.formatTaskNumber(taskNum);
    const cleanLoop = String(loopNum).replace(/[^0-9]/g, '');
    const lNumStr = cleanLoop.slice(-2).padStart(2, '0');
    return `LOOP-${sNumStr}-${tNumStr}-${lNumStr}`;
  }

  /**
   * 4. 대화턴 ID 생성 (5단 구조 계층 표준): TRACE-[세션번호(4자리)]-[태스크번호(2자리)]-[루프번호(2자리, 없으면 00)]-[턴순번(2자리)]
   * 예: TRACE-0015-03-01-01
   */
  public static generateHierarchicalTraceId(
    sessionId: string | number,
    taskId?: string | number | null,
    loopId?: string | number | null,
    turnNum: number | string = 1,
    _subNum?: number | string
  ): string {
    const sNumStr = this.extractSessionNumber(sessionId);

    // Extract task number (e.g. TASK-0015-01 -> 01, 1 -> 01)
    let tNumStr = '00';
    if (taskId) {
      const taskParts = String(taskId).trim().split('-');
      const lastTaskPart = taskParts[taskParts.length - 1];
      tNumStr = this.formatTaskNumber(lastTaskPart);
    }

    // Extract loop number (e.g. LOOP-0015-03-01 -> 01, 1 -> 01)
    let lNumStr = '00';
    if (loopId) {
      const loopParts = String(loopId).trim().split('-');
      const lastLoopPart = loopParts[loopParts.length - 1];
      const cleanLoop = String(lastLoopPart).replace(/[^0-9]/g, '');
      lNumStr = cleanLoop.slice(-2).padStart(2, '0');
    }

    const turnStr = String(turnNum || 1).replace(/[^0-9]/g, '').slice(-2).padStart(2, '0');

    return `TRACE-${sNumStr}-${tNumStr}-${lNumStr}-${turnStr}`;
  }

  /**
   * 4-1. 기존 레거시 호환 대화턴 ID 생성: TRACE-[세션번호(4자리)]-[턴번호(4자리)]
   * 예: TRACE-0011-0001
   */
  public static generateTraceId(sessionNum: number | string, turnNum: number | string): string {
    const sNumStr = this.extractSessionNumber(String(sessionNum));
    const tNumStr = this.formatTurnNumber(turnNum);
    return `TRACE-${sNumStr}-${tNumStr}`;
  }

  /**
   * 세션 ID로부터 세션번호 추출 (예: SESSION-260924-0011 -> 0011, SESSION-20260923-008 -> 0008, 11 -> 0011)
   */
  public static extractSessionNumber(sessionId: string | number): string {
    if (!sessionId) return '0001';
    const str = String(sessionId).trim();
    if (str.includes('-')) {
      const parts = str.split('-');
      const lastPart = parts[parts.length - 1];
      return this.formatSessionNumber(lastPart);
    }
    return this.formatSessionNumber(str);
  }
}
