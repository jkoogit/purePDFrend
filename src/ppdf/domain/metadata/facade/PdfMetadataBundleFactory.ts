/**
 * @file PdfMetadataBundleFactory.ts
 * @description PDF 메타데이터 번들 생성 팩토리 및 빌더 (Factory / Builder Pattern)
 * 도서 서지 정보, 활동 정보, 독서 진행 정보를 조립하고 데이터 일관성을 사전 보정
 */

import { StandardPdfMetadata, PdfMetadataBundle, PdfMetadataBundleProps } from '../models/PdfMetadataBundle';
import { BookBibliographicInfoProps } from '../models/BookBibliographicInfo';
import { BookActivityInfoProps, StandardActivityType } from '../models/BookActivityInfo';
import { BookReadingProgressProps } from '../models/BookReadingProgress';

export class PdfMetadataBundleFactory {
  private standard: StandardPdfMetadata = {};
  private bibliographic?: BookBibliographicInfoProps;
  private activity?: BookActivityInfoProps;
  private reading?: BookReadingProgressProps;
  private multiUserReading: Record<string, BookReadingProgressProps> = {};
  private multiUserActivity: Record<string, BookActivityInfoProps> = {};
  private customEntries: Record<string, string> = {};

  /**
   * 표준 메타데이터 설정
   */
  public setStandard(std: StandardPdfMetadata): this {
    this.standard = { ...this.standard, ...std };
    return this;
  }

  /**
   * 도서 서지 정보 설정
   */
  public setBibliographic(bib: BookBibliographicInfoProps): this {
    this.bibliographic = { ...bib };
    // 제목이 없으면 출판사 기반 기본 제목 추론 설정
    if (!this.standard.title && bib.publisher) {
      this.standard.title = `[${bib.publisher}] 스캔 도서`;
    }
    // 저자가 없으면 서지 저자 목록으로 표준 author 설정
    if (!this.standard.author && bib.authors?.length) {
      this.standard.author = bib.authors.join(', ');
    }
    return this;
  }

  /**
   * 활동 정보 설정
   */
  public setActivity(act: BookActivityInfoProps): this {
    this.activity = { ...act };
    if (act.userId) {
      this.multiUserActivity[act.userId] = { ...act };
    }
    return this;
  }

  /**
   * 단일 활동 태그 추가
   */
  public addActivityType(type: StandardActivityType, userId?: string): this {
    if (!this.activity) {
      this.activity = { activityTypes: [type], userId };
    } else {
      const current = this.activity.activityTypes || [];
      if (!current.includes(type)) {
        this.activity.activityTypes = [...current, type];
      }
    }
    if (userId) {
      this.activity.userId = userId;
      this.multiUserActivity[userId] = { ...this.activity };
    }
    return this;
  }

  /**
   * 독서 진행 정보 설정
   */
  public setReading(reading: BookReadingProgressProps): this {
    this.reading = { ...reading };
    // 서지 정보에 pageCount가 있고 독서에 totalPage가 없으면 자동 동기화
    if (!this.reading.totalPage && this.bibliographic?.pageCount) {
      this.reading.totalPage = this.bibliographic.pageCount;
    }
    if (reading.userId) {
      this.multiUserReading[reading.userId] = { ...this.reading };
    }
    return this;
  }

  /**
   * 특정 사용자의 독서 상태 등록
   */
  public addUserReading(userId: string, reading: BookReadingProgressProps): this {
    const updated = {
      ...reading,
      userId,
      totalPage: reading.totalPage || this.bibliographic?.pageCount,
    };
    this.multiUserReading[userId] = updated;
    if (!this.reading || this.reading.userId === userId) {
      this.reading = updated;
    }
    return this;
  }

  /**
   * 특정 사용자의 활동 정보 등록
   */
  public addUserActivity(userId: string, activity: BookActivityInfoProps): this {
    const updated = { ...activity, userId };
    this.multiUserActivity[userId] = updated;
    if (!this.activity || this.activity.userId === userId) {
      this.activity = updated;
    }
    return this;
  }

  /**
   * 커스텀 키-값 속성 추가
   */
  public addCustomEntry(key: string, value: string): this {
    this.customEntries[key] = value;
    return this;
  }

  /**
   * 불변 PdfMetadataBundle 객체 생성
   */
  public build(): PdfMetadataBundle {
    const props: PdfMetadataBundleProps = {
      standard: this.standard,
      bibliographic: this.bibliographic,
      activity: this.activity,
      reading: this.reading,
      multiUserReading: this.multiUserReading,
      multiUserActivity: this.multiUserActivity,
      customEntries: this.customEntries,
    };

    return PdfMetadataBundle.create(props);
  }

  /**
   * 기존 번들을 기반으로 빌더 인스턴스 복제 생성
   */
  public static fromBundle(bundle: PdfMetadataBundle): PdfMetadataBundleFactory {
    const factory = new PdfMetadataBundleFactory();
    factory.standard = { ...bundle.standard };
    if (bundle.bibliographic) factory.bibliographic = bundle.bibliographic.toJSON();
    if (bundle.activity) factory.activity = bundle.activity.toJSON();
    if (bundle.reading) factory.reading = bundle.reading.toJSON();
    factory.multiUserReading = { ...bundle.multiUserReading };
    factory.multiUserActivity = { ...bundle.multiUserActivity };
    factory.customEntries = { ...bundle.customEntries };
    return factory;
  }

  public static create(): PdfMetadataBundleFactory {
    return new PdfMetadataBundleFactory();
  }
}
