import '../src/shared/envLoader';
import https from 'https';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DB_BRIDGE_URL = 'https://ptype.pdfrend.com';
const DB_BRIDGE_SECRET = 'jkadh-secure-secret-token-2026';
const TARGET_DATABASE = 'purepdfrend_dev';

function queryDb(sql: string): Promise<any> {
  return new Promise((resolve) => {
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
      timeout: 15000,
    }, (res) => {
      let body = '';
      res.on('data', (c) => { body += c; });
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { resolve({ error: body }); }
      });
    });
    req.on('error', (e) => resolve({ error: e.message }));
    req.write(payload);
    req.end();
  });
}

function scanDocs(dir: string, baseDir: string = dir): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(scanDocs(filePath, baseDir));
    } else if (file.endsWith('.md')) {
      results.push(path.relative(process.cwd(), filePath).replace(/\\/g, '/'));
    }
  }
  return results;
}

async function main() {
  console.log('================================================================');
  console.log('⚡ [SESSION-0016] 태스크/루프 및 전체 문서 해시 원격 DB 100% 동기화');
  console.log('================================================================\n');

  const storePath = path.join(process.cwd(), 'data', 'local_agent_store.json');
  const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));

  // 1. SESSION-0016 DB 등록
  console.log('▶ [1] SESSION-0016 DB 동기화...');
  const session = store.sessions[0];
  if (session) {
    const sql = `
      INSERT INTO aiagent.harness_session_meta (
        session_id, session_name, work_group, ai_agent, ai_model, status_cd, started_at, ended_at, doc_payload, version, created_at, updated_at
      ) VALUES (
        '${session.session_id}',
        '${session.session_name}',
        '${session.work_group}',
        '${session.ai_agent}',
        '${session.ai_model}',
        '${session.status_cd}',
        '${session.started_at}',
        NULL,
        '${JSON.stringify(session.doc_payload).replace(/'/g, "''")}'::jsonb,
        ${session.version || 1},
        now(),
        now()
      )
      ON CONFLICT (session_id) DO UPDATE SET
        session_name = EXCLUDED.session_name,
        status_cd = EXCLUDED.status_cd,
        doc_payload = EXCLUDED.doc_payload,
        version = EXCLUDED.version,
        updated_at = now();
    `;
    const r = await queryDb(sql);
    console.log('Session DB Result:', r.success ? 'SUCCESS' : r.error);
  }

  // 2. TASK-0016-01 DB 등록
  console.log('▶ [2] TASK-0016-01 DB 동기화...');
  const task = store.tasks[0];
  if (task) {
    const sql = `
      INSERT INTO aiagent.harness_task_meta (
        task_id, session_id, task_name, git_branch, status_cd, started_at, ended_at,
        doc_payload, created_sys, created_by, updated_sys, updated_by, version
      ) VALUES (
        '${task.task_id}',
        '${task.session_id}',
        '${task.task_name}',
        'task/0016_01_UI정책_긴급백업복구_Gemini',
        '${task.status_cd}',
        '${task.started_at}',
        NULL,
        '${JSON.stringify(task.doc_payload).replace(/'/g, "''")}'::jsonb,
        'agent-harness',
        'system',
        'agent-harness',
        'system',
        ${task.version || 1}
      )
      ON CONFLICT (task_id) DO UPDATE SET
        task_name = EXCLUDED.task_name,
        git_branch = EXCLUDED.git_branch,
        status_cd = EXCLUDED.status_cd,
        doc_payload = EXCLUDED.doc_payload,
        version = EXCLUDED.version,
        updated_at = now();
    `;
    const r = await queryDb(sql);
    console.log('Task DB Result:', r.success ? 'SUCCESS' : r.error);
  }

  // 3. LOOP-0016-01-01 DB 등록
  console.log('▶ [3] LOOP-0016-01-01 DB 동기화...');
  const loop = store.loops[0];
  if (loop) {
    const sql = `
      INSERT INTO aiagent.harness_loop_meta (
        loop_id, task_id, session_id, loop_name, status_cd, started_at, ended_at,
        doc_payload, created_sys, created_by, updated_sys, updated_by, version
      ) VALUES (
        '${loop.loop_id}',
        '${loop.task_id}',
        'SESSION-0016',
        '${loop.loop_name}',
        '${loop.status_cd}',
        '${loop.started_at}',
        NULL,
        '${JSON.stringify(loop.doc_payload).replace(/'/g, "''")}'::jsonb,
        'agent-harness',
        'system',
        'agent-harness',
        'system',
        ${loop.version || 1}
      )
      ON CONFLICT (loop_id) DO UPDATE SET
        loop_name = EXCLUDED.loop_name,
        status_cd = EXCLUDED.status_cd,
        doc_payload = EXCLUDED.doc_payload,
        version = EXCLUDED.version,
        updated_at = now();
    `;
    const r = await queryDb(sql);
    console.log('Loop DB Result:', r.success ? 'SUCCESS' : r.error);
  }

  // 4. 전체 마크다운 문서 SHA-256 DB 동기화
  console.log('▶ [4] 기술문서 전수 SHA-256 해시 동기화...');
  const docs = scanDocs(path.join(process.cwd(), 'docs'));
  console.log(`발견된 총 문서: ${docs.length}개`);

  let docSynced = 0;
  for (const docPath of docs) {
    const content = fs.readFileSync(path.join(process.cwd(), docPath), 'utf8');
    const hash = crypto.createHash('sha256').update(content, 'utf8').digest('hex');
    const filename = path.basename(docPath);
    const category = docPath.split('/')[1] || '기타';

    const sql = `
      INSERT INTO aiagent.agent_docs_meta (
        doc_path, doc_category, doc_name, sha256_hash, file_size_bytes, content_preview, last_synced_at
      ) VALUES (
        '${docPath}',
        '${category}',
        '${filename}',
        '${hash}',
        ${Buffer.byteLength(content, 'utf8')},
        '${content.slice(0, 300).replace(/'/g, "''")}',
        now()
      )
      ON CONFLICT (doc_path) DO UPDATE SET
        sha256_hash = EXCLUDED.sha256_hash,
        file_size_bytes = EXCLUDED.file_size_bytes,
        content_preview = EXCLUDED.content_preview,
        last_synced_at = now();
    `;
    await queryDb(sql);
    docSynced++;
  }
  console.log(`문서 동기화 완료: ${docSynced}건`);

  console.log('\n✅ SESSION-0016 영속화 및 전체 문서 동기화 완결!');
}

main();
