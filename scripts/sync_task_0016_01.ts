import fs from 'fs';
import path from 'path';

interface LocalStore {
  sessions: any[];
  tasks: any[];
  loops: any[];
}

const storePath = path.join(process.cwd(), 'data', 'local_agent_store.json');
let store: LocalStore = { sessions: [], tasks: [], loops: [] };

if (fs.existsSync(storePath)) {
  try {
    store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
  } catch (e) {
    console.error('Error reading local_agent_store.json:', e);
  }
}

// 1. SESSION-0016 검증
let session = store.sessions.find((s) => s.session_id === 'SESSION-0016');
if (!session) {
  session = {
    session_id: 'SESSION-0016',
    session_name: '[0016]0015_토큰소진_연계작업_UI정책_및_긴급백업복구',
    work_group: 'purePDFrend',
    ai_agent: 'gemini',
    ai_model: 'models/gemini-3.7-flash',
    status_cd: '진행중',
    started_at: new Date().toISOString(),
    ended_at: null,
    doc_payload: {
      objective: '0015 토큰소진 연계작업(전수 목록 UI정책 일괄적용), 비-LLM 긴급소스 백업 복구, 와이어프레임 분석',
      issue_number: 28,
      branch: 'task/0016_01_UI정책_긴급백업복구_Gemini',
      operator_account: 'jkoogit',
      user_email: 'jkoogit@gmail.com',
      linked_from_session: 'SESSION-0015',
      linked_operator: 'jkok2j2m'
    },
    created_sys: 'agent-harness',
    created_by: 'system',
    updated_sys: 'agent-harness',
    updated_by: 'system',
    version: 1,
    operator_account: 'jkoogit',
    user_email: 'jkoogit@gmail.com'
  };
  store.sessions.push(session);
} else {
  session.doc_payload.branch = 'task/0016_01_UI정책_긴급백업복구_Gemini';
}

// 2. TASK-0016-01 등록
let task = store.tasks.find((t) => t.task_id === 'TASK-0016-01');
if (!task) {
  task = {
    task_id: 'TASK-0016-01',
    session_id: 'SESSION-0016',
    task_name: '소진 작업(전수 목록 화면 UI 정책 일괄 적용, 긴급 백업 복구)',
    status_cd: '진행중',
    priority: 'HIGH',
    assigned_agent: 'gemini',
    started_at: new Date().toISOString(),
    ended_at: null,
    doc_payload: {
      items: [
        '전수 목록 화면 테이블 헤더 컬럼 너비 조절, 정렬 버튼 분리, 타이틀 중앙 정렬 UI 표준 정책 일괄 적용',
        '비-LLM 긴급 소스 백업 (EmergencyRecoveryPanel) 화면 마운트 및 상시 1클릭 접근 복구',
        '와이어프레임 기획서 및 WireframeStudio 분석 정합성 검토',
        '정적 타입 검사(tsc --noEmit) 및 전수 컴파일 무결성 검증 완결'
      ],
      branch: 'task/0016_01_UI정책_긴급백업복구_Gemini',
      issue_number: 28,
      operator_account: 'jkoogit',
      user_email: 'jkoogit@gmail.com'
    },
    created_sys: 'agent-harness',
    created_by: 'system',
    updated_sys: 'agent-harness',
    updated_by: 'system',
    version: 1
  };
  store.tasks.push(task);
}

// 3. LOOP-0016-01-01 등록
let loop = store.loops.find((l) => l.loop_id === 'LOOP-0016-01-01');
if (!loop) {
  loop = {
    loop_id: 'LOOP-0016-01-01',
    task_id: 'TASK-0016-01',
    loop_name: '전수 목록 UI 정책 적용 및 긴급 백업 복구 컴파일 검증',
    status_cd: '진행중',
    iteration_index: 1,
    started_at: new Date().toISOString(),
    ended_at: null,
    doc_payload: {
      action: 'UI 정책 일괄 적용 및 TypeScript 정적 무결성 100% 검증',
      result: 'tsc --noEmit PASS (에러 0건)',
      operator_account: 'jkoogit',
      user_email: 'jkoogit@gmail.com'
    },
    created_sys: 'agent-harness',
    created_by: 'system',
    updated_sys: 'agent-harness',
    updated_by: 'system',
    version: 1
  };
  store.loops.push(loop);
}

fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
console.log('✅ local_agent_store.json synced with TASK-0016-01 and LOOP-0016-01-01');

// 4. API 서버에도 동기화 요청 전송
async function syncToServer() {
  try {
    const taskRes = await fetch('http://localhost:3000/api/agent/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task)
    });
    console.log('Task API Sync status:', taskRes.status);

    const loopRes = await fetch('http://localhost:3000/api/agent/loops', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loop)
    });
    console.log('Loop API Sync status:', loopRes.status);
  } catch (e) {
    console.log('Server sync skipped (server offline or local mode):', (e as any).message);
  }
}

syncToServer();
