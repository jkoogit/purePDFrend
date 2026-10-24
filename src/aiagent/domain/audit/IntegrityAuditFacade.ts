/**
 * IntegrityAuditFacade.ts
 * 
 * 디자인 패턴: 파사드 패턴 (Facade Pattern)
 * 아키텍처: 헥사고날 아키텍처 (Hexagonal Architecture)
 * 
 * 복잡한 4대 하위 서브시스템(고아 레코드 검증, 스토어-DB 패리티, 문서 SHA-256 해시, 쿼터 정책 준수)을
 * 단일 진입점 메서드(runComprehensiveAudit)로 캡슐화하여 클라이언트에 단순화된 인터페이스를 제공함.
 */

export interface AuditIndicatorOrphanRecords {
  passed: boolean;
  orphanTasksCount: number;
  orphanLoopsCount: number;
  orphanTracesCount: number;
  orphanDocsInDbCount: number;
  orphanTasks: any[];
  orphanLoops: any[];
  orphanTraces: any[];
  orphanDocsInDb: { doc_id: string; file_path: string }[];
}

export interface AuditIndicatorStoreDbParity {
  passed: boolean;
  activeSessionId: string;
  sessionMatch: boolean;
  tasksLocalCount: number;
  tasksDbCount: number;
  loopsLocalCount: number;
  loopsDbCount: number;
  tracesLocalCount: number;
  tracesDbCount: number;
  parityPercentage: number;
  activeSessionTracesMissing?: boolean;
}

export interface AuditIndicatorDocsHashIntegrity {
  passed: boolean;
  localTotalDocs: number;
  dbTotalDocs: number;
  hashMatches: number;
  hashMismatches: number;
  unindexedCount: number;
  mismatches: { path: string; localHash: string; dbHash: string }[];
}

export interface AuditIndicatorPolicyQuota {
  passed: boolean;
  violationCount: number;
  rule: string;
}

export interface ComprehensiveAuditResult {
  success: boolean;
  timestamp: string;
  integrityScore: number;
  grade: 'A+ (PERFECT)' | 'A (GOOD)' | 'WARNING';
  verdict: 'PASSED' | 'ACTION_REQUIRED';
  indicators: {
    orphanRecords: AuditIndicatorOrphanRecords;
    storeDbParity: AuditIndicatorStoreDbParity;
    docsHashIntegrity: AuditIndicatorDocsHashIntegrity;
    policyQuotaGovernance: AuditIndicatorPolicyQuota;
  };
}

export class IntegrityAuditFacade {
  /**
   * 점수 계산 수학 공식
   * 100점 만점 기준 위반 항목별 감점 적용
   */
  public static calculateIntegrityScore(
    indicators: ComprehensiveAuditResult['indicators']
  ): { score: number; grade: ComprehensiveAuditResult['grade']; verdict: ComprehensiveAuditResult['verdict'] } {
    let deductions = 0;
    if (indicators.orphanRecords.orphanTasksCount > 0) deductions += 15;
    if (indicators.orphanRecords.orphanLoopsCount > 0) deductions += 15;
    if (indicators.orphanRecords.orphanTracesCount > 0) deductions += 10;
    if (indicators.orphanRecords.orphanDocsInDbCount > 0) deductions += 10;
    if (indicators.docsHashIntegrity.hashMismatches > 0) deductions += 15;
    if (indicators.policyQuotaGovernance.violationCount > 0) deductions += 20;
    if (indicators.storeDbParity.activeSessionTracesMissing) deductions += 15;
    if (indicators.storeDbParity.parityPercentage < 100) {
      deductions += (100 - indicators.storeDbParity.parityPercentage) * 0.5;
    }

    const score = Math.max(0, Math.min(100, Math.round(100 - deductions)));
    const grade: ComprehensiveAuditResult['grade'] =
      score >= 95 ? 'A+ (PERFECT)' : score >= 80 ? 'A (GOOD)' : 'WARNING';
    const verdict: ComprehensiveAuditResult['verdict'] =
      score >= 90 ? 'PASSED' : 'ACTION_REQUIRED';

    return { score, grade, verdict };
  }
}
