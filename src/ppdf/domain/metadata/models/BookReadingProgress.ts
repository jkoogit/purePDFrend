/**
 * @file BookReadingProgress.ts
 * @description 독서 회독 및 진행 상태 값 객체 (Value Object)
 * 회독(1독, 2독, 3독...), 과거 회독 누적 히스토리(roundHistory), 독서 진행상태, 진도율, 별점, 독서 메모, 사용자 식별자(userId)
 */

export type ReadingStatusCode = 'NOT_STARTED' | 'READING' | 'COMPLETED' | 'PAUSED';

export interface ReadingRoundRecord {
  readingRound: number; // 회독 차수
  status: ReadingStatusCode; // 해당 회독 최종 상태
  startedAt?: string; // 독서 시작 일자
  completedAt?: string; // 완독 일자
  rating?: number; // 별점 (1 ~ 5)
  reviewNotes?: string; // 해당 회독 서평/메모
  finalPage?: number; // 완독 또는 종료 시점 페이지
}

export interface BookReadingProgressProps {
  userId?: string; // 사용자별 관리 식별자
  readingRound: number; // 현재 회독 차수 (기본값: 1독)
  status: ReadingStatusCode; // 독서 진행상태
  currentPage?: number; // 현재 읽고 있는 페이지 번호
  totalPage?: number; // 전체 페이지 수
  startedAt?: string; // 독서 시작 일자 (YYYY-MM-DD 또는 ISO-8601)
  completedAt?: string; // 완독 일자 (YYYY-MM-DD 또는 ISO-8601)
  rating?: number; // 도서 평점 (1 ~ 5점)
  reviewNotes?: string; // 한줄 서평 또는 독서 메모
  roundHistory?: ReadingRoundRecord[]; // 과거 완료된 회독 히스토리 목록
  updatedAt?: string; // 수정 일시 (ISO-8601)
}

export class BookReadingProgress {
  public readonly userId?: string;
  public readonly readingRound: number;
  public readonly status: ReadingStatusCode;
  public readonly currentPage?: number;
  public readonly totalPage?: number;
  public readonly startedAt?: string;
  public readonly completedAt?: string;
  public readonly rating?: number;
  public readonly reviewNotes?: string;
  public readonly roundHistory: readonly ReadingRoundRecord[];
  public readonly updatedAt: string;

  constructor(props: BookReadingProgressProps) {
    this.userId = props.userId?.trim();
    this.readingRound = Math.max(1, Math.floor(props.readingRound || 1));
    this.status = props.status || 'NOT_STARTED';
    this.totalPage = typeof props.totalPage === 'number' && props.totalPage > 0 ? props.totalPage : undefined;

    // 페이지 번호 경계 방어 로직 (0 <= currentPage <= totalPage)
    if (typeof props.currentPage === 'number' && props.currentPage >= 0) {
      this.currentPage = this.totalPage ? Math.min(props.currentPage, this.totalPage) : props.currentPage;
    } else {
      this.currentPage = undefined;
    }

    this.startedAt = props.startedAt?.trim();
    this.completedAt = props.completedAt?.trim();
    this.rating = typeof props.rating === 'number' ? Math.min(5, Math.max(1, props.rating)) : undefined;
    this.reviewNotes = props.reviewNotes?.trim();
    this.roundHistory = Object.freeze([...(props.roundHistory || [])]);
    this.updatedAt = props.updatedAt || new Date().toISOString();
  }

  /**
   * 회독 표시 레이블 (예: "1독", "2독", "3독")
   */
  public get readingRoundLabel(): string {
    return `${this.readingRound}독`;
  }

  /**
   * 독서 진행률 백분율 계산 (0 ~ 100%)
   */
  public get progressPercentage(): number {
    if (!this.currentPage || !this.totalPage || this.totalPage <= 0) {
      return this.status === 'COMPLETED' ? 100 : 0;
    }
    const percent = Math.round((this.currentPage / this.totalPage) * 100);
    return Math.min(100, Math.max(0, percent));
  }

  /**
   * 다음 회독으로 승급한 새로운 인스턴스 생성
   * - 현재 회독의 이력(시작일, 완독일, 평점, 서평 등)을 roundHistory에 누적 보존하여 데이터 유실을 원천 방지
   */
  public nextRound(): BookReadingProgress {
    const currentRoundRecord: ReadingRoundRecord = {
      readingRound: this.readingRound,
      status: this.status === 'NOT_STARTED' ? 'COMPLETED' : this.status,
      startedAt: this.startedAt,
      completedAt: this.completedAt || new Date().toISOString().split('T')[0],
      rating: this.rating,
      reviewNotes: this.reviewNotes,
      finalPage: this.currentPage || this.totalPage,
    };

    return new BookReadingProgress({
      ...this.toJSON(),
      readingRound: this.readingRound + 1,
      status: 'READING',
      currentPage: 1,
      startedAt: new Date().toISOString().split('T')[0],
      completedAt: undefined,
      rating: undefined,
      reviewNotes: undefined,
      roundHistory: [...this.roundHistory, currentRoundRecord],
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * 완독 처리된 새로운 인스턴스 생성
   */
  public markCompleted(rating?: number, reviewNotes?: string): BookReadingProgress {
    return new BookReadingProgress({
      ...this.toJSON(),
      status: 'COMPLETED',
      currentPage: this.totalPage || this.currentPage,
      completedAt: new Date().toISOString().split('T')[0],
      rating: rating !== undefined ? Math.min(5, Math.max(1, rating)) : this.rating,
      reviewNotes: reviewNotes !== undefined ? reviewNotes : this.reviewNotes,
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * 특정 회독의 히스토리 조회
   */
  public getHistoryOfRound(round: number): ReadingRoundRecord | undefined {
    return this.roundHistory.find((r) => r.readingRound === round);
  }

  public toJSON(): BookReadingProgressProps {
    return {
      userId: this.userId,
      readingRound: this.readingRound,
      status: this.status,
      currentPage: this.currentPage,
      totalPage: this.totalPage,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      rating: this.rating,
      reviewNotes: this.reviewNotes,
      roundHistory: [...this.roundHistory],
      updatedAt: this.updatedAt,
    };
  }

  public static create(props: BookReadingProgressProps): BookReadingProgress {
    return new BookReadingProgress(props);
  }
}
