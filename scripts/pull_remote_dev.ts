import '../src/shared/envLoader';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const TARGET_SHA = '9ff34e0a097b8cdc853f9ed459cd3a500cf9091e'; // latest commit on dev (Merge PR #53 of b5d87a170f)

console.log(`Starting pull of remote dev (${TARGET_SHA})...`);

const tmpDir = '/tmp/remote_dev_sync';
if (fs.existsSync(tmpDir)) {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}
fs.mkdirSync(tmpDir, { recursive: true });

// 1. Download tarball
const tarPath = path.join(tmpDir, 'dev.tar.gz');
console.log('Downloading tarball from GitHub API...');
execSync(
  `curl -sL -H "Authorization: Bearer ${GITHUB_TOKEN}" -H "Accept: application/vnd.github.v3+json" "https://api.github.com/repos/jkoogit/purePDFrend/tarball/${TARGET_SHA}" -o "${tarPath}"`,
  { stdio: 'inherit' }
);

// 2. Extract into tmpDir/extracted
const extractDir = path.join(tmpDir, 'extracted');
fs.mkdirSync(extractDir, { recursive: true });
execSync(`tar -xzf "${tarPath}" --strip-components=1 -C "${extractDir}"`, { stdio: 'inherit' });

console.log('Tarball extracted to tmp directory. Inspecting contents...');
const files = fs.readdirSync(extractDir);
console.log('Top level files in remote dev:', files);

// Check key files in remote dev
const checkFiles = [
  'docs/13.회고/13-16_SESSION-261002-0020_세션종합_KPT_회고록.md',
  'docs/10.리뷰/261002_038_목차TOC제거_주석행체크박스및선택레이어팝업_OCR위아래탐색및즉시현행화_완결_코드리뷰.md',
  'docs/10.리뷰/261001_036_문서관리_라이브러리_모바일반응형_및_옵션처리레이어_일체형배치_완결_코드리뷰.md',
  'src/ppdf/components/VirtualViewerStudio.tsx',
  'src/ppdf/views/wireframes/UserWireframes.tsx'
];

for (const cf of checkFiles) {
  const p = path.join(extractDir, cf);
  console.log(`- ${cf}: exists=${fs.existsSync(p)}`);
}

// Copy extracted files into workspace, preserving node_modules and .env
const PROTECTED = new Set([
  'node_modules',
  '.env',
  '.env.local',
  '.env.production',
  '.env.development'
]);

function copyDirRecursive(src: string, dest: string) {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    if (PROTECTED.has(entry.name)) {
      continue;
    }
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true });
      }
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('Applying remote dev files to local workspace...');
copyDirRecursive(extractDir, process.cwd());
console.log('✅ Remote dev sync complete!');
