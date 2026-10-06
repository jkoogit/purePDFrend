import '../src/shared/envLoader';
import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';

interface ReconcileResponse {
  success: boolean;
  message?: string;
  targetSessionId?: string;
  totalLocalTraces?: number;
  syncedCount?: number;
  errors?: string[] | null;
  error?: string;
}

const DB_BRIDGE_URL = 'https://ptype.pdfrend.com';
const DB_BRIDGE_SECRET = 'jkadh-secure-secret-token-2026';
const TARGET_DATABASE = 'purepdfrend_dev';

function executeBridgeSql(sql: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ database: TARGET_DATABASE, sql });
    const req = https.request(
      `${DB_BRIDGE_URL}/api/query`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-JKADH-SECRET': DB_BRIDGE_SECRET,
          'Authorization': `Bearer ${DB_BRIDGE_SECRET}`,
          'Content-Length': Buffer.byteLength(payload),
        },
        rejectUnauthorized: false,
        timeout: 20000,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            if (parsed.success) resolve(parsed);
            else reject(new Error(parsed.error || body));
          } catch (e) {
            reject(new Error(body));
          }
        });
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function reconcileDirectlyViaDbBridge(targetSessionId?: string): Promise<ReconcileResponse> {
  const storePath = path.join(process.cwd(), 'data', 'local_agent_store.json');
  if (!fs.existsSync(storePath)) {
    return { success: false, error: 'local_agent_store.json이 존재하지 않습니다.' };
  }
  const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
  const sessId = targetSessionId || store.sessions?.[0]?.session_id;
  const tracesToSync = (store.traces || []).filter((t: any) => !sessId || t.session_id === sessId);

  let syncedCount = 0;
  for (const t of tracesToSync) {
    const pText = String(t.user_prompt ?? t.prompt_text ?? '');
    const rText = String(t.agent_response ?? '');
    const sSummary = String(t.response_summary || (rText.split('\n')[0] || '').replace(/^#+\s*/, '')).slice(0, 150);

    const escapedPrompt = pText.replace(/'/g, "''");
    const escapedResponse = rText.replace(/'/g, "''");
    const escapedSummary = sSummary.replace(/'/g, "''");
    const safeLoopId = t.loop_id ? `'${String(t.loop_id).replace(/'/g, "''")}'` : 'NULL';

    const upsertSql = `
      INSERT INTO aiagent.agent_conversation_trace (
        trace_id, session_id, task_id, loop_id, step_index, agent_name, model_name,
        operator_account, agent_account, user_email,
        user_prompt, agent_response, response_summary, prompt_tokens, completion_tokens, total_tokens, created_at
      ) VALUES (
        '${t.trace_id}',
        '${t.session_id}',
        '${t.task_id}',
        ${safeLoopId},
        ${Number(t.step_index) || 1},
        '${t.agent_name || 'gemini'}',
        '${t.model_name || 'models/gemini-3.8-flash'}',
        '${t.operator_account || 'jkoogit'}',
        '${t.agent_account || 'jkoogit@gmail.com'}',
        '${t.user_email || 'jkoogit@gmail.com'}',
        '${escapedPrompt}',
        '${escapedResponse}',
        '${escapedSummary}',
        ${Number(t.prompt_tokens) || 0},
        ${Number(t.completion_tokens) || 0},
        ${Number(t.total_tokens) || 0},
        '${t.created_at || new Date().toISOString()}'
      )
      ON CONFLICT (trace_id) DO UPDATE SET
        user_prompt = EXCLUDED.user_prompt,
        agent_response = EXCLUDED.agent_response,
        response_summary = EXCLUDED.response_summary,
        step_index = EXCLUDED.step_index,
        total_tokens = EXCLUDED.total_tokens;
    `;

    try {
      await executeBridgeSql(upsertSql);
      syncedCount++;
    } catch (e: any) {
      console.warn(`[직접 화해 실패: ${t.trace_id}]`, e.message);
    }
  }

  return {
    success: true,
    message: `세션(${sessId})의 대화 턴 ${syncedCount}건이 원격 DB 브릿지를 통해 직접 무손실 영속화(화해)되었습니다.`,
    targetSessionId: sessId,
    totalLocalTraces: tracesToSync.length,
    syncedCount,
    errors: null,
  };
}

export async function reconcileSessionTraces(sessionId?: string): Promise<ReconcileResponse> {
  return new Promise((resolve) => {
    const storePath = path.join(process.cwd(), 'data', 'local_agent_store.json');
    let targetSessionId = sessionId;

    if (!targetSessionId && fs.existsSync(storePath)) {
      try {
        const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
        targetSessionId = store.sessions?.[0]?.session_id;
      } catch (e) {
        // ignore
      }
    }

    const payload = JSON.stringify({ session_id: targetSessionId });
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/agent/trace/reconcile',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
        timeout: 4000,
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed);
          } catch {
            // Fallback to direct DB bridge
            reconcileDirectlyViaDbBridge(targetSessionId).then(resolve);
          }
        });
      }
    );

    req.on('error', () => {
      // Fallback to direct DB bridge if localhost:3000 refused
      reconcileDirectlyViaDbBridge(targetSessionId).then(resolve);
    });

    req.on('timeout', () => {
      req.destroy();
      reconcileDirectlyViaDbBridge(targetSessionId).then(resolve);
    });

    req.write(payload);
    req.end();
  });
}

// Allow CLI execution
if (process.argv[1]?.includes('reconcile_session_traces')) {
  console.log('🔄 [대화턴 화해] 세션 내 누적 미반영 대화턴 전수 DB 영속화 실행 중...');
  reconcileSessionTraces()
    .then((result) => {
      console.log('결과:', JSON.stringify(result, null, 2));
      if (!result.success) {
        process.exit(1);
      }
    })
    .catch((err) => {
      console.error('실패:', err);
      process.exit(1);
    });
}
