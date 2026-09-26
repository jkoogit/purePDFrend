/**
 * @file BookActivityInfo.ts
 * @description 도서 연계 활동 정보 값 객체 (Value Object)
 * 활동종류(강의도서, 뉴런데브, 인프런강의, 그룹독서), 강의/스터디명, 활동 메모, 사용자 식별자(userId)
 */

export type StandardActivityType = '강의도서' | '뉴런데브' | '인프런강의' | '그룹독서' | string;

export interface BookActivityInfoProps {
  userId?: string; // 사용자별 격리 관리 식별자
  activityTypes: StandardActivityType[]; // 활동 종류 목록
  courseOrGroupName?: string; // 연계 강의명 또는 스터디 그룹명
  activityNotes?: string; // 활동 상세 메모/요약
  createdAt?: string; // 등록 일시 (ISO-8601)
  updatedAt?: string; // 수정 일시 (ISO-8601)
}

export class BookActivityInfo {
  public readonly userId?: string;
  public readonly activityTypes: readonly StandardActivityType[];
  public readonly courseOrGroupName?: string;
  public readonly activityNotes?: string;
  public readonly createdAt: string;
  public readonly updatedAt: string;

  constructor(props: BookActivityInfoProps) {
    this.userId = props.userId?.trim();
    this.activityTypes = Object.freeze([
      ...Array.from(new Set((props.activityTypes || []).map((t) => t.trim()).filter(Boolean))),
    ]);
    this.courseOrGroupName = props.courseOrGroupName?.trim();
    this.activityNotes = props.activityNotes?.trim();
    this.createdAt = props.createdAt || new Date().toISOString();
    this.updatedAt = props.updatedAt || new Date().toISOString();
  }

  /**
   * 특정 활동 타입 포함 여부 확인
   */
  public hasActivity(type: StandardActivityType): boolean {
    return this.activityTypes.includes(type);
  }

  /**
   * 활동 태그 목록을 쉼표 문자열로 반환
   */
  public get activityTagsFormatted(): string {
    return this.activityTypes.join(', ');
  }

  /**
   * 사용자 변경 시 새로운 인스턴스 복제 생성 (불변성 유지)
   */
  public withUser(userId: string): BookActivityInfo {
    return new BookActivityInfo({
      ...this.toJSON(),
      userId,
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * 활동 타입 추가 시 새로운 인스턴스 복제 생성
   */
  public addActivityType(type: StandardActivityType): BookActivityInfo {
    if (this.hasActivity(type)) return this;
    return new BookActivityInfo({
      ...this.toJSON(),
      activityTypes: [...this.activityTypes, type],
      updatedAt: new Date().toISOString(),
    });
  }

  public toJSON(): BookActivityInfoProps {
    return {
      userId: this.userId,
      activityTypes: [...this.activityTypes],
      courseOrGroupName: this.courseOrGroupName,
      activityNotes: this.activityNotes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  public static create(props: BookActivityInfoProps): BookActivityInfo {
    return new BookActivityInfo(props);
  }
}
