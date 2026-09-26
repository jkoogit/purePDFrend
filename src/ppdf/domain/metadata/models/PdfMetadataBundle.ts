/**
 * @file PdfMetadataBundle.ts
 * @description PDF 메타데이터 통합 번들 애그리게이트 (Aggregate Root)
 * 표준 PDF 메타데이터 + 도서 서지 정보 + 활동 정보 + 독서 진행 정보를 단일 패키지로 캡슐화
 */

import { BookBibliographicInfo, BookBibliographicInfoProps } from './BookBibliographicInfo';
import { BookActivityInfo, BookActivityInfoProps } from './BookActivityInfo';
import { BookReadingProgress, BookReadingProgressProps } from './BookReadingProgress';

export interface StandardPdfMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  creator?: string; // 저작 애플리케이션 명칭 (기본값: purePDFrend v1.0)
  producer?: string; // PDF 생성/변환 엔진 명칭 (기본값: purePDFrend Engine (pdf-lib))
  creationDate?: Date;
  modificationDate?: Date;
}

export interface PdfMetadataBundleProps {
  standard?: StandardPdfMetadata;
  bibliographic?: BookBibliographicInfoProps;
  activity?: BookActivityInfoProps;
  reading?: BookReadingProgressProps;
  multiUserReading?: Record<string, BookReadingProgressProps>; // 사용자별 다중 독서 기록
  multiUserActivity?: Record<string, BookActivityInfoProps>; // 사용자별 다중 활동 기록
  customEntries?: Record<string, string>;
}

export class PdfMetadataBundle {
  public readonly standard: Readonly<StandardPdfMetadata>;
  public readonly bibliographic?: BookBibliographicInfo;
  public readonly activity?: BookActivityInfo;
  public readonly reading?: BookReadingProgress;
  public readonly multiUserReading: Readonly<Record<string, BookReadingProgressProps>>;
  public readonly multiUserActivity: Readonly<Record<string, BookActivityInfoProps>>;
  public readonly customEntries: Readonly<Record<string, string>>;

  constructor(props: PdfMetadataBundleProps) {
    const rawStd = props.standard || {};
    this.bibliographic = props.bibliographic ? BookBibliographicInfo.create(props.bibliographic) : undefined;
    this.activity = props.activity ? BookActivityInfo.create(props.activity) : undefined;

    // 페이지 수 정합성 자동 동기화: bibliographic.pageCount가 있고 reading.totalPage가 누락된 경우 자동 채움
    let readingProps = props.reading ? { ...props.reading } : undefined;
    if (readingProps && !readingProps.totalPage && this.bibliographic?.pageCount) {
      readingProps.totalPage = this.bibliographic.pageCount;
    }

    this.reading = readingProps ? BookReadingProgress.create(readingProps) : undefined;
    this.multiUserReading = Object.freeze({ ...(props.multiUserReading || {}) });
    this.multiUserActivity = Object.freeze({ ...(props.multiUserActivity || {}) });
    this.customEntries = Object.freeze({ ...(props.customEntries || {}) });

    // 표준 메타데이터 자동 지능형 보강
    const inferredTitle = rawStd.title || (this.bibliographic ? this.resolveInferredTitle() : undefined);
    const inferredAuthor = rawStd.author || this.bibliographic?.authorsFormatted || undefined;
    const inferredKeywords = this.resolveInferredKeywords(rawStd.keywords);

    this.standard = Object.freeze({
      title: inferredTitle?.trim(),
      author: inferredAuthor?.trim(),
      subject: rawStd.subject?.trim(),
      keywords: inferredKeywords,
      creator: rawStd.creator || 'purePDFrend v1.0',
      producer: rawStd.producer || 'purePDFrend Engine (pdf-lib)',
      creationDate: rawStd.creationDate || new Date(),
      modificationDate: rawStd.modificationDate || new Date(),
    });
  }

  private resolveInferredTitle(): string | undefined {
    if (!this.bibliographic) return undefined;
    if (this.bibliographic.publisher) {
      return `[${this.bibliographic.publisher}] 스캔 도서`;
    }
    return undefined;
  }

  private resolveInferredKeywords(explicitKeywords?: string[]): string[] {
    const keywordSet = new Set<string>((explicitKeywords || []).map((k) => k.trim()).filter(Boolean));

    // 출판사 및 ISBN 자동 태그화
    if (this.bibliographic?.publisher) keywordSet.add(this.bibliographic.publisher);
    if (this.bibliographic?.isbn) keywordSet.add(`ISBN:${this.bibliographic.isbn}`);

    // 활동 분류 자동 태그화
    if (this.activity?.activityTypes) {
      this.activity.activityTypes.forEach((type) => keywordSet.add(type));
    }

    // 회독 자동 태그화
    if (this.reading) {
      keywordSet.add(this.reading.readingRoundLabel);
      keywordSet.add(`상태:${this.reading.status}`);
    }

    return Array.from(keywordSet);
  }

