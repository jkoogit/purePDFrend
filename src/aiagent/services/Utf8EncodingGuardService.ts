/**
 * @file Utf8EncodingGuardService.ts
 * @description Windows/Node.js/DB 환경 전역 UTF-8 인코딩 영구 방어 및 NFC 한글 정규화 도메인 서비스
 */

import path from 'path';

export class Utf8EncodingGuardService {
  /**
   * 문자열을 유니코드 NFC(Normalization Form C)로 정규화하여 자모 분리 현상 방어
   */
  public static normalizeNfc(input: string): string {
    if (!input) return '';
    return input.normalize('NFC');
  }

  /**
   * 파일 경로를 정규화하고 UTF-8 NFC 인코딩으로 안전하게 변환
   */
  public static safeUtf8Path(filePath: string): string {
    if (!filePath) return '';
    const normalized = path.normalize(filePath).replace(/\\/g, '/');
    return Utf8EncodingGuardService.normalizeNfc(normalized);
  }

  /**
   * 바이트 버퍼가 유효한 UTF-8 문자열인지 검증
   */
  public static isValidUtf8(buffer: Uint8Array): boolean {
    try {
      const decoder = new TextDecoder('utf-8', { fatal: true });
      decoder.decode(buffer);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 문자열을 UTF-8 Buffer로 안전 인코딩
   */
  public static encodeToUtf8(text: string): Uint8Array {
    const encoder = new TextEncoder();
    return encoder.encode(Utf8EncodingGuardService.normalizeNfc(text));
  }

  /**
   * Buffer를 UTF-8 문자열로 안전 디코딩
   */
  public static decodeFromUtf8(buffer: Uint8Array): string {
    const decoder = new TextDecoder('utf-8');
    return Utf8EncodingGuardService.normalizeNfc(decoder.decode(buffer));
  }
}
