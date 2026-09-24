/**
 * @file scripts/promote_task_02_and_sync.ts
 * @description TASK-260924-0012-02 태스크 상태를 '완료'로 최종 승급하고 local_agent_store.json 및 DB 반영
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import '../src/shared/envLoader';

const DB_BRIDGE_URL = 'https://ptype.pdfrend.com';
const DB_BRIDGE_SECRET = 'jkadh-secure-secret-token-2026';
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
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch {
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function main() {
  console.log('=== [Harness] TASK-260924-0012-02 태스크 상태 \'완료\' 승급 시작 ===');

  const localStorePath = path.resolve('data/local_agent_store.json');
  let store: any = { sessions: [], tasks: [], loops: [], traces: [] };
  if (fs.existsSync(localStorePath)) {
    store = JSON.parse(fs.readFileSync(localStorePath, 'utf8'));
  }

  const now = new Date().toISOString();
  const taskId = 'TASK-260924-0012-02';

  // 로컬 스토어 갱신
  if (store.tasks) {
    const task = store.tasks.find((t: any) => t.task_id === taskId);
    if (task) {
      task.status_cd = '완료';
      task.ended_at = now;
      task.updated_at = now;
      task.version = (task.version || 1) + 1;
    }
  }

  fs.writeFileSync(localStorePath, JSON.stringify(store, null, 2), 'utf8');
  console.log('✅ local_agent_store.json 태스크 02 상태 \'완료\' 승급 반영');

  // DB 갱신
  try {
    const sql = `
      UPDATE aiagent.harness_task_meta
      SET status_cd = '완료',
          ended_at = '${now}',
          updated_at = NOW(),
          version = version + 1
      WHERE task_id = '${taskId}';
    `;
    const res = await executeSql(sql);
    console.log('✅ HTTPS DB Bridge aiagent.harness_task_meta 태스크 02 상태 \'완료\' 승급:', JSON.stringify(res));
  } catch (err: any) {
    console.warn('⚠️ DB 승급 반영 주의:', err.message);
  }

  console.log('=== [Harness] 태스크 02 승급 완결 ===');
}

main().catch(console.error);
