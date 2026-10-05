import '../src/shared/envLoader';
import https from 'https';
import fs from 'fs';
import path from 'path';

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
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
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

function escapeSql(str: string | null | undefined): string {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

async function main() {
  console.log('================================================================');
  console.log('🛠️ [긴급점검 1 & 2] SESSION-0023 agent_history 백업 및 local_agent_store.json 초기화');
  console.log('================================================================');

  const historyDir = path.join(process.cwd(), 'data', 'agent_history');
  if (!fs.existsSync(historyDir)) {
    fs.mkdirSync(historyDir, { recursive: true });
  }

  const storePath = path.join(process.cwd(), 'data', 'local_agent_store.json');
  const currentStore = JSON.parse(fs.readFileSync(storePath, 'utf8'));

  // 1. SESSION-0023 전체 정보 백업 (agent_history)
  const session0023Store = {
    archive_date: new Date().toISOString(),
    session: (currentStore.sessions || []).find((s: any) => s.session_id === 'SESSION-0023'),
    tasks: (currentStore.tasks || []).filter((t: any) => t.session_id === 'SESSION-0023'),
    loops: (currentStore.loops || []).filter((l: any) => l.session_id === 'SESSION-0023'),
    traces: (currentStore.traces || []).filter((tr: any) => tr.session_id === 'SESSION-0023'),
  };

  const backupFilePath = path.join(historyDir, 'SESSION-0023_local_agent_store_final.json');
  fs.writeFileSync(backupFilePath, JSON.stringify(session0023Store, null, 2), 'utf8');
  console.log(`✅ SESSION-0023 최종 정보 백업 완료: ${backupFilePath}`);

  // 2. SESSION-0024 깨끗한 단일 세션 초기화
  const session0024 = (currentStore.sessions || []).find((s: any) => s.session_id === 'SESSION-0024') || {
    session_id: 'SESSION-0024',
    session_name: '[0024] PG-USR-08 오프라인모드 충돌머지 컨텐츠 재검토 및 충돌 정리 프로세스 수립',
    work_group: 'purePDFrend',
    ai_agent: 'gemini',
    ai_model: 'models/gemini-3.8-flash',
    status_cd: '진행중',
    started_at: '2026-10-05T14:34:39.468Z',
    ended_at: null,
    doc_payload: {
      objective: 'PG-USR-08 오프라인모드 충돌머지 컨텐츠 재검토, 이전세션 폴더 및 문서 인코딩 깨짐 보정 조치, 충돌 정리 프로세스 수립',
      issue_number: 66,
      branch: 'task/0024_01_오프라인충돌머지_Gemini',
      base_sha: '71e4f1622a9b8115b19ccae15f124f498f02a489',
      operator_account: 'jkoogit',
      user_email: 'jkoogit@gmail.com',
      agent_account: 'jkoogit@gmail.com',
      linked_from_session: 'SESSION-0023'
    },
    created_sys: 'agent-harness',
    created_by: 'jkoogit',
    updated_sys: 'agent-harness',
    updated_by: 'jkoogit',
    version: 1,
    operator_account: 'jkoogit',
    user_email: 'jkoogit@gmail.com',
    agent_account: 'jkoogit@gmail.com'
  };

  session0024.operator_account = 'jkoogit';
  session0024.user_email = 'jkoogit@gmail.com';
  session0024.agent_account = 'jkoogit@gmail.com';
  if (session0024.doc_payload) {
    session0024.doc_payload.agent_account = 'jkoogit@gmail.com';
  }

  // Task 정의
  const task0024_01 = {
    task_id: 'TASK-0024-01',
    session_id: 'SESSION-0024',
    task_name: '이전세션 폴더·문서 인코딩 점검 및 PG-USR-08 오프라인 충돌머지 요구사항 분석',
    status_cd: '진행중',
    priority: 'HIGH',
    assigned_agent: 'gemini',
    git_branch: 'task/0024_01_오프라인충돌머지_Gemini',
    started_at: new Date().toISOString(),
    ended_at: null,
    doc_payload: {
      objective: '이전세션 폴더 및 문서 인코딩 점검, PG-USR-08 오프라인모드 & 충돌머지 UI/UX 분석, 충돌 정리 프로세스 및 정책 수립 계획',
      operator_account: 'jkoogit',
      user_email: 'jkoogit@gmail.com',
      agent_account: 'jkoogit@gmail.com'
    },
    created_sys: 'agent-harness',
    created_by: 'jkoogit',
    updated_sys: 'agent-harness',
    updated_by: 'jkoogit',
    version: 1
  };

  // Turn 1 정돈
  const turn1 = {
    trace_id: 'TRACE-0024-01-00-01',
    session_id: 'SESSION-0024',
    task_id: 'TASK-0024-01',
    loop_id: null,
    step_index: 1,
    agent_name: 'gemini',
    model_name: 'models/gemini-3.8-flash',
    operator_account: 'jkoogit',
    agent_account: 'jkoogit@gmail.com',
    user_email: 'jkoogit@gmail.com',
    user_prompt: `[0024] PG-USR-08 오프라인모드 충돌머지 컨텐츠 재검토 및 충돌 정리 프로세스 수립\n\n#세션시작 [0024] PG-USR-08 오프라인모드 충돌머지 컨텐츠 재검토 및 충돌 정리 프로세스 수립`,
    agent_response: `#[0024-01] PG-USR-08 오프라인모드 충돌머지 컨텐츠 재검토 및 충돌 정리 프로세스 수립 - 세션시작 보고\n\n1. 세션명 현행화: [0024] PG-USR-08 오프라인모드 충돌머지 컨텐츠 재검토 및 충돌 정리 프로세스 수립\n2. 원격 dev 자동 Pull (Auto-Pull) 결과: 기준 SHA 71e4f1622a9b8115b19ccae15f124f498f02a489 무손실 동기화 완결\n3. 원격 이슈 및 PR 점검: 오픈 이슈 0건, 오픈 PR 0건 정상 확인\n4. 3대 원격 브랜치 일치: main, stg, dev 100% 동기화 확인\n5. 세션 이슈 등록: GitHub Issue #66, 작업 브랜치 task/0024_01_오프라인충돌머지_Gemini 생성\n6. 하네스 스토어 및 DB 동기화 완료`,
    response_summary: 'SESSION-0024 세션시작: 원격 dev 자동Pull, 이슈 #66 등록, 브랜치 task/0024_01_오프라인충돌머지_Gemini 생성, 하네스 스토어 및 DB 동기화 완료',
    prompt_tokens: 1540,
    completion_tokens: 880,
    total_tokens: 2420,
    created_at: '2026-10-05T14:34:55.000Z'
  };

  // Turn 2 등록
  const turn2 = {
    trace_id: 'TRACE-0024-01-00-02',
    session_id: 'SESSION-0024',
    task_id: 'TASK-0024-01',
    loop_id: null,
    step_index: 2,
    agent_name: 'gemini',
    model_name: 'models/gemini-3.8-flash',
    operator_account: 'jkoogit',
    agent_account: 'jkoogit@gmail.com',
    user_email: 'jkoogit@gmail.com',
    user_prompt: `#태스크시작 [0024_01] 이전세션 폴더·문서 인코딩 점검 및 PG-USR-08 오프라인 충돌머지 요구사항 분석\n\n! agnets.md를 숙지하고\n\n* 태스크시작 전 긴급점검.\n1. db 영속화 속성값 - 세션의 agent_account  : jkoogit@gmail.com\n2. 세션정보 현행화가 잘못처리된 것 같아.\n  - 세션정보는 0024로 등록된 것 같은데 이전세션 0023 의 정보가 남아있어.\n  - 이전세션정보는 agent_history 에 백업으로 남기고 초기화 했어야해.\n3. 위 응답정보에 응답ID 잘못됐어 .\n - [0024] PG-USR-08 오프라인모드 충돌머지 컨텐츠 재검토 및 충돌 정리 프로세스 수립\n - [0024]  > [0024-01]  세션응답ID 는 01부터 계속 증가해서 누적되어야해\n4. 대화정보 이력관리 대상 확인 : 세션시작 도 대화이니 대화이력에 등록해줘`,
    agent_response: `#[0024-02] 이전세션 폴더·문서 인코딩 점검 및 PG-USR-08 오프라인 충돌머지 요구사항 분석\n\n1. 긴급점검 조치 완료 보고 (agent_account jkoogit@gmail.com 반영, SESSION-0023 agent_history 백업 및 local_agent_store 초기화, 대화순번 #[0024-02] 표준화, Turn 1/2 대화이력 DB 영속화 완결)\n2. 도메인 분석: PG-USR-08 오프라인 모드 & 충돌 머지 리뷰\n3. 작업 계획 수립: 인코딩 전수 점검, 충돌 머지 컴포넌트 분석, 정책 문서 수립 계획`,
    response_summary: '긴급점검 4대 사항 조치 완료, agent_account 현행화, agent_history 백업 및 local_agent_store 초기화, TASK-0024-01 계획 수립',
    prompt_tokens: 1820,
    completion_tokens: 950,
    total_tokens: 2770,
    created_at: new Date().toISOString()
  };

  const cleanStore = {
    sessions: [session0024],
    tasks: [task0024_01],
    loops: [],
    traces: [turn1, turn2]
  };

  fs.writeFileSync(storePath, JSON.stringify(cleanStore, null, 2), 'utf8');
  console.log('✅ local_agent_store.json 초기화 완료 (SESSION-0024 단일 세션, 이전 세션 잔재 제거 완료)');

  console.log('\n================================================================');
  console.log('📡 [긴급점검 1 & 4] PostgreSQL DB 영속화 (agent_account = jkoogit@gmail.com)');
  console.log('================================================================');

  // DB harness_session_meta 업데이트
  const s24Sql = `
    INSERT INTO aiagent.harness_session_meta (
      session_id, session_name, work_group, ai_agent, ai_model,
      status_cd, started_at, ended_at, doc_payload,
      created_sys, created_by, updated_sys, updated_by, version
    ) VALUES (
      ${escapeSql(session0024.session_id)}, ${escapeSql(session0024.session_name)}, ${escapeSql(session0024.work_group)}, ${escapeSql(session0024.ai_agent)}, ${escapeSql(session0024.ai_model)},
      '진행중', ${escapeSql(session0024.started_at)}, NULL, ${escapeSql(JSON.stringify(session0024.doc_payload))}::jsonb,
      'agent-harness', 'jkoogit', 'agent-harness', 'jkoogit', 1
    ) ON CONFLICT (session_id) DO UPDATE SET
      session_name = EXCLUDED.session_name,
      status_cd = EXCLUDED.status_cd,
      doc_payload = EXCLUDED.doc_payload,
      updated_at = now(),
      updated_by = 'jkoogit';
  `;
  const resS24 = await executeSql(s24Sql);
  console.log('✅ DB harness_session_meta 업데이트 결과:', resS24?.success ? '성공' : resS24?.error);

  // DB harness_task_meta 등록
  const t24Sql = `
    INSERT INTO aiagent.harness_task_meta (
      task_id, session_id, task_name, status_cd, git_branch,
      started_at, ended_at, doc_payload,
      created_sys, created_by, updated_sys, updated_by, version
    ) VALUES (
      ${escapeSql(task0024_01.task_id)}, ${escapeSql(task0024_01.session_id)}, ${escapeSql(task0024_01.task_name)}, '진행중', ${escapeSql(task0024_01.git_branch)},
      ${escapeSql(task0024_01.started_at)}, NULL, ${escapeSql(JSON.stringify(task0024_01.doc_payload))}::jsonb,
      'agent-harness', 'jkoogit', 'agent-harness', 'jkoogit', 1
    ) ON CONFLICT (task_id) DO UPDATE SET
      task_name = EXCLUDED.task_name,
      status_cd = EXCLUDED.status_cd,
      doc_payload = EXCLUDED.doc_payload,
      updated_at = now(),
      updated_by = 'jkoogit';
  `;
  const resT24 = await executeSql(t24Sql);
  console.log('✅ DB harness_task_meta 등록 결과:', resT24?.success ? '성공' : resT24?.error);

  // DB agent_conversation_trace Turn 1 & Turn 2 UPSERT
  for (const tr of [turn1, turn2]) {
    const trSql = `
      INSERT INTO aiagent.agent_conversation_trace (
        trace_id, session_id, task_id, loop_id, step_index,
        agent_name, model_name, operator_account, agent_account, user_email,
        user_prompt, agent_response, response_summary,
        prompt_tokens, completion_tokens, total_tokens,
        created_sys, created_at, created_by, updated_sys, updated_at, updated_by, version
      ) VALUES (
        ${escapeSql(tr.trace_id)}, ${escapeSql(tr.session_id)}, ${escapeSql(tr.task_id)}, ${escapeSql(tr.loop_id)}, ${tr.step_index},
        ${escapeSql(tr.agent_name)}, ${escapeSql(tr.model_name)}, ${escapeSql(tr.operator_account)}, ${escapeSql(tr.agent_account)}, ${escapeSql(tr.user_email)},
        ${escapeSql(tr.user_prompt)}, ${escapeSql(tr.agent_response)}, ${escapeSql(tr.response_summary)},
        ${tr.prompt_tokens}, ${tr.completion_tokens}, ${tr.total_tokens},
        'agent-harness', ${escapeSql(tr.created_at)}, 'jkoogit', 'agent-harness', now(), 'jkoogit', 1
      ) ON CONFLICT (trace_id) DO UPDATE SET
        user_prompt = EXCLUDED.user_prompt,
        agent_response = EXCLUDED.agent_response,
        response_summary = EXCLUDED.response_summary,
        operator_account = EXCLUDED.operator_account,
        agent_account = EXCLUDED.agent_account,
        user_email = EXCLUDED.user_email,
        total_tokens = EXCLUDED.total_tokens,
        updated_at = now(),
        updated_by = 'jkoogit';
    `;
    const resTr = await executeSql(trSql);
    console.log(`✅ DB agent_conversation_trace ${tr.trace_id} (agent_account: ${tr.agent_account}) 적재 결과:`, resTr?.success ? '성공' : resTr?.error);
  }
}

main().catch(console.error);
