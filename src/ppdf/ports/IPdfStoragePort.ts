/**
 * IPdfStoragePort.ts
 * 순수 PDF 서비스의 캐시/문서 저장소 포트 인터페이스
 */
export interface IPdfStoragePort {
  saveDocumentCache(docId: string, data: any): Promise<void>;
  loadDocumentCache(docId: string): Promise<any | null>;
}
