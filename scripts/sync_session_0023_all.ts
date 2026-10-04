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
        try { resolve(JSON.parse(data)); } catch { resolve(data); }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function main() {
  console.log('🔄 [SESSION-0023] 하네스 태스크 및 대화 턴 전수 영속화 시작...');

  const storePath = path.join(process.cwd(), 'data', 'local_agent_store.json');
  const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));

  // 1. Sync Task to DB
  const task002301 = {
    task_id: 'TASK-0023-01',
    session_id: 'SESSION-0023',
    task_name: 'PG-USR-07 문서공유 및 협업작업뷰 리뷰 및 뷰어 점프·반응형 UX 고도화',
    status_cd: '완료',
    priority: 'HIGH',
    assigned_agent: 'gemini',
    git_branch: 'task/0023_01_문서공유_협업작업뷰_Gemini',
    started_at: '2026-10-03T12:24:00.000Z',
    ended_at: '2026-10-04T09:23:00.000Z',
    doc_payload: {
      items: [
        '1. [규정준수] 링크 복사 시 window.alert 배제 및 네이티브 클립보드 복사 + showToast 비차단 인앱 토스트 전환',
        '2. [뷰어 점프 연동] 동시 열람 협업자 카드 클릭 시 해당 사용자의 열람 쪽수(p.14 등)로 뷰어(PG-USR-06) 즉시 화면 전환 및 쪽수 점프',
        '3. [실시간 피드 포커스] 실시간 주석 & 협업 활동 피드 로그 클릭 시 해당 페이지로 즉시 이동 및 포커스',
        '4. [모바일 반응형 & UX] 모바일 QR 코드 모달, 협업자 이메일 초대 모달, 실시간 주석 이벤트 시뮬레이션 완비'
      ],
      operator_account: 'jkok2j2m',
      user_email: 'jkok2j2m@gmail.com'
    },
    created_sys: 'agent-harness',
    created_by: 'system',
    updated_sys: 'agent-harness',
    updated_by: 'system',
    version: 1
  };

  const taskPayloadJson = JSON.stringify(task002301.doc_payload).replace(/'/g, "''");
  const taskSql = `
    INSERT INTO aiagent.harness_task_meta (
      task_id, session_id, task_name, status_cd, priority, assigned_agent,
      git_branch, started_at, ended_at, doc_payload,
      created_sys, created_by, updated_sys, updated_by, version
    ) VALUES (
      '${task002301.task_id}', '${task002301.session_id}', '${task002301.task_name.replace(/'/g, "''")}',
      '${task002301.status_cd}', '${task002301.priority}', '${task002301.assigned_agent}',
      '${task002301.git_branch}', '${task002301.started_at}', '${task002301.ended_at}',
      '${taskPayloadJson}'::jsonb,
      'agent-harness', 'system', 'agent-harness', 'system', 1
    ) ON CONFLICT (task_id) DO UPDATE SET
      task_name = EXCLUDED.task_name,
      status_cd = EXCLUDED.status_cd,
      ended_at = EXCLUDED.ended_at,
      doc_payload = EXCLUDED.doc_payload,
      updated_at = now();
  `;
  const taskDbRes = await executeSql(taskSql);
  console.log('✅ Task DB 동기화 완료:', taskDbRes);

  // 2. Sync Conversation Turns for SESSION-0023
  const traceId1 = 'TRACE-0023-01-00-01';
  const prompt1 = `1. 세션작업내용 변경 : 세션명, 현행화 
  - 변경전 : [0023] PG-USR-03 홈 대시보드 헤더 간소화 및 7대 PDF 도구 퀵 액션 연동
  - 변경후 : [0023] PG-USR-07 문서공유 및 협업작업뷰 리뷰

2. AGENTS.md 수정된 내용을 참고 하여 세션시작에 대한 local_agent_store.json 파일 현행화
조치 후 

#태스크시작 [0023-01] PG-USR-07 문서공유 및 협업작업뷰 리뷰`;

  const response1 = `# [01] PG-USR-07 문서공유 및 협업작업뷰 전수 분석 및 계획 수립
1. 거버넌스 조치: /data/agent_history 백업 및 local_agent_store.json 세션 변경 현행화 완결
2. 도메인 분석: PG-USR-07 문서공유 및 협업작업뷰 (접근 권한, 동시 접속자, 실시간 활동 피드)
3. 아키텍처 영향도 평가 및 작업 계획 수립 (window.alert 제거, 뷰어 점프 연동, 실시간 활동 피드 포커스)
4. 루프 분석 및 백로그 분기 제안`;

  const traceId2 = 'TRACE-0023-01-01-02';
  const prompt2 = `#태스크처리 - PG-USR-07 문서공유 및 협업작업뷰 리뷰`;
  const response2 = `[01] PG-USR-07 문서공유 및 협업작업뷰 전수 구현 완료:
1. window.alert 배제 및 네이티브 클립보드 복사 + showToast 비차단 인앱 토스트 전환
2. 동시 열람 협업자 카드 클릭 시 뷰어(PG-USR-06) 즉시 화면 전환 및 해당 열람 쪽수(p.14 등) 점프
3. 실시간 주석 & 협업 활동 피드 로그 클릭 시 해당 페이지로 즉시 이동 및 포커스
4. 모바일 카메라 스캔용 QR 코드 모달 및 새로운 협업자 이메일 초대 모달 신규 구축
5. 실시간 주석 이벤트 시뮬레이션 버튼 연동 (+새 활동 시뮬레이션)`;

  const traces = [
    {
      trace_id: traceId1,
      session_id: 'SESSION-0023',
      task_id: 'TASK-0023-01',
      loop_id: null,
      prompt_text: prompt1,
      agent_response: response1,
      prompt_tokens: 3200,
      completion_tokens: 1450,
      total_tokens: 4650,
      model_name: 'models/gemini-3.8-flash',
      created_at: '2026-10-03T12:15:00.000Z'
    },
    {
      trace_id: traceId2,
      session_id: 'SESSION-0023',
      task_id: 'TASK-0023-01',
      loop_id: null,
      prompt_text: prompt2,
      agent_response: response2,
      prompt_tokens: 2800,
      completion_tokens: 1600,
      total_tokens: 4400,
      model_name: 'models/gemini-3.8-flash',
      created_at: '2026-10-03T12:24:00.000Z'
    }
  ];

  for (const t of traces) {
    const traceSql = `
      INSERT INTO aiagent.agent_conversation_trace (
        trace_id, session_id, task_id, loop_id, prompt_text, agent_response,
        prompt_tokens, completion_tokens, total_tokens, model_name, created_at
      ) VALUES (
        '${t.trace_id}', '${t.session_id}', '${t.task_id}', NULL,
        '${t.prompt_text.replace(/'/g, "''")}', '${t.agent_response.replace(/'/g, "''")}',
        ${t.prompt_tokens}, ${t.completion_tokens}, ${t.total_tokens}, '${t.model_name}', '${t.created_at}'
      ) ON CONFLICT (trace_id) DO UPDATE SET
        agent_response = EXCLUDED.agent_response,
        total_tokens = EXCLUDED.total_tokens;
    `;
    const traceDbRes = await executeSql(traceSql);
    console.log(`✅ Trace DB 동기화 (${t.trace_id}):`, traceDbRes);
  }

  // 3. Update local store
  store.tasks = [task002301];
  store.traces = traces;
  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
  console.log('✅ local_agent_store.json 태스크 및 트레이스 동기화 완료!');
}

main().catch(console.error);
