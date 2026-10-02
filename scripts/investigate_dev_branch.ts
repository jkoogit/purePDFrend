import '../src/shared/envLoader';
import https from 'https';

const OWNER = 'jkoogit';
const REPO = 'purePDFrend';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

function requestGitHub<T = any>(endpoint: string, method = 'GET', data?: any): Promise<{ status: number; body: T }> {
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
  console.log('--- 1. Check commit b5d87a170fe6ecdb311dd9f3878138c616a23120 ---');
  const targetCommit = 'b5d87a170fe6ecdb311dd9f3878138c616a23120';
  const commitRes = await requestGitHub(`/commits/${targetCommit}`);
  console.log(`Commit ${targetCommit} status:`, commitRes.status);
  if (commitRes.status === 200) {
    console.log('Author:', commitRes.body.commit?.author);
    console.log('Message:', commitRes.body.commit?.message);
    console.log('Date:', commitRes.body.commit?.author?.date);
  }

  console.log('\n--- 2. List all branches on remote ---');
  const branchesRes = await requestGitHub('/branches');
  console.log('Branches count:', branchesRes.body?.length);
  (branchesRes.body || []).forEach((b: any) => {
    console.log(`- ${b.name}: ${b.commit?.sha}`);
  });

  console.log('\n--- 3. Recent commits on dev ---');
  const devCommits = await requestGitHub('/commits?sha=dev&per_page=5');
  (devCommits.body || []).forEach((c: any) => {
    console.log(`- dev commit ${c.sha.substring(0, 10)}: ${c.commit?.message?.split('\n')[0]}`);
  });

  console.log('\n--- 4. List all git refs ---');
  const refsRes = await requestGitHub('/git/matching-refs/heads');
  (refsRes.body || []).forEach((r: any) => {
    console.log(`- ${r.ref}: ${r.object?.sha}`);
  });
}

main().catch(console.error);
