import fs from 'fs';
import path from 'path';
import https from 'https';

const DB_BRIDGE_URL = 'https://ptype.pdfrend.com';
const DB_BRIDGE_SECRET = 'jkadh-secure-secret-token-2026';
const TARGET_DATABASE = 'purepdfrend_dev';

function executeSql(sql: string): Promise<any> {
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

function escapeSql(val: any): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
  return `'${String(val).replace(/'/g, "''")}'`;
}

async function main() {
  const storePath = path.join(process.cwd(), 'data', 'local_agent_store.json');
  const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));

  const s0037 = store.sessions.find((s: any) => s.session_id === 'SESSION-0037');
  if (s0037) {
    s0037.status_cd = '완료';
    s0037.ended_at = new Date().toISOString();
    s0037.doc_payload = {
      ...s0037.doc_payload,
      retrospective_doc: 'docs/13.회고/13-30_SESSION-261028-0037_세션종합_KPT_회고록.md',
      promoted_sha: '714bae9e2c6f8fc6900c73d1b77a288285821944',
      merged_branches: ['dev', 'stg', 'main'],
      local_branches_merged: true,
      updated_at: new Date().toISOString()
    };
    fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
    console.log('✅ 1단계: local_agent_store.json SESSION-0037 상태 완료 업데이트 성공!');
  }

  // PostgreSQL DB 업데이트
  const updateSessSql = `
    UPDATE aiagent.harness_session_meta
    SET status_cd = '완료',
        ended_at = NOW(),
        doc_payload = jsonb_set(
          COALESCE(doc_payload, '{}'::jsonb),
          '{retrospective_doc}',
          '"docs/13.회고/13-30_SESSION-261028-0037_세션종합_KPT_회고록.md"'::jsonb
        ),
        updated_at = NOW(),
        version = version + 1
    WHERE session_id = 'SESSION-0037';
  `;

  const res = await executeSql(updateSessSql);
  console.log('✅ 2단계: PostgreSQL DB SESSION-0037 상태 완료 업데이트 성공:', res);
}

main().catch(console.error);
