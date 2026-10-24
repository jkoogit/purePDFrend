import { HarnessRepository } from '../src/aiagent/domain/harness/HarnessRepository';
import https from 'https';

const store = HarnessRepository.getLocalStore();

// Update task in local store
const task = store.tasks.find((t: any) => t.task_id === 'TASK-0034-01');
if (task) {
  task.status = '정리';
  task.status_cd = '정리';
  task.updated_at = new Date().toISOString();
  task.doc_payload = {
    ...task.doc_payload,
    reviewDoc: 'docs/10.리뷰/261024_056_Phase4_관리자_2단계_API_연동_및_관리자_tokens_전면완결_코드리뷰.md',
    commitSha: '7c9825d7',
    status: '정리'
  };
}

const activeSession = store.sessions.find((s: any) => s.session_id === 'SESSION-0034');
if (activeSession && activeSession.doc_payload) {
  if (Array.isArray(activeSession.doc_payload.tasks)) {
    const tItem = activeSession.doc_payload.tasks.find((t: any) => t.id === 'TASK-0034-01');
    if (tItem) {
      tItem.status = '정리';
      tItem.reviewDoc = 'docs/10.리뷰/261024_056_Phase4_관리자_2단계_API_연동_및_관리자_tokens_전면완결_코드리뷰.md';
    }
  }
}

HarnessRepository.saveLocalStore(store);
console.log('✅ Local store TASK-0034-01 status updated to 정리');

// Update DB
const payload = JSON.stringify({
  database: 'purepdfrend_dev',
  sql: `UPDATE aiagent.harness_task_meta
        SET status_cd = '정리', updated_at = now()
        WHERE task_id = 'TASK-0034-01';`
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
  res.on('end', () => console.log('원격 DB 태스크 상태 갱신 결과:', b.slice(0, 100)));
});
req.on('error', e => console.log('원격 DB 업데이트 에러 (로컬 정상):', e.message));
req.write(payload);
req.end();
