import '../src/shared/envLoader';
import https from 'https';
import fs from 'fs';

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
          resolve(JSON.parse(body));
        } catch {
          resolve(body);
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
  console.log('--- Registering TASK-0022-01 in local store and remote DB ---');

  const taskObj = {
    task_id: 'TASK-0022-01',
    session_id: 'SESSION-0022',
    task_name: '계정 전환 및 샌드박스 초기화 시 원격 dev 소스 자동 Pull & 브랜치 정돈 거버넌스 수립',
    status_cd: '완료',
    priority: 'HIGH',
    assigned_agent: 'gemini',
    git_branch: 'task/0022_01_DB동기화_및_거버넌스보완_Gemini',
    started_at: '2026-10-02T17:40:00.000Z',
    ended_at: new Date().toISOString(),
    doc_payload: {
      items: [
        '1. 원격 dev 최신 소스 자동 동기화 엔진(scripts/pull_remote_dev.ts) 고도화 및 Tarball 스트리밍 무손실 병합 구현',
        '2. 대화 턴 전수 영속화 및 No-LLM 요약 추출 도메인 서비스(TurnTraceService.ts) 구현 (토큰 소모 0)',
        '3. server.ts 턴 저장 API 및 일괄 정합성 보정(Reconcile) 엔드포인트(/api/agent/trace/reconcile) 신설',
        '4. TDD 단위 검증(tests/turn_trace_and_pull.test.ts) 14개 테스트 전수 통과 (100% PASS)',
        '5. 거버넌스 운영정책(docs/03.정책/03-21) 및 학습 문서(docs/15.학습/15-20) 발행, 인덱스 현행화',
        '6. AGENTS.md v2.2 최신화: 3대 절대 원칙, Auto-Pull 의무화 및 2단계 하이브리드 등록 규약 반영',
        '7. KST 16:00 리셋 이후 토큰 모니터링 데이터 수집 및 쿼터 건전성 확인 (Tier 1 Pro 250회/250회, Tier 2 Flash 2482회/2500회)'
      ],
      policy_doc: 'docs/03.정책/03-21_계정전환_원격소스자동풀_및_대화턴전수영속화_운영정책.md',
      learning_doc: 'docs/15.학습/15-20_계정전환_샌드박스격리_원격GitDataAPI_무손실동기화_아키텍처.md',
      operator_account: 'jkoogit',
      user_email: 'jkoogit@gmail.com'
    },
    created_sys: 'agent-harness',
    created_by: 'jkoogit',
    updated_sys: 'agent-harness',
    updated_by: 'jkoogit',
    version: 2
  };

  // 1. Update local store
  const storePath = 'data/local_agent_store.json';
  const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));

  // Ensure SESSION-0022 exists in sessions
  let s22 = (store.sessions || []).find((s: any) => s.session_id === 'SESSION-0022');
  if (!s22) {
    s22 = {
      session_id: 'SESSION-0022',
      session_name: '[0022] SESSION-0021 DB 미적재 턴 일괄 동기화 및 신규 세션 하네스 착수',
      work_group: 'purePDFrend',
      ai_agent: 'gemini',
      ai_model: 'models/gemini-3.8-flash',
      status_cd: '진행중',
      started_at: '2026-10-02T17:15:00.000Z',
      ended_at: null,
      doc_payload: {
        objective: 'SESSION-0021 원격 DB 미적재 7대 대화 턴 일괄 INSERT, TASK-0021-01 메타 등록, SESSION-0021 완료 승급, 신규 세션 [0022] 하네스 착수 및 BACKLOG-0021-01 거버넌스 가이드 수립',
        branch: 'task/0022_01_DB동기화_및_거버넌스보완_Gemini',
        operator_account: 'jkoogit',
        user_email: 'jkoogit@gmail.com'
      },
      created_sys: 'agent-harness',
      created_by: 'jkoogit',
      updated_sys: 'agent-harness',
      updated_by: 'jkoogit',
      version: 1
    };
    store.sessions = [s22, ...(store.sessions || [])];
  }

  // Update tasks
  const otherTasks = (store.tasks || []).filter((t: any) => t.task_id !== taskObj.task_id);
  store.tasks = [taskObj, ...otherTasks];
  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
  console.log(`✅ data/local_agent_store.json 에 TASK-0022-01 등록 완료`);

  // 2. Insert into remote DB
  const sql = `
    INSERT INTO aiagent.harness_task_meta (
      task_id, session_id, task_name, status_cd, git_branch,
      started_at, ended_at, doc_payload,
      created_sys, created_by, updated_sys, updated_by, version
    ) VALUES (
      ${escapeSql(taskObj.task_id)}, ${escapeSql(taskObj.session_id)}, ${escapeSql(taskObj.task_name)}, ${escapeSql(taskObj.status_cd)}, ${escapeSql(taskObj.git_branch)},
      ${escapeSql(taskObj.started_at)}, ${escapeSql(taskObj.ended_at)}, ${escapeSql(JSON.stringify(taskObj.doc_payload))}::jsonb,
      'agent-harness', 'jkoogit', 'agent-harness', 'jkoogit', 2
    ) ON CONFLICT (task_id) DO UPDATE SET
      task_name = EXCLUDED.task_name,
      status_cd = EXCLUDED.status_cd,
      git_branch = EXCLUDED.git_branch,
      ended_at = EXCLUDED.ended_at,
      doc_payload = EXCLUDED.doc_payload,
      updated_at = now(),
      version = aiagent.harness_task_meta.version + 1;
  `;
  const dbRes = await executeSql(sql);
  console.log('✅ DB aiagent.harness_task_meta 등록 결과:', dbRes?.success ? '성공' : dbRes?.error);
}

main().catch(console.error);
