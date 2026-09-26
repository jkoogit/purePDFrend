/**
 * Facade Pattern: PdfSecurityFacade
 * Orchestrator and entry point for PDF security operations, dictionary generation,
 * cryptographic stream processing, and situational strategy execution.
 * Pure JS / Browser-portable implementation
 */

import {
  PdfSecurityPolicy,
  PdfSecurityProfileType,
} from '../models/PdfSecurityPolicy';
import { PdfSecurityStrategyFactory } from '../factory/PdfSecurityStrategyFactory';
import { IPdfSecurityStrategyOptions } from '../strategies/IPdfSecurityStrategy';
import {
  PdfKeyDerivationEngine,
  IPdfEncryptionHashes,
} from '../crypto/PdfKeyDerivationEngine';
import { PdfCipherEngine } from '../crypto/PdfCipherEngine';
import { PdfMetadataBundle } from '../../metadata/models/PdfMetadataBundle';

export interface IPdfEncryptDictionary {
  filter: string;            // Standard
  v: number;                 // Algorithm version: 1, 2, 4, 5
  r: number;                 // Revision: 2, 3, 4, 5, 6
  length: number;            // Key length bits (40, 128, 256)
  p: number;                 // Signed 32-bit permission integer
  o: string;                 // Hex string of 32-byte Owner hash
  u: string;                 // Hex string of 32-byte User hash
  encryptMetadata: boolean;  // EncryptMetadata flag
  rawDictionaryString: string; // Ready-to-inject PDF dictionary string
}

export interface IPdfSecureBundle {
  policy: PdfSecurityPolicy;
  hashes: IPdfEncryptionHashes;
  encryptDict: IPdfEncryptDictionary;
  documentId: Uint8Array;
}

function bytesToHex(bytes: Uint8Array): string {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i].toString(16);
    hex += b.length === 1 ? '0' + b : b;
  }
  return hex.toUpperCase();
}

export class PdfSecurityFacade {
  /**
   * Builds and configures a security policy using situational profile strategy
   */
  public static createPolicyFromProfile(
    profileType: PdfSecurityProfileType,
    options?: IPdfSecurityStrategyOptions
  ): PdfSecurityPolicy {
    const strategy = PdfSecurityStrategyFactory.getStrategy(profileType);
    return strategy.buildPolicy(options);
  }

  /**
   * Generates complete /Encrypt dictionary and cryptographic keys for a policy
   */
  public static generateSecurityBundle(
    policy: PdfSecurityPolicy,
    customDocId?: Uint8Array
  ): IPdfSecureBundle | null {
    if (!policy.isEncrypted()) {
      return null;
    }

    const documentId = customDocId || PdfKeyDerivationEngine.generateDocumentId();
    const hashes = PdfKeyDerivationEngine.deriveAllHashes({ policy, documentId });

    // Determine V (algorithm version per ISO 32000-1 Table 20)
    let v = 2; // Default for 128-bit RC4
    if (policy.algorithm === 'RC4_40') v = 1;
    else if (policy.algorithm === 'AES_128') v = 4;
    else if (policy.algorithm === 'AES_256') v = 5;

    const p = policy.permissions.toBitmask();
    const oHex = bytesToHex(hashes.oHash);
    const uHex = bytesToHex(hashes.uHash);

    // Construct raw PDF dictionary string
    let dictStr = `<<\n  /Filter /Standard\n  /V ${v}\n  /R ${policy.revision}\n  /Length ${policy.keyLengthBits}\n  /P ${p}\n  /O <${oHex}>\n  /U <${uHex}>`;

    if (policy.revision >= 4) {
      dictStr += `\n  /EncryptMetadata ${policy.encryptMetadata ? 'true' : 'false'}`;
      if (policy.algorithm.startsWith('AES')) {
        dictStr += `\n  /CF <<\n    /StdCF <<\n      /Type /CryptFilter\n      /CFM /AESV2\n      /AuthEvent /DocOpen\n      /Length ${policy.keyLengthBits / 8}\n    >>\n  >>`;
        dictStr += `\n  /StmF /StdCF\n  /StrF /StdCF`;
      }
    }

    dictStr += `\n>>`;

    const encryptDict: IPdfEncryptDictionary = {
      filter: 'Standard',
      v,
      r: policy.revision,
      length: policy.keyLengthBits,
      p,
      o: oHex,
      u: uHex,
      encryptMetadata: policy.encryptMetadata,
      rawDictionaryString: dictStr,
    };

    return {
      policy,
      hashes,
      encryptDict,
      documentId,
    };
  }

