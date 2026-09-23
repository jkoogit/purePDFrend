/**
 * @file PdfPageStore.ts
 * @description 800쪽 대용량 도서 페이지 상태 관리 및 LRU 메모리 가드(Memory Guard) 서비스
 */

import { PdfPageItem } from '../../types';

export class MemoryGuardManager {
  private maxCacheSize: number;
  private lruQueue: string[] = [];
  private imageCache: Map<string, string> = new Map();

  constructor(maxCacheSize: number = 10) {
    this.maxCacheSize = maxCacheSize;
  }

  /**
   * 페이지 접근 시 LRU 큐 갱신 및 캐시 크기 유지 (38MB 가드)
   */
  public touchPage(pageId: string, imageSrc: string) {
    this.lruQueue = this.lruQueue.filter((id) => id !== pageId);
    this.lruQueue.push(pageId);
    this.imageCache.set(pageId, imageSrc);

    // 초과된 오래된 캐시 정리 (Eviction)
    while (this.lruQueue.length > this.maxCacheSize) {
      const evictedId = this.lruQueue.shift();
      if (evictedId) {
        this.imageCache.delete(evictedId);
      }
    }
  }

  public getCachedImage(pageId: string): string | undefined {
    return this.imageCache.get(pageId);
  }

  public getActiveCacheCount(): number {
    return this.imageCache.size;
  }

  public clear() {
    this.lruQueue = [];
    this.imageCache.clear();
  }
}

export class PdfPageStore {
  /**
   * 테스트 및 시뮬레이션을 위한 고성능 SVG 기반 모의 도서 생성기 (120 ~ 800쪽)
   */
  public static generateMockBook(
    pageCount: number = 120,
    bookTitle: string = '엔터프라이즈 디지털 도서 아카이빙 표준 지침서'
  ): PdfPageItem[] {
    const pages: PdfPageItem[] = [];

    for (let i = 1; i <= pageCount; i++) {
      const isCover = i === 1;
      const isBackCover = i === pageCount;
      const isChapterStart = i % 20 === 1 && !isCover;

      let title = `제${i}쪽 - 본문 내용`;
      let tocTitle: string | undefined = undefined;
      let hasTocBookmark = false;

      if (isCover) {
        title = `[표지] ${bookTitle}`;
        tocTitle = '표지 (Cover)';
        hasTocBookmark = true;
      } else if (isBackCover) {
        title = `[판권지] ${bookTitle} 판권`;
        tocTitle = '판권지 (Colophon)';
        hasTocBookmark = true;
      } else if (isChapterStart) {
        const chapterNum = Math.floor(i / 20) + 1;
        title = `제${chapterNum}장. 스캔 이미지 전처리 및 OCR 품질 관리 기법`;
        tocTitle = `제${chapterNum}장. 대용량 아카이빙 (p.${i})`;
        hasTocBookmark = true;
      }

      // 경량 SVG Data URL 생성
      const svgImage = this.createMockPageSvg(i, pageCount, title, isCover, isChapterStart);

      pages.push({
        id: `page-${i}`,
        pageNum: i,
        title,
        imageSrc: svgImage,
        thumbnailSrc: svgImage,
        width: 800,
        height: 1131, // A4 비율 (1:1.414)
        rotation: 0,
        isOcrDone: i <= 5 || i % 10 === 0, // 일부 페이지 OCR 완료 모의
        ocrConfidence: i % 2 === 0 ? 0.96 : 0.91,
        hasTocBookmark,
        tocTitle,
        isDeleted: false,
      });
    }

    return pages;
  }

  /**
   * 고화질 스캔 도서 질감 모의 SVG 생성
   */
  private static createMockPageSvg(
    pageNum: number,
    total: number,
    title: string,
    isCover: boolean,
    isChapter: boolean
  ): string {
    const bgColor = isCover ? '#1e293b' : isChapter ? '#f8fafc' : '#ffffff';
    const textColor = isCover ? '#f8fafc' : '#1e293b';
    const subColor = isCover ? '#94a3b8' : '#64748b';

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="800" height="1131" viewBox="0 0 800 1131">
        <rect width="800" height="1131" fill="${bgColor}" stroke="#cbd5e1" stroke-width="2"/>
        
        <!-- Header Rule -->
        <line x1="60" y1="70" x2="740" y2="70" stroke="${subColor}" stroke-width="1" stroke-dasharray="4"/>
        <text x="60" y="55" font-family="sans-serif" font-size="14" fill="${subColor}">purePDFrend High-Resolution Scan Archive</text>
        <text x="740" y="55" font-family="sans-serif" font-size="14" fill="${subColor}" text-anchor="end">Page ${pageNum} / ${total}</text>

        <!-- Main Title -->
        <text x="60" y="150" font-family="sans-serif" font-size="${isCover ? '28' : '20'}" font-weight="bold" fill="${textColor}">
          ${title}
        </text>

        <!-- Body Simulation Lines -->
        <g opacity="0.85">
          <rect x="60" y="200" width="680" height="14" rx="3" fill="${subColor}" opacity="0.4"/>
          <rect x="60" y="230" width="640" height="14" rx="3" fill="${subColor}" opacity="0.3"/>
          <rect x="60" y="260" width="670" height="14" rx="3" fill="${subColor}" opacity="0.35"/>
          <rect x="60" y="290" width="590" height="14" rx="3" fill="${subColor}" opacity="0.3"/>
          
          <rect x="60" y="340" width="680" height="14" rx="3" fill="${subColor}" opacity="0.35"/>
          <rect x="60" y="370" width="650" height="14" rx="3" fill="${subColor}" opacity="0.3"/>
          <rect x="60" y="400" width="680" height="14" rx="3" fill="${subColor}" opacity="0.4"/>
          <rect x="60" y="430" width="610" height="14" rx="3" fill="${subColor}" opacity="0.3"/>

          <!-- Mock Image / Diagram Area -->
          <rect x="60" y="480" width="680" height="240" rx="8" fill="#e2e8f0" stroke="#94a3b8" stroke-dasharray="6"/>
          <text x="400" y="605" font-family="sans-serif" font-size="16" font-weight="bold" fill="#64748b" text-anchor="middle">
            [ 고해상도 스캔 이미지 캔버스 레이어 - Page ${pageNum} ]
          </text>

          <rect x="60" y="750" width="680" height="14" rx="3" fill="${subColor}" opacity="0.35"/>
          <rect x="60" y="780" width="630" height="14" rx="3" fill="${subColor}" opacity="0.3"/>
          <rect x="60" y="810" width="670" height="14" rx="3" fill="${subColor}" opacity="0.35"/>
          <rect x="60" y="840" width="560" height="14" rx="3" fill="${subColor}" opacity="0.3"/>
          <rect x="60" y="870" width="680" height="14" rx="3" fill="${subColor}" opacity="0.35"/>
          <rect x="60" y="900" width="640" height="14" rx="3" fill="${subColor}" opacity="0.3"/>
        </g>

        <!-- Footer -->
        <line x1="60" y1="1050" x2="740" y2="1050" stroke="${subColor}" stroke-width="1"/>
        <text x="400" y="1085" font-family="sans-serif" font-size="16" font-weight="bold" fill="${textColor}" text-anchor="middle">
          - ${pageNum} -
        </text>
      </svg>
    `;

    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }
}
