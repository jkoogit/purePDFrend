import fs from 'fs';
import path from 'path';
import http from 'http';

const STORE_PATH = path.join(process.cwd(), 'data', 'local_agent_store.json');

async function main() {
  console.log('=== [하네스 동기화] TASK-0013-02 태스크 정보 동기화 시작 ===');

  const taskPayload = {
    task_id: 'TASK-0013-02',
    session_id: 'SESSION-260924-0013',
    task_name: '[0013-02]Web Worker 스레드 오프로딩 Searchable PDF 합성 엔진 구현',
    status_cd: '처리중',
    git_branch: 'task/0013_0019_manual-and-worker-pipeline_Gemini',
    started_at: '2026-09-24T15:25:00.000Z',
    ended_at: null,
    doc_payload: {
      designDoc: 'docs/05.설계/05-15_Web_Worker_Searchable_PDF_백그라운드_컴파일_엔진_설계.md',
      learningDoc: 'docs/15.학습/15-14_Web_Worker_스레드_오프로딩_및_Transferable_Zero_Copy_기법.md',
      unitTest: 'tests/searchable_pdf_worker.test.ts',
      features: [
        'Web Worker 백그라운드 스레드 오프로딩 (SearchablePdfWorker.ts)',
        'pdf-lib 및 폰트 임베딩 0ms UI 블로킹 무프리징 합성',
        'Transferable Objects (ArrayBuffer) 0-Copy 전송 최적화',
        'SearchablePdfWorkerClient 싱글톤 파사드 및 취소/에러/진행률 스트림',
        'Node.js 및 미지원 환경 자동 인라인 폴백 (Graceful Fallback)',
        '가상 뷰어 스튜디오(VirtualViewerStudio.tsx) UI 연동 및 컴파일 취소 기능'
      ]
    }
  };

  // 1. local_agent_store.json 업데이트
  if (fs.existsSync(STORE_PATH)) {
    const store = JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8'));
    const session = store.sessions?.find((s: any) => s.session_id === 'SESSION-260924-0013');
    if (session) {
      session.doc_payload.currentTask = 'TASK-0013-02';
      session.updated_at = new Date().toISOString();
    }

    const taskIndex = store.tasks?.findIndex((t: any) => t.task_id === 'TASK-0013-02');
    if (taskIndex >= 0) {
      store.tasks[taskIndex] = {
        ...store.tasks[taskIndex],
        ...taskPayload,
        version: (store.tasks[taskIndex].version || 1) + 1,
        updated_at: new Date().toISOString()
      };
    } else {
      store.tasks.unshift({
        ...taskPayload,
        created_sys: 'agent-harness',
        created_by: 'system',
        updated_sys: 'agent-harness',
        updated_by: 'system',
        version: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
    console.log('✅ local_agent_store.json 태스크 반영 완료');
  }

  // 2. DB API 호출 (/api/agent/tasks)
  const body = JSON.stringify(taskPayload);
  const req = http.request(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/agent/task/save',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    },
    (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        console.log('✅ Task DB API 결과:', res.statusCode, data);
      });
    }
  );

  req.on('error', (e) => console.log('⚠️ DB API 오류 (로컬 스토어 유지):', e.message));
  req.write(body);
  req.end();
}

main().catch(console.error);
