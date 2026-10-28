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

  const session0037 = {
    session_id: 'SESSION-0037',
    session_name: '[0037] 메뉴 바로가기 개편 단일메뉴원장 구축 및 실서비스 직결 아키텍처',
    work_group: 'purePDFrend',
    status_cd: '진행중',
    ai_agent: 'gemini',
    ai_model: 'models/gemini-3.8-flash',
    started_at: '2026-10-26T00:00:00.000Z',
    operator_account: 'jkok2j2m',
    agent_account: 'jkok2j2m@gmail.com',
    user_email: 'jkok2j2m@gmail.com',
    doc_payload: {
      objective: '노트북 LLM 4단계 정리 전략 기반 단일 메뉴 원장(menuRegistry.ts) 구축, 메뉴 바로가기 실서비스 직결 개편, 에이전트 포지셔닝 재정립, 49개 전수 화면 07-03 로드맵 수립 및 리뷰 완결',
      branch: 'task/0037_01_menu_registry_and_real_service_Gemini',
      operator_account: 'jkok2j2m',
      user_email: 'jkok2j2m@gmail.com',
      reference_docs: [
        'docs/07.로드맵/07-03_전체_화면_리뷰대상_목록_및_소스_연계_로드맵.md',
        'docs/10.리뷰/261028_052_메뉴바로가기_개편_단일메뉴원장_구축_및_실서비스직결_아키텍처_완결_코드리뷰.md',
        'src/shared/constants/menuRegistry.ts',
        'src/ppdf/components/WireframeRibbonLayer.tsx',
        'src/ppdf/components/WireframeTopDropdown.tsx',
        'src/ppdf/views/UnifiedServiceScreenRouter.tsx'
      ]
    },
    created_sys: 'agent-harness',
    created_at: new Date().toISOString(),
    created_by: 'jkok2j2m',
    updated_sys: 'agent-harness',
    updated_at: new Date().toISOString(),
    updated_by: 'jkok2j2m',
    version: 1
  };

  const task0037_01 = {
    task_id: 'TASK-0037-01',
    session_id: 'SESSION-0037',
    task_name: '메뉴 바로가기 개편, 단일 메뉴 원장 구축 및 실서비스 직결 아키텍처 완결',
    status_cd: '완료',
    work_group: 'purePDFrend',
    git_branch: 'task/0037_01_menu_registry_and_real_service_Gemini',
    priority: 'HIGH',
    status: 'COMPLETED',
    assigned_agent: 'gemini',
    operator_account: 'jkok2j2m',
    user_email: 'jkok2j2m@gmail.com',
    started_at: '2026-10-26T00:00:00.000Z',
    ended_at: new Date().toISOString(),
    doc_payload: {
      scope: '4단계 정리 전략(단일 메뉴 원장 menuRegistry.ts, WireframeRibbonLayer 및 WireframeTopDropdown 로컬 하드코딩 제거 및 실서비스 직결, UnifiedServiceScreenRouter 단일 원장 헬퍼 직결, ppdf 메인 소유 및 aiagent 관제 격리)',
      branch: 'task/0037_01_menu_registry_and_real_service_Gemini',
      review_doc: 'docs/10.리뷰/261028_052_메뉴바로가기_개편_단일메뉴원장_구축_및_실서비스직결_아키텍처_완결_코드리뷰.md',
      roadmap_doc: 'docs/07.로드맵/07-03_전체_화면_리뷰대상_목록_및_소스_연계_로드맵.md',
      operator_account: 'jkok2j2m',
      user_email: 'jkok2j2m@gmail.com'
    },
    created_sys: 'agent-harness',
    created_at: new Date().toISOString(),
    created_by: 'jkok2j2m',
    updated_sys: 'agent-harness',
    updated_at: new Date().toISOString(),
    updated_by: 'jkok2j2m',
    version: 1
  };

  // 1. local_agent_store.json unshift
  store.sessions = (store.sessions || []).filter((s: any) => s.session_id !== 'SESSION-0037');
  store.sessions.unshift(session0037);

  store.tasks = (store.tasks || []).filter((t: any) => t.task_id !== 'TASK-0037-01');
  store.tasks.unshift(task0037_01);

  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
  console.log('✅ 1단계: local_agent_store.json에 SESSION-0037 및 TASK-0037-01 등록 완료!');

  // 2. PostgreSQL DB aiagent.harness_session_meta & aiagent.harness_task_meta upsert
  const sessSql = `
    INSERT INTO aiagent.harness_session_meta (
      session_id, session_name, work_group, status_cd, ai_agent, ai_model,
      started_at, doc_payload,
      created_sys, created_at, created_by, updated_sys, updated_at, updated_by, version
    ) VALUES (
      ${escapeSql(session0037.session_id)},
      ${escapeSql(session0037.session_name)},
      ${escapeSql(session0037.work_group)},
      ${escapeSql(session0037.status_cd)},
      ${escapeSql(session0037.ai_agent)},
      ${escapeSql(session0037.ai_model)},
      NOW(),
      ${escapeSql(session0037.doc_payload)},
      'agent-harness', NOW(), 'jkok2j2m', 'agent-harness', NOW(), 'jkok2j2m', 1
    )
    ON CONFLICT (session_id) DO UPDATE SET
      session_name = EXCLUDED.session_name,
      status_cd = EXCLUDED.status_cd,
      doc_payload = EXCLUDED.doc_payload,
      updated_at = NOW(),
      version = harness_session_meta.version + 1;
  `;

  const taskSql = `
    INSERT INTO aiagent.harness_task_meta (
      task_id, session_id, task_name, status_cd, git_branch,
      started_at, ended_at, doc_payload,
      created_sys, created_at, created_by, updated_sys, updated_at, updated_by, version
    ) VALUES (
      ${escapeSql(task0037_01.task_id)},
      ${escapeSql(task0037_01.session_id)},
      ${escapeSql(task0037_01.task_name)},
      ${escapeSql(task0037_01.status_cd)},
      ${escapeSql(task0037_01.git_branch)},
      NOW(), NOW(),
      ${escapeSql(task0037_01.doc_payload)},
      'agent-harness', NOW(), 'jkok2j2m', 'agent-harness', NOW(), 'jkok2j2m', 1
    )
    ON CONFLICT (task_id) DO UPDATE SET
      task_name = EXCLUDED.task_name,
      status_cd = EXCLUDED.status_cd,
      doc_payload = EXCLUDED.doc_payload,
      ended_at = NOW(),
      updated_at = NOW(),
      version = harness_task_meta.version + 1;
  `;

  const resSess = await executeSql(sessSql);
  console.log('✅ 2단계(세션): PostgreSQL DB 반영 결과:', resSess);

  const resTask = await executeSql(taskSql);
  console.log('✅ 2단계(태스크): PostgreSQL DB 반영 결과:', resTask);
}

main().catch(console.error);
