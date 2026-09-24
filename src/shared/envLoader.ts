import fs from 'fs';
import path from 'path';

/**
 * .env 파일 자동 로더
 * Google AI Studio / Cloud 환경의 시스템 환경 변수를 우선 보존하며,
 * 로컬 개발 환경(Windows/Linux/macOS)에서 프로젝트 루트의 .env 파일을 자동으로 process.env에 로드합니다.
 */
export function loadEnv(customPath?: string): Record<string, string> {
  const loaded: Record<string, string> = {};

  try {
    const rootDir = process.cwd();
    const envPaths = customPath 
      ? [customPath] 
      : [
          path.resolve(rootDir, '.env'),
          path.resolve(rootDir, '.env.local'),
        ];

    for (const targetPath of envPaths) {
      if (!fs.existsSync(targetPath)) continue;

      const content = fs.readFileSync(targetPath, 'utf8');
      const lines = content.split(/\r?\n/);

      for (const rawLine of lines) {
        const line = rawLine.trim();
        // 주석(#) 및 빈 줄 무시
        if (!line || line.startsWith('#')) continue;

        const eqIdx = line.indexOf('=');
        if (eqIdx === -1) continue;

        const key = line.slice(0, eqIdx).trim();
        let val = line.slice(eqIdx + 1).trim();

        if (!key) continue;

        // 양 끝 따옴표 제거 ("..." 또는 '...')
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        }

        // 이스케이프 문자 처리 (\n 등)
        val = val.replace(/\\n/g, '\n');

        // 이미 OS 환경변수에 설정되어 있지 않은 경우에만 주입 (또는 빈 값인 경우 보정)
        if (!process.env[key] || process.env[key] === '') {
          process.env[key] = val;
        }
        loaded[key] = process.env[key] || val;
      }
    }
  } catch (err) {
    console.warn('[envLoader] .env 파일 로드 중 경고:', err);
  }

  return loaded;
}

// 모듈 로드 시 자동 1회 실행
loadEnv();
