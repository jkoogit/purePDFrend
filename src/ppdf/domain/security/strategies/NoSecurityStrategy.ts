/**
 * Concrete Strategy: NoSecurityStrategy
 * Context: Open public documents, papers, open educational resources.
 * All permissions allowed, no encryption overhead.
 */

import { IPdfSecurityStrategy, IPdfSecurityStrategyOptions } from './IPdfSecurityStrategy';
import { PdfSecurityPolicy } from '../models/PdfSecurityPolicy';
import { PdfPermissions } from '../models/PdfPermissions';

export class NoSecurityStrategy implements IPdfSecurityStrategy {
  public readonly profileType = 'NONE';
  public readonly displayName = '공개 배포용 (보안 없음)';
  public readonly description = '모든 사용자가 자유롭게 열람, 인쇄, 복사 및 가공할 수 있는 완전 개방형 정책입니다.';

  public buildPolicy(_options?: IPdfSecurityStrategyOptions): PdfSecurityPolicy {
    return new PdfSecurityPolicy({
      profileType: 'NONE',
      algorithm: 'NONE',
      revision: 2,
      permissions: PdfPermissions.createAllAllowed(),
      encryptMetadata: false,
    });
  }
}
