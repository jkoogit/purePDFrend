/**
 * @file PdfMetadataInjector.ts
 * @description PDF 표준 및 커스텀 메타데이터 주입/추출 엔진 (Pure Domain Service)
 * ISO 32000-1 표준 준수, 한글 유니코드 UTF-16BE 무손실 인코딩, 서지/활동/독서 메타데이터 양방향 동기화
 */

import { PDFDocument, PDFName, PDFHexString, PDFString, PDFDict } from 'pdf-lib';
import { IPdfMetadataPort } from '../../../ports/IPdfMetadataPort';
import { PdfMetadataBundle, StandardPdfMetadata } from '../models/PdfMetadataBundle';
import { BookBibliographicInfoProps } from '../models/BookBibliographicInfo';
import { BookActivityInfoProps } from '../models/BookActivityInfo';
import { BookReadingProgressProps } from '../models/BookReadingProgress';

export class PdfMetadataInjector implements IPdfMetadataPort {
  public static readonly KEY_BOOK_META = 'PpdfBookMeta';
  public static readonly KEY_ACTIVITY_META = 'PpdfActivityMeta';
  public static readonly KEY_READING_META = 'PpdfReadingMeta';
  public static readonly KEY_ISBN = 'ISBN';
  public static readonly KEY_PUBLISHER = 'Publisher';

  /**
   * PDFDocument 인스턴스에 메타데이터 번들 주입
   */
  public async injectMetadata(pdfDoc: PDFDocument, bundle: PdfMetadataBundle): Promise<void> {
    const std = bundle.standard;

    // 1. PDF 표준 메타데이터 주입
    if (std.title !== undefined) pdfDoc.setTitle(std.title);
    if (std.author !== undefined) pdfDoc.setAuthor(std.author);
    if (std.subject !== undefined) pdfDoc.setSubject(std.subject);
    if (std.keywords && std.keywords.length > 0) pdfDoc.setKeywords(std.keywords);
    if (std.creator !== undefined) pdfDoc.setCreator(std.creator);
    if (std.producer !== undefined) pdfDoc.setProducer(std.producer);
    if (std.creationDate !== undefined) pdfDoc.setCreationDate(std.creationDate);
    if (std.modificationDate !== undefined) pdfDoc.setModificationDate(std.modificationDate);

    // 2. Info Dictionary 커스텀 메타데이터 주입 (유니코드 무손실 인코딩)
    const infoDict = this.getOrCreateInfoDict(pdfDoc);

    // 2-1. 도서 서지 정보 직렬화
    if (bundle.bibliographic) {
      const bookJson = JSON.stringify(bundle.bibliographic.toJSON());
      infoDict.set(PDFName.of(PdfMetadataInjector.KEY_BOOK_META), PDFHexString.fromText(bookJson));

      // 표준 리더에서 바로 식별 가능하도록 기본 키도 동시 등록
      if (bundle.bibliographic.isbn) {
        infoDict.set(PDFName.of(PdfMetadataInjector.KEY_ISBN), PDFHexString.fromText(bundle.bibliographic.isbn));
      }
      if (bundle.bibliographic.publisher) {
        infoDict.set(PDFName.of(PdfMetadataInjector.KEY_PUBLISHER), PDFHexString.fromText(bundle.bibliographic.publisher));
      }
    }

    // 2-2. 도서 연계 활동 정보 직렬화
    if (bundle.activity) {
      const actJson = JSON.stringify(bundle.activity.toJSON());
      infoDict.set(PDFName.of(PdfMetadataInjector.KEY_ACTIVITY_META), PDFHexString.fromText(actJson));
    }

    // 2-3. 독서 회독 및 진행 상태 직렬화
    if (bundle.reading) {
      const readJson = JSON.stringify(bundle.reading.toJSON());
      infoDict.set(PDFName.of(PdfMetadataInjector.KEY_READING_META), PDFHexString.fromText(readJson));
    }

    // 2-4. 임의 커스텀 키-값 쌍 주입
    if (bundle.customEntries) {
      for (const [key, value] of Object.entries(bundle.customEntries)) {
        if (key && value !== undefined) {
          infoDict.set(PDFName.of(key), PDFHexString.fromText(String(value)));
        }
      }
    }
  }

