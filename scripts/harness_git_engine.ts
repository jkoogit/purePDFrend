import '../src/shared/envLoader';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { execSync } from 'child_process';
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

// 1. 로컬 Git CLI 실행 헬퍼
export function hasLocalGit(): boolean {
  try {
    execSync('git --version', { stdio: 'ignore' });
    return fs.existsSync(path.join(process.cwd(), '.git'));
  } catch (e) {
    return false;
  }
}

export function runLocalGit(cmd: string): string {
  try {
    return execSync(cmd, { cwd: process.cwd(), encoding: 'utf-8' }).trim();
  } catch (e: any) {
    console.warn(`[Local Git Warning] Command '${cmd}' failed:`, e.message);
    return '';
  }
}

// 2. GitHub REST API 헬퍼
export function requestGitHub<T = any>(
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

// 3. 작업 브랜치 Push (로컬 Git + 원격 Git Data API)
export async function commitAndPushTaskBranch(branchName: string, commitMessage: string): Promise<string> {
  console.log(`\n================================================================`);
  console.log(`🚀 [하이브리드 Git] 작업 브랜치 '${branchName}' 커밋 및 푸시`);
  console.log(`================================================================`);

  // (1) 로컬 Git 환경이 존재하는 경우: 로컬 브랜치 체크아웃 & git add & commit
  if (hasLocalGit()) {
    console.log('▶ [1단계: 로컬 Git] 브랜치 전환 및 Staged Changes 커밋 중...');
    runLocalGit(`git checkout -B ${branchName}`);
    runLocalGit('git add .');
    const commitOut = runLocalGit(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`);
    console.log(`   - 로컬 커밋 결과: ${commitOut ? commitOut.split('\n')[0] : 'Working tree clean'}`);
  }

  // (2) 원격 GitHub Git Data API로 원격 작업 브랜치 푸시
  console.log('▶ [2단계: 원격 Git Data API] 원격 브랜치 커밋 및 푸시 중...');
  const refRes = await requestGitHub(`/git/ref/heads/${branchName}`);
  let parentCommitSha: string;
  if (refRes.status === 200) {
    parentCommitSha = refRes.body.object.sha;
  } else {
    // 브랜치가 없으면 dev 브랜치 기준으로 생성
    const devRef = await requestGitHub('/git/ref/heads/dev');
    parentCommitSha = devRef.body.object.sha;
    await requestGitHub('/git/refs', 'POST', {
      ref: `refs/heads/${branchName}`,
      sha: parentCommitSha,
    });
  }

  const commitRes = await requestGitHub(`/git/commits/${parentCommitSha}`);
  const baseTreeSha = commitRes.body.tree.sha;

  const files = getAllFiles(process.cwd());
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

  const treeRes = await requestGitHub('/git/trees', 'POST', {
    base_tree: baseTreeSha,
    tree: treeItems,
  });
  const newTreeSha = treeRes.body.sha;

  const newCommitRes = await requestGitHub('/git/commits', 'POST', {
    message: commitMessage,
    tree: newTreeSha,
    parents: [parentCommitSha],
  });
  const newCommitSha = newCommitRes.body.sha;

  await requestGitHub(`/git/refs/heads/${branchName}`, 'PATCH', {
    sha: newCommitSha,
    force: false,
  });

  console.log(`   ✅ 원격 '${branchName}' 푸시 완료! (SHA: ${newCommitSha})`);
  return newCommitSha;
}

// 4. PR 생성 및 원격 dev 머지 (#태스크정리)
export async function finalizeTaskCleanup(
  branchName: string,
  prTitle: string,
  prBody: string,
  commitMessage: string
): Promise<{ taskSha: string; devSha: string }> {
  // 1) 작업 브랜치 커밋 & 푸시
  const taskSha = await commitAndPushTaskBranch(branchName, commitMessage);

  // 2) GitHub PR 자동 생성
  console.log('\n▶ [3단계: GitHub PR] PR 작성 중...');
  const prRes = await requestGitHub('/pulls', 'POST', {
    title: prTitle,
    head: branchName,
    base: 'dev',
    body: prBody,
  });
  if (prRes.status === 201) {
    console.log(`   ✅ PR 생성 완료: #${prRes.body.number} (${prRes.body.html_url})`);
  } else {
    console.log(`   ℹ️ PR 응답: ${prRes.status} (이미 존재하거나 연동됨)`);
  }

  // 3) 원격 dev 브랜치 Fast-Forward 머지
  console.log('\n▶ [4단계: 원격 dev 머지] dev 브랜치 동기화 중...');
  let devSha = taskSha;
  const devPatchRes = await requestGitHub('/git/refs/heads/dev', 'PATCH', {
    sha: taskSha,
    force: false,
  });
  if (devPatchRes.status !== 200) {
    const mergeRes = await requestGitHub('/merges', 'POST', {
      base: 'dev',
      head: taskSha,
      commit_message: `Merge branch '${branchName}' into dev`,
    });
    devSha = mergeRes.body?.sha || taskSha;
  }
  console.log(`   ✅ 원격 'dev' 브랜치 머지 완료! (SHA: ${devSha})`);

  // 4) 로컬 git 동기화
  if (hasLocalGit()) {
    console.log('▶ [5단계: 로컬 git 동기화] 로컬 dev/task 브랜치 최신화...');
    runLocalGit('git fetch origin dev');
    runLocalGit(`git checkout ${branchName}`);
    runLocalGit(`git reset --hard ${taskSha}`);
  }

  return { taskSha, devSha };
}

// 5. 원격 dev 기준 stg/main 배포 승급 (#태스크승급)
export async function promoteTaskToStgAndMain(): Promise<{ devSha: string; stgSha: string; mainSha: string }> {
  console.log(`\n================================================================`);
  console.log(`🚀 [하이브리드 Git] 원격 dev 기준 stg 및 main 브랜치 배포 승급`);
  console.log(`================================================================`);

  const devRef = await requestGitHub('/git/ref/heads/dev');
  const devSha = devRef.body.object.sha;
  console.log(`- 기준 원격 dev 브랜치 SHA: ${devSha}`);

  // 1) stg 브랜치 승급
  console.log('\n▶ [1단계] stg 브랜치 승급...');
  let stgPatch = await requestGitHub('/git/refs/heads/stg', 'PATCH', { sha: devSha, force: false });
  if (stgPatch.status !== 200) {
    await requestGitHub('/merges', 'POST', { base: 'stg', head: devSha, commit_message: `Promote dev to stg: ${devSha}` });
  }
  console.log(`   ✅ stg 브랜치 승급 완료`);

  // 2) main 브랜치 승급
  console.log('\n▶ [2단계] main 브랜치 승급...');
  let mainPatch = await requestGitHub('/git/refs/heads/main', 'PATCH', { sha: devSha, force: false });
  if (mainPatch.status !== 200) {
    await requestGitHub('/merges', 'POST', { base: 'main', head: devSha, commit_message: `Promote stg to main: ${devSha}` });
  }
  console.log(`   ✅ main 브랜치 승급 완료`);

  // 3) SHA 100% 일치 검증
  const stgRef = await requestGitHub('/git/ref/heads/stg');
  const mainRef = await requestGitHub('/git/ref/heads/main');
  const stgSha = stgRef.body.object.sha;
  const mainSha = mainRef.body.object.sha;

  if (devSha === stgSha && stgSha === mainSha) {
    console.log(`\n🎉 [무결성 통과] 원격 3대 브랜치 (dev, stg, main) 커밋 SHA 100% 일치 (${devSha})`);
  } else {
    throw new Error(`❌ 브랜치 SHA 불일치: dev(${devSha}), stg(${stgSha}), main(${mainSha})`);
  }

  // 4) 로컬 git 브랜치들 일괄 최신화
  if (hasLocalGit()) {
    console.log('\n▶ [3단계: 로컬 Git 현행화] 로컬 dev, stg, main 브랜치 원격 일치...');
    runLocalGit('git fetch origin');
    runLocalGit('git checkout dev && git reset --hard origin/dev');
    runLocalGit('git checkout stg && git reset --hard origin/stg');
    runLocalGit('git checkout main && git reset --hard origin/main');
  }

  return { devSha, stgSha, mainSha };
}
