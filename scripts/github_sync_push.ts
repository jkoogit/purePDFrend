import fs from 'fs';
import path from 'path';
import https from 'https';

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

  // 3. Scan local files
  console.log('2. Scanning local files to track...');
  const files = getAllFiles(process.cwd());
  console.log(`   Found ${files.length} files to synchronize.`);

  // 4. Upload blobs in chunks of 10
  console.log('3. Uploading blobs to GitHub Git Database...');
  const treeItems: Array<{ path: string; mode: string; type: string; sha: string }> = [];
  const chunkSize = 10;
  for (let i = 0; i < files.length; i += chunkSize) {
    const chunk = files.slice(i, i + chunkSize);
    const results = await Promise.all(
      chunk.map(async (f) => {
        const sha = await uploadBlob(f);
        return { path: f, mode: '100644', type: 'blob', sha };
      })
    );
    treeItems.push(...results);
    process.stdout.write(`   Uploaded ${Math.min(i + chunkSize, files.length)} / ${files.length} blobs...\r`);
  }
  console.log(`\n   All ${treeItems.length} blobs successfully uploaded.`);

  // 5. Create new tree
  console.log('4. Creating new Git Tree...');
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

  // 8. Auto-promote to stg and main
  console.log('7. Promoting commit to stg and main branches...');
  await mergeBranch('stg', targetBranch, `Promote ${targetBranch} to stg: ${commitMessage}`);
  await mergeBranch('main', 'stg', `Promote stg to main: ${commitMessage}`);

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
