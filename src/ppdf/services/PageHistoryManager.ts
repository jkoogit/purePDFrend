/**
 * @file PageHistoryManager.ts
 * @description 무제한 실행취소(Undo) 및 다시실행(Redo) 상태 관리 엔진 (Command & Memento Pattern)
 * 800쪽 대용량 도서 메타데이터 및 주석 편집 상태를 메모리 누수 없이 가볍고 안전하게 불변 스택으로 관리합니다.
 */

export interface HistoryEntry<T> {
  state: T;
  description: string;
  timestamp: number;
}

export interface HistoryStats {
  undoCount: number;
  redoCount: number;
  canUndo: boolean;
  canRedo: boolean;
  latestAction?: string;
}

export class HistoryManager<T> {
  private undoStack: HistoryEntry<T>[] = [];
  private redoStack: HistoryEntry<T>[] = [];
  private currentState: T;
  private maxDepth: number; // 0 또는 음수면 무제한 (기본 무제한: 0)

  constructor(initialState: T, maxDepth: number = 0) {
    this.currentState = initialState;
    this.maxDepth = maxDepth;
  }

  /**
   * 현재 상태 반환
   */
  public getState(): T {
    return this.currentState;
  }

  /**
   * 새로운 상태 수정 적용 (Execute Command)
   * - Undo 스택에 이전 상태 누적
   * - Redo 스택 초기화 (신규 변경 시작 시 redo 불가)
   * - 현재 상태 갱신
   */
  public execute(nextState: T, description: string = '상태 수정'): void {
    const entry: HistoryEntry<T> = {
      state: this.currentState,
      description,
      timestamp: Date.now(),
    };

    this.undoStack.push(entry);

    // maxDepth가 양수로 지정된 경우 초과분 제거 (기본 0 = 무제한)
    if (this.maxDepth > 0 && this.undoStack.length > this.maxDepth) {
      this.undoStack.shift();
    }

    // 신규 수정 시 Redo 스택은 완전히 초기화됨
    this.redoStack = [];
    this.currentState = nextState;
  }

  /**
   * 실행 취소 (Undo)
   * - Undo 스택에서 직전 상태를 꺼내어 현재 상태로 복원
   * - 현재 상태는 Redo 스택에 누적
   */
  public undo(): T | null {
    if (!this.canUndo()) {
      return null;
    }

    const previousEntry = this.undoStack.pop()!;
    
    // 복구 직전 상태를 Redo 스택에 저장
    this.redoStack.push({
      state: this.currentState,
      description: previousEntry.description,
      timestamp: Date.now(),
    });

    this.currentState = previousEntry.state;
    return this.currentState;
  }

  /**
   * 다시 실행 (Redo)
   * - Redo 스택에서 다음 상태를 꺼내어 현재 상태로 적용
   * - 복원 전 상태는 Undo 스택에 누적
   */
  public redo(): T | null {
    if (!this.canRedo()) {
      return null;
    }

    const nextEntry = this.redoStack.pop()!;

    // 복원 전 상태를 Undo 스택에 저장
    this.undoStack.push({
      state: this.currentState,
      description: nextEntry.description,
      timestamp: Date.now(),
    });

    this.currentState = nextEntry.state;
    return this.currentState;
  }

  /**
   * 실행 취소 가능 여부
   */
  public canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  /**
   * 다시 실행 가능 여부
   */
  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /**
   * 누적된 Undo 스택 크기
   */
  public getUndoCount(): number {
    return this.undoStack.length;
  }

  /**
   * 누적된 Redo 스택 크기
   */
  public getRedoCount(): number {
    return this.redoStack.length;
  }

  /**
   * 히스토리 전체 통계 요약
   */
  public getStats(): HistoryStats {
    const latestEntry = this.undoStack[this.undoStack.length - 1];
    return {
      undoCount: this.undoStack.length,
      redoCount: this.redoStack.length,
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      latestAction: latestEntry ? latestEntry.description : undefined,
    };
  }

  /**
   * 히스토리 스택 초기화
   */
  public clear(newInitialState?: T): void {
    if (newInitialState !== undefined) {
      this.currentState = newInitialState;
    }
    this.undoStack = [];
    this.redoStack = [];
  }
}
