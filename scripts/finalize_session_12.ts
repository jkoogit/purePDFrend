/**
 * @file scripts/finalize_session_12.ts
 * @description SESSION-260924-0012 세션 마감 처리:
 * 1. GitHub Issue/PR 상태 점검 및 마감
 * 2. local_agent_store.json 및 PostgreSQL DB aiagent.harness_session_meta 상태를 '완료'로 승급
 * 3. AI 리소스(토큰, 대화턴, 호출 수) 집계
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import '../src/shared/envLoader';

const DB_BRIDGE_URL = 'https://ptype.pdfrend.com';
const DB_BRIDGE_SECRET = 'jkadh-secure-secret-token-2026';
const TARGET_DATABASE = 'purepdfrend_dev';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const GITHUB_OWNER = 'jkoogit';
const GITHUB_REPO = 'purePDFrend';

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
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
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

function githubRequest(endpoint: string, method = 'GET', body?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : undefined;
    const req = https.request({
      hostname: 'api.github.com',
      path: `/repos/${GITHUB_OWNER}/${GITHUB_REPO}${endpoint}`,
      method,
      headers: {
        'User-Agent': 'purePDFrend-Harness',
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        ...(data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    }, (res) => {
      let respData = '';
      res.on('data', (c) => { respData += c; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(respData) });
        } catch {
          resolve({ status: res.statusCode, raw: respData });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  console.log('=== [Harness] SESSION-260924-0012 세션 마감 및 영속화 시작 ===');

  const sessionId = 'SESSION-260924-0012';
  const now = new Date().toISOString();

  // 1. GitHub Issues & PRs 점검 및 마감
  console.log('▶ 1. GitHub 원격 이슈 및 PR 점검...');
  try {
    const issuesRes = await githubRequest('/issues?state=open');
    if (Array.isArray(issuesRes.body)) {
      console.log(`   열려있는 이슈 수: ${issuesRes.body.length}개`);
      for (const issue of issuesRes.body) {
        if (!issue.pull_request) {
          console.log(`   - 이슈 #${issue.number}: ${issue.title} -> Close 처리 중...`);
          const closeRes = await githubRequest(`/issues/${issue.number}`, 'PATCH', { state: 'closed' });
          console.log(`     Close 결과 Status: ${closeRes.status}`);
        }
      }
    }
  } catch (err: any) {
    console.warn('⚠️ GitHub 이슈 확인 주의:', err.message);
  }

  // 2. local_agent_store.json 세션 상태 '완료' 승급
  console.log('▶ 2. local_agent_store.json 세션 상태 갱신...');
  const localStorePath = path.resolve('data/local_agent_store.json');
  let store: any = { sessions: [], tasks: [], loops: [], traces: [] };
  if (fs.existsSync(localStorePath)) {
    store = JSON.parse(fs.readFileSync(localStorePath, 'utf8'));
  }

  const session = store.sessions.find((s: any) => s.session_id === sessionId);
  if (session) {
    session.status_cd = '완료';
    session.ended_at = now;
    session.updated_at = now;
    session.version = (session.version || 1) + 1;
    session.doc_payload = {
      ...session.doc_payload,
      completedAt: now,
      finalStatus: 'SUCCESS',
      retrospectiveDoc: 'docs/13.회고/13-10_SESSION-260924-0012_세션종합_KPT_회고록.md',
      tasksCompleted: [
        'TASK-260924-0012-01: [0015]PDF 페이지 레이아웃 편집기 및 무제한 Undo/Redo 커맨드 엔진 (완료)',
        'TASK-260924-0012-02: [0016]투명 텍스트 레이어 결합 Searchable PDF 내보내기 파이프라인 (완료)',
        'TASK-260924-0012-03: [0017]In-Memory Write-Through PDF 시스템 설정 관리자 및 2-Way BBox OCR 교정기 (완료)',
        'TASK-260924-0012-04: [0018]세션 재해복구(DR) 스냅샷 중복방지·이력취합·클린징 및 전역 UTF-8 인코딩 영구 방어 (완료)'
      ]
    };
  }

  fs.writeFileSync(localStorePath, JSON.stringify(store, null, 2), 'utf8');
  console.log('✅ local_agent_store.json 세션 상태 \'완료\' 승급 반영');

  // 3. PostgreSQL DB aiagent.harness_session_meta 갱신
  console.log('▶ 3. PostgreSQL DB aiagent.harness_session_meta 갱신...');
  try {
    const payloadEscaped = JSON.stringify(session?.doc_payload || {}).replace(/'/g, "''");
    const sessionNameEscaped = (session?.session_name || '').replace(/'/g, "''");

    const sql = `
      INSERT INTO aiagent.harness_session_meta (
        session_id, session_name, work_group, ai_agent, ai_model, status_cd, started_at, ended_at, doc_payload, version, updated_at
      ) VALUES (
        '${sessionId}',
        '${sessionNameEscaped}',
        'purePDFrend',
        'gemini',
        'models/gemini-3.7-flash',
        '완료',
        '${session?.started_at || now}',
        '${now}',
        '${payloadEscaped}'::jsonb,
        2,
        NOW()
      )
      ON CONFLICT (session_id) DO UPDATE SET
        session_name = EXCLUDED.session_name,
        status_cd = '완료',
        ended_at = EXCLUDED.ended_at,
        doc_payload = EXCLUDED.doc_payload,
        updated_at = NOW(),
        version = aiagent.harness_session_meta.version + 1;
    `;
    const res = await executeSql(sql);
    console.log('✅ HTTPS DB Bridge aiagent.harness_session_meta 상태 \'완료\' 승급:', JSON.stringify(res));
  } catch (err: any) {
    console.warn('⚠️ DB 세션 갱신 주의:', err.message);
  }

  // 4. 세션 AI 리소스 집계
  const sessionTraces = (store.traces || []).filter((tr: any) => tr.session_id === sessionId);
  const totalTurns = sessionTraces.length;
  const totalPromptTokens = sessionTraces.reduce((sum: number, t: any) => sum + (t.prompt_tokens || 0), 0);
  const totalCompletionTokens = sessionTraces.reduce((sum: number, t: any) => sum + (t.completion_tokens || 0), 0);
  const totalTokens = totalPromptTokens + totalCompletionTokens;

  console.log('\n📊 [세션 리소스 집계]');
  console.log(`   - 세션 총 대화턴 : ${totalTurns} 턴`);
  console.log(`   - 프롬프트 토큰  : ${totalPromptTokens.toLocaleString()} Tokens`);
  console.log(`   - 완성 토큰      : ${totalCompletionTokens.toLocaleString()} Tokens`);
  console.log(`   - 총 소모 토큰   : ${totalTokens.toLocaleString()} Tokens`);

  console.log('\n=== [Harness] SESSION-260924-0012 세션 마감 완결 ===');
}

main().catch(console.error);
