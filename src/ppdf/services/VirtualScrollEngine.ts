/**
 * @file VirtualScrollEngine.ts
 * @description 800쪽 대용량 스캔 도서 가상 스크롤(Windowing) 및 뷰포트 범위 계산 엔진
 * 단면(Single) 및 양면 펼침면(Facing Spread) 모드를 지원하여 뷰포트 내 상하 2~3페이지만 렌더링
 */

import { PdfPageItem, ViewerLayoutMode, VirtualScrollState } from '../../types';

export interface VirtualScrollOptions {
  scrollTop: number;
  viewportHeight: number;
  layoutMode: ViewerLayoutMode;
  pageHeight: number; // 기본 예상 높이 (px)
  pageGap: number; // 페이지 간격 (px)
  overscan?: number; // 상하 버퍼 페이지 수 (기본: 2)
  scale?: number; // 줌 배율 (기본: 1.0)
}

export class VirtualScrollEngine {
  /**
   * 가상 스크롤 상태 계산 (Top/Bottom Spacer 높이 및 가시 페이지 범위)
   */
  public static calculateState(
    pages: PdfPageItem[],
    options: VirtualScrollOptions
  ): VirtualScrollState {
    const {
      scrollTop,
      viewportHeight,
      layoutMode,
      pageHeight,
      pageGap,
      overscan = 2,
      scale = 1.0,
    } = options;

    const totalPages = pages.length;
    if (totalPages === 0) {
      return {
        startIndex: 0,
        endIndex: 0,
        topSpacerHeight: 0,
        bottomSpacerHeight: 0,
        totalVirtualHeight: 0,
        visiblePages: [],
      };
    }

    const scaledPageHeight = Math.max(100, pageHeight * scale);
    const scaledGap = pageGap * scale;
    const itemFullHeight = scaledPageHeight + scaledGap;

    if (layoutMode === 'single') {
      // 1. 단면 모드: 1페이지 = 1슬롯
      const totalVirtualHeight = totalPages * itemFullHeight;
      const rawStartIndex = Math.floor(scrollTop / itemFullHeight);
      const visibleCount = Math.ceil(viewportHeight / itemFullHeight) + 1;

      const startIndex = Math.max(0, rawStartIndex - overscan);
      const endIndex = Math.min(totalPages - 1, rawStartIndex + visibleCount + overscan);

      const topSpacerHeight = startIndex * itemFullHeight;
      const renderedCount = endIndex - startIndex + 1;
      const bottomSpacerHeight = Math.max(
        0,
        totalVirtualHeight - (topSpacerHeight + renderedCount * itemFullHeight)
      );

      return {
        startIndex,
        endIndex,
        topSpacerHeight: Math.max(0, topSpacerHeight),
        bottomSpacerHeight: Math.max(0, bottomSpacerHeight),
        totalVirtualHeight,
        visiblePages: pages.slice(startIndex, endIndex + 1),
      };
    } else {
      // 2. 양면 펼침면 모드 (Facing Spread):
      // 1쪽(표지) 단독 슬롯, 이후 (2-3), (4-5), ... 2장씩 1슬롯
      const spreadSlots: number[][] = [];
      spreadSlots.push([0]); // 1쪽 (0-indexed)

      for (let i = 1; i < totalPages; i += 2) {
        if (i + 1 < totalPages) {
          spreadSlots.push([i, i + 1]);
        } else {
          spreadSlots.push([i]);
        }
      }

      const totalSlots = spreadSlots.length;
      const totalVirtualHeight = totalSlots * itemFullHeight;
      const rawStartSlot = Math.floor(scrollTop / itemFullHeight);
      const visibleSlotCount = Math.ceil(viewportHeight / itemFullHeight) + 1;

      const startSlot = Math.max(0, rawStartSlot - overscan);
      const endSlot = Math.min(totalSlots - 1, rawStartSlot + visibleSlotCount + overscan);

      const topSpacerHeight = startSlot * itemFullHeight;
      const renderedSlotCount = endSlot - startSlot + 1;
      const bottomSpacerHeight = Math.max(
        0,
        totalVirtualHeight - (topSpacerHeight + renderedSlotCount * itemFullHeight)
      );

      const visiblePageIndices: number[] = [];
      for (let s = startSlot; s <= endSlot; s++) {
        visiblePageIndices.push(...spreadSlots[s]);
      }

      const startIndex = visiblePageIndices.length > 0 ? visiblePageIndices[0] : 0;
      const endIndex = visiblePageIndices.length > 0 ? visiblePageIndices[visiblePageIndices.length - 1] : 0;

      const visiblePages = visiblePageIndices.map((idx) => pages[idx]).filter(Boolean);

      return {
        startIndex,
        endIndex,
        topSpacerHeight: Math.max(0, topSpacerHeight),
        bottomSpacerHeight: Math.max(0, bottomSpacerHeight),
        totalVirtualHeight,
        visiblePages,
      };
    }
  }

  /**
   * 특정 페이지 번호로 점프할 때 스크롤 타겟 위치(scrollTop px) 계산
   */
  public static getScrollTopForPage(
    pageNum: number,
    totalPages: number,
    pageHeight: number,
    pageGap: number,
    layoutMode: ViewerLayoutMode,
    scale: number = 1.0
  ): number {
    const clampedPage = Math.max(1, Math.min(totalPages, pageNum));
    const targetIndex = clampedPage - 1;
    const scaledPageHeight = Math.max(100, pageHeight * scale);
    const scaledGap = pageGap * scale;
    const itemFullHeight = scaledPageHeight + scaledGap;

    if (layoutMode === 'single') {
      return targetIndex * itemFullHeight;
    } else {
      if (targetIndex === 0) return 0;
      const slotIndex = Math.floor((targetIndex - 1) / 2) + 1;
      return slotIndex * itemFullHeight;
    }
  }
}
