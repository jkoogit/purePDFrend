/**
 * @file scripts/sync_task_and_harness.ts
 * @description TASK-260924-0012-02 태스크를 local_agent_store.json 및 HTTPS DB Bridge에 동기화
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
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

async function main() {
  console.log('=== [Harness] TASK-260924-0012-02 하네스 스토어 및 DB 동기화 시작 ===');

  const localStorePath = path.resolve('data/local_agent_store.json');
  let store: any = { sessions: [], tasks: [], loops: [], traces: [] };
  if (fs.existsSync(localStorePath)) {
    store = JSON.parse(fs.readFileSync(localStorePath, 'utf8'));
  }

  const now = new Date().toISOString();
  const taskObj = {
    task_id: 'TASK-260924-0012-02',
    session_id: 'SESSION-260924-0012',
    task_name: '[0016]투명 텍스트 레이어 결합 Searchable PDF 내보내기 파이프라인 구현',
    status_cd: '정리완료',
    git_branch: 'task/0012_0015_layout-editor-and-dr-fix_Gemini',
    started_at: '2026-09-24T02:30:00.000Z',
    ended_at: now,
    doc_payload: {
      reviewDoc: 'docs/10.리뷰/260924_028_투명_텍스트_레이어_결합_Searchable_PDF_내보내기_구현_리뷰.md',
      designDoc: 'docs/05.설계/05-14_투명_텍스트_레이어_결합_Searchable_PDF_내보내기_엔진_설계.md',
      learningDoc: 'docs/15.학습/15-11_pdf-lib_기반_투명_텍스트_레이어_임베딩_및_Searchable_PDF_생성_기법.md',
      unitTest: 'tests/searchable_pdf_export.test.ts',
      features: [
        'pdf-lib 기반 투명 텍스트 레이어(opacity:0) 합성',
        '기본 표준 폰트 및 시스템 등록 커스텀 폰트 레지스트리(FontRegistry)',
        '[도서제목]_ocr_YYYYMMDD.pdf 표준 파일명 규칙 및 메타데이터 주입',
        '소프트 삭제 페이지 자동 배제 및 1..N 완본 PDF 생성',
        'UI 프로그레스 모달(0%~100%) 및 브라우저 원클릭 Blob 다운로드'
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
  console.log('✅ local_agent_store.json 태스크 02 반영 완료');

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
    console.log('✅ HTTPS DB Bridge aiagent.harness_task_meta 태스크 02 동기화 완료:', JSON.stringify(res));
  } catch (err: any) {
    console.warn('⚠️ DB 태스크 반영 주의:', err.message);
  }

  console.log('=== [Harness] 동기화 완결 ===');
}

main().catch(console.error);
