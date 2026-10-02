import '../src/shared/envLoader';
import fs from 'fs';
import https from 'https';

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

const storePath = 'data/local_agent_store.json';
const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));

const session0021 = {
  session_id: 'SESSION-0021',
  session_name: '[0021] PG-USR-05 문서관리 라이브러리 리뷰 마무리 및 PG-USR-06 가상뷰어 화면 종합 리뷰',
  work_group: 'purePDFrend',
  ai_agent: 'gemini',
  ai_model: 'models/gemini-3.8-flash',
  status_cd: '진행중',
  started_at: new Date().toISOString(),
  ended_at: null,
  doc_payload: {
    objective: 'PG-USR-05 문서관리 라이브러리 최종 사용성 및 화면 리뷰 마무리, PG-USR-06 가상뷰어 화면 종합 리뷰 및 UX 인터랙션 검증',
    issue_number: 54,
    branch: 'task/0021_01_문서관리_가상뷰어_화면리뷰_Gemini',
    base_sha: '9ff34e0a097b8cdc853f9ed459cd3a500cf9091e',
    operator_account: 'jkoogit',
    user_email: 'jkoogit@gmail.com',
    linked_from_session: 'SESSION-0020',
    reference_docs: [
      'docs/13.회고/13-16_SESSION-261002-0020_세션종합_KPT_회고록.md',
      'docs/10.리뷰/261002_038_목차TOC제거_주석행체크박스및선택레이어팝업_OCR위아래탐색및즉시현행화_완결_코드리뷰.md',
      'docs/10.리뷰/261001_036_문서관리_라이브러리_모바일반응형_및_옵션처리레이어_일체형배치_완결_코드리뷰.md',
      'docs/05.설계/05-22_화면프로그램ID체계표_및_정보구조_IA_설계서.md',
      'docs/18.메뉴얼/18-01_사용자_PDF_스튜디오_이용_매뉴얼.md',
      'docs/03.정책/03-13_UIUX_통일성_및_모바일반응형_디자인시스템_운영정책.md'
    ]
  },
  created_sys: 'agent-harness',
  created_by: 'system',
  updated_sys: 'agent-harness',
  updated_by: 'system',
  version: 1,
  operator_account: 'jkoogit',
  user_email: 'jkoogit@gmail.com'
};

const remainingSessions = (store.sessions || []).filter((s: any) => s.session_id !== 'SESSION-0021');
store.sessions = [session0021, ...remainingSessions];

fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
console.log('✅ local_agent_store.json updated with SESSION-0021 on top of full history!');

async function syncDb() {
  const insertSql = `
    INSERT INTO aiagent.harness_session_meta (
      session_id, session_name, work_group, ai_agent, ai_model,
      status_cd, started_at, ended_at, doc_payload,
      created_sys, created_by, updated_sys, updated_by, version
    ) VALUES (
      '${session0021.session_id}', '${session0021.session_name}', '${session0021.work_group}', '${session0021.ai_agent}', '${session0021.ai_model}',
      '${session0021.status_cd}', '${session0021.started_at}', NULL, '${JSON.stringify(session0021.doc_payload)}'::jsonb,
      'agent-harness', 'system', 'agent-harness', 'system', 1
    ) ON CONFLICT (session_id) DO UPDATE SET
      session_name = EXCLUDED.session_name,
      status_cd = EXCLUDED.status_cd,
      doc_payload = EXCLUDED.doc_payload,
      updated_at = now();
  `;
  const res = await executeSql(insertSql);
  console.log('✅ Remote DB sync:', res?.error ? res.error : 'success');
}

syncDb().catch(console.error);
