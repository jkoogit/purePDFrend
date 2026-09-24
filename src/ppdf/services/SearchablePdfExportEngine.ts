/**
 * @file SearchablePdfExportEngine.ts
 * @description 투명 텍스트 레이어 결합 Searchable PDF 내보내기 엔진
 * 원본 스캔 이미지 위에 OCR BBox 텍스트를 투명 텍스트(opacity: 0)로 합성하여
 * 원본 화질을 유지하면서 텍스트 검색 및 드래그/복사가 가능한 PDF를 생성합니다.
 */

import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from 'pdf-lib';
import { PdfPageItem, BoundingBoxItem } from '../../types';
import { PageLayoutEngine } from './PageLayoutEngine';

export interface FontOptionItem {
  id: string;
  name: string;
  isCustom: boolean;
  fontBytes?: Uint8Array;
}

export interface SearchablePdfExportOptions {
  bookTitle?: string;
  author?: string;
  fontId?: string; // 'helvetica' | 'times' | 'courier' 또는 등록된 커스텀 폰트 ID
  customFontBytes?: Uint8Array;
  onProgress?: (current: number, total: number, message: string) => void;
}

export interface PdfExportResult {
  pdfBytes: Uint8Array;
  fileName: string;
  pageCount: number;
  totalBytes: number;
  durationMs: number;
}

export class FontRegistry {
  private static registeredFonts: Map<string, FontOptionItem> = new Map([
    { id: 'helvetica', name: '기본 표준 폰트 (Helvetica)', isCustom: false },
    { id: 'times', name: '표준 명조 폰트 (Times Roman)', isCustom: false },
    { id: 'courier', name: '표준 고정폭 폰트 (Courier)', isCustom: false },
    { id: 'noto-sans-kr', name: '시스템 등록 폰트 (Noto Sans KR)', isCustom: true },
  ].map((f) => [f.id, f]));

  public static getAvailableFonts(): FontOptionItem[] {
    return Array.from(this.registeredFonts.values());
  }

  public static registerCustomFont(id: string, name: string, fontBytes: Uint8Array): void {
    this.registeredFonts.set(id, {
      id,
      name,
      isCustom: true,
      fontBytes,
    });
  }

  public static getFont(id: string): FontOptionItem | undefined {
    return this.registeredFonts.get(id);
  }
}

