import https from 'https';
import fs from 'fs';
import { GovernanceIdGenerator } from '../src/aiagent/domain/governance/GovernanceIdGenerator';

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
      timeout: 30000,
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch (e) { resolve({ error: body }); }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function normalizeSessionId(oldId: string): string {
  const clean = GovernanceIdGenerator.extractSessionNumber(oldId);
  return `SESSION-${clean}`;
}

function normalizeTaskId(oldTaskId: string, newSessionId: string): string {
  // e.g. TASK-260924-0011-01 -> TASK-0011-01, TASK-0015-03 -> TASK-0015-03
  const parts = String(oldTaskId).split('-');
  const tNum = GovernanceIdGenerator.formatTaskNumber(parts[parts.length - 1]);
  const sNum = newSessionId.replace('SESSION-', '');
  return `TASK-${sNum}-${tNum}`;
}

function normalizeLoopId(oldLoopId: string, newTaskId: string): string {
  // e.g. LOOP-260924-0011-01-001 -> LOOP-0011-01-01, LOOP-0015-03-01 -> LOOP-0015-03-01
  const parts = String(oldLoopId).split('-');
  const lNum = String(parts[parts.length - 1]).replace(/[^0-9]/g, '').slice(-2).padStart(2, '0');
  const tParts = newTaskId.split('-');
  const sNum = tParts[1];
  const tNum = tParts[2];
  return `LOOP-${sNum}-${tNum}-${lNum}`;
}

