import '../src/shared/envLoader';
import https from 'https';
import fs from 'fs';
import path from 'path';

const DB_BRIDGE_URL = process.env.REMOTE_DB_BRIDGE_URL || 'https://ptype.pdfrend.com';
const DB_BRIDGE_SECRET = process.env.REMOTE_DB_BRIDGE_SECRET || 'jkadh-secure-secret-token-2026';
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
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
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

function escapeSql(str: string | null | undefined): string {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

async function main() {
  console.log('=== Syncing TASK-0032-01 Cleanup to Local Store and DB ===');

  const taskId = 'TASK-0032-01';
  const sessionId = 'SESSION-0032';
  const taskName = '[0032-01] Phase 2 사용자 와이어프레임(PG-USR-05~07) tokens.ts 전면 대입 및 4모드 고대비 표준화';
  const statusCd = '정리';
  const gitBranch = 'task/0032_01_wireframe_tokens_phase2_Gemini';
  const startedAt = '2026-10-23T17:22:00.000Z';
  const endedAt = new Date().toISOString();

  const docPayload = {
    plan_items: [
      '1. PG-USR-05 내 문서관리 상세검색·8대 필터·사이드바·그리드·모달 tokens.ts 전면 대입 (대입률 100%)',
      '2. PG-USR-06 800쪽 대용량 가상뷰어·초슬림 2단 통폐합 툴바·3탭 드로어·플로팅 쪽수 칩 고대비 표준화',
      '3. PG-USR-07 실시간 협업·공유 대시보드 4대 필터·공유카드·권한뱃지 tokens.ts 전면 대입',
      '4. 4모드(Light, Dark, Dawn, System) WCAG AA 4.5:1 이상 고대비 가독성 확보',
      '5. 44px 모바일 최소 터치타깃 및 Zero-Pill 사각 라운딩 규격 100% 준수',
      '6. 정적 컴파일(tsc --noEmit) 0 에러 및 4단계 서비스 전수점검 100점 만점 [A+ (PERFECT)] 달성',
      '7. 코드리뷰 053 발행, README_리뷰.md 색인 현행화 및 원격 dev 브랜치 커밋 동기화'
    ],
    completed_items: [
      'src/ppdf/components/DocumentLibraryViewer.tsx에 themeMode 인터페이스 및 MutationObserver/storage 테마 리스너 탑재',
      'PG-USR-05 8대 상세검색 필터, 카테고리 접힘/트리 패널, 문서 카드 그리드, 테이블 뷰, 4종 모달 themeClasses 치환 완료',
      'PG-USR-06 초슬림 2단 통폐합 툴바, 3탭(북마크/목차/주석) 드로어, 800쪽 가상 캔버스, 좌상단 플로팅 쪽수 칩 themeClasses 바인딩 완료',
      'PG-USR-07 협업 센터 헤더, 4대 공유 필터 칩, 공유 문서 카드, 권한 뱃지 themeClasses 치환 완료',
      '44px 모바일 터치타깃(min-h-[44px]) 및 Zero-Pill 사각 라운딩 규격 전면 강제',
      'tests/wireframe_shells_and_tokens.test.ts 및 scripts/verify_phase2_tokens.ts 단위 테스트 전수 통과',
      'TypeScript 무결성 검증 (tsc --noEmit) 0 에러 통과',
      'docs/07.로드맵/07-02_화면별_디자인_토큰_적용현황_및_단계별_로드맵.md v1.2.0 현행화 완료',
      'docs/10.리뷰/261024_053_Phase2_사용자_와이어프레임_tokens_전면대입_및_가상뷰어_문서관리_4모드_고대비_코드리뷰.md 발행 및 README_리뷰.md 10-53 인덱싱'
    ],
    review_doc: 'docs/10.리뷰/261024_053_Phase2_사용자_와이어프레임_tokens_전면대입_및_가상뷰어_문서관리_4모드_고대비_코드리뷰.md',
    operator_account: 'jkok2j2m',
    user_email: 'jkok2j2m@gmail.com'
  };

  const taskRecord = {
    task_id: taskId,
    session_id: sessionId,
    task_name: taskName,
    status_cd: statusCd,
    priority: 'HIGH',
    assigned_agent: 'gemini',
    git_branch: gitBranch,
    started_at: startedAt,
    ended_at: endedAt,
    doc_payload: docPayload,
    created_sys: 'agent-harness',
    created_by: 'jkok2j2m',
    updated_sys: 'agent-harness',
    updated_by: 'jkok2j2m',
    version: 1,
    status: '정리완료',
    updated_at: endedAt
  };

  // 1. Update local_agent_store.json
  const storePath = path.resolve(process.cwd(), 'data/local_agent_store.json');
  if (fs.existsSync(storePath)) {
    const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
    if (!store.tasks) store.tasks = [];
    const existingIdx = store.tasks.findIndex((t: any) => t.task_id === taskId);
    if (existingIdx >= 0) {
      store.tasks[existingIdx] = { ...store.tasks[existingIdx], ...taskRecord };
    } else {
      store.tasks.unshift(taskRecord);
    }

    if (store.sessions && store.sessions[0] && store.sessions[0].session_id === sessionId) {
      if (!store.sessions[0].doc_payload) store.sessions[0].doc_payload = {};
      if (!store.sessions[0].doc_payload.tasks) store.sessions[0].doc_payload.tasks = [];
      const sessTask = store.sessions[0].doc_payload.tasks.find((t: any) => t.task_id === taskId);
      if (sessTask) {
        sessTask.status = '정리완료';
      } else {
        store.sessions[0].doc_payload.tasks.push({
          task_id: taskId,
          task_name: taskName,
          status: '정리완료'
        });
      }
    }

    fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
    console.log('✅ Local store tasks and session updated successfully.');
  }

  // 2. Sync to PostgreSQL DB
  try {
    const upsertSql = `
      INSERT INTO aiagent.harness_task_meta (
        task_id, session_id, task_name, status_cd, git_branch,
        started_at, ended_at, doc_payload, created_sys, created_by, updated_sys, updated_by, version
      ) VALUES (
        ${escapeSql(taskId)},
        ${escapeSql(sessionId)},
        ${escapeSql(taskName)},
        ${escapeSql(statusCd)},
        ${escapeSql(gitBranch)},
        ${escapeSql(startedAt)}::timestamptz,
        ${escapeSql(endedAt)}::timestamptz,
        ${escapeSql(JSON.stringify(docPayload))}::jsonb,
        'agent-harness',
        'jkok2j2m',
        'agent-harness',
        'jkok2j2m',
        1
      )
      ON CONFLICT (task_id) DO UPDATE SET
        status_cd = EXCLUDED.status_cd,
        ended_at = EXCLUDED.ended_at,
        doc_payload = EXCLUDED.doc_payload,
        updated_sys = EXCLUDED.updated_sys,
        updated_by = EXCLUDED.updated_by,
        version = aiagent.harness_task_meta.version + 1;
    `;
    const res = await executeSql(upsertSql);
    console.log('✅ Remote DB harness_task_meta upsert response:', res);
  } catch (err: any) {
    console.warn('⚠️ Remote DB harness_task_meta upsert notice:', err.message);
  }

  console.log('=== Task Cleanup & Sync Completed ===');
}

main().catch(console.error);
