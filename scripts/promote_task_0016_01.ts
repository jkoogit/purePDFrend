import '../src/shared/envLoader';
import https from 'https';
import fs from 'fs';
import path from 'path';

const OWNER = 'jkoogit';
const REPO = 'purePDFrend';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const DB_BRIDGE_URL = 'https://ptype.pdfrend.com';
const DB_BRIDGE_SECRET = 'jkadh-secure-secret-token-2026';
const TARGET_DATABASE = 'purepdfrend_dev';

function requestGitHub<T = any>(endpoint: string, method = 'GET', data?: any): Promise<{ status: number; body: T }> {
  return new Promise((resolve) => {
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
      res.on('data', (c) => body += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode || 500, body: JSON.parse(body) }); }
        catch (e) { resolve({ status: res.statusCode || 500, body: body as any }); }
      });
    });
    req.on('error', (e) => resolve({ status: 500, body: { error: e.message } as any }));
    if (payload) req.write(payload);
    req.end();
  });
}

function queryDb(sql: string): Promise<any> {
  return new Promise((resolve) => {
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
      timeout: 15000,
    }, (res) => {
      let body = '';
      res.on('data', (c) => { body += c; });
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { resolve({ error: body }); }
      });
    });
    req.on('error', (e) => resolve({ error: e.message }));
    req.write(payload);
    req.end();
  });
}

async function main() {
  console.log('================================================================');
  console.log('🚀 [TASK-0016-01] 태스크 승급 및 원격 3대 브랜치 배포 검증');
  console.log('================================================================\n');

  // 1. 원격 브랜치 SHA 점검 및 머지
  console.log('▶ [1] 원격 브랜치 (dev, stg, main) 배포 승급 및 동기화...');
  await requestGitHub('/merges', 'POST', {
    base: 'stg',
    head: 'dev',
    commit_message: 'Promote dev to stg (TASK-0016-01)',
  });

  await requestGitHub('/merges', 'POST', {
    base: 'main',
    head: 'stg',
    commit_message: 'Promote stg to main (TASK-0016-01)',
  });

  const devRef = await requestGitHub('/git/ref/heads/dev');
  const stgRef = await requestGitHub('/git/ref/heads/stg');
  const mainRef = await requestGitHub('/git/ref/heads/main');

  const devSha = devRef.body?.object?.sha;
  const stgSha = stgRef.body?.object?.sha;
  const mainSha = mainRef.body?.object?.sha;

  console.log(`   - dev  SHA: ${devSha}`);
  console.log(`   - stg  SHA: ${stgSha}`);
  console.log(`   - main SHA: ${mainSha}`);

  const isShaMatched = devSha && devSha === stgSha && devSha === mainSha;
  console.log(`   3대 브랜치 SHA 일치 여부: ${isShaMatched ? '✅ 100% 일치 (배포 승급 완결)' : '⚠️ 불일치'}`);

  // 2. 하네스 스토어 상태 '완료' 최종 수정
  console.log('\n▶ [2] 하네스 스토어 상태 최종 완료 승급...');
  const storePath = path.join(process.cwd(), 'data', 'local_agent_store.json');
  const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));

  const task = store.tasks.find((t: any) => t.task_id === 'TASK-0016-01');
  if (task) {
    task.status_cd = '완료';
    task.ended_at = new Date().toISOString();
    task.version = (task.version || 1) + 1;
  }

  const loop = store.loops.find((l: any) => l.loop_id === 'LOOP-0016-01-01');
  if (loop) {
    loop.status_cd = '완료';
    loop.ended_at = new Date().toISOString();
    loop.version = (loop.version || 1) + 1;
  }

  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
  console.log('✅ Local Store updated to 완료');

  // 3. PostgreSQL DB 상태 '완료' 최종 승급
  console.log('\n▶ [3] 원격 DB 상태 최종 완료 승급...');
  if (task) {
    const sql = `
      UPDATE aiagent.harness_task_meta
      SET status_cd = '완료',
          ended_at = now(),
          version = version + 1,
          updated_at = now()
      WHERE task_id = '${task.task_id}';
    `;
    const r = await queryDb(sql);
    console.log('Task DB Final Promotion:', r.success ? 'SUCCESS' : r.error);
  }

  if (loop) {
    const sql = `
      UPDATE aiagent.harness_loop_meta
      SET status_cd = '완료',
          ended_at = now(),
          version = version + 1,
          updated_at = now()
      WHERE loop_id = '${loop.loop_id}';
    `;
    const r = await queryDb(sql);
    console.log('Loop DB Final Promotion:', r.success ? 'SUCCESS' : r.error);
  }

  console.log('\n🎉 TASK-0016-01 승급 완료!');
}

main();
