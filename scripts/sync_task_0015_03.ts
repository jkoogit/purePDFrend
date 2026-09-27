import https from 'https';
import fs from 'fs';

const DB_BRIDGE_URL = 'https://ptype.pdfrend.com';
const DB_BRIDGE_SECRET = 'jkadh-secure-secret-token-2026';
const TARGET_DATABASE = 'purepdfrend_dev';

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

async function main() {
  console.log('=== Registering TASK-0015-03 & LOOP-0015-03-01 to Harness Store & DB ===');

  const OPERATOR = 'jkok2j2m';
  const EMAIL = 'jkok2j2m@gmail.com';

  const taskData = {
    task_id: 'TASK-0015-03',
    session_id: 'SESSION-260926-0015',
    task_name: '[03] DB 영속화 하네스 메타원장 현행화, 계층형 TraceId 표준화 및 통계 상세팝업 연동',
    git_branch: 'task/0015_03_메타원장현행화_TraceId표준화_Gemini',
    status_cd: '진행중',
    operator_account: OPERATOR,
    user_email: EMAIL,
    started_at: '2026-09-27T09:25:00.000Z',
    ended_at: null,
    doc_payload: {
      trace_id_pattern: 'TRACE-세션(4)-태스크(2)-루프(2)-턴(3)-서브(2)',
      sample_trace_id: 'TRACE-0015-01-03-001-01',
      operator_account: OPERATOR,
      user_email: EMAIL,
      features: [
        'DB/로컬 세션·태스크·루프 계정정보(jkok2j2m@gmail.com) 추가',
        '대화턴 93건 전수 계층형 TraceId 표준화 마이그레이션',
        '에이전트 통계 UI: TraceId 클릭 시 세션/태스크/루프 메타정보 팝업 연계',
        '에이전트 통계 UI: 사용계정 컬럼 및 프롬프트/응답 전문 상세 팝업'
      ]
    }
  };

  const loopData = {
    loop_id: 'LOOP-0015-03-01',
    task_id: 'TASK-0015-03',
    session_id: 'SESSION-260926-0015',
    loop_name: '하네스 메타원장 계정정보 반영, 계층형 TraceId 변환 및 에이전트 통계 팝업 연동 구현',
    status_cd: '완료',
    operator_account: OPERATOR,
    user_email: EMAIL,
    started_at: '2026-09-27T09:25:00.000Z',
    ended_at: '2026-09-27T09:32:00.000Z',
    doc_payload: {
      migrated_traces_count: 93,
      components_updated: [
        'src/aiagent/domain/governance/GovernanceIdGenerator.ts',
        'src/types.ts',
        'server.ts',
        'src/aiagent/components/AgentUsageViewer.tsx'
      ]
    }
  };

  // 1. Update local_agent_store.json
  const storePath = 'data/local_agent_store.json';
  const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));

  if (!store.tasks.some((t: any) => t.task_id === taskData.task_id)) {
    store.tasks.push({
      ...taskData,
      created_sys: 'agent-harness',
      created_by: 'system',
      updated_sys: 'agent-harness',
      updated_by: 'system',
      version: 1
    });
  } else {
    store.tasks = store.tasks.map((t: any) => t.task_id === taskData.task_id ? { ...t, ...taskData } : t);
  }

  if (!store.loops.some((l: any) => l.loop_id === loopData.loop_id)) {
    store.loops.push({
      ...loopData,
      created_sys: 'agent-harness',
      created_by: 'system',
      updated_sys: 'agent-harness',
      updated_by: 'system',
      version: 1
    });
  } else {
    store.loops = store.loops.map((l: any) => l.loop_id === loopData.loop_id ? { ...l, ...loopData } : l);
  }

  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
  console.log('✅ Updated data/local_agent_store.json with TASK-0015-03');

  // 2. Insert/Update Remote DB
  const taskSql = `
    INSERT INTO aiagent.harness_task_meta (
      task_id, session_id, task_name, git_branch, status_cd,
      started_at, ended_at, doc_payload,
      created_sys, created_by, updated_sys, updated_by, version
    ) VALUES (
      '${taskData.task_id}', '${taskData.session_id}', '${taskData.task_name}', '${taskData.git_branch}', '${taskData.status_cd}',
      '${taskData.started_at}', ${taskData.ended_at ? `'${taskData.ended_at}'` : 'NULL'}, '${JSON.stringify(taskData.doc_payload)}'::jsonb,
      'agent-harness', 'system', 'agent-harness', 'system', 1
    ) ON CONFLICT (task_id) DO UPDATE SET
      task_name = EXCLUDED.task_name,
      git_branch = EXCLUDED.git_branch,
      status_cd = EXCLUDED.status_cd,
      ended_at = EXCLUDED.ended_at,
      doc_payload = EXCLUDED.doc_payload,
      updated_at = now();
  `;
  await executeSql(taskSql);

  const loopSql = `
    INSERT INTO aiagent.harness_loop_meta (
      loop_id, task_id, session_id, loop_name, status_cd,
      started_at, ended_at, doc_payload,
      created_sys, created_by, updated_sys, updated_by, version
    ) VALUES (
      '${loopData.loop_id}', '${loopData.task_id}', '${loopData.session_id}', '${loopData.loop_name}', '${loopData.status_cd}',
      '${loopData.started_at}', '${loopData.ended_at}', '${JSON.stringify(loopData.doc_payload)}'::jsonb,
      'agent-harness', 'system', 'agent-harness', 'system', 1
    ) ON CONFLICT (loop_id) DO UPDATE SET
      loop_name = EXCLUDED.loop_name,
      status_cd = EXCLUDED.status_cd,
      ended_at = EXCLUDED.ended_at,
      doc_payload = EXCLUDED.doc_payload,
      updated_at = now();
  `;
  await executeSql(loopSql);
  console.log('✅ Remote DB synchronized for TASK-0015-03 & LOOP-0015-03-01');
}

main().catch(console.error);
