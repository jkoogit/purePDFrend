/**
 * @file PdfMetadataFacade.ts
 * @description PDF 메타데이터 통합 파사드 (Facade Pattern)
 * 복잡한 하위 도메인(표준, 서지, 활동, 독서 회독 히스토리)의 상호작용을 단일 인터페이스로 단순화
 */

import { PDFDocument } from 'pdf-lib';
import { PdfMetadataBundle } from '../models/PdfMetadataBundle';
import { PdfMetadataInjector } from '../services/PdfMetadataInjector';
import { BookReadingProgress, BookReadingProgressProps, ReadingStatusCode } from '../models/BookReadingProgress';
import { BookActivityInfoProps } from '../models/BookActivityInfo';
import { IPdfMetadataPort } from '../../../ports/IPdfMetadataPort';

export class PdfMetadataFacade {
  private readonly injector: IPdfMetadataPort;

  constructor(injector?: IPdfMetadataPort) {
    this.injector = injector || new PdfMetadataInjector();
  }

  /**
   * PDF 문서에 메타데이터 번들 주입
   */
  public async inject(pdfDoc: PDFDocument, bundle: PdfMetadataBundle): Promise<void> {
    await this.injector.injectMetadata(pdfDoc, bundle);
  }

  /**
   * PDF 바이트 배열에 메타데이터 번들 주입 및 새 바이너리 생성
   */
  public async injectToBytes(pdfBytes: Uint8Array | ArrayBuffer, bundle: PdfMetadataBundle): Promise<Uint8Array> {
    return await this.injector.injectMetadataToBytes(pdfBytes, bundle);
  }

  /**
   * PDF 문서로부터 메타데이터 번들 추출
   */
  public extract(pdfDoc: PDFDocument): PdfMetadataBundle {
    return this.injector.extractMetadata(pdfDoc);
  }

  /**
   * PDF 바이트 배열로부터 메타데이터 번들 추출
   */
  public async extractFromBytes(pdfBytes: Uint8Array | ArrayBuffer): Promise<PdfMetadataBundle> {
    return await this.injector.extractMetadataFromBytes(pdfBytes);
  }

  /**
   * 특정 사용자의 독서 회독을 다음 차수(예: 1독 -> 2독)로 승급하고 이전 이력을 누적 보존
   */
  public advanceReadingRound(
    bundle: PdfMetadataBundle,
    userId: string,
    rating?: number,
    reviewNotes?: string
  ): PdfMetadataBundle {
    const currentProgress = bundle.getUserReading(userId) || bundle.reading;
    if (!currentProgress) {
      // 신규 독서 상태 생성
      const initial = BookReadingProgress.create({
        userId,
        readingRound: 1,
        status: 'READING',
        currentPage: 1,
        totalPage: bundle.bibliographic?.pageCount,
        startedAt: new Date().toISOString().split('T')[0],
      });
      return bundle.withUserReading(userId, initial.toJSON());
    }

    // 완독 처리 후 다음 회독으로 승급
    const completed = currentProgress.markCompleted(rating, reviewNotes);
    const nextRound = completed.nextRound();

    return bundle.withUserReading(userId, nextRound.toJSON());
  }

  /**
   * 특정 사용자의 독서 진행 페이지 및 상태 갱신
   */
  public updateReadingProgress(
    bundle: PdfMetadataBundle,
    userId: string,
    currentPage: number,
    status?: ReadingStatusCode
  ): PdfMetadataBundle {
    const currentProgress = bundle.getUserReading(userId) || bundle.reading;
    const totalPage = currentProgress?.totalPage || bundle.bibliographic?.pageCount;
    const determinedStatus: ReadingStatusCode = status
      ? status
      : totalPage && currentPage >= totalPage
      ? 'COMPLETED'
      : 'READING';

    const updatedProps: BookReadingProgressProps = {
      userId,
      readingRound: currentProgress?.readingRound || 1,
      status: determinedStatus,
      currentPage,
      totalPage,
      startedAt: currentProgress?.startedAt || new Date().toISOString().split('T')[0],
      completedAt: determinedStatus === 'COMPLETED' ? new Date().toISOString().split('T')[0] : currentProgress?.completedAt,
      rating: currentProgress?.rating,
      reviewNotes: currentProgress?.reviewNotes,
      roundHistory: currentProgress?.roundHistory ? [...currentProgress.roundHistory] : [],
      updatedAt: new Date().toISOString(),
    };

    return bundle.withUserReading(userId, updatedProps);
  }

  /**
   * 특정 사용자의 활동 정보 갱신
   */
  public updateActivity(
    bundle: PdfMetadataBundle,
    userId: string,
    activity: BookActivityInfoProps
  ): PdfMetadataBundle {
    return bundle.withUserActivity(userId, activity);
  }

  /**
   * 번들의 정합성 및 유효성 점검
   */
  public validate(bundle: PdfMetadataBundle): { valid: boolean; warnings: string[] } {
    return bundle.validateConsistency();
  }

  /**
   * 커스텀 메타데이터 사전 필드 삭제
   */
  public clearCustomMetadata(pdfDoc: PDFDocument): void {
    this.injector.clearCustomMetadata(pdfDoc);
  }

  /**
   * 싱글톤 또는 기본 인스턴스 제공
   */
  private static defaultInstance?: PdfMetadataFacade;
  public static getInstance(): PdfMetadataFacade {
    if (!this.defaultInstance) {
      this.defaultInstance = new PdfMetadataFacade();
    }
    return this.defaultInstance;
  }
}
