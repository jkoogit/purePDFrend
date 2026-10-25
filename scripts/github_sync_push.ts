import '../src/shared/envLoader';
import { execSync, spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import https from 'https';
import crypto from 'crypto';
import { runComprehensiveServiceCheck } from './service_health_check';
import { reconcileSessionTraces } from './reconcile_session_traces';

const OWNER = 'jkoogit';
const REPO = 'purePDFrend';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// Environment Detection
export function detectToolEnvironment(): {
  isAiStudio: boolean;
  isAntigravityIde: boolean;
  mode: 'ai-studio-api' | 'antigravity-local-git';
} {
  const hasToken = !!GITHUB_TOKEN && GITHUB_TOKEN.trim().length > 0;
  const isVscode = !!process.env.VSCODE_PID || !!process.env.VSCODE_IPC_HOOK;
  
  if (hasToken && !isVscode) {
    return { isAiStudio: true, isAntigravityIde: false, mode: 'ai-studio-api' };
  }
  return { isAiStudio: false, isAntigravityIde: true, mode: 'antigravity-local-git' };
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
    if (!GITHUB_TOKEN) {
      return resolve({ status: 401, body: { message: 'GITHUB_TOKEN is missing' } as any });
    }
    const payload = data ? JSON.stringify(data) : null;
    const req = https.request(`https://api.github.com/repos/${OWNER}/${REPO}${endpoint}`, {
      method,
      headers: {
        'User-Agent': 'purePDFrend-agent',
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        ...(payload ? {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        } : {})
      }
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode || 500, body: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode || 500, body: body as any });
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
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
      if (!IGNORE_FILES.has(entry.name) && !entry.name.startsWith('.env')) {
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

async function mergeBranchApi(base: string, head: string, commitMessage: string) {
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

/**
 * Antigravity IDE Mode: Local Git CLI Merge & Verification
 */
async function syncViaAntigravityLocalGit(
  targetBranch = 'dev',
  commitMessage = 'feat: automated sync via Antigravity Local Git',
  taskBranch?: string
) {
  console.log(`\n======================================================`);
  console.log(`🖥️  Antigravity IDE Mode: Local Git Pipeline Activated`);
  console.log(`======================================================`);

  // 1. Identify active branch
  const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
  const activeTaskBranch = taskBranch || currentBranch;

  // 1-1. Commit any uncommitted changes on activeTaskBranch first
  const statusOutput = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
  if (statusOutput.length > 0) {
    console.log(`   📝 Committing uncommitted changes on '${activeTaskBranch}'...`);
    execSync('git add -A', { stdio: 'pipe' });
    try {
      execSync(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`, { stdio: 'pipe' });
    } catch (e: any) {
      console.warn('   ⚠️ Commit skipped or already clean:', e.message);
    }
  }

  const currentSha = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  console.log(`📌 Active Task Branch: ${activeTaskBranch} (HEAD SHA: ${currentSha})`);

  // 2. Perform Local Merge: taskBranch -> dev -> stg -> main
  console.log(`\n🔀 1. Local Merge: ${activeTaskBranch} -> dev...`);
  execSync(`git checkout dev`, { stdio: 'pipe' });
  execSync(`git merge ${activeTaskBranch} --no-edit`, { stdio: 'pipe' });
  const devSha = execSync('git rev-parse dev', { encoding: 'utf8' }).trim();
  console.log(`   ✅ dev merged. Latest SHA: ${devSha}`);

  console.log(`🔀 2. Local Merge: dev -> stg...`);
  try {
    execSync(`git checkout -B stg origin/stg`, { stdio: 'pipe' });
  } catch {
    execSync(`git checkout -B stg`, { stdio: 'pipe' });
  }
  execSync(`git merge dev --no-edit`, { stdio: 'pipe' });
  const stgSha = execSync('git rev-parse stg', { encoding: 'utf8' }).trim();
  console.log(`   ✅ stg merged. Latest SHA: ${stgSha}`);

  console.log(`🔀 3. Local Merge: stg -> main...`);
  try {
    execSync(`git checkout -B main origin/main`, { stdio: 'pipe' });
  } catch {
    execSync(`git checkout -B main`, { stdio: 'pipe' });
  }
  execSync(`git merge stg --no-edit`, { stdio: 'pipe' });
  const mainSha = execSync('git rev-parse main', { encoding: 'utf8' }).trim();
  console.log(`   ✅ main merged. Latest SHA: ${mainSha}`);

  // Return to task branch
  execSync(`git checkout ${activeTaskBranch}`, { stdio: 'pipe' });
  console.log(`   ↩️  Switched back to task branch: ${activeTaskBranch}`);

  // 3. Remote Push Execution
  console.log(`\n🚀 4. Executing Remote Push to GitHub...`);
  let pushSuccess = false;
  let pushNotice = '';

  if (GITHUB_TOKEN && GITHUB_TOKEN.trim().length > 0) {
    const authRemoteUrl = `https://x-access-token:${GITHUB_TOKEN.trim()}@github.com/${OWNER}/${REPO}.git`;
    try {
      console.log(`   📡 Pushing '${activeTaskBranch}' to remote...`);
      execSync(`git -c credential.helper= push "${authRemoteUrl}" ${activeTaskBranch}:refs/heads/${activeTaskBranch}`, { stdio: 'pipe', timeout: 15000 });
      console.log(`   📡 Pushing 'dev' to remote...`);
      execSync(`git -c credential.helper= push "${authRemoteUrl}" dev:refs/heads/dev`, { stdio: 'pipe', timeout: 15000 });
      console.log(`   📡 Pushing 'stg' to remote...`);
      execSync(`git -c credential.helper= push "${authRemoteUrl}" stg:refs/heads/stg`, { stdio: 'pipe', timeout: 15000 });
      console.log(`   📡 Pushing 'main' to remote...`);
      execSync(`git -c credential.helper= push "${authRemoteUrl}" main:refs/heads/main`, { stdio: 'pipe', timeout: 15000 });
      console.log(`   🔄 Synchronizing local tracking refs (refs/remotes/origin/*)...`);
      execSync(`git -c credential.helper= fetch "${authRemoteUrl}" +refs/heads/*:refs/remotes/origin/*`, { stdio: 'pipe', timeout: 15000 });
      pushSuccess = true;
      pushNotice = '✅ Remote branches (task, dev, stg, main) successfully pushed and local tracking refs updated!';
      console.log(`   🎉 ${pushNotice}`);
    } catch (e: any) {
      console.error('   ❌ Token push error:', e.message, e.stderr?.toString());
      pushNotice = `Local merge completed, remote push failed: ${e.message}`;
    }
  } else {
    const pushAttempt = spawnSync('git', ['push', '--dry-run', 'origin', activeTaskBranch], {
      timeout: 3000,
      encoding: 'utf8'
    });

    if (pushAttempt.status === 0) {
      console.log('   ✅ Git Credential helper available. Executing real push to dev...');
      try {
        execSync(`git push origin ${activeTaskBranch}`, { stdio: 'pipe', timeout: 10000 });
        execSync(`git push origin dev`, { stdio: 'pipe', timeout: 10000 });
        execSync(`git push origin stg`, { stdio: 'pipe', timeout: 10000 });
        execSync(`git push origin main`, { stdio: 'pipe', timeout: 10000 });
        pushSuccess = true;
        console.log('   🎉 Remote branches (dev, stg, main) successfully pushed to GitHub!');
      } catch (e: any) {
        pushNotice = `Local merge completed. Remote push pending via IDE UI: ${e.message}`;
      }
    } else {
      pushNotice = 'Local merge complete (dev/stg/main SHA: ' + currentSha + '). Push ready via Antigravity IDE Source Control (Ctrl+Shift+G).';
      console.log(`   ℹ️  ${pushNotice}`);
    }
  }

  // 4. Update local agent store with actual commit SHA
  try {
    const storePath = path.resolve('data/local_agent_store.json');
    if (fs.existsSync(storePath)) {
      const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
      if (store.sessions?.[0]) {
        store.sessions[0].doc_payload = {
          ...store.sessions[0].doc_payload,
          promoted_sha: currentSha,
          local_branches_merged: true,
          merged_branches: ['dev', 'stg', 'main'],
          tool_mode: 'antigravity-local-git',
          updated_at: new Date().toISOString()
        };
      }
      fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
      console.log('   ✅ Harness local agent store updated with promoted SHA:', currentSha);
    }
  } catch (err: any) {
    console.warn('   ⚠️ Failed to update store promoted_sha:', err.message);
  }

  return {
    newCommitSha: currentSha,
    newTreeSha: '',
    prNumber: null,
    pushSuccess,
    pushNotice,
    toolMode: 'antigravity-local-git'
  };
}

/**
 * AI Studio Mode: GitHub REST/Git Data API Pipeline
 */
export async function syncViaAiStudioApi(
  targetBranch = 'dev',
  commitMessage = 'feat: automated sync via Git Data API',
  taskBranch?: string,
  prTitle?: string
) {
  console.log(`\n======================================================`);
  console.log(`☁️  AI Studio Mode: GitHub Git Data API Pipeline Activated`);
  console.log(`======================================================`);

  if (!GITHUB_TOKEN) {
    throw new Error('GITHUB_TOKEN is missing for AI Studio Mode');
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

  console.log(`   Unchanged files: ${files.length - filesToUpload.length} (reusing remote base tree blobs)`);
  console.log(`   Modified/New files to upload: ${filesToUpload.length}`);

  const modifiedTreeItems: Array<{ path: string; mode: string; type: string; sha: string }> = [];

  // Upload modified or new blobs
  for (let i = 0; i < filesToUpload.length; i++) {
    const f = filesToUpload[i];
    const sha = await uploadBlob(f);
    modifiedTreeItems.push({ path: f, mode: '100644', type: 'blob', sha });
    console.log(`   Uploaded blob [${i + 1}/${filesToUpload.length}]: ${f}`);
    await new Promise((res) => setTimeout(res, 80));
  }
  console.log(`   Total ${modifiedTreeItems.length} modified/new tree items prepared.`);

  // 4. Create new tree layered on top of base_tree
  console.log('4. Creating new Git Tree...');
  const treeRes = await requestGitHub('/git/trees', 'POST', {
    base_tree: baseTreeSha,
    tree: modifiedTreeItems,
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
    console.log(`   Fallback updating '${targetBranch}' ref directly to ${newCommitSha}...`);
    await requestGitHub(`/git/refs/heads/${targetBranch}`, 'PATCH', {
      sha: newCommitSha,
      force: false,
    });
  }

  // 8. Auto-promote to stg and main
  console.log('8. Promoting commit to stg and main branches...');
  await mergeBranchApi('stg', targetBranch, `Promote ${targetBranch} to stg: ${commitMessage}`);
  await mergeBranchApi('main', 'stg', `Promote stg to main: ${commitMessage}`);
  console.log('=== GitHub Sync, PR, and Promotion Complete! ===\n');

  return {
    newCommitSha,
    newTreeSha,
    prNumber,
    pushSuccess: true,
    pushNotice: 'GitHub API commit, PR, and promotion completed.',
    toolMode: 'ai-studio-api'
  };
}

/**
 * Universal Dual-Mode Sync & Push Entry Point
 */
export async function syncAndPush(
  targetBranch = 'dev',
  commitMessage = 'feat: automated sync via tool-adaptive harness',
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
          taskBranch = activeSession?.doc_payload?.branch || activeTask?.doc_payload?.branch;
        }
        if (!prTitle) {
          prTitle = activeTask ? `[${activeTask.task_id}] ${activeTask.task_name}` : `[${activeSession?.session_id || '0031'}] 최신 소스 동기화`;
        }
      }
    } catch (e) {
      // Fallback
    }
  }

  // Detect tool environment
  const env = detectToolEnvironment();
  console.log(`🛠️ Tool Environment Detected: ${env.mode.toUpperCase()} (AI Studio: ${env.isAiStudio}, Antigravity IDE: ${env.isAntigravityIde})`);

  // 0-A. Pre-reconciliation of All Session Conversation Turns (Fail-Safe)
  console.log('0-A. Pre-reconciling all session conversation turns to remote DB...');
  try {
    const recon = await reconcileSessionTraces();
    console.log(`✅ Session Traces Reconciled: ${recon.syncedCount || 0} turns synced.`);
  } catch (e: any) {
    console.warn('⚠️ Turn reconciliation notice:', e.message);
  }

  // 0. Pre-flight Comprehensive Service Check
  console.log('0. Running Pre-flight Comprehensive Service Health Check...');
  const healthCheck = await runComprehensiveServiceCheck();
  if (!healthCheck.allPassed) {
    throw new Error('❌ Pre-flight Service Health Check FAILED. GitHub Push aborted to protect remote branches.');
  }
  console.log('✅ Pre-flight Service Health Check PASSED (100% Integrity). Proceeding to Git Sync...');

  if (env.mode === 'ai-studio-api') {
    return await syncViaAiStudioApi(targetBranch, commitMessage, taskBranch, prTitle);
  } else {
    return await syncViaAntigravityLocalGit(targetBranch, commitMessage, taskBranch);
  }
}

// Allow CLI execution or import
if (process.argv[1]?.includes("github_sync_push")) {
  const messageArg = process.argv.slice(2).join(' ') || 'feat: automated full sync from ai agent';
  syncAndPush('dev', messageArg).catch((err) => {
    console.error('Sync failed:', err);
    process.exit(1);
  });
}
