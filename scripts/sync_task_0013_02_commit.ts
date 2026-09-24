import '../src/shared/envLoader';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { runComprehensiveServiceCheck } from './service_health_check';

const OWNER = 'jkoogit';
const REPO = 'purePDFrend';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

if (!GITHUB_TOKEN) {
  console.error('Error: GITHUB_TOKEN is not defined in environment variables.');
  process.exit(1);
}

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
  data?: any
): Promise<{ status: number; body: T }> {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : null;
    const req = https.request(`https://api.github.com/repos/${OWNER}/${REPO}${endpoint}`, {
      method,
      headers: {
        'User-Agent': 'purePDFrend-agent',
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
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

async function uploadBlob(relPath: string): Promise<string> {
  const content = fs.readFileSync(path.join(process.cwd(), relPath));
  const base64Content = content.toString('base64');

  const res = await requestGitHub('/git/blobs', 'POST', {
    content: base64Content,
    encoding: 'base64',
  });

  if (res.status !== 201) {
    throw new Error(`Failed to upload blob for ${relPath}: ${JSON.stringify(res.body)}`);
  }

  return res.body.sha;
}

async function pushToBranch(branchName: string, commitMessage: string) {
  console.log(`\n▶ [Git Data API] '${branchName}' 작업 브랜치 커밋 및 Push 시작...`);
  
  // 1. Get current branch ref
  const refRes = await requestGitHub(`/git/ref/heads/${branchName}`);
  if (refRes.status !== 200) {
    throw new Error(`Failed to fetch ref for branch ${branchName}: ${JSON.stringify(refRes.body)}`);
  }
  const parentCommitSha = refRes.body.object.sha;
  console.log(`   - 최신 Parent Commit SHA: ${parentCommitSha}`);

  // 2. Fetch commit to get base_tree sha
  const commitRes = await requestGitHub(`/git/commits/${parentCommitSha}`);
  if (commitRes.status !== 200) {
    throw new Error(`Failed to fetch commit ${parentCommitSha}: ${JSON.stringify(commitRes.body)}`);
  }
  const baseTreeSha = commitRes.body.tree.sha;

  // 3. Scan local files
  const files = getAllFiles(process.cwd());
  console.log(`   - 동기화 대상 로컬 파일 수: ${files.length}개`);

  // 4. Upload blobs in chunks of 15
  const treeItems: Array<{ path: string; mode: string; type: string; sha: string }> = [];
  const chunkSize = 15;
  for (let i = 0; i < files.length; i += chunkSize) {
    const chunk = files.slice(i, i + chunkSize);
    const results = await Promise.all(
      chunk.map(async (f) => {
        const sha = await uploadBlob(f);
        return { path: f, mode: '100644', type: 'blob', sha };
      })
    );
    treeItems.push(...results);
  }
  console.log(`   - ${treeItems.length}개 파일 Blob 업로드 완료`);

  // 5. Create new tree
  const treeRes = await requestGitHub('/git/trees', 'POST', {
    base_tree: baseTreeSha,
    tree: treeItems,
  });
  if (treeRes.status !== 201) {
    throw new Error(`Failed to create git tree: ${JSON.stringify(treeRes.body)}`);
  }
  const newTreeSha = treeRes.body.sha;

  // 6. Create commit
  const newCommitRes = await requestGitHub('/git/commits', 'POST', {
    message: commitMessage,
    tree: newTreeSha,
    parents: [parentCommitSha],
  });
  if (newCommitRes.status !== 201) {
    throw new Error(`Failed to create git commit: ${JSON.stringify(newCommitRes.body)}`);
  }
  const newCommitSha = newCommitRes.body.sha;
  console.log(`   - 신규 Commit 생성 완료: ${newCommitSha}`);

  // 7. Update branch ref
  const updateRefRes = await requestGitHub(`/git/refs/heads/${branchName}`, 'PATCH', {
    sha: newCommitSha,
    force: false,
  });
  if (updateRefRes.status !== 200) {
    throw new Error(`Failed to update branch ref: ${JSON.stringify(updateRefRes.body)}`);
  }
  console.log(`   ✅ '${branchName}' 작업 브랜치 Commit & Push 성공!`);
  return newCommitSha;
}

async function main() {
  console.log('================================================================');
  console.log('🚀 [TASK-0013-02] 태스크 처리: 작업 브랜치 커밋 동기화');
  console.log('================================================================');

  // 0. Pre-flight 헬스체크
  console.log('\n[단계 0] Pre-flight 정합성 검사...');
  const { allPassed } = await runComprehensiveServiceCheck();
  if (!allPassed) {
    throw new Error('❌ Pre-flight Service Health Check FAILED. Git Push 중단.');
  }
  console.log('✅ Pre-flight 100% 무결성 통과\n');

  const taskBranch = 'task/0013_0019_manual-and-worker-pipeline_Gemini';
  const commitMsg = 'feat: TASK-0013-02 Web Worker 스레드 오프로딩 Searchable PDF 합성 엔진 및 Transferable 0-Copy 전송 구현';

  const taskCommitSha = await pushToBranch(taskBranch, commitMsg);

  console.log('\n================================================================');
  console.log('✨ [TASK-0013-02] 작업 브랜치 커밋 완결');
  console.log(`- 작업 브랜치 SHA (${taskBranch}): ${taskCommitSha}`);
  console.log('================================================================');
}

main().catch((err) => {
  console.error('Task commit failed:', err);
  process.exit(1);
});
