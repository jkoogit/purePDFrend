import https from 'https';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DB_BRIDGE_URL = 'https://ptype.pdfrend.com';
const DB_BRIDGE_SECRET = 'jkadh-secure-secret-token-2026';
const TARGET_DATABASE = 'purepdfrend_dev';

const rel = '10.리뷰/261024_054_Phase3_관리자1단계_REST_API연동_및_사용자_tokens_전면완결_코드리뷰.md';
const filePath = `docs/${rel}`;
const fullPath = path.resolve(filePath);
const content = fs.readFileSync(fullPath, 'utf-8');
const hash = crypto.createHash('sha256').update(content).digest('hex');
const stat = fs.statSync(fullPath);
const docId = `DOC-${rel.replace(/[\/\.]/g, '-').toUpperCase()}`;
const title = content.split('\n').find((l) => l.startsWith('#'))?.replace(/^#+\s*/, '') || path.basename(rel);

const payloadDoc = JSON.stringify({
  folder: '10.리뷰',
  fileName: path.basename(rel),
  lines: content.split('\n').length,
  size: stat.size,
  content: content,
});

const escapedPayload = payloadDoc.replace(/'/g, "''");
const escapedTitle = title.replace(/'/g, "''");
const escapedFolder = '10.리뷰'.replace(/'/g, "''");
const escapedPath = filePath.replace(/'/g, "''");

const sql = `
  INSERT INTO aiagent.agent_docs_meta (
    doc_id, file_path, category, title, content_hash, last_synced_at, doc_payload,
    created_sys, created_by, updated_sys, updated_by, version
  ) VALUES (
    '${docId}',
    '${escapedPath}',
    '${escapedFolder}',
    '${escapedTitle}',
    '${hash}',
    now(),
    '${escapedPayload}'::jsonb,
    'agent-service', 'system', 'agent-service', 'system', 1
  )
  ON CONFLICT (doc_id) DO UPDATE SET
    file_path = EXCLUDED.file_path,
    content_hash = EXCLUDED.content_hash,
    category = EXCLUDED.category,
    title = EXCLUDED.title,
    last_synced_at = now(),
    doc_payload = EXCLUDED.doc_payload,
    updated_at = now();
`;

const payload = JSON.stringify({
  database: TARGET_DATABASE,
  sql
});

const req = https.request(`${DB_BRIDGE_URL}/api/query`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-JKADH-SECRET': DB_BRIDGE_SECRET,
    'Authorization': `Bearer ${DB_BRIDGE_SECRET}`,
    'Content-Length': Buffer.byteLength(payload),
  },
  rejectUnauthorized: false,
  timeout: 10000,
}, (res) => {
  let b = '';
  res.on('data', c => b += c);
  res.on('end', () => {
    console.log('✅ Single doc sync result:', b);
  });
});

req.write(payload);
req.end();