async function main() {
  console.log('=== [1] Local Store Pure Numeric Session ID Migration ===');
  const storePath = 'data/local_agent_store.json';
  const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));

  // 1. Sessions
  store.sessions = store.sessions.map((s: any) => ({
    ...s,
    session_id: normalizeSessionId(s.session_id)
  }));

  // 2. Tasks
  store.tasks = store.tasks.map((t: any) => {
    const newSessionId = normalizeSessionId(t.session_id);
    const newTaskId = normalizeTaskId(t.task_id, newSessionId);
    return {
      ...t,
      session_id: newSessionId,
      task_id: newTaskId
    };
  });

  // 3. Loops
  store.loops = store.loops.map((l: any) => {
    const newSessionId = normalizeSessionId(l.session_id);
    const newTaskId = normalizeTaskId(l.task_id, newSessionId);
    const newLoopId = normalizeLoopId(l.loop_id, newTaskId);
    return {
      ...l,
      session_id: newSessionId,
      task_id: newTaskId,
      loop_id: newLoopId
    };
  });

  // 4. Traces
  store.traces = store.traces.map((tr: any) => {
    const newSessionId = normalizeSessionId(tr.session_id);
    const newTaskId = tr.task_id ? normalizeTaskId(tr.task_id, newSessionId) : null;
    const newLoopId = tr.loop_id ? normalizeLoopId(tr.loop_id, newTaskId || `TASK-${newSessionId.replace('SESSION-', '')}-01`) : null;
    const newTraceId = GovernanceIdGenerator.generateHierarchicalTraceId(
      newSessionId,
      newTaskId,
      newLoopId,
      tr.step_index
    );
    return {
      ...tr,
      session_id: newSessionId,
      task_id: newTaskId,
      loop_id: newLoopId,
      trace_id: newTraceId
    };
  });

  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
  console.log('Local store pure numeric migration done.');

  console.log('\n=== [2] Remote DB Sessions/Tasks/Loops/Traces Pure Numeric Migration ===');

  // DB Sessions
  const allDbSessions = (await executeSql("SELECT * FROM aiagent.harness_session_meta;")).rows || [];
  for (const s of allDbSessions) {
    const newSessionId = normalizeSessionId(s.session_id);
    if (newSessionId !== s.session_id) {
      await executeSql(`
        INSERT INTO aiagent.harness_session_meta (
          session_id, session_name, work_group, ai_agent, ai_model, status_cd, started_at, ended_at, doc_payload, created_sys, created_by, updated_sys, updated_by, version
        ) VALUES (
          '${newSessionId}', '${s.session_name.replace(/'/g, "''")}', '${s.work_group || 'purePDFrend'}', '${s.ai_agent || 'gemini'}', '${s.ai_model || 'models/gemini-3.8-flash'}',
          '${s.status_cd || '완료'}', '${s.started_at}', ${s.ended_at ? `'${s.ended_at}'` : 'NULL'}, '${JSON.stringify(s.doc_payload || {})}'::jsonb,
          'agent-harness', 'system', 'agent-harness', 'system', ${s.version || 1}
        ) ON CONFLICT (session_id) DO UPDATE SET session_name = EXCLUDED.session_name;

        DELETE FROM aiagent.harness_session_meta WHERE session_id = '${s.session_id}';
      `);
    }
  }
  console.log(`DB sessions migrated (${allDbSessions.length} total).`);

  // DB Tasks
  const allDbTasks = (await executeSql("SELECT * FROM aiagent.harness_task_meta;")).rows || [];
  for (const t of allDbTasks) {
    const newSessionId = normalizeSessionId(t.session_id);
    const newTaskId = normalizeTaskId(t.task_id, newSessionId);
    if (newTaskId !== t.task_id || newSessionId !== t.session_id) {
      await executeSql(`
        INSERT INTO aiagent.harness_task_meta (
          task_id, session_id, task_name, git_branch, status_cd, started_at, ended_at, doc_payload, created_sys, created_by, updated_sys, updated_by, version
        ) VALUES (
          '${newTaskId}', '${newSessionId}', '${t.task_name.replace(/'/g, "''")}', '${t.git_branch || ''}', '${t.status_cd || '완료'}',
          '${t.started_at}', ${t.ended_at ? `'${t.ended_at}'` : 'NULL'}, '${JSON.stringify(t.doc_payload || {})}'::jsonb,
          'agent-harness', 'system', 'agent-harness', 'system', ${t.version || 1}
        ) ON CONFLICT (task_id) DO UPDATE SET task_name = EXCLUDED.task_name, session_id = EXCLUDED.session_id;

        DELETE FROM aiagent.harness_task_meta WHERE task_id = '${t.task_id}';
      `);
    }
  }
  console.log(`DB tasks migrated (${allDbTasks.length} total).`);

  // DB Loops
  const allDbLoops = (await executeSql("SELECT * FROM aiagent.harness_loop_meta;")).rows || [];
  for (const l of allDbLoops) {
    const newSessionId = normalizeSessionId(l.session_id);
    const newTaskId = normalizeTaskId(l.task_id, newSessionId);
    const newLoopId = normalizeLoopId(l.loop_id, newTaskId);
    if (newLoopId !== l.loop_id || newTaskId !== l.task_id || newSessionId !== l.session_id) {
      await executeSql(`
        INSERT INTO aiagent.harness_loop_meta (
          loop_id, task_id, session_id, loop_name, status_cd, started_at, ended_at, doc_payload, created_sys, created_by, updated_sys, updated_by, version
        ) VALUES (
          '${newLoopId}', '${newTaskId}', '${newSessionId}', '${l.loop_name.replace(/'/g, "''")}', '${l.status_cd || '완료'}',
          '${l.started_at}', ${l.ended_at ? `'${l.ended_at}'` : 'NULL'}, '${JSON.stringify(l.doc_payload || {})}'::jsonb,
          'agent-harness', 'system', 'agent-harness', 'system', ${l.version || 1}
        ) ON CONFLICT (loop_id) DO UPDATE SET loop_name = EXCLUDED.loop_name, task_id = EXCLUDED.task_id, session_id = EXCLUDED.session_id;

        DELETE FROM aiagent.harness_loop_meta WHERE loop_id = '${l.loop_id}';
      `);
    }
  }
  console.log(`DB loops migrated (${allDbLoops.length} total).`);

  // DB Traces
  const allDbTraces = (await executeSql("SELECT * FROM aiagent.agent_conversation_trace ORDER BY session_id ASC, created_at ASC;")).rows || [];
  await executeSql("DELETE FROM aiagent.agent_conversation_trace;");

  const sessionTraceCount: Record<string, number> = {};
  for (const tr of allDbTraces) {
    const newSessionId = normalizeSessionId(tr.session_id);
    const newTaskId = tr.task_id ? normalizeTaskId(tr.task_id, newSessionId) : null;
    const newLoopId = tr.loop_id ? normalizeLoopId(tr.loop_id, newTaskId || `TASK-${newSessionId.replace('SESSION-', '')}-01`) : null;
    
    sessionTraceCount[newSessionId] = (sessionTraceCount[newSessionId] || 0) + 1;
    const turnIndex = sessionTraceCount[newSessionId];

    const newTraceId = GovernanceIdGenerator.generateHierarchicalTraceId(
      newSessionId,
      newTaskId,
      newLoopId,
      turnIndex
    );

    const safeLoop = newLoopId ? `'${newLoopId}'` : 'NULL';
    const escapedPrompt = String(tr.user_prompt || '').replace(/'/g, "''");
    const escapedResponse = String(tr.agent_response || '').replace(/'/g, "''");
    const escapedSummary = String(tr.response_summary || '').replace(/'/g, "''");

    await executeSql(`
      INSERT INTO aiagent.agent_conversation_trace (
        trace_id, session_id, task_id, loop_id, step_index, agent_name, model_name,
        user_prompt, agent_response, response_summary, prompt_tokens, completion_tokens,
        total_tokens, created_at
      ) VALUES (
        '${newTraceId}', '${newSessionId}', '${newTaskId}', ${safeLoop}, ${turnIndex},
        '${tr.agent_name || 'gemini'}', '${tr.model_name || 'models/gemini-3.8-flash'}',
        '${escapedPrompt}', '${escapedResponse}', '${escapedSummary}',
        ${Number(tr.prompt_tokens) || 0}, ${Number(tr.completion_tokens) || 0}, ${Number(tr.total_tokens) || 0},
        '${tr.created_at || new Date().toISOString()}'
      );
    `);
  }
  console.log(`DB traces migrated cleanly (${allDbTraces.length} total).`);

  const sample = (await executeSql("SELECT trace_id, session_id, task_id, loop_id, step_index FROM aiagent.agent_conversation_trace WHERE session_id = 'SESSION-0015' ORDER BY step_index ASC;")).rows || [];
  console.log('\nSample SESSION-0015 Traces:');
  sample.slice(0, 5).forEach((r: any) => console.log(`   ${r.trace_id} | ${r.session_id} | ${r.task_id} | ${r.loop_id} | #${r.step_index}`));
}

main().catch(console.error);
