/**
 * Concrete Strategy: HighConfidentialEnterpriseStrategy
 * Context: Corporate finance, confidential contracts, sensitive board minutes.
 * AES-256 high-grade encryption, requires authentication, disables copying/extraction.
 */

import { IPdfSecurityStrategy, IPdfSecurityStrategyOptions } from './IPdfSecurityStrategy';
import { PdfSecurityPolicy } from '../models/PdfSecurityPolicy';
import { PdfPermissions } from '../models/PdfPermissions';

export class HighConfidentialEnterpriseStrategy implements IPdfSecurityStrategy {
  public readonly profileType = 'ENTERPRISE_CONFIDENTIAL';
  public readonly displayName = '기업 대외비 (AES-256 강력 암호화)';
  public readonly description = 'AES-256 암호화 및 듀얼 비밀번호를 적용하여 인가된 사용자만 열람 가능하며, 복사 및 변조를 엄격히 차단합니다.';

  public buildPolicy(options: IPdfSecurityStrategyOptions = {}): PdfSecurityPolicy {
    if (!options.ownerPassword && !options.userPassword) {
      throw new Error('기업 대외비 보안 전략은 열람용 암호(User) 또는 관리용 암호(Owner)가 최소 1개 이상 지정되어야 합니다.');
    }

    const permissions = new PdfPermissions({
      canPrint: options.permissionOverrides?.canPrint ?? true,
      canModify: false,
      canCopy: false,
      canAnnotate: false,
      canFillForms: false,
      canAccessText: false,
      canAssemble: false,
      canPrintHighQuality: options.permissionOverrides?.canPrintHighQuality ?? true,
    });

    return new PdfSecurityPolicy({
      profileType: 'ENTERPRISE_CONFIDENTIAL',
      algorithm: 'AES_256',
      revision: 6,
      userPassword: options.userPassword || '',
      ownerPassword: options.ownerPassword || options.userPassword || '',
      permissions,
      encryptMetadata: options.encryptMetadata ?? true,
    });
  }
}
