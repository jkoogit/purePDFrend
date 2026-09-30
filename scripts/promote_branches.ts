import '../src/shared/envLoader';
import https from 'https';

const OWNER = 'jkoogit';
const REPO = 'purePDFrend';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

function postMerge(base: string, head: string): Promise<any> {
  return new Promise((resolve) => {
    const payload = JSON.stringify({
      base,
      head,
      commit_message: `[Promotion] Merge ${head} into ${base} (100% Parity Alignment)`,
    });
    const req = https.request(`https://api.github.com/repos/${OWNER}/${REPO}/merges`, {
      method: 'POST',
      headers: {
        'User-Agent': 'NodeJS',
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(d) });
        } catch {
          resolve({ status: res.statusCode, raw: d });
        }
      });
    });
    req.write(payload);
    req.end();
  });
}

function getBranch(branch: string): Promise<any> {
  return new Promise((resolve) => {
    https.get(`https://api.github.com/repos/${OWNER}/${REPO}/branches/${branch}`, {
      headers: {
        'User-Agent': 'NodeJS',
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(d);
          resolve({ branch, sha: json.commit?.sha || json.message });
        } catch (e) {
          resolve({ branch, error: d });
        }
      });
    });
  });
}

function updateRef(branch: string, sha: string): Promise<any> {
  return new Promise((resolve) => {
    const payload = JSON.stringify({
      sha,
      force: true,
    });
    const req = https.request(`https://api.github.com/repos/${OWNER}/${REPO}/git/refs/heads/${branch}`, {
      method: 'PATCH',
      headers: {
        'User-Agent': 'NodeJS',
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(d) });
        } catch {
          resolve({ status: res.statusCode, raw: d });
        }
      });
    });
    req.write(payload);
    req.end();
  });
}

async function promote() {
  console.log('1. Fetching dev SHA...');
  const bDev = await getBranch('dev');
  const targetSha = bDev.sha;
  console.log('Target dev SHA:', targetSha);

  console.log('2. Syncing stg ref to targetSha...');
  const u1 = await updateRef('stg', targetSha);
  console.log('stg ref update status:', u1.status);

  console.log('3. Syncing main ref to targetSha...');
  const u2 = await updateRef('main', targetSha);
  console.log('main ref update status:', u2.status);

  console.log('4. Verifying 3-way branch SHAs...');
  const [chkDev, chkStg, chkMain] = await Promise.all([
    getBranch('dev'),
    getBranch('stg'),
    getBranch('main')
  ]);
  console.log('Dev Branch Commit :', chkDev.sha);
  console.log('Stg Branch Commit :', chkStg.sha);
  console.log('Main Branch Commit:', chkMain.sha);
  const match = chkDev.sha === chkStg.sha && chkStg.sha === chkMain.sha;
  console.log('All 3 Branches Match 100%:', match);
}

promote().catch(console.error);