  /**
   * Encrypts a specific PDF indirect object's stream or string payload
   */
  public static encryptObjectPayload(
    payload: Uint8Array,
    masterKey: Uint8Array,
    objNum: number,
    genNum: number,
    algorithm: string
  ): Uint8Array {
    if (algorithm === 'NONE') return payload;

    const isAes = algorithm.startsWith('AES');
    const objectKey = PdfKeyDerivationEngine.deriveObjectKey(masterKey, objNum, genNum, isAes);

    if (algorithm === 'AES_256') {
      return PdfCipherEngine.encryptAes256(objectKey, payload);
    } else if (algorithm === 'AES_128') {
      return PdfCipherEngine.encryptAes128(objectKey, payload);
    } else {
      // RC4
      return PdfCipherEngine.rc4(objectKey, payload);
    }
  }

  /**
   * Decrypts a specific PDF indirect object's payload
   */
  public static decryptObjectPayload(
    cipherPayload: Uint8Array,
    masterKey: Uint8Array,
    objNum: number,
    genNum: number,
    algorithm: string
  ): Uint8Array {
    if (algorithm === 'NONE') return cipherPayload;

    const isAes = algorithm.startsWith('AES');
    const objectKey = PdfKeyDerivationEngine.deriveObjectKey(masterKey, objNum, genNum, isAes);

    if (algorithm === 'AES_256') {
      return PdfCipherEngine.decryptAes256(objectKey, cipherPayload);
    } else if (algorithm === 'AES_128') {
      return PdfCipherEngine.decryptAes128(objectKey, cipherPayload);
    } else {
      return PdfCipherEngine.rc4(objectKey, cipherPayload);
    }
  }

  /**
   * Verifies an entered password against an existing security bundle
   * Returns: 'OWNER' | 'USER' | 'INVALID'
   */
  public static authenticatePassword(
    bundle: IPdfSecureBundle,
    enteredPassword: string
  ): 'OWNER' | 'USER' | 'INVALID' {
    const { policy } = bundle;
    if (!policy.isEncrypted()) return 'USER';

    // 1. Check Owner Password match
    if (policy.ownerPassword && enteredPassword === policy.ownerPassword) {
      return 'OWNER';
    }

    // 2. Check User Password match
    if (enteredPassword === policy.userPassword) {
      return 'USER';
    }

    // 3. Fallback: if user password is empty and entered password is empty
    if (!policy.userPassword && enteredPassword === '') {
      return 'USER';
    }

    return 'INVALID';
  }

  /**
   * Integrates with TASK-0014-01 PdfMetadataBundle:
   * Generates combined metadata and security trailer references
   */
  public static createSecureTrailerContext(
    bundle: IPdfSecureBundle | null,
    metadataBundle?: PdfMetadataBundle
  ): {
    encryptRefString: string;
    encryptMetadataFlag: boolean;
    metadataIsProtected: boolean;
  } {
    if (!bundle) {
      return {
        encryptRefString: '',
        encryptMetadataFlag: false,
        metadataIsProtected: false,
      };
    }

    const encryptMetadataFlag = bundle.policy.encryptMetadata;
    const metadataIsProtected = Boolean(metadataBundle && encryptMetadataFlag);

    return {
      encryptRefString: `/Encrypt ${bundle.encryptDict.rawDictionaryString}`,
      encryptMetadataFlag,
      metadataIsProtected,
    };
  }
}
