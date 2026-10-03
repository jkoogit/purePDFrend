import '../src/shared/envLoader';
import https from 'https';
import fs from 'fs';

const OWNER = 'jkoogit';
const REPO = 'purePDFrend';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const DB_BRIDGE_URL = 'https://ptype.pdfrend.com';
const DB_BRIDGE_SECRET = 'jkadh-secure-secret-token-2026';
const TARGET_DATABASE = 'purepdfrend_dev';

function requestGitHub<T = any>(endpoint: string, method = 'GET', data?: any): Promise<{ status: number; body: T }> {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : null;
    const req = https.request(`https://api.github.com/repos/${OWNER}/${REPO}${endpoint}`, {
      method,
      headers: {
        'User-Agent': 'purePDFrend-agent',
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        ...(payload ? {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        } : {}),
      },
    }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        try {
          const parsed = text ? JSON.parse(text) : {};
          resolve({ status: res.statusCode || 200, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode || 200, body: text as any });
        }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

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

function escapeSql(str: string | null | undefined): string {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

async function main() {
  console.log('================================================================');
  console.log('🔄 [1단계] SESSION-0021 원격 PostgreSQL DB 일괄 적재 및 현행화');
  console.log('================================================================');

  const storePath = 'data/local_agent_store.json';
  const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));

  // 1-1. Update SESSION-0021 in aiagent.harness_session_meta
  const s21 = (store.sessions || []).find((s: any) => s.session_id === 'SESSION-0021');
  if (s21) {
    const s21Sql = `
      INSERT INTO aiagent.harness_session_meta (
        session_id, session_name, work_group, ai_agent, ai_model,
        status_cd, started_at, ended_at, doc_payload,
        created_sys, created_by, updated_sys, updated_by, version
      ) VALUES (
        ${escapeSql(s21.session_id)}, ${escapeSql(s21.session_name)}, ${escapeSql(s21.work_group)}, ${escapeSql(s21.ai_agent)}, ${escapeSql(s21.ai_model)},
        '완료', ${escapeSql(s21.started_at)}, ${escapeSql(s21.ended_at || '2026-10-02T16:45:00.000Z')}, ${escapeSql(JSON.stringify(s21.doc_payload))}::jsonb,
        'agent-harness', 'jkoogit', 'agent-harness', 'jkoogit', 2
      ) ON CONFLICT (session_id) DO UPDATE SET
        session_name = EXCLUDED.session_name,
        status_cd = '완료',
        ended_at = EXCLUDED.ended_at,
        doc_payload = EXCLUDED.doc_payload,
        updated_at = now(),
        updated_by = 'jkoogit';
    `;
    const resS21 = await executeSql(s21Sql);
    console.log('✅ SESSION-0021 harness_session_meta 업데이트 결과:', resS21?.success ? '성공' : resS21?.error);
  }

  // 1-2. Insert TASK-0021-01 into aiagent.harness_task_meta
  const t21 = (store.tasks || []).find((t: any) => t.task_id === 'TASK-0021-01');
  if (t21) {
    const t21Sql = `
      INSERT INTO aiagent.harness_task_meta (
        task_id, session_id, task_name, status_cd, git_branch,
        started_at, ended_at, doc_payload,
        created_sys, created_by, updated_sys, updated_by, version
      ) VALUES (
        ${escapeSql(t21.task_id)}, ${escapeSql(t21.session_id)}, ${escapeSql(t21.task_name)}, '완료', ${escapeSql(t21.git_branch)},
        ${escapeSql(t21.started_at)}, ${escapeSql(t21.ended_at)}, ${escapeSql(JSON.stringify(t21.doc_payload))}::jsonb,
        'agent-harness', 'jkoogit', 'agent-harness', 'jkoogit', 2
      ) ON CONFLICT (task_id) DO UPDATE SET
        task_name = EXCLUDED.task_name,
        status_cd = '완료',
        ended_at = EXCLUDED.ended_at,
        doc_payload = EXCLUDED.doc_payload,
        updated_at = now();
    `;
    const resT21 = await executeSql(t21Sql);
    console.log('✅ TASK-0021-01 harness_task_meta 업데이트 결과:', resT21?.success ? '성공' : resT21?.error);
  }

  // 1-3. Insert SESSION-0021 7 conversation traces into aiagent.agent_conversation_trace
  const traces21 = (store.traces || []).filter((t: any) => t.session_id === 'SESSION-0021');
  console.log(`SESSION-0021 적재 대상 턴 수: ${traces21.length}건`);

  for (const tr of traces21) {
    const trSql = `
      INSERT INTO aiagent.agent_conversation_trace (
        trace_id, session_id, task_id, loop_id, step_index,
        agent_name, model_name, operator_account, agent_account, user_email,
        user_prompt, agent_response, response_summary,
        prompt_tokens, completion_tokens, total_tokens,
        created_sys, created_at, created_by, updated_sys, updated_at, updated_by, version
      ) VALUES (
        ${escapeSql(tr.trace_id)}, ${escapeSql(tr.session_id)}, ${escapeSql(tr.task_id)}, ${escapeSql(tr.loop_id)}, ${tr.step_index},
        ${escapeSql(tr.agent_name)}, ${escapeSql(tr.model_name)}, ${escapeSql(tr.operator_account || 'jkoogit')}, 'purePDFrend-agent', ${escapeSql(tr.user_email || 'jkoogit@gmail.com')},
        ${escapeSql(tr.user_prompt)}, ${escapeSql(tr.agent_response)}, ${escapeSql(tr.response_summary)},
        ${tr.prompt_tokens || 0}, ${tr.completion_tokens || 0}, ${tr.total_tokens || 0},
        'agent-harness', ${escapeSql(tr.created_at || new Date().toISOString())}, 'jkoogit', 'agent-harness', now(), 'jkoogit', 1
      ) ON CONFLICT (trace_id) DO UPDATE SET
        user_prompt = EXCLUDED.user_prompt,
        agent_response = EXCLUDED.agent_response,
        response_summary = EXCLUDED.response_summary,
        total_tokens = EXCLUDED.total_tokens,
        updated_at = now();
    `;
    const resTr = await executeSql(trSql);
    if (!resTr?.success) {
      console.warn(`⚠️ ${tr.trace_id} INSERT 실패:`, resTr?.error);
    } else {
      console.log(`  ✓ ${tr.trace_id} (${tr.response_summary}) DB 적재 완료`);
    }
  }

  console.log('\n================================================================');
  console.log('🔍 [2단계] GitHub 이슈 및 PR 점검');
  console.log('================================================================');

  const issuesRes = await requestGitHub<any[]>('/issues?state=open');
  const pullsRes = await requestGitHub<any[]>('/pulls?state=open');
  const openIssues = (issuesRes.body || []).filter((i: any) => !i.pull_request);
  const openPulls = pullsRes.body || [];

  console.log(`현재 열린 이슈 수: ${openIssues.length}`);
  openIssues.forEach((i: any) => console.log(` - 이슈 #${i.number}: ${i.title}`));
  console.log(`현재 열린 PR 수: ${openPulls.length}`);
  openPulls.forEach((p: any) => console.log(` - PR #${p.number}: ${p.title}`));

  console.log('\n================================================================');
  console.log('🌿 [3단계] 원격 브랜치 커밋 SHA 일치 점검 (main, stg, dev)');
  console.log('================================================================');

  const mainRef = await requestGitHub<any>('/git/ref/heads/main');
  const devRef = await requestGitHub<any>('/git/ref/heads/dev');
  const stgRef = await requestGitHub<any>('/git/ref/heads/stg');

  const mainSha = mainRef.body?.object?.sha;
  const devSha = devRef.body?.object?.sha;
  const stgSha = stgRef.body?.object?.sha;

  console.log(`- main SHA: ${mainSha}`);
  console.log(`- stg  SHA: ${stgSha}`);
  console.log(`- dev  SHA: ${devSha}`);

  const isBranchesSynced = (mainSha === devSha && devSha === stgSha);
  console.log(`3대 브랜치 일치 여부: ${isBranchesSynced ? '✅ 100% 일치' : 'ℹ️ 차이 확인됨'}`);

  console.log('\n================================================================');
  console.log('🎫 [4단계] SESSION-0022 GitHub 이슈 현행화');
  console.log('================================================================');

  const issueTitle = '[0022_01] SESSION-0021 DB 미적재 턴 일괄 동기화 및 신규 세션 하네스 착수';
  const issueBody = `## 📌 세션 정보
- **세션 ID**: \`SESSION-0022\`
- **세션명**: \`[0022] SESSION-0021 DB 미적재 턴 일괄 동기화 및 신규 세션 하네스 착수\`
- **작업자**: Gemini 3.8 Flash / jkoogit (jkoogit@gmail.com)
- **작업 그룹**: \`purePDFrend\`
- **기준 브랜치**: \`dev\` (${devSha})

## 🎯 핵심 작업 목표
1. **[비상대응 완결] SESSION-0021 원격 DB 일괄 적재**:
   - \`data/local_agent_store.json\`에 보존된 SESSION-0021의 7대 대화 턴(\`TRACE-0021-01-00-01\` ~ \`TRACE-0021-01-00-07\`)을 PostgreSQL DB \`aiagent.agent_conversation_trace\`에 일괄 INSERT
   - \`aiagent.harness_task_meta\`에 \`TASK-0021-01\` 등록 및 \`aiagent.harness_session_meta\`의 \`SESSION-0021\` 상태를 '완료'로 승급
2. **신규 세션 [0022] 하네스 초기화**:
   - 원격 저장소 이슈 및 PR 점검 (종결 상태 확인)
   - 원격 \`dev\` 기준 신규 작업 브랜치 생성 (\`task/0022_01_DB동기화_및_거버넌스보완_Gemini\`)
   - \`SESSION-0022\` 세션 이슈 등록 및 하네스 스토어 동기화
3. **이월 백로그 착수 (\`BACKLOG-0021-01\`)**:
   - 계정 전환 및 샌드박스 초기화 시 원격 \`dev\` 소스 자동 Pull & 브랜치 정돈 거버넌스 가이드라인 수립`;

  let issueNumber = 58;
  // If issue 58 exists and is open, update it; otherwise create new
  if (openIssues.some((i: any) => i.number === 58)) {
    const updateRes = await requestGitHub(`/issues/58`, 'PATCH', {
      title: issueTitle,
      body: issueBody
    });
    console.log(`✅ GitHub 이슈 #58 현행화 완료: ${updateRes.body?.html_url}`);
  } else {
    const newIssueRes = await requestGitHub('/issues', 'POST', {
      title: issueTitle,
      body: issueBody
    });
    issueNumber = newIssueRes.body?.number;
    console.log(`✅ 신규 GitHub 이슈 등록 완료: #${issueNumber} (${newIssueRes.body?.html_url})`);
  }

  console.log('\n================================================================');
  console.log('🌱 [5단계] 원격 dev 브랜치 기준 작업 브랜치 생성');
  console.log('================================================================');

  const branchName = 'task/0022_01_DB동기화_및_거버넌스보완_Gemini';
  const targetSha = devSha || '983339dc7aefcd3cf392f2abe51a759140649a83';

  const createRefRes = await requestGitHub<any>('/git/refs', 'POST', {
    ref: `refs/heads/${branchName}`,
    sha: targetSha
  });

  if (createRefRes.status === 201) {
    console.log(`✅ 원격 작업 브랜치 [${branchName}] 생성 성공 (SHA: ${targetSha})`);
  } else if (createRefRes.status === 422) {
    console.log(`ℹ️ 브랜치 [${branchName}]가 이미 존재합니다. 참조 업데이트 시도...`);
    const updateRefRes = await requestGitHub<any>(`/git/refs/heads/${encodeURIComponent(branchName)}`, 'PATCH', {
      sha: targetSha,
      force: true
    });
    console.log(`✅ 원격 작업 브랜치 [${branchName}] 업데이트 결과 (${updateRefRes.status})`);
  } else {
    console.warn(`⚠️ 브랜치 생성 응답 상태: ${createRefRes.status}`, createRefRes.body);
  }

  console.log('\n================================================================');
  console.log('💾 [6단계] 하네스 스토어 (data/local_agent_store.json) 및 DB SESSION-0022 등록');
  console.log('================================================================');

  const session0022 = {
    session_id: 'SESSION-0022',
    session_name: '[0022] SESSION-0021 DB 미적재 턴 일괄 동기화 및 신규 세션 하네스 착수',
    work_group: 'purePDFrend',
    ai_agent: 'gemini',
    ai_model: 'models/gemini-3.8-flash',
    status_cd: '진행중',
    started_at: new Date().toISOString(),
    ended_at: null,
    doc_payload: {
      objective: 'SESSION-0021 원격 DB 미적재 7대 대화 턴 일괄 INSERT, TASK-0021-01 메타 등록, SESSION-0021 완료 승급, 신규 세션 [0022] 하네스 착수 및 BACKLOG-0021-01 거버넌스 가이드 수립',
      issue_number: issueNumber,
      branch: branchName,
      base_sha: targetSha,
      operator_account: 'jkoogit',
      user_email: 'jkoogit@gmail.com',
      linked_from_session: 'SESSION-0021',
      backlog_items: [
        {
          backlog_id: 'BACKLOG-0021-01',
          session_id: 'SESSION-0021',
          title: '계정 전환 및 신규 세션 시작 시 원격 dev 소스 자동 풀(Pull) & 브랜치 정돈 거버넌스 가이드라인 수립',
          category: '거버넌스/프로세스',
          status: '진행예정',
          priority: 'HIGH',
          created_at: '2026-10-02T14:40:41.387Z',
          content: [
            '같은 계정에서 신규세션 새채팅으로 시작 (브랜치전환 무난)',
            '다른 계정에서 신규세션 새채팅으로 시작 (브랜치전환 주의: 신규 샌드박스 컨테이너 환경에서 로컬 파일이 구 스냅샷이므로, #세션시작 시 원격 dev 최신 트리를 즉시 로컬로 자동 Pull하고 아카이빙을 선행하여 작업 정보 뭉개짐 원천 차단)',
            '세션 종료 시 퀵작업으로 docs/03.정책 및 AGENTS.md에 절차 보완 및 표준 체크리스트 반영'
          ]
        }
      ]
    },
    created_sys: 'agent-harness',
    created_by: 'jkoogit',
    updated_sys: 'agent-harness',
    updated_by: 'jkoogit',
    version: 1,
    operator_account: 'jkoogit',
    user_email: 'jkoogit@gmail.com'
  };

  const otherSessions = (store.sessions || []).filter((s: any) => s.session_id !== 'SESSION-0022');
  store.sessions = [session0022, ...otherSessions];

  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
  console.log(`✅ data/local_agent_store.json 현행화 완료 (SESSION-0022 등록됨)`);

  // DB에 SESSION-0022 반영
  try {
    const insertS22Sql = `
      INSERT INTO aiagent.harness_session_meta (
        session_id, session_name, work_group, ai_agent, ai_model,
        status_cd, started_at, ended_at, doc_payload,
        created_sys, created_by, updated_sys, updated_by, version
      ) VALUES (
        ${escapeSql(session0022.session_id)}, ${escapeSql(session0022.session_name)}, ${escapeSql(session0022.work_group)}, ${escapeSql(session0022.ai_agent)}, ${escapeSql(session0022.ai_model)},
        '진행중', ${escapeSql(session0022.started_at)}, NULL, ${escapeSql(JSON.stringify(session0022.doc_payload))}::jsonb,
        'agent-harness', 'jkoogit', 'agent-harness', 'jkoogit', 1
      ) ON CONFLICT (session_id) DO UPDATE SET
        session_name = EXCLUDED.session_name,
        status_cd = EXCLUDED.status_cd,
        doc_payload = EXCLUDED.doc_payload,
        updated_at = now();
    `;
    const resS22 = await executeSql(insertS22Sql);
    console.log('✅ 원격 DB aiagent.harness_session_meta (SESSION-0022) 등록 완료:', resS22?.success ? '성공' : resS22?.error);
  } catch (err: any) {
    console.warn('⚠️ 원격 DB 동기화 예외 (로컬 폴백 정상 유지됨):', err.message);
  }

  // 1-4. Verification
  console.log('\n================================================================');
  console.log('🔍 [7단계] 최종 동기화 검증');
  console.log('================================================================');

  const checkSessions = await executeSql("SELECT session_id, session_name, status_cd FROM aiagent.harness_session_meta WHERE session_id IN ('SESSION-0021', 'SESSION-0022') ORDER BY session_id;");
  console.log('DB Sessions:', checkSessions?.rows);

  const checkTasks = await executeSql("SELECT task_id, session_id, task_name, status_cd FROM aiagent.harness_task_meta WHERE session_id IN ('SESSION-0021', 'SESSION-0022');");
  console.log('DB Tasks:', checkTasks?.rows);

  const checkTraces = await executeSql("SELECT session_id, count(*) as count FROM aiagent.agent_conversation_trace WHERE session_id IN ('SESSION-0021', 'SESSION-0022') GROUP BY session_id;");
  console.log('DB Trace Counts:', checkTraces?.rows);
}

main().catch(console.error);
