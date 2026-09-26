/**
 * @file IPdfMetadataPort.ts
 * @description PDF 메타데이터 주입 및 추출 헥사고날 포트 인터페이스
 */

import { PDFDocument } from 'pdf-lib';
import { PdfMetadataBundle } from '../domain/metadata/models/PdfMetadataBundle';

export interface IPdfMetadataPort {
  /**
   * PDFDocument 인스턴스에 메타데이터 번들을 주입
   */
  injectMetadata(pdfDoc: PDFDocument, bundle: PdfMetadataBundle): Promise<void>;

  /**
   * 원본 PDF 바이트 배열에 메타데이터 번들을 주입하여 새로운 바이트 배열로 반환
   */
  injectMetadataToBytes(pdfBytes: Uint8Array | ArrayBuffer, bundle: PdfMetadataBundle): Promise<Uint8Array>;

  /**
   * PDFDocument 인스턴스로부터 표준 및 커스텀 메타데이터 번들을 추출
   */
  extractMetadata(pdfDoc: PDFDocument): PdfMetadataBundle;

  /**
   * 원본 PDF 바이트 배열로부터 메타데이터 번들을 추출
   */
  extractMetadataFromBytes(pdfBytes: Uint8Array | ArrayBuffer): Promise<PdfMetadataBundle>;

  /**
   * 주입된 커스텀 메타데이터 사전 필드 삭제
   */
  clearCustomMetadata(pdfDoc: PDFDocument): void;
}
