import '../src/shared/envLoader';
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

function escapeSql(str: string | null | undefined): string {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
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
  console.log('🔄 1. TASK-0027-01 원격 DB upsert');
  const storePath = path.join(process.cwd(), 'data', 'local_agent_store.json');
  const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
  const task = store.tasks?.find((t: any) => t.task_id === 'TASK-0027-01');

  if (task) {
    task.status_cd = '정리';
    fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');

    const sqlTask = `
      INSERT INTO aiagent.harness_task_meta (
        task_id, session_id, task_name, git_branch, status_cd, started_at, ended_at,
        doc_payload, created_sys, created_by, updated_sys, updated_by, version
      ) VALUES (
        'TASK-0027-01', 'SESSION-0027', ${escapeSql(task.task_name)},
        'task/0027_01_글로벌헤더_테마스위치_관리자API_jkoogit',
        '정리', now(), NULL,
        ${escapeSql(JSON.stringify(task.doc_payload || {}))}::jsonb,
        'agent-harness', 'jkoogit', 'agent-harness', 'jkoogit', 1
      ) ON CONFLICT (task_id) DO UPDATE SET
        session_id = EXCLUDED.session_id,
        task_name = EXCLUDED.task_name,
        git_branch = EXCLUDED.git_branch,
        status_cd = EXCLUDED.status_cd,
        doc_payload = EXCLUDED.doc_payload,
        updated_at = now();
    `;
    const resTask = await executeSql(sqlTask);
    console.log('   TASK-0027-01 DB 반영 결과:', resTask?.success ? '성공' : resTask?.error);
  }

  console.log('🔄 2. 전체 기술문서 해시 동기화');
  const docsDir = path.join(process.cwd(), 'docs');
  const mdFiles = getAllMarkdownFiles(docsDir, process.cwd());
  console.log(`   총 ${mdFiles.length}개 마크다운 문서 스캔됨.`);

  // Get current DB docs
  const dbDocsRes: any = await executeSql('SELECT doc_id, file_path, content_hash FROM aiagent.agent_docs_meta;');
  const dbDocMap = new Map((dbDocsRes.rows || []).map((d: any) => [d.file_path, d]));

  let syncCount = 0;
  for (const relPath of mdFiles) {
    const fullPath = path.join(process.cwd(), relPath);
    const content = fs.readFileSync(fullPath, 'utf8');
    const hash = crypto.createHash('sha256').update(content, 'utf8').digest('hex');
    const existing = dbDocMap.get(relPath);

    if (!existing || existing.content_hash !== hash) {
      const parts = relPath.split('/');
      const category = parts.length > 1 ? parts[1] : '기타';
      const filename = path.basename(relPath, '.md');
      const titleMatch = content.match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1].trim() : filename;
      const normalizedKey = relPath.replace(/[\/\.]/g, '-').toUpperCase();
      const docId = existing?.doc_id || `DOC-${normalizedKey}`;

      const payload = JSON.stringify({
        filename,
        lineCount: content.split('\n').length,
        sizeBytes: Buffer.byteLength(content, 'utf8'),
        content,
      });

      const sql = `
        INSERT INTO aiagent.agent_docs_meta (
          doc_id, file_path, category, title, content_hash, last_synced_at, doc_payload,
          created_sys, created_by, updated_sys, updated_by, version
        ) VALUES (
          ${escapeSql(docId)}, ${escapeSql(relPath)}, ${escapeSql(category)}, ${escapeSql(title)},
          ${escapeSql(hash)}, now(), ${escapeSql(payload)}::jsonb,
          'agent-harness', 'jkoogit', 'agent-harness', 'jkoogit', 1
        ) ON CONFLICT (doc_id) DO UPDATE SET
          file_path = EXCLUDED.file_path,
          category = EXCLUDED.category,
          title = EXCLUDED.title,
          content_hash = EXCLUDED.content_hash,
          last_synced_at = now(),
          doc_payload = EXCLUDED.doc_payload,
          updated_at = now(),
          version = agent_docs_meta.version + 1;
      `;

      await executeSql(sql);
      syncCount++;
    }
  }

  console.log(`   ✅ 문서 ${syncCount}건 원격 DB 동기화 완료!`);
}

main().catch(console.error);

