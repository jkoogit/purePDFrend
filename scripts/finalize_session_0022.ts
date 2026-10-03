import '../src/shared/envLoader';
import https from 'https';
import fs from 'fs';

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
          resolve(JSON.parse(body));
        } catch {
          resolve(body);
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function escapeSql(str: string | null | undefined): string {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

async function main() {
  console.log('--- Finalizing SESSION-0022 in local store and DB ---');

  const now = new Date().toISOString();

  // 1. Update local store
  const storePath = 'data/local_agent_store.json';
  const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));

  // Mark BACKLOG-0021-01 as completed in SESSION-0021
  const s21 = (store.sessions || []).find((s: any) => s.session_id === 'SESSION-0021');
  if (s21 && s21.doc_payload?.backlog_items) {
    for (const b of s21.doc_payload.backlog_items) {
      if (b.backlog_id === 'BACKLOG-0021-01') {
        b.status = '완료';
        b.resolved_in_session = 'SESSION-0022';
        b.resolved_at = now;
      }
    }
  }

  // Finalize SESSION-0022
  let s22 = (store.sessions || []).find((s: any) => s.session_id === 'SESSION-0022');
  if (s22) {
    s22.session_name = '[0022] SESSION-0021 DB 미적재 턴 일괄 동기화 및 원격 dev 자동 Pull 거버넌스 수립';
    s22.status_cd = '완료';
    s22.ended_at = now;
    s22.doc_payload = {
      ...(s22.doc_payload || {}),
      retrospective_doc: 'docs/13.회고/13-18_SESSION-261003-0022_세션종합_KPT_회고록.md',
      reference_docs: [
        'docs/03.정책/03-21_계정전환_원격소스자동풀_및_대화턴전수영속화_운영정책.md',
        'docs/15.학습/15-20_계정전환_샌드박스격리_원격GitDataAPI_무손실동기화_아키텍처.md',
        'docs/10.리뷰/261003_040_계정전환_원격dev_자동Pull_및_대화턴_전수영속화_완결_코드리뷰.md',
        'docs/13.회고/13-18_SESSION-261003-0022_세션종합_KPT_회고록.md'
      ],
      resolved_backlog_items: ['BACKLOG-0021-01']
    };
    s22.version = (s22.version || 1) + 1;
    s22.updated_at = now;
  }

  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
  console.log('✅ data/local_agent_store.json 세션 마감 완료');

  // 2. Update DB
  const sql = `
    UPDATE aiagent.harness_session_meta
    SET session_name = ${escapeSql(s22.session_name)},
        status_cd = '완료',
        ended_at = ${escapeSql(now)},
        doc_payload = ${escapeSql(JSON.stringify(s22.doc_payload))}::jsonb,
        updated_at = now(),
        version = version + 1
    WHERE session_id = 'SESSION-0022';
  `;
  const dbRes = await executeSql(sql);
  console.log('✅ DB aiagent.harness_session_meta 세션 마감 결과:', dbRes?.success ? '성공' : dbRes?.error);
}

main().catch(console.error);
