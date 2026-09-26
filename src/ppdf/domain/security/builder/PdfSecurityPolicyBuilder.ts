/**
 * Builder Pattern: PdfSecurityPolicyBuilder
 * Fluent builder for creating validated PdfSecurityPolicy entities
 */

import {
  PdfSecurityPolicy,
  PdfSecurityProfileType,
  PdfCryptoAlgorithm,
  PdfSecurityRevision,
} from '../models/PdfSecurityPolicy';
import { PdfPermissions, IPdfPermissionFlags } from '../models/PdfPermissions';

export class PdfSecurityPolicyBuilder {
  private profileType: PdfSecurityProfileType = 'CUSTOM';
  private algorithm: PdfCryptoAlgorithm = 'AES_128';
  private revision: PdfSecurityRevision = 4;
  private userPassword = '';
  private ownerPassword = '';
  private permissionFlags: IPdfPermissionFlags = {};
  private encryptMetadata = true;
  private customKeyLength?: number;

  public withProfileType(type: PdfSecurityProfileType): this {
    this.profileType = type;
    return this;
  }

  public withAlgorithm(algorithm: PdfCryptoAlgorithm): this {
    this.algorithm = algorithm;
    switch (algorithm) {
      case 'AES_256':
        this.revision = 6;
        break;
      case 'AES_128':
        this.revision = 4;
        break;
      case 'RC4_128':
        this.revision = 3;
        break;
      case 'RC4_40':
        this.revision = 2;
        break;
      case 'NONE':
        this.revision = 2;
        break;
    }
    return this;
  }

  public withRevision(revision: PdfSecurityRevision): this {
    this.revision = revision;
    return this;
  }

  public withUserPassword(password: string): this {
    this.userPassword = password;
    return this;
  }

  public withOwnerPassword(password: string): this {
    this.ownerPassword = password;
    return this;
  }

  public withPermissions(permissions: IPdfPermissionFlags): this {
    this.permissionFlags = { ...this.permissionFlags, ...permissions };
    return this;
  }

  public allowPrint(highQuality = false): this {
    this.permissionFlags.canPrint = true;
    this.permissionFlags.canPrintHighQuality = highQuality;
    return this;
  }

  public allowModify(allowed = true): this {
    this.permissionFlags.canModify = allowed;
    return this;
  }

  public allowCopy(allowed = true): this {
    this.permissionFlags.canCopy = allowed;
    return this;
  }

  public allowAnnotate(allowed = true): this {
    this.permissionFlags.canAnnotate = allowed;
    return this;
  }

  public allowFormFill(allowed = true): this {
    this.permissionFlags.canFillForms = allowed;
    return this;
  }

  public withEncryptMetadata(encrypt = true): this {
    this.encryptMetadata = encrypt;
    return this;
  }

  public withKeyLength(bits: number): this {
    this.customKeyLength = bits;
    return this;
  }

  public build(): PdfSecurityPolicy {
    const permissions = new PdfPermissions(this.permissionFlags);

    // If encrypted and owner password not set, generate fallback owner password
    let finalOwner = this.ownerPassword;
    if (this.algorithm !== 'NONE' && !finalOwner && !this.userPassword) {
      finalOwner = 'PurePDF_AutoMaster_' + Math.random().toString(36).slice(2, 10);
    }

    return new PdfSecurityPolicy({
      profileType: this.profileType,
      algorithm: this.algorithm,
      revision: this.revision,
      userPassword: this.userPassword,
      ownerPassword: finalOwner,
      permissions,
      encryptMetadata: this.encryptMetadata,
      keyLengthBits: this.customKeyLength,
    });
  }
}
