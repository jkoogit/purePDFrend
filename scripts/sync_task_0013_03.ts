import fs from 'fs';
import path from 'path';
import http from 'http';

const STORE_PATH = path.join(process.cwd(), 'data', 'local_agent_store.json');

async function main() {
  console.log('=== [하네스 동기화] TASK-0013-03 태스크 정보 동기화 시작 ===');

  const taskPayload = {
    task_id: 'TASK-0013-03',
    session_id: 'SESSION-260924-0013',
    task_name: '[0013-03]다국어 OCR 병렬 배치 큐(Worker Pool) 및 세부 프로그레스 바 UI 구현',
    status_cd: '처리중',
    git_branch: 'task/0013_0019_manual-and-worker-pipeline_Gemini',
    started_at: '2026-09-24T16:00:00.000Z',
    ended_at: null,
    doc_payload: {
      designDoc: 'docs/05.설계/05-18_다국어_OCR_병렬_배치_큐_Worker_Pool_및_프로그레스_엔진_설계.md',
      learningDoc: 'docs/15.학습/15-15_Worker_Pool_기반_병렬_배치_큐_및_동시성_제어_알고리즘_해설.md',
      unitTest: 'tests/ocr_batch_queue.test.ts',
      features: [
        'OcrBatchQueueManager 싱글톤/인스턴스 기반 Worker Pool 동시성 제어',
        '다국어 언어팩(kor+eng, jpn, chi) 및 3대 OCR 엔진 어댑터 라우팅',
        'Pause / Resume / Cancel 배치 작업 제어 가드레일',
        '페이지 실패 시 지수 백오프 기반 최대 3회 자동 재시도',
        '실시간 TPS 및 ETA(남은 시간) 계산기 및 옵저버 스트리밍',
        'OcrBatchProgressModal UI 신설 및 VirtualViewerStudio 연동'
      ]
    }
  };

  // 1. local_agent_store.json 업데이트
  if (fs.existsSync(STORE_PATH)) {
    const store = JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8'));
    const session = store.sessions?.find((s: any) => s.session_id === 'SESSION-260924-0013');
    if (session) {
      session.doc_payload.currentTask = 'TASK-0013-03';
      session.updated_at = new Date().toISOString();
    }

    const taskIndex = store.tasks?.findIndex((t: any) => t.task_id === 'TASK-0013-03');
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

  // 2. DB API 호출 (/api/agent/task/save)
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
