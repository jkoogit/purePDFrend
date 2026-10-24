import '../src/shared/envLoader';
import { execSync } from 'child_process';
import https from 'https';
import { syncViaAiStudioApi } from './github_sync_push';

const OWNER = 'jkoogit';
const REPO = 'purePDFrend';
const GITHUB_TOKEN = (process.env.GITHUB_TOKEN || '').trim();
const authRemoteUrl = `https://x-access-token:${GITHUB_TOKEN}@github.com/${OWNER}/${REPO}.git`;

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
  console.log('=== 1. Commit any local uncommitted files ===');
  try {
    execSync('git add -A', { stdio: 'inherit' });
    const status = execSync('git status --porcelain').toString();
    if (status.trim().length > 0) {
      execSync('git commit -m "docs(trace): record turn 0035-11 session prompt trace and finalize local store"', { stdio: 'inherit' });
      console.log('   Local commit created.');
    } else {
      console.log('   Local working tree already committed.');
    }
  } catch (e: any) {
    console.warn('   Local commit note:', e.message);
  }

  console.log('=== 2. Syncing all files to remote dev via Git Data API ===');
  const taskBranch = 'task/0035_01_admin_p5_api_pdf_viewer_Gemini';
  const commitMsg = 'docs(trace): record turn 0035-11 trace and clean final workspace';
  const prTitle = '[SESSION-0035] 턴 11 세션프롬프트 영속화 및 최종 작업공간 완전 정리';

  const syncResult = await syncViaAiStudioApi('dev', commitMsg, taskBranch, prTitle);
  console.log('   Git Data API Sync Result:', syncResult);

  console.log('=== 3. Getting latest dev SHA on remote ===');
  const devBranch = await getBranch('dev');
  const latestDevSha = devBranch.sha;
  console.log('   Latest dev branch SHA:', latestDevSha);

  console.log('=== 4. Updating remote stg and main to latestDevSha ===');
  const stgRes = await updateRef('stg', latestDevSha);
  console.log('   stg updated:', stgRes.status, latestDevSha);
  const mainRes = await updateRef('main', latestDevSha);
  console.log('   main updated:', mainRes.status, latestDevSha);

  console.log('=== 5. Fetching latest remote branches to local git ===');
  execSync(`git -c credential.helper= fetch "${authRemoteUrl}" +refs/heads/*:refs/remotes/origin/*`, { stdio: 'inherit' });

  console.log('=== 6. Aligning local dev, stg, main, and task branches ===');
  execSync('git checkout dev', { stdio: 'inherit' });
  execSync('git reset --hard origin/dev', { stdio: 'inherit' });
  execSync('git branch -f stg origin/stg', { stdio: 'inherit' });
  execSync('git branch -f main origin/main', { stdio: 'inherit' });
  execSync(`git branch -f ${taskBranch} origin/dev`, { stdio: 'inherit' });

  console.log('=== 7. Final Verification ===');
  const [d, s, m] = await Promise.all([
    getBranch('dev'),
    getBranch('stg'),
    getBranch('main')
  ]);

  const localDevSha = execSync('git rev-parse dev', { encoding: 'utf8' }).trim();
  const localStgSha = execSync('git rev-parse stg', { encoding: 'utf8' }).trim();
  const localMainSha = execSync('git rev-parse main', { encoding: 'utf8' }).trim();
  const gitStatusOutput = execSync('git status', { encoding: 'utf8' });

  console.log(`Remote: dev=${d.sha}, stg=${s.sha}, main=${m.sha}`);
  console.log(`Local:  dev=${localDevSha}, stg=${localStgSha}, main=${localMainSha}`);
  console.log(`Remote Match: ${d.sha === s.sha && s.sha === m.sha}`);
  console.log(`Local Match:  ${localDevSha === localStgSha && localStgSha === localMainSha}`);
  console.log(`Local/Remote Parity: ${localDevSha === d.sha}`);
  console.log(`Working Tree:\n${gitStatusOutput}`);
}

main().catch(console.error);
