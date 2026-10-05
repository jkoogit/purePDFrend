import '../src/shared/envLoader';
import http from 'http';
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
        timeout: 15000,
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed);
          } catch {
            resolve({ success: false, error: data });
          }
        });
      }
    );

    req.on('error', (err) => {
      resolve({ success: false, error: err.message });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ success: false, error: 'Reconciliation request timeout' });
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
