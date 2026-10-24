import '../src/shared/envLoader';
import https from 'https';
import { syncViaAiStudioApi } from './github_sync_push';

const OWNER = 'jkoogit';
const REPO = 'purePDFrend';
const GITHUB_TOKEN = (process.env.GITHUB_TOKEN || '').trim();

function updateRef(branch: string, sha: string): Promise<any> {
  return new Promise((resolve) => {
    const payload = JSON.stringify({ sha, force: true });
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
          resolve({ branch, status: res.statusCode, data: JSON.parse(d) });
        } catch {
          resolve({ branch, status: res.statusCode, raw: d });
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

async function main() {
  console.log('=== 1. Executing Git Data API Sync for SESSION-0035 Finalization ===');
  const taskBranch = 'task/0035_01_admin_p5_api_pdf_viewer_Gemini';
  const commitMsg = 'docs(harness): finalize SESSION-0035 with retrospective 13-28 and turn 10 trace';
  const prTitle = '[SESSION-0035] 세션 마감 종합 회고록 13-28 및 턴 10 영속화';

  const syncResult = await syncViaAiStudioApi('dev', commitMsg, taskBranch, prTitle);
  console.log('✅ Sync result:', syncResult);

  console.log('=== 2. Fetching latest dev SHA ===');
  const devBranch = await getBranch('dev');
  const latestDevSha = devBranch.sha;
  console.log('Latest dev SHA:', latestDevSha);

  console.log('=== 3. Fast-forward updating stg and main refs ===');
  const stgRes = await updateRef('stg', latestDevSha);
  console.log('stg updated:', stgRes.status, latestDevSha);

  const mainRes = await updateRef('main', latestDevSha);
  console.log('main updated:', mainRes.status, latestDevSha);

  const [d, s, m] = await Promise.all([
    getBranch('dev'),
    getBranch('stg'),
    getBranch('main')
  ]);

  console.log('=== Final Branch Parity ===');
  console.log(`dev:  ${d.sha}`);
  console.log(`stg:  ${s.sha}`);
  console.log(`main: ${m.sha}`);
  console.log(`Match: ${d.sha === s.sha && s.sha === m.sha}`);
}

main().catch(console.error);
