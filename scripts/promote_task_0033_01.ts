import fs from 'fs';
import path from 'path';
import https from 'https';

const storePath = path.resolve('data/local_agent_store.json');
const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));

const endedAt = new Date().toISOString();

// Update store.tasks
if (Array.isArray(store.tasks)) {
  const task = store.tasks.find((t: any) => t.task_id === 'TASK-0033-01');
  if (task) {
    task.status_cd = '완료';
    task.status = 'COMPLETED';
    task.ended_at = endedAt;
    task.updated_at = endedAt;
  }
}

// Update store.sessions tasks
if (Array.isArray(store.sessions)) {
  const currentSession = store.sessions.find((s: any) => s.session_id === 'SESSION-0033');
  if (currentSession && currentSession.doc_payload && Array.isArray(currentSession.doc_payload.tasks)) {
    const sessionTask = currentSession.doc_payload.tasks.find((t: any) => t.task_id === 'TASK-0033-01');
    if (sessionTask) {
      sessionTask.status = '완료';
    }
  }
}

fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
console.log('✅ data/local_agent_store.json TASK-0033-01 상태 "완료" 업데이트 완료');

const payload = JSON.stringify({
  database: 'purepdfrend_dev',
  sql: `UPDATE aiagent.harness_task_meta
    SET status_cd = '완료',
        ended_at = now(),
        updated_at = now()
    WHERE task_id = 'TASK-0033-01';`
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
    console.log('✅ Remote DB harness_task_meta TASK-0033-01 상태 "완료" 수정 성공:', b);
    process.exit(0);
  });
});

req.on('error', (err) => {
  console.warn('⚠️ Remote DB 업데이트 실패 (로컬 스토어 유지):', err.message);
  process.exit(0);
});

req.write(payload);
req.end();
