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

async function run() {
  console.log('================================================================');
  console.log('🚀 [TASK-0013-01] 태스크 완료 동기화 (로컬 스토어 & DB)');
  console.log('================================================================');

  const sessionId = 'SESSION-260924-0013';
  const taskId = 'TASK-0013-01';
  const now = new Date().toISOString();

  // 1. local_agent_store.json 갱신
  console.log('\n[1] local_agent_store.json 태스크 상태 갱신...');
  const storePath = path.resolve(process.cwd(), 'data', 'local_agent_store.json');
  let store: any = { sessions: [], tasks: [], loops: [], snapshots: [] };
  if (fs.existsSync(storePath)) {
    store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
  }

  const taskRecord = {
    task_id: taskId,
    session_id: sessionId,
    task_name: '[0013-01]docs/18.메뉴얼 폴더 신설 및 [사용/관리] 서비스별 상세 매뉴얼(v1.0) 작성',
    status_cd: '처리완료',
    git_branch: 'task/0013_0019_manual-and-worker-pipeline_Gemini',
    started_at: '2026-09-24T14:44:28.000Z',
    ended_at: now,
    doc_payload: {
      reviewDoc: 'docs/10.리뷰/260924_031_docs_18_메뉴얼_신설_및_서비스별_상세매뉴얼_작성_리뷰.md',
      manualDocs: [
        'docs/18.메뉴얼/README_메뉴얼.md',
        'docs/18.메뉴얼/18-01_사용자_PDF_스튜디오_이용_매뉴얼.md',
        'docs/18.메뉴얼/18-02_관리자_하네스_및_시스템_운영_매뉴얼.md'
      ],
      svgAssets: [
        'docs/18.메뉴얼/images/v1.0_260924_pdf_studio_viewer.svg',
        'docs/18.메뉴얼/images/v1.0_260924_page_layout_editor.svg',
        'docs/18.메뉴얼/images/v1.0_260924_ocr_correction_studio.svg',
        'docs/18.메뉴얼/images/v1.0_260924_admin_governance_console.svg'
      ],
      features: [
        '19대 기술문서 분류체계 확장 (docs/18.메뉴얼 신설)',
        '18-01 사용자 PDF 스튜디오 이용 매뉴얼 (v1.0) 작성',
        '18-02 관리자 하네스 및 시스템 운영 매뉴얼 (v1.0) 작성',
        '하네스 거버넌스 대화턴 추적 등록일자(created_at) Desc 기본 정렬 적용',
        '세션ID 필터 선택 즉각 반응 및 검색 버튼/Enter 키 이벤트 핸들러 보강'
      ]
    },
    created_sys: 'agent-harness',
    created_by: 'system',
    updated_sys: 'agent-harness',
    updated_by: 'system',
    version: 1,
    updated_at: now
  };

  const existingTaskIdx = (store.tasks || []).findIndex((t: any) => t.task_id === taskId);
  if (existingTaskIdx >= 0) {
    store.tasks[existingTaskIdx] = taskRecord;
  } else {
    store.tasks = store.tasks || [];
    store.tasks.unshift(taskRecord);
  }

  // Session doc_payload 업데이트
  const session = (store.sessions || []).find((s: any) => s.session_id === sessionId);
  if (session) {
    session.updated_at = now;
    session.doc_payload = {
      ...(session.doc_payload || {}),
      currentTask: taskId,
      lastUpdated: now
    };
  }

  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
  console.log(`- local_agent_store.json TASK-0013-01 등록 완료`);

  // 2. DB aiagent.harness_task_meta 갱신
  console.log('\n[2] PostgreSQL DB aiagent.harness_task_meta 동기화...');
  try {
    const payloadEscaped = JSON.stringify(taskRecord.doc_payload).replace(/'/g, "''");
    const taskNameEscaped = taskRecord.task_name.replace(/'/g, "''");

    const sql = `
      INSERT INTO aiagent.harness_task_meta (
        task_id, session_id, task_name, status_cd, git_branch, started_at, ended_at, doc_payload, version, updated_at
      ) VALUES (
        '${taskId}',
        '${sessionId}',
        '${taskNameEscaped}',
        '처리완료',
        '${taskRecord.git_branch}',
        '${taskRecord.started_at}',
        '${now}',
        '${payloadEscaped}'::jsonb,
        1,
        NOW()
      )
      ON CONFLICT (task_id) DO UPDATE SET
        task_name = EXCLUDED.task_name,
        status_cd = EXCLUDED.status_cd,
        doc_payload = EXCLUDED.doc_payload,
        ended_at = EXCLUDED.ended_at,
        updated_at = NOW(),
        version = aiagent.harness_task_meta.version + 1;
    `;
    const res = await executeSql(sql);
    console.log(`- DB aiagent.harness_task_meta 동기화 완료:`, JSON.stringify(res));
  } catch (err: any) {
    console.warn(`- DB 동기화 생략 또는 오류:`, err.message);
  }

  // 3. docs 동기화
  console.log('\n[3] 신규 생성된 docs 문서 DB 동기화...');
  const docFiles = [
    'docs/18.메뉴얼/README_메뉴얼.md',
    'docs/18.메뉴얼/18-01_사용자_PDF_스튜디오_이용_매뉴얼.md',
    'docs/18.메뉴얼/18-02_관리자_하네스_및_시스템_운영_매뉴얼.md',
    'docs/10.리뷰/260924_031_docs_18_메뉴얼_신설_및_서비스별_상세매뉴얼_작성_리뷰.md',
    'docs/10.리뷰/README_리뷰.md',
    'docs/03.정책/03-01_문서작성_및_편집이력_정책.md'
  ];

  for (const relPath of docFiles) {
    const fullPath = path.resolve(process.cwd(), relPath);
    if (!fs.existsSync(fullPath)) continue;

    const content = fs.readFileSync(fullPath, 'utf8');
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : path.basename(relPath);
    const linesCount = content.split('\n').length;
    const sizeBytes = Buffer.byteLength(content, 'utf8');

    const escapedContent = content.replace(/'/g, "''");
    const escapedTitle = title.replace(/'/g, "''");

    const docSql = `
      INSERT INTO aiagent.agent_docs_meta (
        file_path, doc_title, category_cd, sha256_hash, lines_count, size_bytes, raw_content, updated_at
      ) VALUES (
        '${relPath}',
        '${escapedTitle}',
        '${relPath.split('/')[1] || '기타'}',
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
      await executeSql(docSql);
      console.log(`  - 문서 동기화 완료: ${relPath}`);
    } catch (e: any) {
      console.warn(`  - 문서 DB 동기화 실패 (${relPath}): ${e.message}`);
    }
  }

  console.log('\n================================================================');
  console.log('✨ [TASK-0013-01] 태스크 완료 동기화 완결');
  console.log('================================================================');
}

run().catch(console.error);
