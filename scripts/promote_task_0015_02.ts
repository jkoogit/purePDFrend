import https from 'https';
import fs from 'fs';

const DB_BRIDGE_URL = 'https://ptype.pdfrend.com';
const DB_BRIDGE_SECRET = 'jkadh-secure-secret-token-2026';
const TARGET_DATABASE = 'purepdfrend_dev';

function executeSql(sql: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ database: TARGET_DATABASE, sql });
    const req = https.request(DB_BRIDGE_URL + '/api/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-JKADH-SECRET': DB_BRIDGE_SECRET,
        'Authorization': 'Bearer ' + DB_BRIDGE_SECRET,
        'Content-Length': Buffer.byteLength(payload),
      },
      rejectUnauthorized: false,
      timeout: 20000,
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch (e) { resolve({ error: body }); }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function main() {
  console.log('=== Promoting TASK-0015-02 to COMPLETED ===');

  // 1. Update local store
  const storePath = 'data/local_agent_store.json';
  const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));

  store.tasks = store.tasks.map((t: any) => {
    if (t.task_id === 'TASK-0015-02') {
      return {
        ...t,
        status_cd: '완료',
        ended_at: new Date().toISOString(),
        updated_sys: 'agent-harness',
        updated_by: 'system',
        version: (t.version || 1) + 1
      };
    }
    return t;
  });

  store.loops = store.loops.map((l: any) => {
    if (l.task_id === 'TASK-0015-02') {
      return {
        ...l,
        status_cd: '완료',
        ended_at: new Date().toISOString(),
        updated_sys: 'agent-harness',
        updated_by: 'system',
        version: (l.version || 1) + 1
      };
    }
    return l;
  });

  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
  console.log('Local store updated to COMPLETED.');

  // 2. Update DB
  const sql = `
    UPDATE aiagent.harness_task_meta
    SET status_cd = '완료',
        ended_at = now(),
        updated_at = now(),
        version = version + 1
    WHERE task_id = 'TASK-0015-02';

    UPDATE aiagent.harness_loop_meta
    SET status_cd = '완료',
        ended_at = now(),
        updated_at = now(),
        version = version + 1
    WHERE task_id = 'TASK-0015-02';
  `;

  const dbRes = await executeSql(sql);
  console.log('DB promotion status:', dbRes.success !== false ? 'SUCCESS' : dbRes.error);
}

main().catch(console.error);
