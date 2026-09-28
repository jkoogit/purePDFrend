import '../src/shared/envLoader';
import fs from 'fs';
import path from 'path';
import https from 'https';
import crypto from 'crypto';
import { runComprehensiveServiceCheck } from './service_health_check';

const OWNER = 'jkoogit';
const REPO = 'purePDFrend';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const DB_BRIDGE_URL = 'https://ptype.pdfrend.com';
const DB_BRIDGE_SECRET = 'jkadh-secure-secret-token-2026';
const TARGET_DATABASE = 'purepdfrend_dev';

if (!GITHUB_TOKEN) {
  console.error('Error: GITHUB_TOKEN is not defined in environment variables.');
  process.exit(1);
}

function requestGitHub<T = any>(
  endpoint: string,
  method = 'GET',
  data?: any
): Promise<{ status: number; body: T }> {
  return new Promise((resolve) => {
    const payload = data ? JSON.stringify(data) : null;
    const req = https.request(`https://api.github.com/repos/${OWNER}/${REPO}${endpoint}`, {
      method,
      headers: {
        'User-Agent': 'purePDFrend-agent',
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        ...(payload ? {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        } : {})
      }
    }, (res) => {
      let resBody = '';
      res.on('data', (chunk) => { resBody += chunk; });
      res.on('end', () => {
        try {
          const parsed = resBody ? JSON.parse(resBody) : {};
          resolve({ status: res.statusCode || 200, body: parsed });
        } catch {
          resolve({ status: res.statusCode || 200, body: resBody as any });
        }
      });
    });
    req.on('error', (e) => resolve({ status: 500, body: { error: e.message } as any }));
    if (payload) req.write(payload);
    req.end();
  });
}

function queryDb(sql: string): Promise<any> {
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

async function finalizeSession0017() {
  console.log('=== [SESSION-0017] 세션 종합 마감 및 회고록 발행 파이프라인 시작 ===\n');

  // 1. 서비스 전수 가드레일 점검
  console.log('1. 서비스 전수 가드레일 진단 실행...');
  const healthPassed = await runComprehensiveServiceCheck();
  if (!healthPassed) {
    console.error('❌ 서비스 전수 점검 실패. 세션 마감을 중단합니다.');
    process.exit(1);
  }

  // 2. GitHub 이슈 #24, #25 닫기 (Close Issues)
  console.log('\n2. GitHub 잔여 오픈 이슈(#24, #25) 상태 점검 및 Close 처리...');
  for (const issueNum of [24, 25]) {
    try {
      const issueRes = await requestGitHub(`/issues/${issueNum}`, 'PATCH', {
        state: 'closed',
        state_reason: 'completed'
      });
      console.log(`   이슈 #${issueNum} Closed 상태 코드: ${issueRes.status}`);
    } catch (err: any) {
      console.warn(`   이슈 #${issueNum} Close 중 경고 (무시 가능): ${err.message}`);
    }
  }

  // 3. 하네스 로컬 스토어 세션 상태 완료 갱신
  console.log('\n3. local_agent_store.json 세션 상태 완료 갱신...');
  const storePath = path.resolve(process.cwd(), 'data/local_agent_store.json');
  if (fs.existsSync(storePath)) {
    const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
    const sess = (store.sessions || []).find((s: any) => s.session_id === 'SESSION-0017');
    if (sess) {
      sess.status_cd = '완료';
      sess.ended_at = new Date().toISOString();
      sess.version = (sess.version || 1) + 1;
    }
    fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
    console.log('   SESSION-0017 세션 상태가 완료로 갱신되었습니다.');
  }

  // 4. PostgreSQL DB 업데이트
  console.log('\n4. PostgreSQL DB harness_session_meta 상태 완료 갱신...');
  try {
    const nowIso = new Date().toISOString();
    const updateSql = `
      UPDATE harness_session_meta
      SET status_cd = '완료', ended_at = '${nowIso}', version = version + 1
      WHERE session_id = 'SESSION-0017';
    `;
    const dbRes = await queryDb(updateSql);
    console.log('   DB 갱신 결과:', JSON.stringify(dbRes));
  } catch (err: any) {
    console.warn('   DB 갱신 중 경고 (로컬 폴백 유지):', err.message);
  }

  console.log('\n=== SESSION-0017 마감 전처리 완료 ===');
}

finalizeSession0017().catch((err) => {
  console.error('Fatal error during finalize session 0017:', err);
  process.exit(1);
});
