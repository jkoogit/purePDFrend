/**
 * Interface: IPdfSecurityStrategy
 * Strategy Pattern for contextual situational PDF security configurations
 */

import {
  PdfSecurityPolicy,
  PdfSecurityProfileType,
  PdfCryptoAlgorithm,
  PdfSecurityRevision,
} from '../models/PdfSecurityPolicy';
import { IPdfPermissionFlags } from '../models/PdfPermissions';

export interface IPdfSecurityStrategyOptions {
  userPassword?: string;
  ownerPassword?: string;
  algorithm?: PdfCryptoAlgorithm;
  revision?: PdfSecurityRevision;
  permissionOverrides?: IPdfPermissionFlags;
  encryptMetadata?: boolean;
}

export interface IPdfSecurityStrategy {
  readonly profileType: PdfSecurityProfileType;
  readonly displayName: string;
  readonly description: string;
  buildPolicy(options?: IPdfSecurityStrategyOptions): PdfSecurityPolicy;
}
