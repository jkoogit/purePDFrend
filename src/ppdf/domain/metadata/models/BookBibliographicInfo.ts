/**
 * @file BookBibliographicInfo.ts
 * @description 도서 서지 정보 값 객체 (Value Object)
 * 출판사, 저자/역자, 발행일, 가격, 페이지수, ISBN, 온라인서점/eBook/원서/정오표/코드 링크 등
 */

export interface BookstoreUrlItem {
  name: string;
  url: string;
}

export interface BookstoreUrls {
  aladin?: string;
  kyobo?: string;
  yes24?: string;
  others?: BookstoreUrlItem[];
}

export interface EbookUrls {
  ridi?: string;
  yes24?: string;
  kyobo?: string;
  others?: BookstoreUrlItem[];
}

export interface OriginalBookUrls {
  amazon?: string;
  kyobo?: string;
  aladin?: string;
  yes24?: string;
  others?: BookstoreUrlItem[];
}

export interface BookBibliographicInfoProps {
  publisher: string; // 출판사
  authors: string[]; // 저자 목록
  translators?: string[]; // 역자 목록
  publishedDate?: string; // 발행일자 (YYYY-MM-DD)
  price?: number | string; // 정가 / 가격
  pageCount?: number; // 총 페이지 수
  isbn?: string; // ISBN
  bookstoreUrls?: BookstoreUrls; // 온라인 서점 URL 목록
  ebookUrls?: EbookUrls; // 전자책 서점 URL 목록
  errataUrl?: string; // 정오표 링크
  githubUrl?: string; // GitHub 저장소 URL
  sampleCodeUrl?: string; // 예제 코드 다운로드 URL
  originalBookUrls?: OriginalBookUrls; // 원서 구매/정보 링크
}

export class BookBibliographicInfo {
  public readonly publisher: string;
  public readonly authors: readonly string[];
  public readonly translators: readonly string[];
  public readonly publishedDate?: string;
  public readonly price?: number | string;
  public readonly pageCount?: number;
  public readonly isbn?: string;
  public readonly bookstoreUrls: BookstoreUrls;
  public readonly ebookUrls: EbookUrls;
  public readonly errataUrl?: string;
  public readonly githubUrl?: string;
  public readonly sampleCodeUrl?: string;
  public readonly originalBookUrls: OriginalBookUrls;

  constructor(props: BookBibliographicInfoProps) {
    this.publisher = (props.publisher || '').trim();
    this.authors = Object.freeze([...(props.authors || []).map((a) => a.trim()).filter(Boolean)]);
    this.translators = Object.freeze([...(props.translators || []).map((t) => t.trim()).filter(Boolean)]);
    this.publishedDate = props.publishedDate?.trim();
    this.price = props.price;
    this.pageCount = typeof props.pageCount === 'number' && props.pageCount > 0 ? props.pageCount : undefined;
    this.isbn = props.isbn ? props.isbn.replace(/[^0-9X-]/gi, '').trim() : undefined;
    this.bookstoreUrls = Object.freeze({ ...(props.bookstoreUrls || {}) });
    this.ebookUrls = Object.freeze({ ...(props.ebookUrls || {}) });
    this.errataUrl = props.errataUrl?.trim();
    this.githubUrl = props.githubUrl?.trim();
    this.sampleCodeUrl = props.sampleCodeUrl?.trim();
    this.originalBookUrls = Object.freeze({ ...(props.originalBookUrls || {}) });
  }

  /**
   * 저자 목록을 쉼표로 연결된 문자열로 포맷
   */
  public get authorsFormatted(): string {
    return this.authors.join(', ');
  }

  /**
   * 역자 목록을 쉼표로 연결된 문자열로 포맷
   */
  public get translatorsFormatted(): string {
    return this.translators.join(', ');
  }

  /**
   * 가격 한국어 원화 포맷 (예: 34,000원)
   */
  public get priceFormatted(): string {
    if (typeof this.price === 'number') {
      return `${this.price.toLocaleString('ko-KR')}원`;
    }
    if (typeof this.price === 'string' && this.price.trim()) {
      return this.price.trim().endsWith('원') ? this.price.trim() : `${this.price.trim()}원`;
    }
    return '가격 정보 없음';
  }

  /**
   * ISBN-10 또는 ISBN-13 유효성 검증
   */
  public get isValidIsbn(): boolean {
    if (!this.isbn) return false;
    const clean = this.isbn.replace(/[^0-9X]/gi, '').toUpperCase();
    if (clean.length === 10) {
      let sum = 0;
      for (let i = 0; i < 9; i++) {
        sum += parseInt(clean[i], 10) * (10 - i);
      }
      const check = clean[9] === 'X' ? 10 : parseInt(clean[9], 10);
      sum += check;
      return sum % 11 === 0;
    } else if (clean.length === 13) {
      let sum = 0;
      for (let i = 0; i < 12; i++) {
        sum += parseInt(clean[i], 10) * (i % 2 === 0 ? 1 : 3);
      }
      const check = parseInt(clean[12], 10);
      return (10 - (sum % 10)) % 10 === check;
    }
    return false;
  }

  /**
   * 등록된 모든 온라인 서점 링크 목록 반환
   */
  public get allBookstoreLinks(): { name: string; url: string }[] {
    const list: { name: string; url: string }[] = [];
    if (this.bookstoreUrls.aladin) list.push({ name: '알라딘', url: this.bookstoreUrls.aladin });
    if (this.bookstoreUrls.kyobo) list.push({ name: '교보문고', url: this.bookstoreUrls.kyobo });
    if (this.bookstoreUrls.yes24) list.push({ name: 'Yes24', url: this.bookstoreUrls.yes24 });
    if (this.bookstoreUrls.others) {
      this.bookstoreUrls.others.forEach((o) => list.push(o));
    }
    return list;
  }

  /**
   * 등록된 모든 eBook 서점 링크 목록 반환
   */
  public get allEbookLinks(): { name: string; url: string }[] {
    const list: { name: string; url: string }[] = [];
    if (this.ebookUrls.ridi) list.push({ name: '리디북스', url: this.ebookUrls.ridi });
    if (this.ebookUrls.yes24) list.push({ name: 'Yes24 eBook', url: this.ebookUrls.yes24 });
    if (this.ebookUrls.kyobo) list.push({ name: '교보문고 eBook', url: this.ebookUrls.kyobo });
    if (this.ebookUrls.others) {
      this.ebookUrls.others.forEach((o) => list.push(o));
    }
    return list;
  }

  /**
   * 직렬화 가능한 순수 객체로 반환
   */
  public toJSON(): BookBibliographicInfoProps {
    return {
      publisher: this.publisher,
      authors: [...this.authors],
      translators: [...this.translators],
      publishedDate: this.publishedDate,
      price: this.price,
      pageCount: this.pageCount,
      isbn: this.isbn,
      bookstoreUrls: { ...this.bookstoreUrls },
      ebookUrls: { ...this.ebookUrls },
      errataUrl: this.errataUrl,
      githubUrl: this.githubUrl,
      sampleCodeUrl: this.sampleCodeUrl,
      originalBookUrls: { ...this.originalBookUrls },
    };
  }

  public static create(props: BookBibliographicInfoProps): BookBibliographicInfo {
    return new BookBibliographicInfo(props);
  }
}
