/**
 * Key Derivation Engine: PdfKeyDerivationEngine
 * ISO 32000-1:2008 Clause 7.6.3.3 to 7.6.3.8
 * Implements Algorithm 2, 3, 4, 7 for File and Object Encryption Key derivation.
 * Pure JS / Web-portable implementation (No Node.js 'crypto' or 'Buffer' requirement)
 */

import { PdfCipherEngine } from './PdfCipherEngine';
import { PdfSecurityPolicy } from '../models/PdfSecurityPolicy';
import { PortableCrypto } from './PortableCrypto';

// 32-byte standard padding string specified in ISO 32000-1 Clause 7.6.3.3
export const PDF_STANDARD_PADDING = new Uint8Array([
  0x28, 0xbf, 0x4e, 0x5e, 0x4e, 0x75, 0x8a, 0x41,
  0x64, 0x00, 0x4e, 0x56, 0xff, 0xfa, 0x01, 0x08,
  0x2e, 0x2e, 0x00, 0xb6, 0xd0, 0x68, 0x3e, 0x80,
  0x2f, 0x0c, 0x9a, 0x96, 0x7c, 0x9d, 0x65, 0x32,
]);

export interface IPdfKeyDerivationInputs {
  policy: PdfSecurityPolicy;
  documentId?: Uint8Array; // First element of /ID array in trailer
}

export interface IPdfEncryptionHashes {
  encryptionKey: Uint8Array; // File master key
  oHash: Uint8Array;         // /O entry (Owner hash 32 bytes)
  uHash: Uint8Array;         // /U entry (User hash 32 bytes)
}

