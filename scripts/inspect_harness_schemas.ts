import https from 'https';

const sql = `
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'aiagent'
  AND table_name IN ('harness_session_meta', 'harness_task_meta', 'harness_loop_meta')
ORDER BY table_name, ordinal_position;
`;

const payload = JSON.stringify({ database: 'purepdfrend_dev', sql });
const req = https.request('https://ptype.pdfrend.com/api/query', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-JKADH-SECRET': 'jkadh-secure-secret-token-2026',
    'Authorization': 'Bearer jkadh-secure-secret-token-2026',
    'Content-Length': Buffer.byteLength(payload)
  }
}, (res) => {
  let b = '';
  res.on('data', c => b += c);
  res.on('end', () => console.log(JSON.stringify(JSON.parse(b), null, 2)));
});
req.write(payload);
req.end();
