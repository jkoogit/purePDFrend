import '../src/shared/envLoader';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { reconcileSessionTraces } from './reconcile_session_traces';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const OWNER = 'jkoogit';
const REPO = 'purePDFrend';
const DB_BRIDGE_URL = process.env.REMOTE_DB_BRIDGE_URL || 'https://ptype.pdfrend.com';
const DB_BRIDGE_SECRET = process.env.REMOTE_DB_BRIDGE_SECRET || 'jkadh-secure-secret-token-2026';
const TARGET_DATABASE = 'purepdfrend_dev';

function executeSql(sql: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ database: TARGET_DATABASE, sql });
    const req = https.request(`${DB_BRIDGE_URL}/api/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-JKADH-SECRET': DB_BRIDGE_SECRET,
        'Authorization': `Bearer ${DB_BRIDGE_SECRET}`,
        'Content-Length': Buffer.byteLength(payload),
      },
      rejectUnauthorized: false,
      timeout: 20000,
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed.success) resolve(parsed);
          else reject(new Error(parsed.error || body));
        } catch (e) {
          reject(new Error(body));
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

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
          'Content-Length': Buffer.byteLength(payload)
        } : {})
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode || 200, body: parsed });
        } catch {
          resolve({ status: res.statusCode || 200, body: body as any });
        }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function main() {
  console.log('=== Step 1. Reconciling all session traces ===');
  const reconcileRes = await reconcileSessionTraces('SESSION-0026');
  console.log('Reconcile result:', reconcileRes);

  console.log('=== Step 2. Updating local store task to COMPLETED ===');
  const storePath = path.join(process.cwd(), 'data', 'local_agent_store.json');
  const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
  const task = store.tasks.find((t: any) => t.task_id === 'TASK-0026-02');
  if (task) {
    task.status = 'COMPLETED';
    task.status_cd = '완료';
    task.completed_at = new Date().toISOString();
    task.ended_at = new Date().toISOString();
  }
  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
  console.log('Local store task TASK-0026-02 updated to COMPLETED.');

  console.log('=== Step 3. Updating remote DB task status to COMPLETED ===');
  const updateTaskSql = `
    UPDATE aiagent.harness_task_meta
    SET status_cd = '완료', ended_at = NOW(), updated_at = NOW()
    WHERE task_id = 'TASK-0026-02';
  `;
  await executeSql(updateTaskSql);
  console.log('Remote DB task TASK-0026-02 updated to 완료.');

  console.log('=== Step 4. Checking and Promoting GitHub branches ===');
  const devBranch = await requestGitHub('/branches/dev');
  const devSha = devBranch.body?.commit?.sha;

  let stgBranch = await requestGitHub('/branches/stg');
  let stgSha = stgBranch.body?.commit?.sha;

  if (devSha && stgSha !== devSha) {
    console.log(`Promoting dev (${devSha}) -> stg...`);
    const mergeStg = await requestGitHub('/merges', 'POST', {
      base: 'stg',
      head: 'dev',
      commit_message: 'chore: promote dev to stg'
    });
    console.log('Merge dev -> stg status:', mergeStg.status);
    stgBranch = await requestGitHub('/branches/stg');
    stgSha = stgBranch.body?.commit?.sha;
  }

  let mainBranch = await requestGitHub('/branches/main');
  let mainSha = mainBranch.body?.commit?.sha;

  if (stgSha && mainSha !== stgSha) {
    console.log(`Promoting stg (${stgSha}) -> main...`);
    const mergeMain = await requestGitHub('/merges', 'POST', {
      base: 'main',
      head: 'stg',
      commit_message: 'chore: promote stg to main'
    });
    console.log('Merge stg -> main status:', mergeMain.status);
    mainBranch = await requestGitHub('/branches/main');
    mainSha = mainBranch.body?.commit?.sha;
  }

  console.log('Branch SHAs:', {
    dev: devSha,
    stg: stgSha,
    main: mainSha,
    allMatch: devSha === stgSha && stgSha === mainSha
  });
}

main().catch(err => {
  console.error('Promotion error:', err);
  process.exit(1);
});
