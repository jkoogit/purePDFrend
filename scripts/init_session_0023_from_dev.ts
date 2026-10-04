import '../src/shared/envLoader';
import fs from 'fs';
import path from 'path';
import https from 'https';

const DB_BRIDGE_URL = process.env.REMOTE_DB_BRIDGE_URL || 'https://ptype.pdfrend.com';
const DB_BRIDGE_SECRET = process.env.REMOTE_DB_BRIDGE_SECRET || 'jkadh-secure-secret-token-2026';
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
  const historyDir = path.join(process.cwd(), 'data', 'agent_history');
  if (!fs.existsSync(historyDir)) {
    fs.mkdirSync(historyDir, { recursive: true });
  }

  const storePath = path.join(process.cwd(), 'data', 'local_agent_store.json');
  const devStore = JSON.parse(fs.readFileSync(storePath, 'utf8'));

  // 1. Backup SESSION-0022 store to agent_history
  const backupFileName = 'SESSION-0022_local_agent_store_01.json';
  const backupFilePath = path.join(historyDir, backupFileName);
  fs.writeFileSync(backupFilePath, JSON.stringify(devStore, null, 2), 'utf8');
  console.log(`✅ SESSION-0022 원본 백업 완료: ${backupFilePath}`);

  // 2. Initialize SESSION-0023 cleanly
  const nowIso = new Date().toISOString();
  const session0023 = {
    session_id: 'SESSION-0023',
    session_name: '[0023] PG-USR-07 문서공유 및 협업작업뷰 리뷰',
    work_group: 'purePDFrend',
    ai_agent: 'gemini',
    ai_model: 'models/gemini-3.8-flash',
    status_cd: '진행중',
    started_at: nowIso,
    ended_at: null,
    doc_payload: {
      objective: 'PG-USR-07 문서공유 및 협업작업뷰 전수 분석 및 리뷰, 공유권한(열람/주석/편집) 통제, 유효기간, 실시간 동시접속자 목록 및 주석 활동 피드 연계, 뷰어(PG-USR-06) 상호 위치 점프(Follow/Jump) UX 고도화',
      issue_number: 61,
      branch: 'task/0023_01_문서공유_협업작업뷰_Gemini',
      base_sha: '2b9f6da61feb267e83de4e90e5f8b6ea48bea4d8',
      operator_account: 'jkok2j2m',
      user_email: 'jkok2j2m@gmail.com',
      reference_docs: [
        'docs/05.설계/05-22_화면프로그램ID체계표_및_정보구조_IA_설계서.md',
        'docs/06.기획/06-01_모바일반응형_UIUX_오브젝트_표준기획서.md',
        'docs/03.정책/03-13_UIUX_통일성_및_모바일반응형_디자인시스템_운영정책.md',
        'docs/03.정책/03-14_모바일반응형_카드전환_및_가로스크롤_원천방지_디자인가이드.md',
        'docs/13.회고/13-18_SESSION-261003-0022_세션종합_KPT_회고록.md'
      ]
    },
    created_sys: 'agent-harness',
    created_by: 'system',
    updated_sys: 'agent-harness',
    updated_by: 'system',
    version: 1,
    operator_account: 'jkok2j2m',
    user_email: 'jkok2j2m@gmail.com'
  };

  const updatedSessions = [
    session0023,
    ...devStore.sessions.filter((s: any) => s.session_id !== 'SESSION-0023')
  ];

  const newStore = {
    sessions: updatedSessions,
    tasks: [],
    loops: []
  };

  fs.writeFileSync(storePath, JSON.stringify(newStore, null, 2), 'utf8');
  console.log('✅ local_agent_store.json 새 세션(SESSION-0023)으로 초기화 완료 (tasks=[], loops=[])');

  // 3. PostgreSQL Sync
  const insertSql = `
    INSERT INTO aiagent.harness_session_meta (
      session_id, session_name, work_group, ai_agent, ai_model,
      status_cd, started_at, ended_at, doc_payload,
      created_sys, created_by, updated_sys, updated_by, version
    ) VALUES (
      '${session0023.session_id}',
      '${session0023.session_name.replace(/'/g, "''")}',
      '${session0023.work_group}',
      '${session0023.ai_agent}',
      '${session0023.ai_model}',
      '${session0023.status_cd}',
      '${session0023.started_at}',
      NULL,
      '${JSON.stringify(session0023.doc_payload).replace(/'/g, "''")}'::jsonb,
      'agent-harness', 'system', 'agent-harness', 'system', 1
    ) ON CONFLICT (session_id) DO UPDATE SET
      session_name = EXCLUDED.session_name,
      status_cd = EXCLUDED.status_cd,
      doc_payload = EXCLUDED.doc_payload,
      updated_at = now();
  `;

  try {
    const dbRes = await executeSql(insertSql);
    console.log('✅ PostgreSQL 동기화 완료:', dbRes);
  } catch (err) {
    console.warn('⚠️ DB 동기화 오류 (로컬 스토어 유지):', err);
  }
}

main().catch(console.error);
