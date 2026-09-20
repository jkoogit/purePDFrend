import https from 'https';
import fs from 'fs';
import path from 'path';

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
      const stat = fs.statSync(full);
      const parts = rel.split('/');
      const folder = parts.length > 1 ? parts[0] : '루트';
      const docId = `DOC-${rel.replace(/[\/\.]/g, '-').toUpperCase()}`;

      list.push({
        docId,
        filePath: `docs/${rel}`,
        folder,
        fileName: entry.name,
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

    const sql = `
      UPDATE aiagent.agent_docs_meta
      SET doc_payload = '${escapedPayload}'::jsonb,
          updated_at = now()
      WHERE doc_id = '${doc.docId}';
    `;
    const res = await executeSql(sql);
    console.log(`Updated ${doc.docId}: ${res.rowCount || 1} rows affected.`);
  }

  console.log('All documents updated with full markdown content.');
}

main().catch(console.error);
