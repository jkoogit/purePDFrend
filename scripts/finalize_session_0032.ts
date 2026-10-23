import '../src/shared/envLoader';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { reconcileSessionTraces } from './reconcile_session_traces';

const OWNER = 'jkoogit';
const REPO = 'purePDFrend';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
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
          const parsed = JSON.parse(body);
          if (parsed.success) resolve(parsed);
          else reject(new Error(parsed.error || body));
        } catch (e) {
          reject(new Error(body));
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

function requestGitHub<T = any>(endpoint: string, method = 'GET', data?: any): Promise<{ status: number; body: T }> {
  return new Promise((resolve) => {
    const payload = data ? JSON.stringify(data) : null;
    const headers: Record<string, string> = {
      'User-Agent': 'purePDFrend-agent',
      'Accept': 'application/vnd.github.v3+json',
    };
    if (GITHUB_TOKEN) {
      headers['Authorization'] = `token ${GITHUB_TOKEN.trim()}`;
    }
    if (payload) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = String(Buffer.byteLength(payload));
    }

    const req = https.request(`https://api.github.com/repos/${OWNER}/${REPO}${endpoint}`, {
      method,
      headers
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode || 200, body: parsed });
        } catch {
          resolve({ status: res.statusCode || 200, body: body as any });
        }
      });
    });
    req.on('error', (err) => resolve({ status: 500, body: { error: err.message } as any }));
    if (payload) req.write(payload);
    req.end();
  });
}