function stringToUtf8Bytes(str: string): Uint8Array {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(str);
  }
  const utf8: number[] = [];
  for (let i = 0; i < str.length; i++) {
    let charcode = str.charCodeAt(i);
    if (charcode < 0x80) utf8.push(charcode);
    else if (charcode < 0x800) {
      utf8.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f));
    } else if (charcode < 0xd800 || charcode >= 0xe000) {
      utf8.push(0xe0 | (charcode >> 12), 0x80 | ((charcode >> 6) & 0x3f), 0x80 | (charcode & 0x3f));
    } else {
      i++;
      charcode = 0x10000 + (((charcode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
      utf8.push(0xf0 | (charcode >> 18), 0x80 | ((charcode >> 12) & 0x3f), 0x80 | ((charcode >> 6) & 0x3f), 0x80 | (charcode & 0x3f));
    }
  }
  return new Uint8Array(utf8);
}

function concatUint8Arrays(arrays: Uint8Array[]): Uint8Array {
  const totalLen = arrays.reduce((acc, a) => acc + a.length, 0);
  const out = new Uint8Array(totalLen);
  let offset = 0;
  for (const a of arrays) {
    out.set(a, offset);
    offset += a.length;
  }
  return out;
}

export class PdfKeyDerivationEngine {
  /**
   * Pads or truncates password to exactly 32 bytes per ISO 32000-1 Algorithm 2 Step 1.
   */
  public static padPassword(password: string): Uint8Array {
    const raw = stringToUtf8Bytes(password);
    if (raw.length >= 32) {
      return raw.subarray(0, 32);
    }
    const padded = new Uint8Array(32);
    padded.set(raw, 0);
    padded.set(PDF_STANDARD_PADDING.subarray(0, 32 - raw.length), raw.length);
    return padded;
  }

  /**
   * Generates a 16-byte random document ID if none provided
   */
  public static generateDocumentId(): Uint8Array {
    return PortableCrypto.randomBytes(16);
  }

  /**
   * Algorithm 3: Computing the Owner Password Hash (/O)
   */
  public static computeOwnerHash(
    ownerPassword: string,
    userPassword: string,
    keyLengthBytes: number,
    revision: number
  ): Uint8Array {
    const effectiveOwner = ownerPassword || userPassword;
    const paddedOwner = this.padPassword(effectiveOwner);

    let md5 = PortableCrypto.md5(paddedOwner);

    if (revision >= 3) {
      for (let i = 0; i < 50; i++) {
        md5 = PortableCrypto.md5(md5);
      }
    }

    const key = md5.subarray(0, keyLengthBytes);
    const paddedUser = this.padPassword(userPassword);

    let encrypted = PdfCipherEngine.rc4(key, paddedUser);

    if (revision >= 3) {
      for (let i = 1; i <= 19; i++) {
        const newKey = new Uint8Array(key.length);
        for (let j = 0; j < key.length; j++) {
          newKey[j] = key[j] ^ i;
        }
        encrypted = PdfCipherEngine.rc4(newKey, encrypted);
      }
    }

    return encrypted;
  }

  /**
   * Algorithm 2: Computing the File Encryption Key
   */
  public static computeFileEncryptionKey(
    userPassword: string,
    oHash: Uint8Array,
    permissionsMask: number,
    documentId: Uint8Array,
    revision: number,
    keyLengthBytes: number,
    encryptMetadata = true
  ): Uint8Array {
    // 1. Pad password to 32 bytes
    const paddedUser = this.padPassword(userPassword);

    // 4. Pass P value (4 bytes, signed integer little-endian)
    const pBuf = new Uint8Array(4);
    pBuf[0] = permissionsMask & 0xff;
    pBuf[1] = (permissionsMask >> 8) & 0xff;
    pBuf[2] = (permissionsMask >> 16) & 0xff;
    pBuf[3] = (permissionsMask >> 24) & 0xff;

    const parts: Uint8Array[] = [paddedUser, oHash, pBuf, documentId];

    // 6. If revision >= 4 and not encrypting metadata, pass 0xFFFFFFFF
    if (revision >= 4 && !encryptMetadata) {
      parts.push(new Uint8Array([0xff, 0xff, 0xff, 0xff]));
    }

    let hash = PortableCrypto.md5(concatUint8Arrays(parts));

    // 7. If revision >= 3, do 50 iterations of MD5
    if (revision >= 3) {
      for (let i = 0; i < 50; i++) {
        hash = PortableCrypto.md5(hash.subarray(0, keyLengthBytes));
      }
    }

    return hash.subarray(0, keyLengthBytes);
  }

  /**
   * Algorithm 4: Computing the User Password Hash (/U)
   */
  public static computeUserHash(
    encryptionKey: Uint8Array,
    documentId: Uint8Array,
    revision: number
  ): Uint8Array {
    if (revision === 2) {
      return PdfCipherEngine.rc4(encryptionKey, PDF_STANDARD_PADDING);
    }

    // Revision 3 or higher
    const hash = PortableCrypto.md5(concatUint8Arrays([PDF_STANDARD_PADDING, documentId]));

    let encrypted = PdfCipherEngine.rc4(encryptionKey, hash);

    for (let i = 1; i <= 19; i++) {
      const newKey = new Uint8Array(encryptionKey.length);
      for (let j = 0; j < encryptionKey.length; j++) {
        newKey[j] = encryptionKey[j] ^ i;
      }
      encrypted = PdfCipherEngine.rc4(newKey, encrypted);
    }

    // Pad to 32 bytes with arbitrary padding per spec
    const uResult = new Uint8Array(32);
    uResult.set(encrypted.subarray(0, 16), 0);
    uResult.set(PDF_STANDARD_PADDING.subarray(0, 16), 16);
    return uResult;
  }

  /**
   * Algorithm 7: Derives Object Encryption Key for a specific PDF indirect object (num, gen)
   */
  public static deriveObjectKey(
    masterKey: Uint8Array,
    objNum: number,
    genNum: number,
    isAes: boolean
  ): Uint8Array {
    const parts: Uint8Array[] = [
      masterKey,
      new Uint8Array([objNum & 0xff, (objNum >> 8) & 0xff, (objNum >> 16) & 0xff]),
      new Uint8Array([genNum & 0xff, (genNum >> 8) & 0xff]),
    ];

    if (isAes) {
      parts.push(new Uint8Array([0x73, 0x41, 0x6c, 0x54])); // 'sAlT'
    }

    const digest = PortableCrypto.md5(concatUint8Arrays(parts));
    const keyLen = Math.min(masterKey.length + 5, 16);
    return digest.subarray(0, keyLen);
  }

  /**
   * High-level helper: derives all /Encrypt dictionary hashes
   */
  public static deriveAllHashes(inputs: IPdfKeyDerivationInputs): IPdfEncryptionHashes {
    const { policy } = inputs;
    const docId = inputs.documentId || this.generateDocumentId();
    const keyLengthBytes = policy.keyLengthBits / 8;
    const permissionsMask = policy.permissions.toBitmask();

    const oHash = this.computeOwnerHash(
      policy.ownerPassword,
      policy.userPassword,
      keyLengthBytes,
      policy.revision
    );

    const encryptionKey = this.computeFileEncryptionKey(
      policy.userPassword,
      oHash,
      permissionsMask,
      docId,
      policy.revision,
      keyLengthBytes,
      policy.encryptMetadata
    );

    const uHash = this.computeUserHash(encryptionKey, docId, policy.revision);

    return {
      encryptionKey,
      oHash,
      uHash,
    };
  }
}
