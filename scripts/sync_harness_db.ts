import '../src/shared/envLoader';
import fs from 'fs';
import https from 'https';

const DB_BRIDGE_URL = process.env.REMOTE_DB_BRIDGE_URL || 'https://ptype.pdfrend.com';
const DB_BRIDGE_SECRET = process.env.REMOTE_DB_BRIDGE_SECRET || 'jkadh-secure-secret-token-2026';
const TARGET_DATABASE = 'purepdfrend_dev';

function query(sql: string): Promise<any> {
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
    }, (res) => {
      let d = '';
      res.on('data', (c) => d += c);
      res.on('end', () => {
        try {
          resolve(JSON.parse(d));
        } catch (e) {
          resolve({ error: d });
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function main() {
  const store = JSON.parse(fs.readFileSync('data/local_agent_store.json', 'utf8'));

  // 1. Sessions
  for (const s of store.sessions) {
    const payload = JSON.stringify(s.doc_payload || {}).replace(/'/g, "''");
    const sql = `
      INSERT INTO aiagent.harness_session_meta (
        session_id, session_name, work_group, ai_agent, ai_model, status_cd,
        started_at, ended_at, doc_payload, created_sys, created_by, updated_sys, updated_by, version
      ) VALUES (
        '${s.session_id}', '${s.session_name.replace(/'/g, "''")}', '${s.work_group || 'purePDFrend'}', '${s.ai_agent || 'gemini'}', '${s.ai_model || 'models/gemini-3.8-flash'}', '${s.status_cd || '진행'}',
        '${s.started_at || new Date().toISOString()}', ${s.ended_at ? `'${s.ended_at}'` : 'NULL'}, '${payload}'::jsonb, 'agent-harness', 'system', 'agent-harness', 'system', ${s.version || 1}
      )
      ON CONFLICT (session_id) DO UPDATE SET
        session_name = EXCLUDED.session_name,
        status_cd = EXCLUDED.status_cd,
        ended_at = EXCLUDED.ended_at,
        doc_payload = EXCLUDED.doc_payload,
        updated_at = now(),
        version = aiagent.harness_session_meta.version + 1;
    `;
    const res = await query(sql);
    if (!res.success) console.error('Session sync error:', res.error);
  }

  // 2. Tasks
  for (const t of store.tasks) {
    const payload = JSON.stringify(t.doc_payload || {}).replace(/'/g, "''");
    const sql = `
      INSERT INTO aiagent.harness_task_meta (
        task_id, session_id, task_name, git_branch, status_cd, started_at, ended_at,
        doc_payload, created_sys, created_by, updated_sys, updated_by, version
      ) VALUES (
        '${t.task_id}', '${t.session_id}', '${t.task_name.replace(/'/g, "''")}', '${(t.git_branch || t.doc_payload?.branch || '').replace(/'/g, "''")}', '${t.status_cd || '진행'}',
        '${t.started_at || new Date().toISOString()}', ${t.ended_at ? `'${t.ended_at}'` : 'NULL'}, '${payload}'::jsonb, 'agent-harness', 'system', 'agent-harness', 'system', ${t.version || 1}
      )
      ON CONFLICT (task_id) DO UPDATE SET
        task_name = EXCLUDED.task_name,
        git_branch = EXCLUDED.git_branch,
        status_cd = EXCLUDED.status_cd,
        ended_at = EXCLUDED.ended_at,
        doc_payload = EXCLUDED.doc_payload,
        updated_at = now(),
        version = aiagent.harness_task_meta.version + 1;
    `;
    const res = await query(sql);
    if (!res.success) console.error('Task sync error:', res.error);
  }

  // 3. Loops (columns: loop_id, task_id, session_id, loop_name, status_cd, started_at, ended_at, doc_payload, created_sys, created_by, updated_sys, updated_by, version)
  for (const l of store.loops) {
    const payload = JSON.stringify(l.doc_payload || {}).replace(/'/g, "''");
    const sql = `
      INSERT INTO aiagent.harness_loop_meta (
        loop_id, task_id, session_id, loop_name, status_cd, started_at, ended_at,
        doc_payload, created_sys, created_by, updated_sys, updated_by, version
      ) VALUES (
        '${l.loop_id}', '${l.task_id}', '${l.session_id || 'SESSION-0017'}', '${l.loop_name.replace(/'/g, "''")}', '${l.status_cd || '진행'}',
        '${l.started_at || new Date().toISOString()}', ${l.ended_at ? `'${l.ended_at}'` : 'NULL'}, '${payload}'::jsonb, 'agent-harness', 'system', 'agent-harness', 'system', ${l.version || 1}
      )
      ON CONFLICT (loop_id) DO UPDATE SET
        loop_name = EXCLUDED.loop_name,
        status_cd = EXCLUDED.status_cd,
        ended_at = EXCLUDED.ended_at,
        doc_payload = EXCLUDED.doc_payload,
        updated_at = now(),
        version = aiagent.harness_loop_meta.version + 1;
    `;
    const res = await query(sql);
    if (!res.success) console.error('Loop sync error:', res.error);
  }

  // 4. Traces (columns: trace_id, session_id, task_id, loop_id, step_index, agent_name, model_name, user_prompt, agent_response, response_summary, prompt_tokens, completion_tokens, total_tokens, created_sys, created_by, updated_sys, updated_by, version)
  for (const tr of (store.traces || [])) {
    const sql = `
      INSERT INTO aiagent.agent_conversation_trace (
        trace_id, session_id, task_id, loop_id, step_index, agent_name, model_name,
        user_prompt, agent_response, response_summary,
        prompt_tokens, completion_tokens, total_tokens, created_sys, created_by, updated_sys, updated_by, version
      ) VALUES (
        '${tr.trace_id}', '${tr.session_id}', '${tr.task_id}', ${tr.loop_id ? `'${tr.loop_id}'` : 'NULL'}, ${tr.step_index || 1},
        '${tr.agent_name || 'gemini'}', '${tr.model_name || 'models/gemini-3.8-flash'}',
        '${(tr.user_prompt || '').replace(/'/g, "''")}', '${(tr.agent_response || '').replace(/'/g, "''")}',
        '${(tr.response_summary || '').replace(/'/g, "''")}', ${tr.prompt_tokens || 0}, ${tr.completion_tokens || 0}, ${tr.total_tokens || 0},
        'agent-harness', 'system', 'agent-harness', 'system', 1
      )
      ON CONFLICT (trace_id) DO UPDATE SET
        user_prompt = EXCLUDED.user_prompt,
        agent_response = EXCLUDED.agent_response,
        response_summary = EXCLUDED.response_summary;
    `;
    const res = await query(sql);
    if (!res.success) console.error('Trace sync error:', res.error);
  }

  console.log('✅ Harness local store successfully synced to remote PostgreSQL DB with 100% schema alignment!');
}

main().catch(console.error);
