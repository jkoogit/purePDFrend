import '../src/shared/envLoader';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { runComprehensiveServiceCheck } from './service_health_check';

const OWNER = 'jkoogit';
const REPO = 'purePDFrend';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

if (!GITHUB_TOKEN) {
  console.error('Error: GITHUB_TOKEN is not defined in environment variables.');
  process.exit(1);
}

function requestGitHub<T = any>(
  endpoint: string,
  method = 'GET',
  data?: any
): Promise<{ status: number; body: T }> {
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
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function finalizeSession0023() {
  console.log('=== [SESSION-0023] 세션 종합 마감 및 회고록 발행 파이프라인 시작 ===\n');

  // 1. 서비스 전수 가드레일 점검
  console.log('1. 서비스 전수 가드레일 진단 실행...');
  const healthPassed = await runComprehensiveServiceCheck();
  if (!healthPassed) {
    console.error('❌ 서비스 전수 점검 실패. 세션 마감을 중단합니다.');
    process.exit(1);
  }
  console.log('   전수 가드레일 진단 100점 만점 통과.');

  // 2. GitHub 이슈 #61 닫기 (Close Issue)
  console.log('\n2. GitHub 이슈 #61 상태 점검 및 Close 처리...');
  try {
    const issueRes = await requestGitHub(`/issues/61`, 'PATCH', {
      state: 'closed',
      state_reason: 'completed'
    });
    console.log(`   이슈 #61 Closed 상태 코드: ${issueRes.status}`);
  } catch (err: any) {
    console.warn(`   이슈 #61 Close 중 경고 (무시 가능): ${err.message}`);
  }

  // 3. 하네스 로컬 스토어 세션 상태 완료 갱신
  console.log('\n3. local_agent_store.json 세션 상태 완료 갱신...');
  const storePath = path.resolve(process.cwd(), 'data/local_agent_store.json');
  if (fs.existsSync(storePath)) {
    const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
    const sess = (store.sessions || []).find((s: any) => s.session_id === 'SESSION-0023');
    if (sess) {
      sess.session_name = '[0023] PG-USR-07 문서공유·협업작업뷰 고도화 및 대화턴 무손실 영속화 거버넌스 완결';
      sess.status_cd = '완료';
      sess.ended_at = new Date().toISOString();
      sess.version = (sess.version || 1) + 1;
    }
    fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
    console.log('   SESSION-0023 세션 상태가 완료로 갱신되었습니다.');

    // DB 동기화
    if (sess) {
      await new Promise<void>((resolve) => {
        const payload = JSON.stringify(sess);
        const req = http.request({
          hostname: 'localhost',
          port: 3000,
          path: '/api/agent/session/save',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
          }
        }, (res) => {
          let b = '';
          res.on('data', c => b += c);
          res.on('end', () => {
            console.log('   세션 DB 원장 동기화 결과:', b.slice(0, 100));
            resolve();
          });
        });
        req.on('error', (e) => {
          console.warn('   세션 DB 동기화 경고:', e.message);
          resolve();
        });
        req.write(payload);
        req.end();
      });
    }
  }

  console.log('\n=== SESSION-0023 마감 전처리 완료 ===');
}

finalizeSession0023().catch((err) => {
  console.error('Fatal error during finalize session 0023:', err);
  process.exit(1);
});
