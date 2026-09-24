import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import https from 'https';

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
      timeout: 25000,
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

function getAllMarkdownFiles(dir: string, baseDir: string = dir): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git') {
        files = files.concat(getAllMarkdownFiles(fullPath, baseDir));
      }
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(relPath);
    }
  }

  return files;
}

async function main() {
  console.log('=== [Docs DB Sync] Scanning all markdown files in docs/ ===');
  const docsDir = path.resolve(process.cwd(), 'docs');
  const relFiles = getAllMarkdownFiles(docsDir, process.cwd());
  console.log(`Found ${relFiles.length} markdown documents.`);

  for (let i = 0; i < relFiles.length; i++) {
    const relPath = relFiles[i];
    const fullPath = path.resolve(process.cwd(), relPath);
    const content = fs.readFileSync(fullPath, 'utf8');
    const hash = crypto.createHash('sha256').update(content, 'utf8').digest('hex');
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : path.basename(relPath);
    const linesCount = content.split('\n').length;
    const sizeBytes = Buffer.byteLength(content, 'utf8');
    const categoryCd = relPath.split('/')[1] || '기타';

    const escapedContent = content.replace(/'/g, "''");
    const escapedTitle = title.replace(/'/g, "''");

    const sql = `
      INSERT INTO aiagent.agent_docs_meta (
        file_path, doc_title, category_cd, sha256_hash, lines_count, size_bytes, raw_content, updated_at
      ) VALUES (
        '${relPath}',
        '${escapedTitle}',
        '${categoryCd}',
        '${hash}',
        ${linesCount},
        ${sizeBytes},
        '${escapedContent}',
        NOW()
      )
      ON CONFLICT (file_path) DO UPDATE SET
        doc_title = EXCLUDED.doc_title,
        category_cd = EXCLUDED.category_cd,
        sha256_hash = EXCLUDED.sha256_hash,
        lines_count = EXCLUDED.lines_count,
        size_bytes = EXCLUDED.size_bytes,
        raw_content = EXCLUDED.raw_content,
        updated_at = NOW();
    `;

    try {
      await executeSql(sql);
      process.stdout.write(`[${i + 1}/${relFiles.length}] Synced ${relPath}\r`);
    } catch (err: any) {
      console.warn(`\nFailed to sync ${relPath}:`, err.message);
    }
  }

  console.log(`\n=== All ${relFiles.length} docs successfully synced to PostgreSQL DB! ===`);
}

main().catch(console.error);
