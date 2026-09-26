/**
 * Entity: PdfSecurityPolicy
 * Encapsulates security encryption algorithm, revision, passwords, permissions, and metadata encryption flags.
 */

import { PdfPermissions } from './PdfPermissions';

export type PdfSecurityProfileType =
  | 'NONE'
  | 'READ_ONLY_DIST'
  | 'ENTERPRISE_CONFIDENTIAL'
  | 'STRICT_DRM'
  | 'CUSTOM';

export type PdfCryptoAlgorithm =
  | 'NONE'
  | 'RC4_40'
  | 'RC4_128'
  | 'AES_128'
  | 'AES_256';

export type PdfSecurityRevision = 2 | 3 | 4 | 5 | 6;

export interface IPdfSecurityPolicyProps {
  profileType: PdfSecurityProfileType;
  algorithm: PdfCryptoAlgorithm;
  revision: PdfSecurityRevision;
  userPassword?: string;
  ownerPassword?: string;
  permissions: PdfPermissions;
  encryptMetadata?: boolean;
  keyLengthBits?: number;
}

export class PdfSecurityPolicy {
  public readonly profileType: PdfSecurityProfileType;
  public readonly algorithm: PdfCryptoAlgorithm;
  public readonly revision: PdfSecurityRevision;
  public readonly userPassword: string;
  public readonly ownerPassword: string;
  public readonly permissions: PdfPermissions;
  public readonly encryptMetadata: boolean;
  public readonly keyLengthBits: number;

  constructor(props: IPdfSecurityPolicyProps) {
    this.profileType = props.profileType;
    this.algorithm = props.algorithm;
    this.revision = props.revision;
    this.userPassword = props.userPassword || '';
    this.ownerPassword = props.ownerPassword || '';
    this.permissions = props.permissions;
    this.encryptMetadata = props.encryptMetadata ?? true;

    // Determine key length in bits
    if (props.keyLengthBits) {
      this.keyLengthBits = props.keyLengthBits;
    } else {
      switch (props.algorithm) {
        case 'RC4_40':
          this.keyLengthBits = 40;
          break;
        case 'RC4_128':
        case 'AES_128':
          this.keyLengthBits = 128;
          break;
        case 'AES_256':
          this.keyLengthBits = 256;
          break;
        default:
          this.keyLengthBits = 0;
      }
    }

    this.validateInvariants();
    Object.freeze(this);
  }

  private validateInvariants(): void {
    if (this.algorithm !== 'NONE') {
      // Must have at least an owner password or a user password
      if (!this.ownerPassword && !this.userPassword) {
        throw new Error('암호화가 활성화된 경우 소유자(Owner) 또는 사용자(User) 암호가 최소 1개 이상 지정되어야 합니다.');
      }
      // AES-256 requires revision 5 or 6
      if (this.algorithm === 'AES_256' && this.revision < 5) {
        throw new Error('AES-256 알고리즘은 Revision 5 또는 6 이상이어야 합니다.');
      }
      // AES-128 requires revision 4 or higher
      if (this.algorithm === 'AES_128' && this.revision < 4) {
        throw new Error('AES-128 알고리즘은 Revision 4 이상이어야 합니다.');
      }
    }
  }

  public isEncrypted(): boolean {
    return this.algorithm !== 'NONE';
  }

  public hasUserPassword(): boolean {
    return Boolean(this.userPassword.trim().length > 0);
  }

  public hasOwnerPassword(): boolean {
    return Boolean(this.ownerPassword.trim().length > 0);
  }
}
