/**
 * @file EmergencyGitPushEngine.ts
 * @description LLM 비의존형(Non-LLM) 긴급 소스 원격 브랜치 커밋 및 푸시 엔진
 * 토큰 소진 또는 세션 행(Hang) 발생 시 웹 UI에서 직접 호출되어 최종 소스를 보존합니다.
 */

import '../../shared/envLoader';
import fs from 'fs';
import path from 'path';
import https from 'https';

const OWNER = 'jkoogit';
const REPO = 'purePDFrend';

const IGNORE_DIRS = new Set([
  'node_modules',
  'dist',
  '.vite',
  '.git',
  '.cache',
  'coverage',
]);

const IGNORE_FILES = new Set([
  '.DS_Store',
  'package-lock.json',
  'yarn.lock',
  '.env',
  '.env.local',
  '.env.production',
  '.env.development',
]);

function requestGitHub<T = any>(
  endpoint: string,
  method = 'GET',
  data?: any,
  token?: string
): Promise<{ status: number; body: T }> {
  return new Promise((resolve, reject) => {
    const githubToken = token || process.env.GITHUB_TOKEN;
    if (!githubToken) {
      return reject(new Error('GITHUB_TOKEN 환경변수가 설정되어 있지 않습니다.'));
    }

    const payload = data ? JSON.stringify(data) : null;
    const req = https.request(`https://api.github.com/repos/${OWNER}/${REPO}${endpoint}`, {
      method,
      headers: {
        'User-Agent': 'purePDFrend-emergency-agent',
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        ...(payload ? {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        } : {}),
      },
    }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        try {
          const parsed = text ? JSON.parse(text) : {};
          resolve({ status: res.statusCode || 200, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode || 200, body: text as any });
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function getAllFiles(dir: string, baseDir: string = dir): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      if (!IGNORE_DIRS.has(entry.name)) {
        files = files.concat(getAllFiles(fullPath, baseDir));
      }
    } else if (entry.isFile()) {
      if (
        !IGNORE_FILES.has(entry.name) && 
        !entry.name.startsWith('.env') && 
        !entry.name.endsWith('.log')
      ) {
        files.push(relPath);
      }
    }
  }

  return files;
}

export interface EmergencyPushResult {
  success: boolean;
  commitSha?: string;
  branch: string;
  filesSyncedCount: number;
  commitMessage: string;
  commitUrl?: string;
  error?: string;
}

export class EmergencyGitPushEngine {
  public static async executeEmergencyPush(options: {
    targetBranch?: string;
    commitMessage?: string;
  } = {}): Promise<EmergencyPushResult> {
    const branch = options.targetBranch || 'dev';
    const msg = options.commitMessage || `[EMERGENCY-PUSH] non-llm backup checkpoint (${new Date().toISOString()})`;

    try {
      // 1. Fetch current commit of target branch
      const refRes = await requestGitHub(`/git/ref/heads/${encodeURIComponent(branch)}`);
      if (refRes.status !== 200) {
        throw new Error(`원격 브랜치(${branch}) 조회 실패: HTTP ${refRes.status}`);
      }
      const parentCommitSha = refRes.body.object.sha;

      // 2. Scan tracked local files
      const rootDir = process.cwd();
      const files = getAllFiles(rootDir, rootDir);

      if (files.length === 0) {
        throw new Error('푸시할 로컬 파일이 발견되지 않았습니다.');
      }

      // 3. Upload blobs concurrently in batches of 10
      const treeItems: Array<{ path: string; mode: string; type: string; sha: string }> = [];
      const batchSize = 10;

      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        const uploadedBatch = await Promise.all(
          batch.map(async (file) => {
            const content = fs.readFileSync(path.join(rootDir, file));
            const base64Content = content.toString('base64');
            const blobRes = await requestGitHub('/git/blobs', 'POST', {
              content: base64Content,
              encoding: 'base64',
            });
            if (blobRes.status !== 201) {
              throw new Error(`Blob 업로드 실패 (${file}): HTTP ${blobRes.status}`);
            }
            return {
              path: file,
              mode: '100644',
              type: 'blob',
              sha: blobRes.body.sha,
            };
          })
        );
        treeItems.push(...uploadedBatch);
      }

      // 4. Create new tree
      const treeRes = await requestGitHub('/git/trees', 'POST', {
        tree: treeItems,
      });
      if (treeRes.status !== 201) {
        throw new Error(`신규 Git Tree 생성 실패: HTTP ${treeRes.status}`);
      }
      const newTreeSha = treeRes.body.sha;

      // 5. Create new commit
      const commitRes = await requestGitHub('/git/commits', 'POST', {
        message: msg,
        tree: newTreeSha,
        parents: [parentCommitSha],
      });
      if (commitRes.status !== 201) {
        throw new Error(`Git 커밋 생성 실패: HTTP ${commitRes.status}`);
      }
      const newCommitSha = commitRes.body.sha;

      // 6. Update reference
      const updateRes = await requestGitHub(`/git/refs/heads/${encodeURIComponent(branch)}`, 'PATCH', {
        sha: newCommitSha,
        force: true,
      });
      if (updateRes.status !== 200) {
        throw new Error(`브랜치 Reference 업데이트 실패: HTTP ${updateRes.status}`);
      }

      return {
        success: true,
        commitSha: newCommitSha,
        branch,
        filesSyncedCount: files.length,
        commitMessage: msg,
        commitUrl: `https://github.com/${OWNER}/${REPO}/commit/${newCommitSha}`,
      };
    } catch (err: any) {
      return {
        success: false,
        branch,
        filesSyncedCount: 0,
        commitMessage: msg,
        error: err.message,
      };
    }
  }
}