  /**
   * 특정 사용자의 독서 진행 상태 조회 (없으면 기본 reading 반환)
   */
  public getUserReading(userId: string): BookReadingProgress | undefined {
    if (!userId) return this.reading;
    if (this.multiUserReading[userId]) {
      return BookReadingProgress.create(this.multiUserReading[userId]);
    }
    if (this.reading?.userId === userId) {
      return this.reading;
    }
    return undefined;
  }

  /**
   * 특정 사용자의 독서 상태 갱신된 새로운 번들 인스턴스 반환
   */
  public withUserReading(userId: string, progress: BookReadingProgressProps): PdfMetadataBundle {
    const updatedMulti = {
      ...this.multiUserReading,
      [userId]: { ...progress, userId },
    };
    return new PdfMetadataBundle({
      ...this.toJSON(),
      reading: this.reading?.userId === userId ? { ...progress, userId } : this.reading?.toJSON(),
      multiUserReading: updatedMulti,
    });
  }

  /**
   * 특정 사용자의 활동 정보 조회
   */
  public getUserActivity(userId: string): BookActivityInfo | undefined {
    if (!userId) return this.activity;
    if (this.multiUserActivity[userId]) {
      return BookActivityInfo.create(this.multiUserActivity[userId]);
    }
    if (this.activity?.userId === userId) {
      return this.activity;
    }
    return undefined;
  }

  /**
   * 특정 사용자의 활동 정보 갱신된 새로운 번들 인스턴스 반환
   */
  public withUserActivity(userId: string, activity: BookActivityInfoProps): PdfMetadataBundle {
    const updatedMulti = {
      ...this.multiUserActivity,
      [userId]: { ...activity, userId },
    };
    return new PdfMetadataBundle({
      ...this.toJSON(),
      activity: this.activity?.userId === userId ? { ...activity, userId } : this.activity?.toJSON(),
      multiUserActivity: updatedMulti,
    });
  }

  /**
   * 도메인 무결성 및 정합성 검증 결과 반환
   */
  public validateConsistency(): { valid: boolean; warnings: string[] } {
    const warnings: string[] = [];
    if (this.bibliographic && !this.bibliographic.publisher) {
      warnings.push('출판사 정보가 누락되었습니다.');
    }
    if (this.bibliographic && this.bibliographic.authors.length === 0) {
      warnings.push('저자 정보가 1명 이상 등록되어야 합니다.');
    }
    if (this.bibliographic?.isbn && !this.bibliographic.isValidIsbn) {
      warnings.push(`ISBN 형식 또는 체크섬이 비정상입니다: ${this.bibliographic.isbn}`);
    }
    if (this.reading && this.bibliographic?.pageCount && this.reading.totalPage) {
      if (this.reading.totalPage !== this.bibliographic.pageCount) {
        warnings.push(`독서 총페이지(${this.reading.totalPage})와 도서 서지 페이지수(${this.bibliographic.pageCount})가 일치하지 않습니다.`);
      }
    }
    return {
      valid: warnings.length === 0,
      warnings,
    };
  }

  /**
   * 순수 JSON 직렬화 객체 반환
   */
  public toJSON(): PdfMetadataBundleProps {
    return {
      standard: {
        title: this.standard.title,
        author: this.standard.author,
        subject: this.standard.subject,
        keywords: this.standard.keywords ? [...this.standard.keywords] : undefined,
        creator: this.standard.creator,
        producer: this.standard.producer,
        creationDate: this.standard.creationDate,
        modificationDate: this.standard.modificationDate,
      },
      bibliographic: this.bibliographic?.toJSON(),
      activity: this.activity?.toJSON(),
      reading: this.reading?.toJSON(),
      multiUserReading: { ...this.multiUserReading },
      multiUserActivity: { ...this.multiUserActivity },
      customEntries: { ...this.customEntries },
    };
  }

  public static create(props: PdfMetadataBundleProps): PdfMetadataBundle {
    return new PdfMetadataBundle(props);
  }

  /**
   * 빈 기본 번들 인스턴스 생성
   */
  public static createEmpty(title?: string): PdfMetadataBundle {
    return new PdfMetadataBundle({
      standard: {
        title: title || '제목 없는 문서',
        creator: 'purePDFrend v1.0',
        producer: 'purePDFrend Engine (pdf-lib)',
      },
    });
  }
}
