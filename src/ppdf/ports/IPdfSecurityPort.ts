/**
 * Port: IPdfSecurityPort
 * Hexagonal Architecture Port for PDF Security and Encryption Management
 */

import {
  PdfSecurityPolicy,
  PdfSecurityProfileType,
} from '../domain/security/models/PdfSecurityPolicy';
import { IPdfSecurityStrategyOptions } from '../domain/security/strategies/IPdfSecurityStrategy';
import {
  IPdfSecureBundle,
} from '../domain/security/facade/PdfSecurityFacade';

export interface IPdfSecurityPort {
  /**
   * Builds a security policy based on a situational profile
   */
  createPolicy(
    profileType: PdfSecurityProfileType,
    options?: IPdfSecurityStrategyOptions
  ): PdfSecurityPolicy;

  /**
   * Generates full /Encrypt dictionary and keys
   */
  generateBundle(
    policy: PdfSecurityPolicy,
    customDocId?: Uint8Array
  ): IPdfSecureBundle | null;

  /**
   * Encrypts indirect object stream/string
   */
  encryptObject(
    payload: Uint8Array,
    masterKey: Uint8Array,
    objNum: number,
    genNum: number,
    algorithm: string
  ): Uint8Array;

  /**
   * Authenticates user or owner password
   */
  verifyPassword(
    bundle: IPdfSecureBundle,
    enteredPassword: string
  ): 'OWNER' | 'USER' | 'INVALID';

  /**
   * Retrieves list of registered security strategy profiles
   */
  getAvailableProfiles(): Array<{ type: string; name: string; description: string }>;
}
