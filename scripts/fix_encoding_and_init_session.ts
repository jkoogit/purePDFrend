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
    const req = https.request(`${DB_BRIDGE_URL}/api/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'X-JKADH-SECRET': DB_BRIDGE_SECRET,
        'Authorization': `Bearer ${DB_BRIDGE_SECRET}`,
        'Content-Length': Buffer.byteLength(payload, 'utf8'),
      },
      rejectUnauthorized: false,
      timeout: 25000,
    }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        try {
          const parsed = JSON.parse(text);
          if (parsed.success) resolve(parsed);
          else reject(new Error(parsed.error || text));
        } catch (e) {
          reject(new Error(text));
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function fixEncodingAndInitNewSession() {
  console.log('--- 1. Fixing historical Korean encoding in DB ---');

  // Fix SESSION-20260923-008
  await executeSql(`
    UPDATE aiagent.harness_session_meta
    SET session_name = '[0011]PDF 비즈니스 코어 고도화 (다국어 OCR 전처리 및 바운딩 박스 교정 스튜디오 구현)',
        status_cd = '완료',
        updated_at = now()
    WHERE session_id = 'SESSION-20260923-008';
  `);
  console.log('Fixed SESSION-20260923-008 session_name in DB.');

  // Fix TASK-20260923-005
  await executeSql(`
    UPDATE aiagent.harness_task_meta
    SET task_name = '[0012]PDF 이미지 전처리 엔진 및 다국어 OCR(WASM/클라우드/PaddleOCR 도커 어댑터) 파이프라인 구현',
        status_cd = '완료',
        updated_at = now()
    WHERE task_id = 'TASK-20260923-005';
  `);
  console.log('Fixed TASK-20260923-005 task_name in DB.');

  // Fix TASK-260923-0011-01
  await executeSql(`
    UPDATE aiagent.harness_task_meta
    SET task_name = '[0013]거버넌스 ID 포맷 개선(세션·태스크·루프·대화턴) 및 기술문서 전수 현행화(Mermaid 다이어그램 이미지화·하단 편집이력 표준화)',
        status_cd = '완료',
        updated_at = now()
    WHERE task_id = 'TASK-260923-0011-01';
  `);
  console.log('Fixed TASK-260923-0011-01 task_name in DB.');

  // Fix TASK-260923-0011-14
  await executeSql(`
    UPDATE aiagent.harness_task_meta
    SET task_name = '[0014]800쪽 대용량 가상 뷰어(VirtualViewer) 및 멀티페이지 썸네일 탐색기 파이프라인 구현',
        status_cd = '완료',
        updated_at = now()
    WHERE task_id = 'TASK-260923-0011-14';
  `);
  console.log('Fixed TASK-260923-0011-14 task_name in DB.');

  console.log('\n--- 2. Initializing new Session SESSION-260924-0012 ---');
  const newSessionId = 'SESSION-260924-0012';
  const newSessionName = '[0012]PDF 페이지 레이아웃 편집기 및 투명 텍스트 레이어 임베딩 Searchable PDF 내보내기 구현';
  const startedAt = new Date().toISOString();

  const newDocPayload = {
    planned_tasks: [
      'TASK-260924-0012-01: [0015]PDF 페이지 레이아웃 편집기(회전 90/180/270, 삭제, 순서 재정렬 액션) 및 UI 구현',
      'TASK-260924-0012-02: [0016]투명 텍스트 레이어 결합 Searchable PDF 내보내기 파이프라인 구현 (pdf-lib 결합)',
      'TASK-260924-0012-03: [0017]2-Way BBox 캔버스 인라인 텍스트 교정기(OCRCorrectionStudio) UI/UX 완성',
      'TASK-260924-0012-04: [0018]세션 재해복구(DR) 스냅샷 중복방지·이력취합·클린징 및 개발환경 UTF-8 인코딩 영구 방어'
    ],
    branchName: 'task/0012_0015_layout-editor-and-dr-fix_Gemini',
    issueNumber: 15,
    objective: 'PDF 페이지 레이아웃 편집기, 투명 텍스트 레이어 임베딩 Searchable PDF 내보내기, 2-Way BBox 교정기 완성 및 DR 스냅샷 중복방지/클린징/UTF-8 인코딩 보완',
    activeAgent: 'Gemini 3.7 Flash',
    baseSha: '793346ee9b6f8a98e8f830a1cbf3cf14fa1a77b3',
    theme: 'PDF 페이지 레이아웃 편집기 및 Searchable PDF 내보내기'
  };

  // DB Insert
  const insertSessionSql = `
    INSERT INTO aiagent.harness_session_meta (
      session_id, session_name, work_group, ai_agent, ai_model, status_cd,
      started_at, doc_payload, created_sys, created_by, updated_sys, updated_by, version
    ) VALUES (
      '${newSessionId}', '${newSessionName.replace(/'/g, "''")}', 'purePDFrend', 'gemini', 'models/gemini-3.7-flash', '진행중',
      '${startedAt}', '${JSON.stringify(newDocPayload).replace(/'/g, "''")}'::jsonb, 'agent-harness', 'system', 'agent-harness', 'system', 1
    )
    ON CONFLICT (session_id) DO UPDATE SET
      session_name = EXCLUDED.session_name,
      status_cd = EXCLUDED.status_cd,
      doc_payload = EXCLUDED.doc_payload,
      updated_at = now(),
      version = aiagent.harness_session_meta.version + 1;
  `;
  await executeSql(insertSessionSql);
  console.log(`Initialized ${newSessionId} in DB.`);

  // Update local_agent_store.json
  const storePath = path.resolve(process.cwd(), 'data/local_agent_store.json');
  let currentStore: any = { sessions: [], tasks: [], loops: [], traces: [], snapshots: [] };
  if (fs.existsSync(storePath)) {
    try {
      currentStore = JSON.parse(fs.readFileSync(storePath, 'utf8'));
    } catch (e) {}
  }

  // Archive old session if exists
  const oldSession = currentStore.sessions?.[0];
  if (oldSession && oldSession.session_id !== newSessionId) {
    const archiveDir = path.resolve(process.cwd(), 'data/archives');
    if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir, { recursive: true });
    const archiveFile = path.join(archiveDir, `local_agent_store_${oldSession.session_id}_${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    fs.writeFileSync(archiveFile, JSON.stringify(currentStore, null, 2), 'utf8');
    console.log(`Archived previous session store to: ${archiveFile}`);
  }

  // Set clean store for new session
  const cleanStore = {
    sessions: [
      {
        session_id: newSessionId,
        session_name: newSessionName,
        work_group: 'purePDFrend',
        ai_agent: 'gemini',
        ai_model: 'models/gemini-3.7-flash',
        status_cd: '진행중',
        started_at: startedAt,
        ended_at: null,
        doc_payload: newDocPayload,
        created_sys: 'agent-harness',
        created_by: 'system',
        updated_sys: 'agent-harness',
        updated_by: 'system',
        version: 1
      }
    ],
    tasks: [],
    loops: [],
    traces: [],
    plans: [],
    models: [],
    users: [],
    ledgers: [],
    quota_logs: [],
    snapshots: (currentStore.snapshots || []).filter((s: any) => s.status !== 'ARCHIVED'),
    vendor_attributes: currentStore.vendor_attributes || [],
    user_ai_accounts: currentStore.user_ai_accounts || []
  };

  fs.writeFileSync(storePath, JSON.stringify(cleanStore, null, 2), 'utf8');
  console.log(`Updated ${storePath} with new session ${newSessionId}.`);
}

fixEncodingAndInitNewSession().catch(console.error);
