import '../src/shared/envLoader';
import https from 'https';
import fs from 'fs';

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
  console.log('--- 1. Compare commit between local container base and dev (9ff34e0a097b8cdc853f9ed459cd3a500cf9091e) ---');
  
  // Let's check files changed in commit b5d87a170fe6ecdb311dd9f3878138c616a23120
  const commitRes = await requestGitHub('/commits/b5d87a170fe6ecdb311dd9f3878138c616a23120');
  console.log('Files in b5d87a170fe6ecdb311dd9f3878138c616a23120:', commitRes.body.files?.length);
  (commitRes.body.files || []).slice(0, 30).forEach((f: any) => {
    const existsLocally = fs.existsSync(f.filename);
    console.log(`- [${f.status}] ${f.filename} (local exists: ${existsLocally})`);
  });

  // Let's check if docs/13.회고/13-16_SESSION-261002-0020_세션종합_KPT_회고록.md exists on GitHub
  const fileCheck = await requestGitHub('/contents/docs/13.회고/13-16_SESSION-261002-0020_세션종합_KPT_회고록.md?ref=dev');
  console.log('\nRetrospective doc on remote dev status:', fileCheck.status);

  // Let's check git tree of dev branch
  const devCommit = await requestGitHub('/commits/9ff34e0a097b8cdc853f9ed459cd3a500cf9091e');
  console.log('Dev commit tree sha:', devCommit.body.commit?.tree?.sha);
}

main().catch(console.error);
