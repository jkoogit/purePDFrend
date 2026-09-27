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

async function main() {
  console.log('=== [1] 작업정보(세션, 태스크, 루프) ID 및 관련 외래키, 실행계정정보 현행화 ===');

  const OPERATOR_ACCOUNT = 'jkok2j2m';
  const USER_EMAIL = 'jkok2j2m@gmail.com';

  // 1. Local store migration
  const storePath = 'data/local_agent_store.json';
  const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));

  // Update sessions
  store.sessions = store.sessions.map((s: any) => ({
    ...s,
    operator_account: OPERATOR_ACCOUNT,
    user_email: USER_EMAIL,
    doc_payload: {
      ...(s.doc_payload || {}),
      operator_account: OPERATOR_ACCOUNT,
      user_email: USER_EMAIL
    }
  }));

  // Update tasks
  store.tasks = store.tasks.map((t: any) => ({
    ...t,
    operator_account: OPERATOR_ACCOUNT,
    user_email: USER_EMAIL,
    doc_payload: {
      ...(t.doc_payload || {}),
      operator_account: OPERATOR_ACCOUNT,
      user_email: USER_EMAIL
    }
  }));

  // Update loops
  store.loops = store.loops.map((l: any) => ({
    ...l,
    operator_account: OPERATOR_ACCOUNT,
    user_email: USER_EMAIL,
    doc_payload: {
      ...(l.doc_payload || {}),
      operator_account: OPERATOR_ACCOUNT,
      user_email: USER_EMAIL
    }
  }));

  console.log(`Local sessions (${store.sessions.length}), tasks (${store.tasks.length}), loops (${store.loops.length}) updated.`);

  console.log('\n=== [2] 대화턴 TraceId 신규 포맷(TRACE-세션-태스크-루프-턴순번-서브순번) 일괄 마이그레이션 ===');

  // Fetch all traces from DB to perform global migration
  const dbTracesRes = await executeSql(`
    SELECT trace_id, session_id, task_id, loop_id, step_index, agent_name, model_name,
           user_prompt, agent_response, response_summary, prompt_tokens, completion_tokens,
           total_tokens, created_at
    FROM aiagent.agent_conversation_trace
    ORDER BY session_id ASC, created_at ASC;
  `);

  const allDbTraces: any[] = dbTracesRes.rows || [];
  console.log(`Fetched ${allDbTraces.length} traces from remote DB.`);

  // Group traces by session to assign turn indices sequentially
  const sessionTraceCount: Record<string, number> = {};
  const traceMigrationMap: Array<{ oldId: string; newId: string; record: any }> = [];

  for (const t of allDbTraces) {
    const sId = t.session_id || 'SESSION-260926-0015';
    sessionTraceCount[sId] = (sessionTraceCount[sId] || 0) + 1;
    const currentTurn = sessionTraceCount[sId];

    const newTraceId = GovernanceIdGenerator.generateHierarchicalTraceId(
      sId,
      t.task_id,
      t.loop_id,
      currentTurn,
      1
    );

    traceMigrationMap.push({
      oldId: t.trace_id,
      newId: newTraceId,
      record: {
        ...t,
        step_index: currentTurn,
        operator_account: OPERATOR_ACCOUNT,
        user_email: USER_EMAIL
      }
    });
  }

  // Update DB traces
  console.log(`Applying ${traceMigrationMap.length} Trace ID migrations to PostgreSQL DB...`);
  for (let i = 0; i < traceMigrationMap.length; i++) {
    const item = traceMigrationMap[i];
    const rec = item.record;

    const escapedPrompt = String(rec.user_prompt || '').replace(/'/g, "''");
    const escapedResponse = String(rec.agent_response || '').replace(/'/g, "''");
    const escapedSummary = String(rec.response_summary || '').replace(/'/g, "''");
    const safeLoopId = rec.loop_id ? `'${String(rec.loop_id).replace(/'/g, "''")}'` : 'NULL';

    // If ID changed, delete old and insert new (or update if conflict)
    const sql = `
      DELETE FROM aiagent.agent_conversation_trace WHERE trace_id = '${item.oldId}';
      INSERT INTO aiagent.agent_conversation_trace (
        trace_id, session_id, task_id, loop_id, step_index, agent_name, model_name,
        user_prompt, agent_response, response_summary, prompt_tokens, completion_tokens,
        total_tokens, created_at
      ) VALUES (
        '${item.newId}',
        '${rec.session_id}',
        '${rec.task_id}',
        ${safeLoopId},
        ${rec.step_index},
        '${rec.agent_name || 'gemini'}',
        '${rec.model_name || 'models/gemini-3.8-flash'}',
        '${escapedPrompt}',
        '${escapedResponse}',
        '${escapedSummary}',
        ${Number(rec.prompt_tokens) || 0},
        ${Number(rec.completion_tokens) || 0},
        ${Number(rec.total_tokens) || 0},
        '${rec.created_at || new Date().toISOString()}'
      ) ON CONFLICT (trace_id) DO UPDATE SET
        session_id = EXCLUDED.session_id,
        task_id = EXCLUDED.task_id,
        loop_id = EXCLUDED.loop_id,
        step_index = EXCLUDED.step_index,
        user_prompt = EXCLUDED.user_prompt,
        agent_response = EXCLUDED.agent_response;
    `;

    await executeSql(sql);
    if ((i + 1) % 15 === 0 || i === traceMigrationMap.length - 1) {
      console.log(`   Migrated [${i + 1}/${traceMigrationMap.length}] traces to DB.`);
    }
  }

  // Update Local Store traces
  store.traces = traceMigrationMap
    .filter(m => m.record.session_id === 'SESSION-260926-0015')
    .map(m => ({
      trace_id: m.newId,
      session_id: m.record.session_id,
      task_id: m.record.task_id,
      loop_id: m.record.loop_id,
      step_index: m.record.step_index,
      agent_name: m.record.agent_name,
      model_name: m.record.model_name,
      operator_account: OPERATOR_ACCOUNT,
      user_email: USER_EMAIL,
      user_prompt: m.record.user_prompt,
      agent_response: m.record.agent_response,
      response_summary: m.record.response_summary,
      prompt_tokens: m.record.prompt_tokens,
      completion_tokens: m.record.completion_tokens,
      total_tokens: m.record.total_tokens,
      created_at: m.record.created_at
    }));

  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
  console.log(`Local store updated with ${store.traces.length} hierarchical traces for active session!`);

  // Verify in DB
  const verifyRes = await executeSql("SELECT trace_id, session_id, task_id, loop_id, step_index FROM aiagent.agent_conversation_trace WHERE session_id = 'SESSION-260926-0015' ORDER BY step_index ASC;");
  console.log('\nVerified Session 0015 DB traces:');
  (verifyRes.rows || []).forEach((r: any) => console.log(`   ${r.trace_id} (Turn #${r.step_index}) [${r.task_id}] [${r.loop_id}]`));
}

main().catch(console.error);
