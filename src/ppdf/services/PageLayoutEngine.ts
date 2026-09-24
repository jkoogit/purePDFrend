/**
 * @file PageLayoutEngine.ts
 * @description PDF 페이지 레이아웃 조작 엔진 (회전, 재배치, 소프트 삭제, 복원, 클린징, 복제)
 * 순수 함수 및 불변성(Immutability) 기반 도메인 로직을 제공합니다.
 */

import { PdfPageItem } from '../../types';

export class PageLayoutEngine {
  /**
   * 단일 페이지 회전 (0°, 90°, 180°, 270° 정규화)
   */
  public static rotatePage(
    pages: PdfPageItem[],
    pageNumOrId: number | string,
    deltaAngle: number = 90
  ): PdfPageItem[] {
    return pages.map((page) => {
      const isMatch =
        typeof pageNumOrId === 'number'
          ? page.pageNum === pageNumOrId
          : page.id === pageNumOrId;

      if (!isMatch) return page;

      const normalizedRotation = this.normalizeAngle((page.rotation || 0) + deltaAngle);
      return {
        ...page,
        rotation: normalizedRotation,
      };
    });
  }

  /**
   * 다중 / 조건부 일괄 페이지 회전
   * @param target 'all' (전체), 'odd' (홀수쪽), 'even' (짝수쪽), 또는 특정 ID/페이지번호 배열
   */
  public static batchRotate(
    pages: PdfPageItem[],
    target: 'all' | 'odd' | 'even' | (number | string)[],
    deltaAngle: number = 90
  ): PdfPageItem[] {
    return pages.map((page) => {
      let isMatch = false;

      if (target === 'all') {
        isMatch = true;
      } else if (target === 'odd') {
        isMatch = page.pageNum % 2 === 1;
      } else if (target === 'even') {
        isMatch = page.pageNum % 2 === 0;
      } else if (Array.isArray(target)) {
        isMatch = target.some((t) =>
          typeof t === 'number' ? page.pageNum === t : page.id === t
        );
      }

      if (!isMatch) return page;

      const normalizedRotation = this.normalizeAngle((page.rotation || 0) + deltaAngle);
      return {
        ...page,
        rotation: normalizedRotation,
      };
    });
  }

  /**
   * 드래그 앤 드롭 기반 페이지 순서 재배치 (불변 배열 복사 및 pageNum 재부여)
   */
  public static reorderPages(
    pages: PdfPageItem[],
    sourceIndex: number,
    targetIndex: number
  ): PdfPageItem[] {
    if (
      sourceIndex < 0 ||
      sourceIndex >= pages.length ||
      targetIndex < 0 ||
      targetIndex >= pages.length ||
      sourceIndex === targetIndex
    ) {
      return pages;
    }

    const nextPages = [...pages];
    const [movedItem] = nextPages.splice(sourceIndex, 1);
    nextPages.splice(targetIndex, 0, movedItem);

    // pageNum 1..N 재부여
    return this.reindexPages(nextPages);
  }

  /**
   * 페이지 소프트 삭제 (isDeleted: true 마킹, Undo로 복구 가능)
   */
  public static softDeletePage(
    pages: PdfPageItem[],
    pageNumOrId: number | string
  ): PdfPageItem[] {
    return pages.map((page) => {
      const isMatch =
        typeof pageNumOrId === 'number'
          ? page.pageNum === pageNumOrId
          : page.id === pageNumOrId;

      if (!isMatch) return page;

      return {
        ...page,
        isDeleted: true,
      };
    });
  }

  /**
   * 소프트 삭제된 페이지 복원 (isDeleted: false 마킹)
   */
  public static restorePage(
    pages: PdfPageItem[],
    pageNumOrId: number | string
  ): PdfPageItem[] {
    return pages.map((page) => {
      const isMatch =
        typeof pageNumOrId === 'number'
          ? page.pageNum === pageNumOrId
          : page.id === pageNumOrId;

      if (!isMatch) return page;

      return {
        ...page,
        isDeleted: false,
      };
    });
  }

  /**
   * 저장 시 영구 클린징 (소프트 삭제된 페이지 물리적 제거 및 pageNum 순차 재부여)
   */
  public static cleanDeletedPages(pages: PdfPageItem[]): PdfPageItem[] {
    const activePages = pages.filter((page) => !page.isDeleted);
    return this.reindexPages(activePages);
  }

  /**
   * 페이지 복제 및 인접 위치에 삽입
   */
  public static duplicatePage(
    pages: PdfPageItem[],
    pageNumOrId: number | string
  ): PdfPageItem[] {
    const targetIndex = pages.findIndex((page) =>
      typeof pageNumOrId === 'number'
        ? page.pageNum === pageNumOrId
        : page.id === pageNumOrId
    );

    if (targetIndex === -1) return pages;

    const source = pages[targetIndex];
    const duplicated: PdfPageItem = {
      ...source,
      id: `page-copy-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: `${source.title} (사본)`,
      isDeleted: false,
    };

    const nextPages = [...pages];
    nextPages.splice(targetIndex + 1, 0, duplicated);

    return this.reindexPages(nextPages);
  }

  /**
   * 활성(삭제되지 않은) 페이지만 필터링하여 반환
   */
  public static getActivePages(pages: PdfPageItem[]): PdfPageItem[] {
    return pages.filter((p) => !p.isDeleted);
  }

  /**
   * 회전 각도 0°, 90°, 180°, 270° 정규화 도우미
   */
  public static normalizeAngle(angle: number): number {
    const normalized = ((angle % 360) + 360) % 360;
    return Math.round(normalized / 90) * 90 % 360;
  }

  /**
   * 1부터 N까지 순차적으로 pageNum 재인덱싱
   */
  private static reindexPages(pages: PdfPageItem[]): PdfPageItem[] {
    return pages.map((page, index) => {
      const newPageNum = index + 1;
      if (page.pageNum === newPageNum) return page;
      return {
        ...page,
        pageNum: newPageNum,
      };
    });
  }
}
