import '../src/shared/envLoader';
import https from 'https';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';

const OWNER = 'jkoogit';
const REPO = 'purePDFrend';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const PROTECTED_NAMES = new Set([
  'node_modules',
  '.env',
  '.env.local',
  '.env.production',
  '.env.development',
  '.git',
]);

function requestGitHub<T = any>(endpoint: string): Promise<{ status: number; body: T }> {
  return new Promise((resolve, reject) => {
    const req = https.request(`https://api.github.com/repos/${OWNER}/${REPO}${endpoint}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'purePDFrend-agent',
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        try {
          resolve({ status: res.statusCode || 200, body: JSON.parse(text) });
        } catch {
          resolve({ status: res.statusCode || 200, body: text as any });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function computeFileHash(filePath: string): string {
  if (!fs.existsSync(filePath)) return '';
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export async function pullRemoteDev(targetShaInput?: string): Promise<{
  success: boolean;
  sha: string;
  addedCount: number;
  updatedCount: number;
  skippedCount: number;
}> {
  console.log('================================================================');
  console.log('🔄 [Auto-Pull] 원격 dev 브랜치 최신 소스 자동 동기화 시작');
  console.log('================================================================');

  let targetSha = targetShaInput;
  if (!targetSha) {
    console.log('📡 GitHub API에서 원격 dev 브랜치 최신 커밋 SHA 조회 중...');
    const refRes = await requestGitHub<any>('/git/ref/heads/dev');
    targetSha = refRes.body?.object?.sha;
    if (!targetSha) {
      throw new Error(`원격 dev 브랜치 SHA 조회 실패 (상태코드: ${refRes.status})`);
    }
  }

  console.log(`🎯 대상 커밋 SHA: ${targetSha}`);

  const tmpDir = '/tmp/remote_dev_sync';
  if (fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tmpDir, { recursive: true });

  const tarPath = path.join(tmpDir, 'dev.tar.gz');
  console.log('📦 GitHub API를 통해 dev 소스 아카이브(Tarball) 다운로드 중...');
  execSync(
    `curl -sL -H "Authorization: Bearer ${GITHUB_TOKEN}" -H "Accept: application/vnd.github.v3+json" "https://api.github.com/repos/${OWNER}/${REPO}/tarball/${targetSha}" -o "${tarPath}"`,
    { stdio: 'inherit' }
  );

  const extractDir = path.join(tmpDir, 'extracted');
  fs.mkdirSync(extractDir, { recursive: true });
  console.log('📂 아카이브 압축 해제 중...');
  execSync(`tar -xzf "${tarPath}" --strip-components=1 -C "${extractDir}"`, { stdio: 'inherit' });

  // Scan and sync
  let addedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  const workspaceRoot = process.cwd();

  function syncDirectory(srcDir: string, destDir: string, relDir: string = '') {
    const entries = fs.readdirSync(srcDir, { withFileTypes: true });
    for (const entry of entries) {
      if (PROTECTED_NAMES.has(entry.name)) {
        continue;
      }
      const srcPath = path.join(srcDir, entry.name);
      const destPath = path.join(destDir, entry.name);
      const relPath = relDir ? `${relDir}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        if (!fs.existsSync(destPath)) {
          fs.mkdirSync(destPath, { recursive: true });
        }
        syncDirectory(srcPath, destPath, relPath);
      } else {
        if (!fs.existsSync(destPath)) {
          fs.copyFileSync(srcPath, destPath);
          addedCount++;
        } else {
          const srcHash = computeFileHash(srcPath);
          const destHash = computeFileHash(destPath);
          if (srcHash !== destHash) {
            fs.copyFileSync(srcPath, destPath);
            updatedCount++;
          } else {
            skippedCount++;
          }
        }
      }
    }
  }

  console.log('🚀 로컬 작업공간으로 최신 소스 무손실 병합 적용 중...');
  syncDirectory(extractDir, workspaceRoot);

  console.log('================================================================');
  console.log(`✅ 원격 dev 동기화 완결!`);
  console.log(`- 기준 SHA: ${targetSha}`);
  console.log(`- 신규 파일 추가: ${addedCount}건`);
  console.log(`- 변경 파일 갱신: ${updatedCount}건`);
  console.log(`- 동일 파일 유지: ${skippedCount}건`);
  console.log('================================================================');

  // Clean up tmp directory
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {}

  return {
    success: true,
    sha: targetSha,
    addedCount,
    updatedCount,
    skippedCount,
  };
}

const isDirectRun = process.argv[1] && (process.argv[1].endsWith('pull_remote_dev.ts') || process.argv[1].endsWith('pull_remote_dev'));
if (isDirectRun) {
  const shaArg = process.argv[2];
  pullRemoteDev(shaArg).catch((err) => {
    console.error('❌ 원격 dev 동기화 실패:', err);
    process.exit(1);
  });
}
