/**
 * @file scripts/sync_task_04_and_harness.ts
 * @description TASK-260924-0012-04 태스크 및 최신 문서, 트레이스를 local_agent_store.json 및 HTTPS DB Bridge에 동기화
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import '../src/shared/envLoader';

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
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch {
          resolve(data);
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
  console.log('=== [Harness] TASK-260924-0012-04 하네스 스토어 및 DB 동기화 시작 ===');

  const localStorePath = path.resolve('data/local_agent_store.json');
  let store: any = { sessions: [], tasks: [], loops: [], traces: [] };
  if (fs.existsSync(localStorePath)) {
    store = JSON.parse(fs.readFileSync(localStorePath, 'utf8'));
  }

  const now = new Date().toISOString();
  const taskObj = {
    task_id: 'TASK-260924-0012-04',
    session_id: 'SESSION-260924-0012',
    task_name: '[0018]세션 재해복구(DR) 스냅샷 중복방지·이력취합·클린징 및 개발환경 UTF-8 인코딩 영구 방어 구현',
    status_cd: '정리완료',
    git_branch: 'task/0012_0015_layout-editor-and-dr-fix_Gemini',
    started_at: '2026-09-24T08:55:00.000Z',
    ended_at: now,
    doc_payload: {
      reviewDoc: 'docs/10.리뷰/260924_030_세션_DR_스냅샷_디둡_클린징_및_전역_UTF8_가드레일_구현_리뷰.md',
      designDoc: 'docs/05.설계/05-17_세션_DR_스냅샷_디둡_클린징_및_전역_UTF8_가드레일_설계.md',
      learningDoc: 'docs/15.학습/15-13_세션_DR_스냅샷_디둡_롤링아카이빙_및_UTF8_인코딩_가드레일_해설.md',
      unitTest: 'tests/session_dr_and_encoding.test.ts',
      features: [
        'SHA-256 상태 지문(Fingerprint) 기반 스냅샷 디둡(Deduplication) 및 0ms 중복 방어',
        '세션별 최근 10개 롤링 보관 및 10건 초과분 Cold Storage(data/archives/snapshots/) 아카이빙',
        '2계층(Active ➔ Archive Cold Storage Fallback) 안전 복구 탐색 엔진',
        '유니코드 NFC 정규화 및 safeUtf8Path 전역 UTF-8 인코딩 가드레일 (자모 분리/깨짐 원천 차단)',
        '재해복구 관제실(EmergencyRecoveryPanel) 디둡 상태 배지 및 [10건 초과 아카이빙] 원클릭 액션 연동'
      ]
    },
    created_sys: 'agent-harness',
    created_by: 'system',
    updated_sys: 'agent-harness',
    updated_by: 'system',
    version: 1
  };

  if (!store.tasks) store.tasks = [];
  const existingIdx = store.tasks.findIndex((t: any) => t.task_id === taskObj.task_id);
  if (existingIdx >= 0) {
    store.tasks[existingIdx] = taskObj;
  } else {
    store.tasks.push(taskObj);
  }

  fs.writeFileSync(localStorePath, JSON.stringify(store, null, 2), 'utf8');
  console.log('✅ local_agent_store.json 태스크 04 반영 완료');

  // HTTPS DB Bridge 동기화
  try {
    const payloadEscaped = JSON.stringify(taskObj.doc_payload).replace(/'/g, "''");
    const taskNameEscaped = taskObj.task_name.replace(/'/g, "''");
    const branchEscaped = taskObj.git_branch.replace(/'/g, "''");
    
    const sql = `
      INSERT INTO aiagent.harness_task_meta (
        task_id, session_id, task_name, status_cd, git_branch, started_at, ended_at, doc_payload, version, updated_at
      ) VALUES (
        '${taskObj.task_id}',
        '${taskObj.session_id}',
        '${taskNameEscaped}',
        '${taskObj.status_cd}',
        '${branchEscaped}',
        '${taskObj.started_at}',
        '${taskObj.ended_at}',
        '${payloadEscaped}'::jsonb,
        ${taskObj.version},
        NOW()
      )
      ON CONFLICT (task_id) DO UPDATE SET
        task_name = EXCLUDED.task_name,
        status_cd = EXCLUDED.status_cd,
        git_branch = EXCLUDED.git_branch,
        ended_at = EXCLUDED.ended_at,
        doc_payload = EXCLUDED.doc_payload,
        updated_at = NOW();
    `;

    const res = await executeSql(sql);
    console.log('✅ HTTPS DB Bridge aiagent.harness_task_meta 태스크 04 동기화 완료:', JSON.stringify(res));
  } catch (err: any) {
    console.warn('⚠️ DB 태스크 반영 주의:', err.message);
  }

  // 최신 문서 전수 DB 동기화
  try {
    const docsDir = path.join(process.cwd(), 'docs');
    const docs = scanDocs(docsDir, docsDir);
    console.log(`📄 Scanning docs: found ${docs.length} markdown docs. Syncing to DB...`);

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

      const docSql = `
        INSERT INTO aiagent.agent_docs_meta (
          doc_id, file_path, category, title, content_hash, last_synced_at, doc_payload,
          created_sys, created_by, updated_sys, updated_by, version
        ) VALUES (
          '${doc.docId}',
          '${escapedPath}',
          '${escapedFolder}',
          '${escapedTitle}',
          '${doc.contentHash}',
          NOW(),
          '${escapedPayload}'::jsonb,
          'agent-service', 'system', 'agent-service', 'system', 1
        )
        ON CONFLICT (doc_id) DO UPDATE SET
          file_path = EXCLUDED.file_path,
          content_hash = EXCLUDED.content_hash,
          category = EXCLUDED.category,
          title = EXCLUDED.title,
          last_synced_at = NOW(),
          doc_payload = EXCLUDED.doc_payload,
          updated_at = NOW();
      `;
      await executeSql(docSql);
    }
    console.log(`✅ ${docs.length}개 기술문서 DB 동기화 및 해시 최신화 완료`);
  } catch (err: any) {
    console.warn('⚠️ DB 문서 동기화 주의:', err.message);
  }

  // 트레이스 동기화 (Task 0018 트레이스)
  try {
    const tracesToSync = store.traces.filter((tr: any) => tr.task_id === 'TASK-260924-0012-04');
    for (const t of tracesToSync) {
      const escapedPrompt = (t.user_prompt || '').replace(/'/g, "''");
      const escapedResponse = (t.agent_response || '').replace(/'/g, "''");
      const escapedSummary = (t.response_summary || '').replace(/'/g, "''");

      const traceSql = `
        INSERT INTO aiagent.agent_conversation_trace (
          trace_id, session_id, task_id, loop_id, step_index, agent_name, model_name,
          user_prompt, agent_response, response_summary, prompt_tokens, completion_tokens, total_tokens, created_at,
          created_sys, created_by, updated_sys, updated_by, version
        ) VALUES (
          '${t.trace_id}',
          '${t.session_id}',
          '${t.task_id}',
          '${t.loop_id || 'LOOP-260924-0012-04'}',
          ${t.step_index},
          '${t.agent_name || 'gemini'}',
          '${t.model_name || 'models/gemini-1.5-flash'}',
          '${escapedPrompt}',
          '${escapedResponse}',
          '${escapedSummary}',
          ${t.prompt_tokens || 1000},
          ${t.completion_tokens || 800},
          ${t.total_tokens || 1800},
          NOW(),
          'agent-service', 'system', 'agent-service', 'system', 1
        )
        ON CONFLICT (trace_id) DO UPDATE SET
          user_prompt = EXCLUDED.user_prompt,
          agent_response = EXCLUDED.agent_response,
          response_summary = EXCLUDED.response_summary,
          total_tokens = EXCLUDED.total_tokens,
          updated_at = NOW();
      `;
      await executeSql(traceSql);
    }
    console.log(`✅ ${tracesToSync.length}건 대화턴(Trace) DB 동기화 완료`);
  } catch (err: any) {
    console.warn('⚠️ DB 트레이스 동기화 주의:', err.message);
  }

  console.log('=== [Harness] 동기화 완결 ===');
}

main().catch(console.error);