export class SearchablePdfExportEngine {
  /**
   * 표준 파일명 생성 ([도서제목]_ocr_YYYYMMDD.pdf)
   */
  public static generateFileName(bookTitle: string = '도서', date: Date = new Date()): string {
    const sanitizedTitle = bookTitle
      .replace(/[\\/:*?"<>|]/g, '')
      .replace(/\s+/g, '_')
      .trim() || 'purePDFrend_Book';

    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}${mm}${dd}`;

    return `${sanitizedTitle}_ocr_${dateStr}.pdf`;
  }

  /**
   * 웹 BBox 좌표(좌상단 0~100%)를 PDF 포인트 좌표계(좌하단 원점, pt)로 변환
   */
  public static calculatePdfCoordinates(
    box: BoundingBoxItem,
    pageWidth: number,
    pageHeight: number
  ): { x: number; y: number; width: number; height: number; fontSize: number } {
    const width = Math.max(1, (box.w / 100) * pageWidth);
    const height = Math.max(1, (box.h / 100) * pageHeight);
    
    // PDF 좌표계: 좌하단 원점
    const x = (box.x / 100) * pageWidth;
    const y = pageHeight - ((box.y + box.h) / 100 * pageHeight);

    // BBox 높이에 비례한 적정 폰트 크기 계산 (최소 6pt, 최대 48pt)
    const fontSize = Math.max(6, Math.min(48, Math.round(height * 0.85)));

    return { x, y, width, height, fontSize };
  }

  /**
   * Searchable PDF 생성 핵심 파이프라인
   */
  public static async createSearchablePdf(
    pages: PdfPageItem[],
    options: SearchablePdfExportOptions = {}
  ): Promise<PdfExportResult> {
    const startTime = performance.now();
    const activePages = PageLayoutEngine.getActivePages(pages);

    if (activePages.length === 0) {
      throw new Error('내보낼 활성 페이지가 존재하지 않습니다.');
    }

    const doc = await PDFDocument.create();

    // 1. 폰트 로드 및 임베딩
    let font: PDFFont;
    const fontId = options.fontId || 'helvetica';
    const selectedFontOption = FontRegistry.getFont(fontId);

    if (selectedFontOption?.isCustom && (options.customFontBytes || selectedFontOption.fontBytes)) {
      const fontBytes = options.customFontBytes || selectedFontOption.fontBytes!;
      try {
        font = await doc.embedFont(fontBytes);
      } catch (err) {
        console.warn('Custom font embedding failed, fallback to Helvetica:', err);
        font = await doc.embedFont(StandardFonts.Helvetica);
      }
    } else if (fontId === 'times') {
      font = await doc.embedFont(StandardFonts.TimesRoman);
    } else if (fontId === 'courier') {
      font = await doc.embedFont(StandardFonts.Courier);
    } else {
      font = await doc.embedFont(StandardFonts.Helvetica);
    }

    // 2. 도서 메타데이터 주입
    const bookTitle = options.bookTitle || 'purePDFrend High-Resolution Scan Archive';
    doc.setTitle(bookTitle);
    doc.setAuthor(options.author || 'purePDFrend OCR Studio');
    doc.setCreator('purePDFrend Searchable Engine v2.1');
    doc.setProducer('pdf-lib Transparent Text Overlay Pipeline');
    doc.setCreationDate(new Date());

    const total = activePages.length;

    // 3. 페이지별 합성 루프
    for (let i = 0; i < total; i++) {
      const pageItem = activePages[i];
      const pageNum = i + 1;

      if (options.onProgress) {
        options.onProgress(
          pageNum,
          total,
          `페이지 합성 중 (${pageNum}/${total}): 제${pageItem.pageNum}쪽`
        );
      }

      const pageWidth = pageItem.width || 800;
      const pageHeight = pageItem.height || 1131;

      // 새 PDF 페이지 추가
      const pdfPage = doc.addPage([pageWidth, pageHeight]);

      // 3-1. 이미지 레이어 임베딩 (PNG / JPG / Data URL 파싱)
      await this.embedImageLayer(doc, pdfPage, pageItem, pageWidth, pageHeight);

      // 3-2. 투명 텍스트 레이어 임베딩 (opacity: 0)
      this.embedTransparentTextLayer(pdfPage, pageItem, font, pageWidth, pageHeight, selectedFontOption);

      // 메인 스레드 프리징 방지 (10페이지마다 양보)
      if (i % 10 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    if (options.onProgress) {
      options.onProgress(total, total, 'PDF 바이너리 직렬화 및 최적화 중...');
    }

    const pdfBytes = await doc.save();
    const fileName = this.generateFileName(bookTitle);
    const durationMs = Math.round(performance.now() - startTime);

    return {
      pdfBytes,
      fileName,
      pageCount: total,
      totalBytes: pdfBytes.byteLength,
      durationMs,
    };
  }

  /**
   * 스캔 이미지 레이어를 PDF 페이지 배경에 임베딩
   */
  private static async embedImageLayer(
    doc: PDFDocument,
    pdfPage: PDFPage,
    pageItem: PdfPageItem,
    pageWidth: number,
    pageHeight: number
  ): Promise<void> {
    try {
      const imageSrc = pageItem.imageSrc;
      if (!imageSrc) return;

      if (imageSrc.startsWith('data:image/png;base64,')) {
        const base64Data = imageSrc.replace('data:image/png;base64,', '');
        const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
        const pngImage = await doc.embedPng(imageBytes);
        pdfPage.drawImage(pngImage, {
          x: 0,
          y: 0,
          width: pageWidth,
          height: pageHeight,
        });
      } else if (
        imageSrc.startsWith('data:image/jpeg;base64,') ||
        imageSrc.startsWith('data:image/jpg;base64,')
      ) {
        const base64Data = imageSrc.replace(/^data:image\/(jpeg|jpg);base64,/, '');
        const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
        const jpgImage = await doc.embedJpg(imageBytes);
        pdfPage.drawImage(jpgImage, {
          x: 0,
          y: 0,
          width: pageWidth,
          height: pageHeight,
        });
      }
      // SVG 모의 이미지나 일반 Data URL의 경우 텍스트 레이어만으로도 무결성 보장
    } catch (err) {
      console.warn(`[Image Embed Warning - Page ${pageItem.pageNum}]:`, err);
    }
  }

  /**
   * 투명 텍스트 레이어(opacity: 0) 임베딩
   */
  private static embedTransparentTextLayer(
    pdfPage: PDFPage,
    pageItem: PdfPageItem,
    font: PDFFont,
    pageWidth: number,
    pageHeight: number,
    selectedFontOption?: FontOptionItem
  ): void {
    const boxes = pageItem.ocrBoxes || this.generateDefaultMockBoxes(pageItem);

    for (const box of boxes) {
      if (!box.text || !box.text.trim()) continue;

      const { x, y, fontSize } = this.calculatePdfCoordinates(
        box,
        pageWidth,
        pageHeight
      );

      try {
        // 표준 폰트(WinAnsi)의 경우 비-ASCII 문자를 ASCII 안전 문자로 변환하거나 필터링하여 인코딩 오류 방지
        const textToDraw = selectedFontOption?.isCustom
          ? box.text
          : this.sanitizeForStandardFont(box.text);

        if (textToDraw && textToDraw.trim()) {
          pdfPage.drawText(textToDraw, {
            x,
            y,
            size: fontSize,
            font,
            color: rgb(0, 0, 0),
            opacity: 0, // 투명 텍스트 레이어 핵심 불변식
          });
        }
      } catch {
        // 인코딩 불가 문자 발생 시 조용히 건너뛰어 PDF 생성 중단 방어
      }
    }
  }

  /**
   * 표준 내장 폰트(WinAnsi)용 텍스트 정제 (ASCII 범위 보존)
   */
  public static sanitizeForStandardFont(text: string): string {
    // WinAnsi 인코딩 가능 범위(0x20 ~ 0x7E 등)만 필터링하거나 로마자 표기 보존
    return text.replace(/[^\x20-\x7E\xA0-\xFF]/g, ' ').replace(/\s+/g, ' ');
  }

  /**
   * 브라우저 원클릭 파일 다운로드 도우미
   */
  public static downloadBlob(pdfBytes: Uint8Array, fileName: string): void {
    const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // 메모리 해제
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  /**
   * OCR BBox가 없는 페이지용 기본 텍스트 박스 모의 생성기
   */
  private static generateDefaultMockBoxes(pageItem: PdfPageItem): BoundingBoxItem[] {
    return [
      {
        id: `box-${pageItem.pageNum}-1`,
        text: pageItem.title || `Page ${pageItem.pageNum}`,
        confidence: 0.98,
        x: 10,
        y: 8,
        w: 80,
        h: 4,
      },
      {
        id: `box-${pageItem.pageNum}-2`,
        text: `purePDFrend High-Resolution Scan Archive - Document Page ${pageItem.pageNum}`,
        confidence: 0.95,
        x: 10,
        y: 15,
        w: 80,
        h: 3,
      },
    ];
  }
}
