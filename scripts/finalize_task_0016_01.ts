import '../src/shared/envLoader';
import https from 'https';
import fs from 'fs';
import path from 'path';

const DB_BRIDGE_URL = 'https://ptype.pdfrend.com';
const DB_BRIDGE_SECRET = 'jkadh-secure-secret-token-2026';
const TARGET_DATABASE = 'purepdfrend_dev';

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
  const storePath = path.join(process.cwd(), 'data', 'local_agent_store.json');
  const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));

  // 1. 태스크 & 루프 상태 '정리완료'로 변경
  const task = store.tasks[0];
  if (task) {
    task.status_cd = '정리완료';
    task.doc_payload.review_doc = 'docs/10.리뷰/260927_030_전수_목록_화면_UI정책_일괄적용_및_비LLM_긴급백업_복구_리뷰.md';
    task.version = (task.version || 1) + 1;
  }

  const loop = store.loops[0];
  if (loop) {
    loop.status_cd = '정리완료';
    loop.ended_at = new Date().toISOString();
    loop.version = (loop.version || 1) + 1;
  }

  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
  console.log('✅ Local Store updated to 정리완료');

  // 2. DB 업데이트
  if (task) {
    const sql = `
      UPDATE aiagent.harness_task_meta
      SET status_cd = '정리완료',
          doc_payload = '${JSON.stringify(task.doc_payload).replace(/'/g, "''")}'::jsonb,
          version = version + 1,
          updated_at = now()
      WHERE task_id = '${task.task_id}';
    `;
    const r = await queryDb(sql);
    console.log('Task DB Status updated:', r.success ? 'SUCCESS' : r.error);
  }

  if (loop) {
    const sql = `
      UPDATE aiagent.harness_loop_meta
      SET status_cd = '정리완료',
          ended_at = now(),
          version = version + 1,
          updated_at = now()
      WHERE loop_id = '${loop.loop_id}';
    `;
    const r = await queryDb(sql);
    console.log('Loop DB Status updated:', r.success ? 'SUCCESS' : r.error);
  }
}

main();
