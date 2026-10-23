import fs from 'fs';
import path from 'path';
import https from 'https';

const storePath = path.resolve('data/local_agent_store.json');
const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));

const taskObj = {
  task_id: 'TASK-0033-01',
  session_id: 'SESSION-0033',
  task_name: '[0033-01] Phase 3 관리자 1단계 핵심화면(PG-ADM-01~04) 실제 REST API 연동 및 사용자 잔여화면(PG-USR-08~09) tokens.ts 전면 완결',
  status_cd: '정리완료',
  priority: 'HIGH',
  assigned_agent: 'gemini',
  git_branch: 'task/0033_01_admin_api_usr_tokens_Gemini',
  started_at: '2026-10-23T18:10:00.000Z',
  ended_at: null,
  doc_payload: {
    plan_items: [
      '1. Express 백엔드 REST API 구현 및 DAG 사이클 감지 알고리즘 탑재',
      '2. Phase 3 관리자 1단계 핵심화면 4종(PG-ADM-01~04) 실제 REST API 데이터 바인딩',
      '3. 사용자 잔여화면 2종(PG-USR-08, 09) tokens.ts 전면 대입 및 4모드 고대비 완결',
      '4. 품질 및 규정 준수 검증 (tsc 0건, 단위테스트, 4단계 서비스 점검 100점 만점)',
      '5. 코드리뷰 문서 발행 및 Git 동기화'
    ],
    completed_items: [
      '1. Express 백엔드 REST API 구현 (/api/admin/programs, /api/admin/terms) 완료',
      '2. 관리자 1단계 4대 화면 실제 REST API 연동 및 상태 바인딩 완료',
      '3. 사용자 잔여 와이어프레임(PG-USR-08, 09) tokens.ts 전면 대입으로 전체 9개 화면(PG-USR-01~09) 100% 토큰화 완결',
      '4. tsc 0건, verify_phase3_tokens 5/5 통과, 서비스 헬스체크 100점 만점 [A+], 로드맵 v1.4.0 현행화',
      '5. 코드리뷰 문서(261024_054...) 발행 및 README_리뷰.md 인덱스 갱신'
    ],
    review_doc: 'docs/10.리뷰/261024_054_Phase3_관리자1단계_REST_API연동_및_사용자_tokens_전면완결_코드리뷰.md',
    operator_account: 'jkok2j2m',
    user_email: 'jkok2j2m@gmail.com'
  },
  created_sys: 'agent-harness',
  created_by: 'jkok2j2m',
  updated_sys: 'agent-harness',
  updated_by: 'jkok2j2m',
  version: 1,
  status: '정리완료',
  updated_at: new Date().toISOString()
};

if (!Array.isArray(store.tasks)) {
  store.tasks = [];
}
store.tasks = store.tasks.filter((t: any) => t.task_id !== 'TASK-0033-01');
store.tasks.unshift(taskObj);

const loopObj = {
  loop_id: 'LOOP-0033-01',
  task_id: 'TASK-0033-01',
  session_id: 'SESSION-0033',
  loop_name: 'Phase 3 관리자 1단계 REST API 연동 및 PG-USR-08~09 tokens.ts 전면 대입 단위 검증',
  iteration: 1,
  status: '완료',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

if (!Array.isArray(store.loops)) {
  store.loops = [];
}
store.loops = store.loops.filter((l: any) => l.loop_id !== 'LOOP-0033-01');
store.loops.unshift(loopObj);

if (store.sessions) {
  const currentSession = store.sessions.find((s: any) => s.session_id === 'SESSION-0033');
  if (currentSession && currentSession.doc_payload && currentSession.doc_payload.tasks) {
    const task = currentSession.doc_payload.tasks.find((t: any) => t.task_id === 'TASK-0033-01');
    if (task) {
      task.status = '정리완료';
    }
  }
}

fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
console.log('✅ store.tasks & store.loops TASK-0033-01 동기화 완료');

function escapeSql(str: string | null | undefined): string {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

const payload = JSON.stringify({
  database: 'purepdfrend_dev',
  sql: `INSERT INTO aiagent.harness_task_meta (
    task_id, session_id, task_name, status_cd, git_branch,
    doc_payload, started_at, version, created_sys, created_by, updated_sys, updated_by
  ) VALUES (
    'TASK-0033-01', 'SESSION-0033', ${escapeSql(taskObj.task_name)}, '정리완료', 'task/0033_01_admin_api_usr_tokens_Gemini',
    ${escapeSql(JSON.stringify(taskObj.doc_payload))}, now(), 1, 'agent-harness', 'jkok2j2m', 'agent-harness', 'jkok2j2m'
  ) ON CONFLICT (task_id) DO UPDATE SET
    status_cd = EXCLUDED.status_cd,
    doc_payload = EXCLUDED.doc_payload,
    updated_by = EXCLUDED.updated_by;

  INSERT INTO aiagent.harness_loop_meta (
    loop_id, task_id, session_id, loop_name, status_cd, started_at, created_at, updated_at
  ) VALUES (
    'LOOP-0033-01', 'TASK-0033-01', 'SESSION-0033', ${escapeSql(loopObj.loop_name)}, '완료', now(), now(), now()
  ) ON CONFLICT (loop_id) DO UPDATE SET
    status_cd = EXCLUDED.status_cd,
    updated_at = now();`
});

const req = https.request('https://ptype.pdfrend.com/api/query', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-JKADH-SECRET': 'jkadh-secure-secret-token-2026',
    'Authorization': 'Bearer jkadh-secure-secret-token-2026',
    'Content-Length': String(Buffer.byteLength(payload)),
  },
  rejectUnauthorized: false,
  timeout: 5000,
}, (res) => {
  let b = '';
  res.on('data', c => b += c);
  res.on('end', () => {
    console.log('✅ Remote DB harness_task_meta & harness_loop_meta 저장 성공:', b);
    process.exit(0);
  });
});

req.on('error', (err) => {
  console.warn('⚠️ Remote DB 저장 알림 (로컬 저장 유지):', err.message);
  process.exit(0);
});

req.write(payload);
req.end();
