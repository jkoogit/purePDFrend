import https from 'https';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DB_BRIDGE_URL = 'https://ptype.pdfrend.com';
const DB_BRIDGE_SECRET = 'jkadh-secure-secret-token-2026';
const TARGET_DATABASE = 'purepdfrend_dev';

function executeSql(sql: string): Promise<any> {
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
      timeout: 20000,
    }, (res) => {
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
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function scanDocs(dir: string, baseDir = dir): any[] {
  let list: any[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      list = list.concat(scanDocs(full, baseDir));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      const rel = path.relative(baseDir, full).replace(/\\/g, '/');
      const content = fs.readFileSync(full, 'utf-8');
      const hash = crypto.createHash('sha256').update(content).digest('hex');
      const stat = fs.statSync(full);
      const parts = rel.split('/');
      const folder = parts.length > 1 ? parts[0] : '루트';
      const title = content.split('\n').find((l) => l.startsWith('#'))?.replace(/^#+\s*/, '') || entry.name;
      const docId = `DOC-${rel.replace(/[\/\.]/g, '-').toUpperCase()}`;

      list.push({
        docId,
        filePath: `docs/${rel}`,
        folder,
        fileName: entry.name,
        title,
        contentHash: hash,
        sizeBytes: stat.size,
        lines: content.split('\n').length,
        content,
      });
    }
  }
  return list;
}

async function main() {
  const docsDir = path.join(process.cwd(), 'docs');
  const docs = scanDocs(docsDir, docsDir);
  console.log(`Scanning docs from ${docsDir}: found ${docs.length} markdown docs.`);

  for (const doc of docs) {
    const payload = JSON.stringify({
      folder: doc.folder,
      fileName: doc.fileName,
      lines: doc.lines,
      size: doc.sizeBytes,
      content: doc.content,
    });
    const escapedPayload = payload.replace(/'/g, "''");
    const escapedTitle = doc.title.replace(/'/g, "''");
    const escapedFolder = doc.folder.replace(/'/g, "''");
    const escapedPath = doc.filePath.replace(/'/g, "''");

    const sql = `
      INSERT INTO aiagent.agent_docs_meta (
        doc_id, file_path, category, title, content_hash, last_synced_at, doc_payload,
        created_sys, created_by, updated_sys, updated_by, version
      ) VALUES (
        '${doc.docId}',
        '${escapedPath}',
        '${escapedFolder}',
        '${escapedTitle}',
        '${doc.contentHash}',
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
    const res = await executeSql(sql);
    console.log(`Upserted ${doc.docId}: ${res.rowCount || 1} rows affected.`);
  }

  console.log('All documents updated and hashed with full markdown content.');
}

main().catch(console.error);
