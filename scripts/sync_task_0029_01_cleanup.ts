import '../src/shared/envLoader';
import https from 'https';
import fs from 'fs';

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

async function syncDocsViaApi() {
  try {
    const res = await fetch('http://localhost:3000/api/agent/docs/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    console.log('Docs sync API response status:', res.status);
  } catch (e: any) {
    console.warn('Docs sync notice:', e.message);
  }
}

async function main() {
  console.log('=== Syncing TASK-0029-01 Cleanup & Turn 5 Trace ===');

  const taskId = 'TASK-0029-01';
  const sessionId = 'SESSION-0029';
  const taskName = '[0029-01] top 영역 가운데 와이어프레임 서비스목록 표시, 로그인 대시보드 및 시스템/로그인 아이콘화';
  const statusCd = '정리';
  const gitBranch = 'task/0029_01_top_wireframe_list_tokens_apply_jkoogit';
  const startedAt = '2026-10-15T05:50:00.000Z';
  const endedAt = '2026-10-15T06:55:00.000Z';

  const docPayload = {
    plan_items: [
      'top 영역 가운데 와이어프레임 서비스목록 표시 (UserShell, AdminShell, WireframeTopLayer, PurePdfServicePortal)',
      '로그인 후 개인화된 로그인 대시보드 표시 (환영배너, 통계, 7대 도구, 최근문서, 800쪽 뷰어 연계)',
      '시스템설정시스템, 에이전트관리, 로그인시스템 버튼 아이콘화 (Settings, Bot, LogIn Lucide 아이콘 전환)'
    ],
    completed_items: [
      'WireframeTopDropdown.tsx 25개 와이어프레임 공통 컴포넌트 신규 구현 및 purepdfrend-navigate-wireframe 전역 이벤트 연동',
      'UserShell 및 AdminShell 상단 헤더 정중앙에 WireframeTopDropdown 배치',
      'WireframeTopLayer 상단 퀵 네비게이션 중앙에 WireframeTopDropdown 연동',
      'PurePdfServicePortal 상단 중앙에 WireframeTopDropdown 배치',
      'PurePdfServicePortal 내 로그인 완료 시 내 작업 대시보드 인터랙티브 뷰 전면 구현 (7대 PDF 코어 도구 카드 및 대용량 800쪽 뷰어 연동)',
      '우측 헤더 툴바 32px 콤팩트 아이콘 버튼화 (Settings, Bot, LogIn, LogOut, Sun/Moon)',
      '코드리뷰 10-49 문서 발행 및 README_리뷰.md 인덱스 현행화',
      'TypeScript 및 Vite 빌드 100% 통과'
    ],
    review_doc: 'docs/10.리뷰/261015_049_와이어프레임_서비스목록_상단중앙배치_로그인대시보드_및_시스템_로그인_아이콘화_코드리뷰.md',
    branch: gitBranch
  };

  // 1. aiagent.harness_task_meta INSERT / UPDATE
  const taskSql = `
    INSERT INTO aiagent.harness_task_meta (
      task_id, session_id, task_name, status_cd,
      git_branch, started_at, ended_at, doc_payload,
      created_sys, created_by, updated_sys, updated_by, version
    ) VALUES (
      ${escapeSql(taskId)},
      ${escapeSql(sessionId)},
      ${escapeSql(taskName)},
      ${escapeSql(statusCd)},
      ${escapeSql(gitBranch)},
      ${escapeSql(startedAt)},
      ${escapeSql(endedAt)},
      ${escapeSql(JSON.stringify(docPayload))}::jsonb,
      'agent-harness',
      'jkoogit',
      'agent-harness',
      'jkoogit',
      1
    )
    ON CONFLICT (task_id) DO UPDATE SET
      task_name = EXCLUDED.task_name,
      status_cd = EXCLUDED.status_cd,
      git_branch = EXCLUDED.git_branch,
      ended_at = EXCLUDED.ended_at,
      doc_payload = EXCLUDED.doc_payload,
      updated_sys = 'agent-harness',
      updated_by = 'jkoogit',
      updated_at = NOW(),
      version = aiagent.harness_task_meta.version + 1;
  `;

  const taskRes = await executeSql(taskSql);
  console.log(`✅ [1/4] DB aiagent.harness_task_meta에 ${taskId} 동기화 완료:`, taskRes);

  // 2. aiagent.harness_session_meta doc_payload 갱신
  const sessionUpdateSql = `
    UPDATE aiagent.harness_session_meta
    SET doc_payload = jsonb_set(
      COALESCE(doc_payload, '{}'::jsonb),
      '{tasks}',
      '[{"task_id":"TASK-0029-01","task_name":"top 영역 가운데 와이어프레임 서비스목록 표시, 로그인 대시보드 및 시스템/로그인 아이콘화","status":"정리"}]'::jsonb
    ),
    updated_at = NOW()
    WHERE session_id = 'SESSION-0029';
  `;
  await executeSql(sessionUpdateSql);
  console.log(`✅ [2/4] DB aiagent.harness_session_meta 태스크 상태 '정리' 반영 완료`);

  // 3. docs sync 실행
  console.log('🔄 [3/4] docs 해시 동기화 실행...');
  await syncDocsViaApi();

  // 4. local_agent_store.json 확인
  const storePath = './data/local_agent_store.json';
  const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
  const taskInStore = store.tasks?.find((t: any) => t.task_id === taskId);
  if (!taskInStore) {
    store.tasks.unshift({
      task_id: taskId,
      session_id: sessionId,
      task_name: taskName,
      status_cd: statusCd,
      started_at: startedAt,
      ended_at: endedAt,
      doc_payload: docPayload,
      created_sys: 'agent-harness',
      created_by: 'jkoogit',
      updated_sys: 'agent-harness',
      updated_by: 'jkoogit',
      version: 1,
      git_branch: gitBranch,
    });
    fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
  }
  console.log(`✅ [4/4] local_agent_store.json 태스크 및 세션 상태 동기화 확인 완료`);
}

main().catch(console.error);
