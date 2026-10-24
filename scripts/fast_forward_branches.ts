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
  console.log('1. Getting latest dev commit SHA...');
  const devRes = await requestGitHub('/git/ref/heads/dev');
  const devSha = devRes.body?.object?.sha;
  console.log('   Dev SHA:', devSha);

  if (!devSha) throw new Error('Cannot get dev SHA');

  console.log(`2. Fast-forwarding stg branch to ${devSha}...`);
  const stgRes = await requestGitHub('/git/refs/heads/stg', 'PATCH', {
    sha: devSha,
    force: true,
  });
  console.log('   stg update status:', stgRes.status);

  console.log(`3. Fast-forwarding main branch to ${devSha}...`);
  const mainRes = await requestGitHub('/git/refs/heads/main', 'PATCH', {
    sha: devSha,
    force: true,
  });
  console.log('   main update status:', mainRes.status);

  const [bDev, bStg, bMain] = await Promise.all([
    requestGitHub('/branches/dev'),
    requestGitHub('/branches/stg'),
    requestGitHub('/branches/main'),
  ]);

  console.log('Final branch verification:');
  console.log('dev :', bDev.body?.commit?.sha);
  console.log('stg :', bStg.body?.commit?.sha);
  console.log('main:', bMain.body?.commit?.sha);
  const allMatch = bDev.body?.commit?.sha === bStg.body?.commit?.sha && bStg.body?.commit?.sha === bMain.body?.commit?.sha;
  console.log('All 3 branches match 100%:', allMatch);
}

main().catch(console.error);
