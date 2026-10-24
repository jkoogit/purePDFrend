import { IPdfServiceAuditPort } from '../../ppdf/ports/IPdfServiceAuditPort';

/**
 * PpdfAuditAdapter.ts
 * IPdfServiceAuditPort 인터페이스의 구현체로, ppdf 비즈니스 서비스의 요청을
 * aiagent 하네스 감사 및 무결성 감사 시스템에 안전하게 중계함.
 */
export class PpdfAuditAdapter implements IPdfServiceAuditPort {
  private static instance: PpdfAuditAdapter;

  private constructor() {}

  public static getInstance(): PpdfAuditAdapter {
    if (!PpdfAuditAdapter.instance) {
      PpdfAuditAdapter.instance = new PpdfAuditAdapter();
    }
    return PpdfAuditAdapter.instance;
  }

  public async recordAuditLog(action: string, payload: Record<string, any>): Promise<void> {
    try {
      // 에이전트 감사 엔드포인트 또는 로컬 로그 연동
      console.log(`[PpdfAuditAdapter] Audit recorded: ${action}`, payload);
    } catch (e) {
      console.warn('[PpdfAuditAdapter] Failed to record audit log:', e);
    }
  }

  public async checkServiceIntegrity(): Promise<{ healthy: boolean; details?: string }> {
    try {
      const res = await fetch('/api/agent/audit/integrity');
      const data = await res.json();
      return {
        healthy: data.success && data.integrityScore >= 80,
        details: `Grade: ${data.grade}, Score: ${data.integrityScore}`,
      };
    } catch (e: any) {
      return { healthy: false, details: e.message };
    }
  }
}
