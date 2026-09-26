/**
 * Concrete Strategy: CustomConfigurableSecurityStrategy
 * Context: Custom management policy configured by administrator via UI
 */

import { IPdfSecurityStrategy, IPdfSecurityStrategyOptions } from './IPdfSecurityStrategy';
import { PdfSecurityPolicy, PdfCryptoAlgorithm, PdfSecurityRevision } from '../models/PdfSecurityPolicy';
import { PdfPermissions } from '../models/PdfPermissions';

export class CustomConfigurableSecurityStrategy implements IPdfSecurityStrategy {
  public readonly profileType = 'CUSTOM';
  public readonly displayName = '사용자 맞춤형 보안 설정';
  public readonly description = '관리자가 알고리즘, 암호 및 8대 권한 플래그를 개별적으로 선택하여 적용합니다.';

  public buildPolicy(options: IPdfSecurityStrategyOptions = {}): PdfSecurityPolicy {
    const algorithm: PdfCryptoAlgorithm = options.algorithm || 'AES_128';
    let revision: PdfSecurityRevision = 4;
    if (algorithm === 'AES_256') revision = 6;
    else if (algorithm === 'RC4_128') revision = 3;
    else if (algorithm === 'RC4_40') revision = 2;
    else if (algorithm === 'NONE') revision = 2;

    const permissions = new PdfPermissions(options.permissionOverrides || {});

    return new PdfSecurityPolicy({
      profileType: 'CUSTOM',
      algorithm,
      revision,
      userPassword: options.userPassword || '',
      ownerPassword: options.ownerPassword || '',
      permissions,
      encryptMetadata: options.encryptMetadata ?? true,
    });
  }
}