  /**
   * PDF 바이트 배열에 메타데이터 번들 주입 후 새로운 바이트 배열 반환
   */
  public async injectMetadataToBytes(
    pdfBytes: Uint8Array | ArrayBuffer,
    bundle: PdfMetadataBundle
  ): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    await this.injectMetadata(pdfDoc, bundle);
    return await pdfDoc.save();
  }

  /**
   * PDFDocument 인스턴스로부터 메타데이터 번들 추출 및 역직렬화
   */
  public extractMetadata(pdfDoc: PDFDocument): PdfMetadataBundle {
    const rawKeywords = pdfDoc.getKeywords();
    let parsedKeywords: string[] | undefined = undefined;
    if (Array.isArray(rawKeywords)) {
      parsedKeywords = rawKeywords;
    } else if (typeof rawKeywords === 'string' && rawKeywords.trim()) {
      // PDF 규격상 키워드는 쉼표, 세미콜론 또는 공백으로 구분될 수 있음
      parsedKeywords = rawKeywords.split(/[,;]|\s+/).map((k) => k.trim()).filter(Boolean);
    }

    const standard: StandardPdfMetadata = {
      title: pdfDoc.getTitle(),
      author: pdfDoc.getAuthor(),
      subject: pdfDoc.getSubject(),
      keywords: parsedKeywords,
      creator: pdfDoc.getCreator(),
      producer: pdfDoc.getProducer(),
      creationDate: pdfDoc.getCreationDate(),
      modificationDate: pdfDoc.getModificationDate(),
    };

    const infoDict = this.getOrCreateInfoDict(pdfDoc);

    // 도서 서지 정보 역직렬화
    let bibliographic: BookBibliographicInfoProps | undefined = undefined;
    const rawBookMeta = this.decodeDictValue(infoDict.get(PDFName.of(PdfMetadataInjector.KEY_BOOK_META)));
    if (rawBookMeta) {
      try {
        bibliographic = JSON.parse(rawBookMeta);
      } catch (e) {
        console.warn('Failed to parse PpdfBookMeta JSON:', e);
      }
    }

    // 서지 정보가 없더라도 기본 ISBN / Publisher 키가 있으면 폴백 구성
    if (!bibliographic) {
      const isbn = this.decodeDictValue(infoDict.get(PDFName.of(PdfMetadataInjector.KEY_ISBN)));
      const publisher = this.decodeDictValue(infoDict.get(PDFName.of(PdfMetadataInjector.KEY_PUBLISHER)));
      if (isbn || publisher) {
        bibliographic = {
          publisher: publisher || '',
          authors: standard.author ? [standard.author] : [],
          isbn: isbn,
        };
      }
    }

    // 활동 정보 역직렬화
    let activity: BookActivityInfoProps | undefined = undefined;
    const rawActivityMeta = this.decodeDictValue(infoDict.get(PDFName.of(PdfMetadataInjector.KEY_ACTIVITY_META)));
    if (rawActivityMeta) {
      try {
        activity = JSON.parse(rawActivityMeta);
      } catch (e) {
        console.warn('Failed to parse PpdfActivityMeta JSON:', e);
      }
    }

    // 독서 진행 정보 역직렬화
    let reading: BookReadingProgressProps | undefined = undefined;
    const rawReadingMeta = this.decodeDictValue(infoDict.get(PDFName.of(PdfMetadataInjector.KEY_READING_META)));
    if (rawReadingMeta) {
      try {
        reading = JSON.parse(rawReadingMeta);
      } catch (e) {
        console.warn('Failed to parse PpdfReadingMeta JSON:', e);
      }
    }

    return PdfMetadataBundle.create({
      standard,
      bibliographic,
      activity,
      reading,
    });
  }

  /**
   * PDF 바이트 배열로부터 메타데이터 번들 추출
   */
  public async extractMetadataFromBytes(pdfBytes: Uint8Array | ArrayBuffer): Promise<PdfMetadataBundle> {
    const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    return this.extractMetadata(pdfDoc);
  }

  /**
   * 주입된 모든 커스텀 메타데이터 사전 필드 삭제
   */
  public clearCustomMetadata(pdfDoc: PDFDocument): void {
    const infoDict = this.getOrCreateInfoDict(pdfDoc);
    infoDict.delete(PDFName.of(PdfMetadataInjector.KEY_BOOK_META));
    infoDict.delete(PDFName.of(PdfMetadataInjector.KEY_ACTIVITY_META));
    infoDict.delete(PDFName.of(PdfMetadataInjector.KEY_READING_META));
    infoDict.delete(PDFName.of(PdfMetadataInjector.KEY_ISBN));
    infoDict.delete(PDFName.of(PdfMetadataInjector.KEY_PUBLISHER));
  }

  /**
   * Info Dictionary 접근 및 필요시 자동 생성 헬퍼
   */
  private getOrCreateInfoDict(pdfDoc: PDFDocument): PDFDict {
    const trailerInfo = pdfDoc.context.trailerInfo;
    const existing = pdfDoc.context.lookup(trailerInfo?.Info);
    if (existing instanceof PDFDict) return existing;

    const newDict = pdfDoc.context.obj({});
    if (trailerInfo) {
      trailerInfo.Info = pdfDoc.context.register(newDict);
    }
    return newDict;
  }

  /**
   * Info Dictionary 항목 값(PDFHexString 또는 PDFString)을 유니코드 문자열로 디코딩
   */
  private decodeDictValue(valueObj: any): string | undefined {
    if (!valueObj) return undefined;
    try {
      if (valueObj instanceof PDFHexString) {
        return valueObj.decodeText();
      }
      if (valueObj instanceof PDFString) {
        return valueObj.asString();
      }
      if (typeof valueObj.decodeText === 'function') {
        return valueObj.decodeText();
      }
      if (typeof valueObj.asString === 'function') {
        return valueObj.asString();
      }
    } catch (e) {
      console.warn('Error decoding dict value:', e);
    }
    return String(valueObj);
  }
}
