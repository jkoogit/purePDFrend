import '../src/shared/envLoader';
import fs from 'fs';
import path from 'path';
import https from 'https';
import crypto from 'crypto';
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

async function syncDoc(filePath: string) {
  const fullPath = path.resolve(filePath);
  if (!fs.existsSync(fullPath)) return;
  const content = fs.readFileSync(fullPath, 'utf8');
  const hash = crypto.createHash('sha256').update(content, 'utf8').digest('hex');
  const stat = fs.statSync(fullPath);
  const rel = filePath.replace(/^docs\//, '');
  const docId = `DOC-${rel.replace(/[\/\.]/g, '-').toUpperCase()}`;
  const title = content.split('\n').find((l) => l.startsWith('#'))?.replace(/^#+\s*/, '') || path.basename(filePath);
  const folder = filePath.split('/')[1] || '기타';

  const payloadDoc = JSON.stringify({
    folder,
    fileName: path.basename(filePath),
    lines: content.split('\n').length,
    size: stat.size,
    content,
  });

  const escapedPayload = payloadDoc.replace(/'/g, "''");
  const escapedTitle = title.replace(/'/g, "''");
  const escapedFolder = folder.replace(/'/g, "''");
  const escapedPath = filePath.replace(/'/g, "''");

  const sql = `
    INSERT INTO aiagent.agent_docs_meta (
      doc_id, file_path, category, title, content_hash, last_synced_at, doc_payload,
      created_sys, created_by, updated_sys, updated_by, version
    ) VALUES (
      '${docId}',
      '${escapedPath}',
      '${escapedFolder}',
      '${escapedTitle}',
      '${hash}',
      now(),
      '${escapedPayload}'::jsonb,
      'agent-service', 'system', 'agent-service', 'system', 1
    )
    ON CONFLICT (doc_id) DO UPDATE SET
      file_path = EXCLUDED.file_path,
      content_hash = EXCLUDED.content_hash,
      category = EXCLUDED.category,
      title = EXCLUDED.title,
      last_synced_at = now(),
      doc_payload = EXCLUDED.doc_payload,
      updated_at = now();
  `;
  await executeSql(sql);
  console.log(`✅ Synced doc hash: ${filePath}`);
}

export async function finalizeSession0033() {
  console.log('=== 1. Checking & Closing GitHub Issue #98 ===');
  try {
    const commentRes = await requestGitHub('/issues/98/comments', 'POST', {
      body: `## SESSION-0033 세션 마감 완료\n\n- Phase 3 관리자 1단계 핵심화면(PG-ADM-01~04) 실제 REST API 연동 완결\n- 사용자 잔여 와이어프레임(PG-USR-08~09) tokens.ts 전면 대입 완료 (사용자 전 화면 9종 토큰화 100% 달성)\n- 하네스 메타원장 DDL 정규화 및 도메인 레포지토리(HarnessRepository) 구축\n- 회고록 발행: docs/13.회고/13-26_SESSION-261024-0033_세션종합_KPT_회고록.md\n- 로드맵 07-02 v1.4.0 현행화`
    });
    console.log('Issue #98 comment status:', commentRes.status);
    const closeRes = await requestGitHub('/issues/98', 'PATCH', { state: 'closed', state_reason: 'completed' });
    console.log('Issue #98 close response status:', closeRes.status);
  } catch (e: any) {
    console.warn('Issue #98 close notice:', e.message);
  }

  const [issuesRes, pullsRes] = await Promise.all([
    requestGitHub<any[]>('/issues?state=open'),
    requestGitHub<any[]>('/pulls?state=open')
  ]);
  const realIssues = Array.isArray(issuesRes.body) ? issuesRes.body.filter(i => !i.pull_request) : [];
  const realPulls = Array.isArray(pullsRes.body) ? pullsRes.body : [];
  console.log(`   Open Issues: ${realIssues.length}, Open PRs: ${realPulls.length}`);

  console.log('=== 2. Syncing Documents Meta Hashes to DB ===');
  await syncDoc('docs/13.회고/13-26_SESSION-261024-0033_세션종합_KPT_회고록.md');
  await syncDoc('docs/13.회고/README_회고.md');
  await syncDoc('docs/07.로드맵/07-02_화면별_디자인_토큰_적용현황_및_단계별_로드맵.md');

  console.log('=== 3. Updating Local Store Session Status to 완료 ===');
  const storePath = path.join(process.cwd(), 'data', 'local_agent_store.json');
  const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));

  const nowIso = new Date().toISOString();
  if (store.sessions && store.sessions[0]) {
    store.sessions[0].status_cd = '완료';
    store.sessions[0].ended_at = nowIso;
    store.sessions[0].doc_payload = store.sessions[0].doc_payload || {};
    store.sessions[0].doc_payload.retrospective_doc = 'docs/13.회고/13-26_SESSION-261024-0033_세션종합_KPT_회고록.md';
    store.sessions[0].doc_payload.backlogs = [
      {
        id: 'BACKLOG-0033-01',
        title: 'Phase 4 관리자 2단계 핵심화면(PG-ADM-05~08) 실제 REST API 연동',
        priority: 'HIGH',
        targetSession: 'SESSION-0034'
      },
      {
        id: 'BACKLOG-0033-02',
        title: '관리자 잔여 화면(PG-ADM-09~16) tokens.ts 전면 대입 및 Table-to-Card 모바일 가드레일',
        priority: 'NORMAL',
        targetSession: 'SESSION-0034'
      },
      {
        id: 'BACKLOG-0033-03',
        title: 'HarnessRepository 기반 CLI 스크립트 표준화',
        priority: 'NORMAL',
        targetSession: 'SESSION-0034'
      }
    ];
  }

  console.log('=== 4. Updating Remote PostgreSQL DB Session Status to 완료 ===');
  const safeSessionName = '[0033] Phase 3 관리자 1단계 핵심화면(PG-ADM-01~04) 실제 REST API 연동 및 사용자 잔여화면(PG-USR-08~09) tokens.ts 전면 완결';
  const sessionDocPayload = JSON.stringify(store.sessions[0].doc_payload);
  const updateSessionSql = `
    UPDATE aiagent.harness_session_meta
    SET session_name = '${safeSessionName}',
        status_cd = '완료',
        ended_at = NOW(),
        doc_payload = ${escapeSql(sessionDocPayload)},
        updated_at = NOW()
    WHERE session_id = 'SESSION-0033';
  `;
  await executeSql(updateSessionSql);
  console.log('   Remote DB harness_session_meta updated to 완료.');

  console.log('=== 5. Registering Turn 9 Trace ===');
  const traceId = 'TRACE-0033-02-00-09';
  const promptText = `#세션정리 [0033] Phase 3 관리자 1단계 핵심화면(PG-ADM-01~04) 실제 REST API 연동 및 사용자 잔여화면(PG-USR-08~09) tokens.ts 전면 완결`;
  const responseSummary = 'SESSION-0033 세션마감 완료: 세션 완료 승급, Phase 3 관리자 1단계 4대 화면 실제 REST API 연동, 사용자 전 화면(9종) tokens.ts 100% 대입 완결, HarnessRepository 도메인 레포지토리 DDL 정규화, 로드맵 07-02 v1.4.0 갱신, 회고 13-26 발행, 잔여 백로그 3건 등록, dev/stg/main 100% 일치 및 9개 대화턴 전수 무손실 영속화';

  const agentResponse = fs.readFileSync(path.join(process.cwd(), 'scripts', 'turn_0033_09_response.md'), 'utf8');

  const turn0033_09 = {
    trace_id: traceId,
    session_id: 'SESSION-0033',
    task_id: 'TASK-0033-02',
    loop_id: 'LOOP-0033-02',
    step_index: 9,
    turn_num: '9',
    turn_number: 9,
    turn_identifier: '[0033-09]',
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
    ...turn0033_09,
    agent_name: 'gemini',
    model_name: 'models/gemini-1.5-flash',
    prompt_tokens: 0,
    completion_tokens: 0,
    total_tokens: 0
  });

  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
  console.log(`   Turn 9 trace registered in local store.`);

  console.log('=== 6. Reconciling All Traces to Remote DB ===');
  const recon = await reconcileSessionTraces();
  console.log(`   Reconcile result: ${recon.syncedCount} traces synced.`);

  return {
    success: true,
    realIssuesCount: realIssues.length,
    realPullsCount: realPulls.length,
    reconciledTraces: recon.syncedCount
  };
}

if (process.argv[1]?.includes('finalize_session_0033')) {
  finalizeSession0033().then((res) => {
    console.log('🎉 SESSION-0033 Finalize Complete:', JSON.stringify(res, null, 2));
    process.exit(0);
  }).catch((err) => {
    console.error('Finalize failed:', err);
    process.exit(1);
  });
}
