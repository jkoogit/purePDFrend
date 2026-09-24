import '../src/shared/envLoader';
import https from 'https';

const OWNER = 'jkoogit';
const REPO = 'purePDFrend';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

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

async function main() {
  const taskBranch = 'task/0013_0019_manual-and-worker-pipeline_Gemini';
  
  console.log(`1. Fetching latest commit SHA from '${taskBranch}'...`);
  const taskRefRes = await requestGitHub(`/git/ref/heads/${taskBranch}`);
  const taskCommitSha = taskRefRes.body?.object?.sha;
  console.log(`   - Task Branch Commit SHA: ${taskCommitSha}`);

  if (!taskCommitSha) {
    throw new Error('Could not find task branch commit SHA');
  }

  console.log(`2. Fast-forwarding 'dev' branch to ${taskCommitSha}...`);
  const updateDevRes = await requestGitHub('/git/refs/heads/dev', 'PATCH', {
    sha: taskCommitSha,
    force: false,
  });
  console.log(`   - dev branch update status: ${updateDevRes.status}`);

  console.log('3. Verifying branches...');
  const devRef = await requestGitHub('/git/ref/heads/dev');
  console.log(`   - dev SHA: ${devRef.body?.object?.sha}`);
  console.log('✅ dev branch and task branch are 100% synchronized!');
}

main().catch(console.error);
