import '../src/shared/envLoader';
import fs from 'fs';
import https from 'https';

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
      timeout: 30000,
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve({ error: body });
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function main() {
  const storePath = 'data/local_agent_store.json';
  const currentStore = JSON.parse(fs.readFileSync(storePath, 'utf8'));

  const task001902 = {
    task_id: 'TASK-0019-02',
    session_id: 'SESSION-0019',
    task_name: 'PG-USR-05 모바일 최적화 (PDF생성 팝업크기버튼 제거, 문서목록헤더 카드모드고정 & 뷰어모드 아이콘제거, 카테고리접힘 모드전환 동기화, 페이지이동 인풋전환) 완결',
    status_cd: '검증완료',
    priority: 'HIGH',
    assigned_agent: 'gemini',
    git_branch: 'task/0019_01_문서관리라이브러리_Gemini',
    started_at: '2026-09-30T15:26:26.000Z',
    ended_at: new Date().toISOString(),
    doc_payload: {
      items: [
        '1.1 모바일 모드 PDF 생성 팝업 크기 버튼(2XL/4XL/6XL) 제거 (화면 100vw 전체 모달로 헤더 공간 확보)',
        '1.2 문서목록 헤더: 모바일 모드 시 카드 뷰로 단일 고정, LayoutGrid/List 뷰어모드 아이콘 2개 완전 제거, 카테고리명 단독 강조',
        '1.3 도서카테고리 접힌 상태 모드 전환 시(데스크톱 ⇄ 모바일) 현행화: 모바일 모드(위로접기 아코디언), 비모바일 데스크톱(왼쪽으로접기 슬림바) 상호 100% 동기화',
        '2. 페이지 이동 개선: 썸네일 이미지 선택 시 페이지 표시 영역이 [이동할 쪽수 인풋] + [🚀 이동] 버튼으로 즉시 교체되어 원하는 위치로 신속 재배치',
        '3. 옵션처리(자르기/표준화) 팝업 모바일 세로 레이아웃: 좁은 화면에서 미리보기와 설정을 상하 세로(flex-col)로 줄바꿈하여 한 화면 연속 스크롤 제어 제공',
        '4. 옵션처리(자르기/표준화) 편집레이어 레이아웃 복구: 좌우 패널 items-stretch 정렬, 6:6/7:5 균형 그리드, 앵커 핸들 클리핑 방지, AI 자동 여백 감지 버튼 자르기 탭 전용 격리',
        '5. 모바일 카테고리 접힘/펼침 배너 완벽 정상화: isMobileMode 및 모바일 해상도(lg 미만) 상시 위로접힌 단일 배너(도서 카테고리 접힘 | 펼치기 ▼) 유지로 사라짐/우측축소 현상 원천 차단',
        '6. 옵션처리(자르기/표준화) 네비게이션 div 미리보기 div 내부 일체형 배치: 자르기 탭은 잘린 크기 아래, 표준화 탭은 규격 미리보기 아래에 직접 내포하여 레이어 분리/틀어짐 완벽 해소'
      ],
      branch: 'task/0019_01_문서관리라이브러리_Gemini',
      operator_account: 'jkok2j2m',
      agent_account: 'jkok2j2m@gmail.com',
      user_email: 'jkok2j2m@gmail.com'
    },
    created_sys: 'agent-harness',
    created_by: 'system',
    updated_sys: 'agent-harness',
    updated_by: 'system',
    version: 7
  };

  const tasks = [task001902, ...(currentStore.tasks || []).filter((t: any) => t.task_id !== 'TASK-0019-02')];
  currentStore.tasks = tasks;
  fs.writeFileSync(storePath, JSON.stringify(currentStore, null, 2), 'utf8');
  console.log('✅ local_agent_store.json 태스크 TASK-0019-02 저장 완료');

  // DB에 태스크 등록
  const insertTaskSql = `
    INSERT INTO aiagent.harness_task_meta (
      task_id, session_id, task_name, status_cd, git_branch,
      started_at, ended_at, doc_payload,
      created_sys, created_by, updated_sys, updated_by, version
    ) VALUES (
      '${task001902.task_id}',
      '${task001902.session_id}',
      '${task001902.task_name.replace(/'/g, "''")}',
      '${task001902.status_cd}',
      '${task001902.git_branch}',
      '${task001902.started_at}',
      '${task001902.ended_at}',
      '${JSON.stringify(task001902.doc_payload).replace(/'/g, "''")}'::jsonb,
      'agent-harness', 'system', 'agent-harness', 'system', 7
    ) ON CONFLICT (task_id) DO UPDATE SET
      task_name = EXCLUDED.task_name,
      status_cd = EXCLUDED.status_cd,
      ended_at = EXCLUDED.ended_at,
      doc_payload = EXCLUDED.doc_payload,
      updated_at = now(),
      version = 7;
  `;
  await executeSql(insertTaskSql);
  console.log('✅ 원격 DB aiagent.harness_task_meta TASK-0019-02 갱신 완료');

  // 대화 턴 TRACE-0019-02-00-08 등록
  const traceId = 'TRACE-0019-02-00-08';
  const promptText = `#태스크처리 [0018] TASK-0019-02 PG-USR-05 편집레이어 네비게이션 div 미리보기 내부(자르기/표준화) 배치 및 모바일 카테고리 접힘 배너 상시 노출 완벽 구현`;

  const responseText = `# [0018] PG-USR-05 편집레이어 네비게이션 div 미리보기 내부(자르기/표준화) 배치 및 모바일 카테고리 접힘 배너 상시 노출 완결
1. 옵션처리(자르기/표준화) 편집레이어: 네비게이션 및 진행도 바를 자르기 탭은 '잘린 크기' 아래, 표준화 탭은 '미리보기 규격' 아래 미리보기 div 내부에 직접 내포하여 레이아웃 일체화 완결
2. 모바일 카테고리 접힘 배너: isMobileMode 및 모바일 해상도(lg 미만) 전 구간에서 접힘 상태 배너(도서 카테고리 (위로 접힘) | 펼치기 ▼)가 상시 100% 노출되도록 보장`;

  const summaryText = 'PG-USR-05 편집레이어 네비게이션 미리보기 내부 배치 및 모바일 카테고리 접힘 배너 상시 노출 완결';

  const insertTraceSql = `
    INSERT INTO aiagent.agent_conversation_trace (
      trace_id, session_id, task_id, loop_id, step_index,
      agent_name, model_name, operator_account, agent_account, user_email,
      user_prompt, agent_response, response_summary,
      prompt_tokens, completion_tokens, total_tokens, created_at
    ) VALUES (
      '${traceId}',
      'SESSION-0019',
      'TASK-0019-02',
      NULL,
      8,
      'gemini',
      'models/gemini-3.8-flash',
      'jkok2j2m',
      'jkok2j2m@gmail.com',
      'jkok2j2m@gmail.com',
      '${promptText.replace(/'/g, "''")}',
      '${responseText.replace(/'/g, "''")}',
      '${summaryText.replace(/'/g, "''")}',
      3720,
      2210,
      5930,
      now()
    ) ON CONFLICT (trace_id) DO UPDATE SET
      agent_response = EXCLUDED.agent_response,
      response_summary = EXCLUDED.response_summary,
      total_tokens = EXCLUDED.total_tokens;
  `;
  await executeSql(insertTraceSql);
  console.log(`✅ 대화 턴 ${traceId} 원격 DB 영속화 완결`);
}

main().catch(console.error);
