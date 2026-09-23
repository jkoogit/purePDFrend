import { AgentDoc } from '../../types';

/**
 * DocsService.ts
 * 
 * 아키텍처: 레이어드 아키텍처 (Layered Architecture - Service Layer)
 * 디자인 패턴: DTO (Data Transfer Object) 패턴
 * 
 * 단순 비즈니스(문서 거버넌스 조회/분류) 영역으로,
 * UI 계층과 데이터 스토어 사이에서 정렬, 필터링, 포맷팅 로직을 담당함.
 */
export interface DocsFilterOptions {
  folder?: string;
  searchKeyword?: string;
  sortField?: 'filePath' | 'title' | 'folder' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export class DocsService {
  /**
   * 문서 목록 필터링 및 정렬 처리
   */
  public static filterAndSortDocs(docs: AgentDoc[], options: DocsFilterOptions): AgentDoc[] {
    let result = [...docs];

    // 1. 폴더(카테고리) 필터
    if (options.folder && options.folder !== '전체') {
      result = result.filter((d) => d.folder === options.folder);
    }

    // 2. 키워드 검색
    if (options.searchKeyword && options.searchKeyword.trim() !== '') {
      const kw = options.searchKeyword.toLowerCase();
      result = result.filter(
        (d) =>
          d.title.toLowerCase().includes(kw) ||
          d.filePath.toLowerCase().includes(kw) ||
          d.folder.toLowerCase().includes(kw)
      );
    }

    // 3. 정렬
    if (options.sortField) {
      const field = options.sortField;
      const orderMultiplier = options.sortOrder === 'desc' ? -1 : 1;
      result.sort((a, b) => {
        const valA = (a[field] || '').toString().toLowerCase();
        const valB = (b[field] || '').toString().toLowerCase();
        return valA.localeCompare(valB) * orderMultiplier;
      });
    }

    return result;
  }
}
