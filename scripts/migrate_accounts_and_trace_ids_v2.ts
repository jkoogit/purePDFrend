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

function resolveAccount(sessionId: string): { operator: string; email: string } {
  // jkok2j2m 세션: 9/22 오후 6시(18:00 KST, UTC 09:00) 첫 세션 (SESSION-20260922-006) 과 현재 세션 (SESSION-260926-0015)
  if (sessionId === 'SESSION-20260922-006' || sessionId === 'SESSION-260926-0015') {
    return { operator: 'jkok2j2m', email: 'jkok2j2m@gmail.com' };
  }
  // 그 외 모든 이전 및 중간 세션은 jkoogit
  return { operator: 'jkoogit', email: 'jkoogit@gmail.com' };
}

async function main() {
  console.log('=== [1] 세션/태스크/루프 사용자계정 재분배 (SESSION-006 & SESSION-015: jkok2j2m, 그 외: jkoogit) ===');

  // 1. Update local store
  const storePath = 'data/local_agent_store.json';
  const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));

  store.sessions = store.sessions.map((s: any) => {
    const acc = resolveAccount(s.session_id);
    return {
      ...s,
      operator_account: acc.operator,
      user_email: acc.email,
      doc_payload: {
        ...(s.doc_payload || {}),
        operator_account: acc.operator,
        user_email: acc.email,
      }
    };
  });

  store.tasks = store.tasks.map((t: any) => {
    const acc = resolveAccount(t.session_id);
    return {
      ...t,
      operator_account: acc.operator,
      user_email: acc.email,
      doc_payload: {
        ...(t.doc_payload || {}),
        operator_account: acc.operator,
        user_email: acc.email,
      }
    };
  });

  store.loops = store.loops.map((l: any) => {
    const acc = resolveAccount(l.session_id);
    return {
      ...l,
      operator_account: acc.operator,
      user_email: acc.email,
      doc_payload: {
        ...(l.doc_payload || {}),
        operator_account: acc.operator,
        user_email: acc.email,
      }
    };
  });

  console.log('Local store accounts updated.');

  // 2. Update DB Sessions/Tasks/Loops
  const dbSessions = (await executeSql("SELECT session_id FROM aiagent.harness_session_meta;")).rows || [];
  for (const s of dbSessions) {
    const acc = resolveAccount(s.session_id);
    await executeSql(`
      UPDATE aiagent.harness_session_meta
      SET doc_payload = jsonb_set(jsonb_set(COALESCE(doc_payload, '{}'::jsonb), '{operator_account}', '"${acc.operator}"'), '{user_email}', '"${acc.email}"')
      WHERE session_id = '${s.session_id}';

      UPDATE aiagent.harness_task_meta
      SET doc_payload = jsonb_set(jsonb_set(COALESCE(doc_payload, '{}'::jsonb), '{operator_account}', '"${acc.operator}"'), '{user_email}', '"${acc.email}"')
      WHERE session_id = '${s.session_id}';

      UPDATE aiagent.harness_loop_meta
      SET doc_payload = jsonb_set(jsonb_set(COALESCE(doc_payload, '{}'::jsonb), '{operator_account}', '"${acc.operator}"'), '{user_email}', '"${acc.email}"')
      WHERE session_id = '${s.session_id}';
    `);
  }
  console.log(`Updated accounts in DB for ${dbSessions.length} sessions.`);

  console.log('\n=== [2] 대화턴 TraceId를 TRACE-0002-06-14-01 패턴으로 전수 마이그레이션 ===');

  const allDbTraces: any[] = (await executeSql(`
    SELECT trace_id, session_id, task_id, loop_id, step_index, agent_name, model_name,
           user_prompt, agent_response, response_summary, prompt_tokens, completion_tokens,
           total_tokens, created_at
    FROM aiagent.agent_conversation_trace
    ORDER BY session_id ASC, created_at ASC;
  `)).rows || [];

  console.log(`Fetched ${allDbTraces.length} traces from DB.`);

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
      currentTurn
    );

    const acc = resolveAccount(sId);

    traceMigrationMap.push({
      oldId: t.trace_id,
      newId: newTraceId,
      record: {
        ...t,
        step_index: currentTurn,
        operator_account: acc.operator,
        user_email: acc.email,
      }
    });
  }

  // Wipe and cleanly insert new format traces in DB
  console.log('Re-inserting all traces into PostgreSQL DB...');
  await executeSql("DELETE FROM aiagent.agent_conversation_trace;");

  for (let i = 0; i < traceMigrationMap.length; i++) {
    const item = traceMigrationMap[i];
    const rec = item.record;

    const escapedPrompt = String(rec.user_prompt || '').replace(/'/g, "''");
    const escapedResponse = String(rec.agent_response || '').replace(/'/g, "''");
    const escapedSummary = String(rec.response_summary || '').replace(/'/g, "''");
    const safeLoopId = rec.loop_id ? `'${String(rec.loop_id).replace(/'/g, "''")}'` : 'NULL';

    const sql = `
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
      );
    `;
    await executeSql(sql);
    if ((i + 1) % 20 === 0 || i === traceMigrationMap.length - 1) {
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
      operator_account: m.record.operator_account,
      user_email: m.record.user_email,
      user_prompt: m.record.user_prompt,
      agent_response: m.record.agent_response,
      response_summary: m.record.response_summary,
      prompt_tokens: m.record.prompt_tokens,
      completion_tokens: m.record.completion_tokens,
      total_tokens: m.record.total_tokens,
      created_at: m.record.created_at
    }));

  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
  console.log(`Local store updated with ${store.traces.length} traces!`);

  // Verification samples
  const sampleRes = await executeSql("SELECT trace_id, session_id, task_id, loop_id, step_index FROM aiagent.agent_conversation_trace WHERE session_id = 'SESSION-260926-0015' ORDER BY step_index ASC;");
  console.log('\nSample Session 0015 DB Traces:');
  (sampleRes.rows || []).slice(0, 5).forEach((r: any) => console.log(`   ${r.trace_id} (Turn #${r.step_index})`));
}

main().catch(console.error);
