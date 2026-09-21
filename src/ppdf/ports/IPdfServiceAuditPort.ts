/**
 * IPdfServiceAuditPort.ts
 * 순수 PDF 서비스에서 에이전트 거버넌스 감사 시스템과 소통하기 위한 DIP 인터페이스 포트
 * (ppdf는 aiagent 구현체를 직접 참조하지 않고 오직 이 계약 인터페이스만 준수함)
 */
export interface IPdfServiceAuditPort {
  recordAuditLog(action: string, payload: Record<string, any>): Promise<void>;
  checkServiceIntegrity(): Promise<{ healthy: boolean; details?: string }>;
}
