import '../src/shared/envLoader';
import fs from 'fs';
import path from 'path';
import https from 'https';
import crypto from 'crypto';
import { runComprehensiveServiceCheck } from './service_health_check';

const OWNER = 'jkoogit';
const REPO = 'purePDFrend';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

if (!GITHUB_TOKEN) {
  console.error('Error: GITHUB_TOKEN is not defined in environment variables.');
  process.exit(1);
}

function computeGitBlobSha(content: Buffer): string {
  const header = `blob ${content.length}\0`;
  const store = Buffer.concat([Buffer.from(header, 'utf8'), content]);
  return crypto.createHash('sha1').update(store).digest('hex');
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
  '.env.development',
  '.env.production',
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
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Length': Buffer.byteLength(payload)
        } : {})
      }
    }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        try {
          resolve({ status: res.statusCode || 500, body: JSON.parse(text) });
        } catch {
          resolve({ status: res.statusCode || 500, body: text as any });
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload, 'utf8');
    req.end();
  });
}

function getAllFiles(dir: string, baseDir = dir): string[] {
  let results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      if (!IGNORE_DIRS.has(entry.name)) {
        results = results.concat(getAllFiles(fullPath, baseDir));
      }
    } else {
      if (!IGNORE_FILES.has(entry.name)) {
        results.push(relPath);
      }
    }
  }

  return results;
}

async function uploadBlob(filePath: string): Promise<string> {
  const content = fs.readFileSync(filePath);
  const base64 = content.toString('base64');

  const res = await requestGitHub('/git/blobs', 'POST', {
    content: base64,
    encoding: 'base64',
  });

  if (res.status !== 201) {
    throw new Error(`Failed to upload blob for ${filePath}: ${JSON.stringify(res.body)}`);
  }

  return res.body.sha;
}

async function mergeBranch(base: string, head: string, commitMessage: string) {
  const res = await requestGitHub('/merges', 'POST', {
    base,
    head,
    commit_message: commitMessage,
  });
  console.log(`[Merge ${head} -> ${base}] Status: ${res.status}`);
  if (res.status !== 201 && res.status !== 204 && res.status !== 409) {
    console.warn(`Merge response:`, res.body);
  }
}

