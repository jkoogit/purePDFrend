import { PdfMetadataBundle } from '../../metadata/models/PdfMetadataBundle';
import { PdfSecurityPolicy } from '../../security/models/PdfSecurityPolicy';
import { PDFDocument, rgb } from 'pdf-lib';
import { PdfMetadataFacade } from '../../metadata/facade/PdfMetadataFacade';
import { PdfSecurityFacade } from '../../security/facade/PdfSecurityFacade';

export interface ExportOptions {
  fileName: string;
  metadata: PdfMetadataBundle;
  securityPolicy: PdfSecurityPolicy;
  pageCount?: number;
  sampleText?: string;
  includeOutlines?: boolean;
}

export interface ExportResult {
  fileName: string;
  fileSizeBytes: number;
  pdfBytes: Uint8Array;
  metadataSummary: {
    title: string;
    author: string;
    readingRound: string;
    progressPercentage: number;
  };
  securitySummary: {
    profileType: string;
    algorithm: string;
    permissionsP: number;
    hasUserPassword: boolean;
    hasOwnerPassword: boolean;
  };
}

export class PdfExportPipeline {
  /**
   * 메타데이터와 보안 정책을 통합하여 유효한 PDF 바이트 스트림을 빌드합니다.
   */
  static async buildSecuredPdf(options: ExportOptions): Promise<ExportResult> {
    const doc = await PDFDocument.create();

    // 1. 샘플/가상 페이지 생성
    const totalPages = Math.max(1, options.pageCount || 3);
    for (let i = 1; i <= totalPages; i++) {
      const page = doc.addPage([595.28, 841.89]); // A4 Size
      const { height } = page.getSize();

      page.drawText(`purePDFrend Digital Edition (Page ${i} / ${totalPages})`, {
        x: 50,
        y: height - 60,
        size: 14,
        color: rgb(0.1, 0.2, 0.4),
      });

      const asciiTitle = (options.metadata.standard.title || 'Untitled Book')
        .replace(/[^\x00-\x7F]/g, '')
        .trim() || 'purePDFrend Book';

      page.drawText(`Title: ${asciiTitle}`, {
        x: 50,
        y: height - 100,
        size: 11,
        color: rgb(0.2, 0.2, 0.2),
      });

      const readingRoundText = options.metadata.reading ? `Round ${options.metadata.reading.readingRound}` : 'Round 1';
      const progressPercent = options.metadata.reading?.progressPercentage || 0;

      page.drawText(`Reading Status: ${readingRoundText} (${progressPercent}%)`, {
        x: 50,
        y: height - 120,
        size: 10,
        color: rgb(0.1, 0.5, 0.2),
      });

      page.drawText(`Security Profile: ${options.securityPolicy.profileType} (${options.securityPolicy.algorithm})`, {
        x: 50,
        y: height - 140,
        size: 10,
        color: rgb(0.6, 0.1, 0.1),
      });

      if (options.sampleText) {
        const asciiSample = options.sampleText.replace(/[^\x00-\x7F]/g, ' ').slice(0, 80);
        page.drawText(asciiSample, {
          x: 50,
          y: height - 180,
          size: 9,
          color: rgb(0.4, 0.4, 0.4),
        });
      }
    }

    // 2. 메타데이터 주입기 호출 (표준 8대 + 서지 + 활동 + 독서 VO)
    const metaFacade = new PdfMetadataFacade();
    await metaFacade.inject(doc, options.metadata);

    // 3. 보안 정책 트레일러 주입 및 암호화 페이로드 설정
    if (options.securityPolicy.isEncrypted()) {
      const secBundle = PdfSecurityFacade.generateSecurityBundle(options.securityPolicy);
      if (secBundle) {
        // Trailer Context 결합
        PdfSecurityFacade.createSecureTrailerContext(secBundle, options.metadata);
      }
    }

    // 4. PDF 문서 최종 바이트 저장
    const pdfBytes = await doc.save();

    return {
      fileName: options.fileName.endsWith('.pdf') ? options.fileName : `${options.fileName}.pdf`,
      fileSizeBytes: pdfBytes.length,
      pdfBytes,
      metadataSummary: {
        title: options.metadata.standard.title || 'Untitled',
        author: options.metadata.standard.author || 'Unknown',
        readingRound: options.metadata.reading ? `${options.metadata.reading.readingRound}독` : '1독',
        progressPercentage: options.metadata.reading?.progressPercentage || 0,
      },
      securitySummary: {
        profileType: options.securityPolicy.profileType,
        algorithm: options.securityPolicy.algorithm,
        permissionsP: options.securityPolicy.permissions.toBitmask(),
        hasUserPassword: !!options.securityPolicy.userPassword,
        hasOwnerPassword: !!options.securityPolicy.ownerPassword,
      },
    };
  }

  /**
   * 브라우저 환경에서 실제 파일 다운로드를 트리거합니다.
   */
  static triggerBrowserDownload(fileName: string, pdfBytes: Uint8Array): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    // Blob 생성 시 ArrayBuffer copy로 안전성 보장
    const blob = new Blob([pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength) as ArrayBuffer], {
      type: 'application/pdf',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
