/**
 * Concrete Strategy: ReadOnlyDistributionStrategy
 * Context: Lecture notes, product guides, public research reports.
 * Allows reading and basic printing, but strictly prohibits content tampering and mass copying.
 */

import { IPdfSecurityStrategy, IPdfSecurityStrategyOptions } from './IPdfSecurityStrategy';
import { PdfSecurityPolicy } from '../models/PdfSecurityPolicy';
import { PdfPermissions } from '../models/PdfPermissions';

export class ReadOnlyDistributionStrategy implements IPdfSecurityStrategy {
  public readonly profileType = 'READ_ONLY_DIST';
  public readonly displayName = '열람 및 인쇄 전용 (복사·수정 차단)';
  public readonly description = '문서 열람 및 저해상도 인쇄는 허용하되, 내용 수정 및 텍스트 무단 복사를 원천 차단합니다.';

  public buildPolicy(options: IPdfSecurityStrategyOptions = {}): PdfSecurityPolicy {
    // Generate default random owner password if not supplied to enforce permissions
    const ownerPassword = options.ownerPassword || 'PurePDF_Master_' + Math.random().toString(36).slice(2, 10);
    const userPassword = options.userPassword || '';

    const permissions = new PdfPermissions({
      canPrint: options.permissionOverrides?.canPrint ?? true,
      canModify: false,
      canCopy: false,
      canAnnotate: options.permissionOverrides?.canAnnotate ?? true,
      canFillForms: false,
      canAccessText: true,
      canAssemble: false,
      canPrintHighQuality: false,
    });

    return new PdfSecurityPolicy({
      profileType: 'READ_ONLY_DIST',
      algorithm: options.algorithm || 'AES_128',
      revision: options.algorithm === 'RC4_128' ? 3 : 4,
      userPassword,
      ownerPassword,
      permissions,
      encryptMetadata: options.encryptMetadata ?? true,
    });
  }
}