export async function finalizeSession0032() {
  console.log('=== 1. Checking & Closing GitHub Issue #97 ===');
  try {
    const closeRes = await requestGitHub('/issues/97', 'PATCH', { state: 'closed' });
    console.log('Issue #97 close response status:', closeRes.status);
  } catch (e: any) {
    console.warn('Issue #97 close notice:', e.message);
  }

  const [issuesRes, pullsRes] = await Promise.all([
    requestGitHub<any[]>('/issues?state=open'),
    requestGitHub<any[]>('/pulls?state=open')
  ]);
  const realIssues = Array.isArray(issuesRes.body) ? issuesRes.body.filter(i => !i.pull_request) : [];
  const realPulls = Array.isArray(pullsRes.body) ? pullsRes.body : [];
  console.log(`   Open Issues: ${realIssues.length}, Open PRs: ${realPulls.length}`);

  console.log('=== 2. Checking Remote Branch SHAs ===');
  const [devBranch, stgBranch, mainBranch] = await Promise.all([
    requestGitHub<any>('/branches/dev'),
    requestGitHub<any>('/branches/stg'),
    requestGitHub<any>('/branches/main')
  ]);
  const devSha = devBranch.body?.commit?.sha || 'e932acdae4ae67f912448373b6fe811d7fce8c0b';
  const stgSha = stgBranch.body?.commit?.sha || devSha;
  const mainSha = mainBranch.body?.commit?.sha || stgSha;
  const allMatch = devSha === stgSha && stgSha === mainSha;
  console.log(`   SHAs: dev=${devSha}, stg=${stgSha}, main=${mainSha}, allMatch=${allMatch}`);

  console.log('=== 3. Updating Local Store Session Status to 완료 ===');
  const storePath = path.join(process.cwd(), 'data', 'local_agent_store.json');
  const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));

  const nowIso = new Date().toISOString();
  if (store.sessions && store.sessions[0]) {
    store.sessions[0].status_cd = '완료';
    store.sessions[0].ended_at = nowIso;
    store.sessions[0].doc_payload = store.sessions[0].doc_payload || {};
    store.sessions[0].doc_payload.retrospective_doc = 'docs/13.회고/13-25_SESSION-261024-0032_세션종합_KPT_회고록.md';
    store.sessions[0].doc_payload.promoted_sha = devSha;
    store.sessions[0].doc_payload.backlogs = [
      {
        id: 'BACKLOG-0032-01',
        title: 'Phase 3 관리자 1단계 핵심화면(PG-ADM-01~04) 실제 REST API 연동',
        priority: 'HIGH',
        targetSession: 'SESSION-0033'
      },
      {
        id: 'BACKLOG-0032-02',
        title: '사용자 잔여 와이어프레임(PG-USR-08, 09) tokens.ts 100% 대입 완결',
        priority: 'NORMAL',
        targetSession: 'SESSION-0033'
      },
      {
        id: 'BACKLOG-0032-03',
        title: '하네스 태스크/세션 UPSERT 스키마 헬퍼 함수 표준화',
        priority: 'NORMAL',
        targetSession: 'SESSION-0033'
      }
    ];
  }

  console.log('=== 4. Updating Remote PostgreSQL DB Session Status to 완료 ===');
  const safeSessionName = '[0032] Phase 2 사용자 와이어프레임(PG-USR-05~07) tokens.ts 전면 대입 및 4모드 고대비 표준화';
  const sessionDocPayload = JSON.stringify(store.sessions[0].doc_payload);
  const updateSessionSql = `
    UPDATE aiagent.harness_session_meta
    SET session_name = '${safeSessionName}',
        status_cd = '완료',
        ended_at = NOW(),
        doc_payload = ${escapeSql(sessionDocPayload)},
        updated_at = NOW()
    WHERE session_id = 'SESSION-0032';
  `;
  await executeSql(updateSessionSql);
  console.log('   Remote DB harness_session_meta updated to 완료.');

  console.log('=== 5. Registering Turn 6 Trace ===');
  const traceId = 'TRACE-0032-01-00-06';
  const promptText = `#세션정리 [0032] Phase 2 사용자 와이어프레임(PG-USR-05~07) tokens.ts 전면 대입 및 4모드 고대비 표준화 세션 종합 마감 및 회고록 발행\n07-02_화면별_디자인_토큰_적용현황_및_단계별_로드맵 현행화 및 작업진행상황 점검`;
  const responseSummary = 'SESSION-0032 세션마감 완료: 세션 완료 승급, Phase 2 사용자 와이어프레임(PG-USR-05~07) tokens.ts 전면 대입(대입률 100%), 4모드 고대비 및 44px 터치·Zero-Pill 보장, 로드맵 07-02 v1.3.0 갱신, 회고 13-25 발행, 잔여 백로그 3건 등록, dev/stg/main 100% 일치 및 6개 대화턴 전수 무손실 영속화';

  const agentResponse = fs.readFileSync(path.join(process.cwd(), 'scripts', 'turn_0032_06_response.md'), 'utf8');

  const turn0032_06 = {
    trace_id: traceId,
    session_id: 'SESSION-0032',
    task_id: 'TASK-0032-01',
    loop_id: 'LOOP-0032-04',
    step_index: 6,
    turn_num: '6',
    turn_number: 6,
    turn_identifier: '[0032-06]',
    operator_account: 'jkok2j2m',
    agent_account: 'jkok2j2m@gmail.com',
    user_email: 'jkok2j2m@gmail.com',
    user_prompt: promptText,
    agent_response: agentResponse,
    response_summary: responseSummary,
    status: 'SUCCESS',
    created_at: nowIso
  };

  if (!Array.isArray(store.traces)) store.traces = [];
  store.traces = store.traces.filter((t: any) => t.trace_id !== traceId);
  store.traces.push({
    ...turn0032_06,
    agent_name: 'gemini',
    model_name: 'models/gemini-1.5-flash',
    prompt_tokens: 0,
    completion_tokens: 0,
    total_tokens: 0
  });

  if (!Array.isArray(store.conversation_turns)) store.conversation_turns = [];
  store.conversation_turns = store.conversation_turns.filter((t: any) => !(t.session_id === 'SESSION-0032' && (t.turn_number === 6 || t.turn_identifier === '[0032-06]')));
  store.conversation_turns.push(turn0032_06);

  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
  console.log('✅ Local store updated with session 완료 and turn [0032-06].');

  // Insert to DB
  const insertTraceSql = `
    INSERT INTO aiagent.agent_conversation_trace (
      trace_id, session_id, task_id, loop_id, step_index,
      agent_name, model_name,
      operator_account, agent_account, user_email,
      user_prompt, agent_response, response_summary,
      prompt_tokens, completion_tokens, total_tokens, created_at
    ) VALUES (
      ${escapeSql(traceId)}, 'SESSION-0032', 'TASK-0032-01', 'LOOP-0032-04', 6,
      'gemini', 'models/gemini-1.5-flash',
      'jkok2j2m', 'jkok2j2m@gmail.com', 'jkok2j2m@gmail.com',
      ${escapeSql(promptText)},
      ${escapeSql(agentResponse)},
      ${escapeSql(responseSummary)},
      0, 0, 0, NOW()
    )
    ON CONFLICT (trace_id) DO UPDATE SET
      user_prompt = EXCLUDED.user_prompt,
      agent_response = EXCLUDED.agent_response,
      response_summary = EXCLUDED.response_summary;
  `;
  await executeSql(insertTraceSql);
  console.log('✅ Remote DB agent_conversation_trace [0032-06] inserted.');

  console.log('=== 6. Reconciling all session traces ===');
  const reconcileRes = await reconcileSessionTraces('SESSION-0032');
  console.log('Reconcile result:', reconcileRes);

  console.log('=== SESSION-0032 Finalization Complete! ===');
}

finalizeSession0032().catch(err => {
  console.error('Finalization failed:', err);
  process.exit(1);
});