export async function syncAndPush(
  targetBranch = 'dev',
  commitMessage = 'feat: automated sync via Git Data API',
  taskBranch?: string,
  prTitle?: string
) {
  // Dynamically resolve active task branch and title if not provided
  if (!taskBranch || !prTitle) {
    try {
      const storePath = path.join(process.cwd(), 'data', 'local_agent_store.json');
      if (fs.existsSync(storePath)) {
        const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
        const activeSession = store.sessions?.[0];
        const activeTask = store.tasks?.find((t: any) => t.session_id === activeSession?.session_id) || store.tasks?.[0];
        if (!taskBranch) {
          taskBranch = activeSession?.doc_payload?.branch || activeTask?.doc_payload?.branch || 'task/0018_01_가상화뷰어최적화_사용자대시보드연동_Gemini';
        }
        if (!prTitle) {
          prTitle = activeTask ? `[${activeTask.task_id}] ${activeTask.task_name}` : `[0018] SESSION-0018 최신 소스 복원 및 작업 브랜치 동기화`;
        }
      }
    } catch (e) {
      // Fallback defaults
    }
  }
  taskBranch = taskBranch || 'task/0016_01_UI정책_긴급백업복구_Gemini';
  prTitle = prTitle || '[0016-01] 전수 목록 화면 UI 정책 일괄 적용 및 긴급 백업 복구';

  console.log(`=== Starting GitHub Sync & Push via Task Branch ('${taskBranch}') ===`);

  // 0. Pre-flight Comprehensive Service Check
  console.log('0. Running Pre-flight Comprehensive Service Health Check...');
  const healthCheck = await runComprehensiveServiceCheck();
  if (!healthCheck.allPassed) {
    // 정책 03-10 (DB 장애 대응 및 무중단 운영): 외부 DB 브릿지 오프라인 시 로컬 폴백 모드로 소스 푸시 허용
    const isCriticalFailure = healthCheck.results.some(r => r.step !== '1단계' && r.step !== '3단계' && !r.passed);
    if (isCriticalFailure) {
      throw new Error('❌ Pre-flight Service Health Check FAILED. GitHub Push aborted to protect remote branches.');
    }
    console.warn('⚠️ Pre-flight Service Health Check: DB 브릿지 경고 (정책 03-10 로컬 폴백 모드 활성). 원격 Git Push를 계속 진행합니다...');
  } else {
    console.log('✅ Pre-flight Service Health Check PASSED (100% Integrity). Proceeding to Git Push...');
  }

  // 1. Fetch current dev reference to base our work
  console.log(`1. Fetching current reference for branch '${targetBranch}'...`);
  const branchRes = await requestGitHub(`/git/ref/heads/${targetBranch}`);
  if (branchRes.status !== 200) {
    throw new Error(`Branch '${targetBranch}' not found on remote: ${JSON.stringify(branchRes.body)}`);
  }
  const parentCommitSha = branchRes.body.object.sha;
  console.log(`   Latest commit on '${targetBranch}': ${parentCommitSha}`);

  // Fetch parent commit details to get base tree
  const commitRes = await requestGitHub(`/git/commits/${parentCommitSha}`);
  const baseTreeSha = commitRes.body.tree.sha;
  console.log(`   Base tree SHA: ${baseTreeSha}`);

  // 2. Scan all files
  console.log('2. Scanning local files to track...');
  const files = getAllFiles(process.cwd());
  console.log(`   Found ${files.length} files to synchronize.`);

  // 3. Compare local files with remote base tree
  console.log('3. Comparing local files with remote base tree...');
  const remoteTreeRes = await requestGitHub(`/git/trees/${baseTreeSha}?recursive=1`);
  const remoteTreeMap = new Map<string, string>();
  if (remoteTreeRes.status === 200 && Array.isArray(remoteTreeRes.body.tree)) {
    for (const item of remoteTreeRes.body.tree) {
      if (item.type === 'blob') {
        remoteTreeMap.set(item.path, item.sha);
      }
    }
  }

  const treeItems: Array<{ path: string; mode: string; type: string; sha: string }> = [];
  const filesToUpload: string[] = [];

  for (const f of files) {
    const content = fs.readFileSync(path.join(process.cwd(), f));
    const localSha = computeGitBlobSha(content);
    const remoteSha = remoteTreeMap.get(f);

    if (remoteSha === localSha) {
      treeItems.push({ path: f, mode: '100644', type: 'blob', sha: localSha });
    } else {
      filesToUpload.push(f);
    }
  }

  console.log(`   Unchanged files: ${treeItems.length} (reusing remote blobs)`);
  console.log(`   Modified/New files to upload: ${filesToUpload.length}`);

  // Upload modified or new blobs
  for (let i = 0; i < filesToUpload.length; i++) {
    const f = filesToUpload[i];
    const sha = await uploadBlob(f);
    treeItems.push({ path: f, mode: '100644', type: 'blob', sha });
    console.log(`   Uploaded blob [${i + 1}/${filesToUpload.length}]: ${f}`);
    await new Promise((res) => setTimeout(res, 80));
  }
  console.log(`   All ${treeItems.length} tree items prepared.`);

  // 4. Create new tree (Full tree creation without base_tree to cleanly purge broken/obsolete remote paths)
  console.log('4. Creating clean Git Tree (purging obsolete/broken remote entries)...');
  const treeRes = await requestGitHub('/git/trees', 'POST', {
    tree: treeItems,
  });
  if (treeRes.status !== 201) {
    throw new Error(`Failed to create git tree: ${JSON.stringify(treeRes.body)}`);
  }
  const newTreeSha = treeRes.body.sha;
  console.log(`   New Tree created. SHA: ${newTreeSha}`);

  // 5. Create new commit
  console.log('5. Creating new Git Commit...');
  const newCommitRes = await requestGitHub('/git/commits', 'POST', {
    message: commitMessage,
    tree: newTreeSha,
    parents: [parentCommitSha],
  });
  if (newCommitRes.status !== 201) {
    throw new Error(`Failed to create git commit: ${JSON.stringify(newCommitRes.body)}`);
  }
  const newCommitSha = newCommitRes.body.sha;
  console.log(`   New Commit created! SHA: ${newCommitSha}`);

  // 6. Update or Create Task Branch with the new commit
  console.log(`6. Updating/Creating task branch 'refs/heads/${taskBranch}' to ${newCommitSha}...`);
  const checkTaskBranchRes = await requestGitHub(`/git/ref/heads/${taskBranch}`);
  if (checkTaskBranchRes.status === 200) {
    await requestGitHub(`/git/refs/heads/${taskBranch}`, 'PATCH', {
      sha: newCommitSha,
      force: true
    });
    console.log(`   Updated existing branch '${taskBranch}' to ${newCommitSha}`);
  } else {
    await requestGitHub('/git/refs', 'POST', {
      ref: `refs/heads/${taskBranch}`,
      sha: newCommitSha
    });
    console.log(`   Created new task branch '${taskBranch}' at ${newCommitSha}`);
  }

  // 7. Create Pull Request from taskBranch to dev
  console.log(`7. Creating Pull Request from '${taskBranch}' to '${targetBranch}'...`);
  const prRes = await requestGitHub('/pulls', 'POST', {
    title: prTitle,
    head: taskBranch,
    base: targetBranch,
    body: `## ${prTitle}\n\n- Commit: ${newCommitSha}\n- Message: ${commitMessage}\n- Automated PR generated during #태스크정리 via purePDFrend Harness.`
  });

  let prNumber: number | null = null;
  if (prRes.status === 201) {
    prNumber = prRes.body.number;
    console.log(`   ✅ PR #${prNumber} created: "${prTitle}"`);
    
    // Merge PR into dev
    console.log(`   Merging PR #${prNumber} into '${targetBranch}'...`);
    const mergePrRes = await requestGitHub(`/pulls/${prNumber}/merge`, 'PUT', {
      commit_title: `Merge pull request #${prNumber} from ${taskBranch}`,
      commit_message: commitMessage,
      merge_method: 'merge'
    });
    console.log(`   PR #${prNumber} Merge Status: ${mergePrRes.status}`);
  } else {
    console.log(`   PR creation notice: ${JSON.stringify(prRes.body)}`);
    // Fallback: direct update to dev if PR was not created
    console.log(`   Fallback updating '${targetBranch}' ref directly to ${newCommitSha}...`);
    await requestGitHub(`/git/refs/heads/${targetBranch}`, 'PATCH', {
      sha: newCommitSha,
      force: false,
    });
  }

  // 8. Auto-promote to stg and main
  console.log('8. Promoting commit to stg and main branches...');
  await mergeBranch('stg', targetBranch, `Promote ${targetBranch} to stg: ${commitMessage}`);
  await mergeBranch('main', 'stg', `Promote stg to main: ${commitMessage}`);
  console.log('=== GitHub Sync, PR, and Promotion Complete! ===\n');

  return { newCommitSha, newTreeSha, prNumber };
}

// Allow CLI execution or import
if (process.argv[1]?.includes("github_sync_push")) {
  const messageArg = process.argv.slice(2).join(' ') || 'feat: automated full sync from ai agent';
  syncAndPush('dev', messageArg).catch((err) => {
    console.error('Sync failed:', err);
    process.exit(1);
  });
}
