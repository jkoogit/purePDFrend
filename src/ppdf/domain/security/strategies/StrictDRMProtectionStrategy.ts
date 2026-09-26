/**
 * Concrete Strategy: StrictDRMProtectionStrategy
 * Context: Paid e-books, commercial intellectual property, strict digital rights management.
 * Disables printing, copying, document assembly, form filling, and encrypts all metadata.
 */

import { IPdfSecurityStrategy, IPdfSecurityStrategyOptions } from './IPdfSecurityStrategy';
import { PdfSecurityPolicy } from '../models/PdfSecurityPolicy';
import { PdfPermissions } from '../models/PdfPermissions';

export class StrictDRMProtectionStrategy implements IPdfSecurityStrategy {
  public readonly profileType = 'STRICT_DRM';
  public readonly displayName = '완전 통제 DRM (모든 권한 차단)';
  public readonly description = '인쇄, 텍스트 복사, 문서 조작을 전면 차단하고 메타데이터까지 암호화하여 지식재산권을 보호합니다.';

  public buildPolicy(options: IPdfSecurityStrategyOptions = {}): PdfSecurityPolicy {
    const ownerPassword = options.ownerPassword || 'DRM_Master_' + Math.random().toString(36).slice(2, 10);
    const userPassword = options.userPassword || '';

    return new PdfSecurityPolicy({
      profileType: 'STRICT_DRM',
      algorithm: 'AES_256',
      revision: 6,
      userPassword,
      ownerPassword,
      permissions: PdfPermissions.createNoPermissions(),
      encryptMetadata: true,
    });
  }
}
