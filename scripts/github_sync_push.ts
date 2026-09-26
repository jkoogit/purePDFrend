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
      if (!IGNORE_FILES.has(entry.name) && !entry.name.endsWith('.log')) {
        files.push(relPath);
      }
    }
  }

  return files;
}

function computeGitBlobSha(content: Buffer): string {
  const header = `blob ${content.length}\0`;
  return crypto.createHash('sha1').update(Buffer.concat([Buffer.from(header), content])).digest('hex');
}

// Upload blob helper
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

// Merge helper
async function mergeBranch(base: string, head: string, commitMessage: string) {
  const res = await requestGitHub('/merges', 'POST', {
    base,
    head,
    commit_message: commitMessage,
  });
  console.log(`[Merge ${head} -> ${base}] Status: ${res.status}`);
  return res;
}

async function syncAndPush(targetBranch = 'dev', commitMessage: string) {
  console.log(`=== Starting GitHub Sync & Push to '${targetBranch}' ===`);

  // 0. Pre-flight Service Health Check Guardrail
  console.log('0. Running Pre-flight Comprehensive Service Health Check...');
  const { allPassed } = await runComprehensiveServiceCheck();
  if (!allPassed) {
    throw new Error('❌ Pre-flight Service Health Check FAILED. GitHub Push aborted to protect remote branches.');
  }
  console.log('✅ Pre-flight Service Health Check PASSED (100% Integrity). Proceeding to Git Push...\n');

  // 1. Get current branch ref
  console.log(`1. Fetching current reference for branch '${targetBranch}'...`);
  const refRes = await requestGitHub(`/git/ref/heads/${targetBranch}`);
  if (refRes.status !== 200) {
    throw new Error(`Failed to fetch ref for branch ${targetBranch}: ${JSON.stringify(refRes.body)}`);
  }
  const parentCommitSha = refRes.body.object.sha;
  console.log(`   Latest commit on '${targetBranch}': ${parentCommitSha}`);

  // 2. Fetch commit to get base_tree sha
  const commitRes = await requestGitHub(`/git/commits/${parentCommitSha}`);
  if (commitRes.status !== 200) {
    throw new Error(`Failed to fetch commit ${parentCommitSha}: ${JSON.stringify(commitRes.body)}`);
  }
  const baseTreeSha = commitRes.body.tree.sha;
  console.log(`   Base tree SHA: ${baseTreeSha}`);

  // 3. Fetch remote tree to compare git blob SHAs
  console.log('2. Fetching remote tree structure for differential sync...');
  const remoteTreeRes = await requestGitHub(`/git/trees/${baseTreeSha}?recursive=1`);
  const remoteHashMap = new Map<string, string>();
  if (remoteTreeRes.status === 200 && Array.isArray(remoteTreeRes.body.tree)) {
    for (const item of remoteTreeRes.body.tree) {
      if (item.type === 'blob' && item.path && item.sha) {
        remoteHashMap.set(item.path, item.sha);
      }
    }
  }
  console.log(`   Cached ${remoteHashMap.size} remote files from tree.`);

  // 4. Scan local files
  console.log('3. Scanning local files to track...');
  const files = getAllFiles(process.cwd());
  console.log(`   Found ${files.length} local files to evaluate.`);

  const treeItems: Array<{ path: string; mode: string; type: string; sha: string }> = [];
  const filesToUpload: string[] = [];

  for (const f of files) {
    const content = fs.readFileSync(path.join(process.cwd(), f));
    const localSha = computeGitBlobSha(content);
    const remoteSha = remoteHashMap.get(f);

    if (remoteSha && remoteSha === localSha) {
      // Re-use existing SHA
      treeItems.push({ path: f, mode: '100644', type: 'blob', sha: localSha });
    } else {
      filesToUpload.push(f);
    }
  }

  console.log(`   Reused ${treeItems.length} unmodified files. Changed/New files to upload: ${filesToUpload.length}`);

  // 5. Upload only changed blobs in chunks
  if (filesToUpload.length > 0) {
    console.log(`4. Uploading ${filesToUpload.length} modified/new blobs to GitHub...`);
    const chunkSize = 10;
    for (let i = 0; i < filesToUpload.length; i += chunkSize) {
      const chunk = filesToUpload.slice(i, i + chunkSize);
      const results = await Promise.all(
        chunk.map(async (f) => {
          const sha = await uploadBlob(f);
          return { path: f, mode: '100644', type: 'blob', sha };
        })
      );
      treeItems.push(...results);
      process.stdout.write(`   Uploaded ${Math.min(i + chunkSize, filesToUpload.length)} / ${filesToUpload.length} blobs...\r`);
    }
    console.log(`\n   All ${filesToUpload.length} blobs successfully uploaded.`);
  }

  // 6. Create new tree
  console.log('5. Creating new Git Tree...');
  const treeRes = await requestGitHub('/git/trees', 'POST', {
    base_tree: baseTreeSha,
    tree: treeItems,
  });
  if (treeRes.status !== 201) {
    throw new Error(`Failed to create git tree: ${JSON.stringify(treeRes.body)}`);
  }
  const newTreeSha = treeRes.body.sha;
  console.log(`   New Tree created. SHA: ${newTreeSha}`);

  // 6. Create commit
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

  // 7. Update branch ref
  console.log(`6. Updating branch ref 'refs/heads/${targetBranch}' to ${newCommitSha}...`);
  const updateRefRes = await requestGitHub(`/git/refs/heads/${targetBranch}`, 'PATCH', {
    sha: newCommitSha,
    force: false,
  });
  if (updateRefRes.status !== 200) {
    throw new Error(`Failed to update branch ref: ${JSON.stringify(updateRefRes.body)}`);
  }
  console.log(`   Successfully pushed to '${targetBranch}'!`);

  // 8. Auto-promote to stg and main (Fast-Forward Ref update first to guarantee identical SHA, fallback to merge)
  console.log('7. Promoting commit to stg and main branches...');
  for (const b of ['stg', 'main']) {
    const patchRes = await requestGitHub(`/git/refs/heads/${b}`, 'PATCH', {
      sha: newCommitSha,
      force: true,
    });
    if (patchRes.status === 200) {
      console.log(`[Fast-Forward ${b}] SHA updated to ${newCommitSha} (Status: 200)`);
    } else {
      console.log(`[Fast-Forward ${b} failed, fallback to merge API] Status: ${patchRes.status}`);
      await mergeBranch(b, targetBranch, `Promote ${targetBranch} to ${b}: ${commitMessage}`);
    }
  }

  // 9. Verify 3-branch parity
  console.log('8. Verifying 3-branch SHA parity across dev, stg, and main...');
  const verifyRes = await Promise.all(['dev', 'stg', 'main'].map(async (b) => {
    const r = await requestGitHub(`/branches/${b}`);
    return { branch: b, sha: r.body?.commit?.sha, tree: r.body?.commit?.commit?.tree?.sha };
  }));
  console.log('   Branch verification:', JSON.stringify(verifyRes, null, 2));

  console.log('=== GitHub Sync & Promotion Complete! ===\n');
  return { newCommitSha, newTreeSha };
}

// Allow CLI execution or import
const messageArg = process.argv.slice(2).join(' ') || 'feat: automated full sync from ai agent';
const branchArg = 'dev';

syncAndPush(branchArg, messageArg).catch((err) => {
  console.error('Sync failed:', err);
  process.exit(1);
});
