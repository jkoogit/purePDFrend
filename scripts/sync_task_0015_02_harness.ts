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
  console.log('=== Syncing TASK-0015-02 & LOOP-0015-02-01 to Harness ===');

  const taskData = {
    task_id: 'TASK-0015-02',
    session_id: 'SESSION-260926-0015',
    task_name: '[02] 리소스점검 및 GitHub 하네스(이슈/PR/브랜치) 거버넌스 현행화',
    git_branch: 'task/0015_02_리소스점검_Gemini',
    status_cd: '완료',
    started_at: '2026-09-27T08:45:00.000Z',
    ended_at: '2026-09-27T08:50:00.000Z',
    doc_payload: {
      github_pr: '#26 ([0015_02] 리소스점검 및 GitHub 하네스 거버넌스 현행화)',
      github_issue: '#25 ([0015_02]_리소스점검)',
      branch_rule: 'task/세션번호_태스크번호_작업명_에이전트명',
      pr_rule: '[세션번호_태스크번호]_작업명',
      issue_rule: '[세션번호_순번]_작업명',
      docs_cleaned: ['docs/10.리뷰', 'docs/18.메뉴얼', 'docs/06.기획']
    }
  };

  const loopData = {
    loop_id: 'LOOP-0015-02-01',
    task_id: 'TASK-0015-02',
    session_id: 'SESSION-260926-0015',
    loop_name: '깨진 문서/폴더 정리, 브랜치/PR/이슈 명명규칙 및 자동 PR생성 머지 구현',
    status_cd: '완료',
    started_at: '2026-09-27T08:45:00.000Z',
    ended_at: '2026-09-27T08:50:00.000Z',
    doc_payload: {
      pr_number: 26,
      issue_number: 25,
      cleaned_folders: ['docs/10.뷰', 'docs/18.메얼']
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
  console.log('✅ Updated data/local_agent_store.json');

  // 2. Insert/Update Remote DB
  const taskSql = `
    INSERT INTO aiagent.harness_task_meta (
      task_id, session_id, task_name, git_branch, status_cd,
      started_at, ended_at, doc_payload,
      created_sys, created_by, updated_sys, updated_by, version
    ) VALUES (
      '${taskData.task_id}', '${taskData.session_id}', '${taskData.task_name}', '${taskData.git_branch}', '${taskData.status_cd}',
      '${taskData.started_at}', '${taskData.ended_at}', '${JSON.stringify(taskData.doc_payload)}'::jsonb,
      'agent-harness', 'system', 'agent-harness', 'system', 1
    ) ON CONFLICT (task_id) DO UPDATE SET
      task_name = EXCLUDED.task_name,
      git_branch = EXCLUDED.git_branch,
      status_cd = EXCLUDED.status_cd,
      ended_at = EXCLUDED.ended_at,
      doc_payload = EXCLUDED.doc_payload,
      updated_at = now();
  `;
  const taskDbRes = await executeSql(taskSql);
  console.log('Task DB upsert:', taskDbRes.success !== false ? 'SUCCESS' : taskDbRes.error);

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
  const loopDbRes = await executeSql(loopSql);
  console.log('Loop DB upsert:', loopDbRes.success !== false ? 'SUCCESS' : loopDbRes.error);
}

main().catch(console.error);
