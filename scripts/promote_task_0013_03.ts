import '../src/shared/envLoader';
import fs from 'fs';
import path from 'path';
import http from 'http';
import { promoteTaskToStgAndMain, requestGitHub } from './harness_git_engine';

const STORE_PATH = path.join(process.cwd(), 'data', 'local_agent_store.json');

async function main() {
  console.log('================================================================');
  console.log('🚀 [TASK-0013-03] 태스크 승급: stg/main 배포 승급 및 상태 마감');
  console.log('================================================================');

  // 1. stg 및 main 브랜치 승급 & 4대 브랜치 일치 검증 & 로컬 git 동기화
  const { devSha, stgSha, mainSha } = await promoteTaskToStgAndMain();

  // 2. task 브랜치 SHA 조회
  const taskRef = await requestGitHub('/git/ref/heads/task/0013_0019_manual-and-worker-pipeline_Gemini');
  const taskSha = taskRef.body.object.sha;

  console.log('\n▶ [4대 브랜치 SHA 최종 검증]');
  console.log(`   - task 브랜치 SHA : ${taskSha}`);
  console.log(`   - dev  브랜치 SHA : ${devSha}`);
  console.log(`   - stg  브랜치 SHA : ${stgSha}`);
  console.log(`   - main 브랜치 SHA : ${mainSha}`);

  if (taskSha === devSha && devSha === stgSha && stgSha === mainSha) {
    console.log('   🎉 [검증 완료] 4대 브랜치 커밋 SHA 100% 일치 확인!');
  } else {
    throw new Error('❌ 브랜치 간 SHA 불일치 발생. 배포 승급 상태를 확인하세요.');
  }

  // 3. 하네스 스토어 및 DB 태스크 상태 '완료' 마감
  const taskPayload = {
    task_id: 'TASK-0013-03',
    session_id: 'SESSION-260924-0013',
    task_name: '[0013-03]다국어 OCR 병렬 배치 큐(Worker Pool) 및 세부 프로그레스 바 UI 구현',
    status_cd: '완료',
    git_branch: 'task/0013_0019_manual-and-worker-pipeline_Gemini',
    started_at: '2026-09-24T16:00:00.000Z',
    ended_at: new Date().toISOString(),
    doc_payload: {
      reviewDoc: 'docs/10.리뷰/260925_033_다국어_OCR_병렬_배치_큐_및_프로그레스_UI_구현_리뷰.md',
      designDoc: 'docs/05.설계/05-18_다국어_OCR_병렬_배치_큐_Worker_Pool_및_프로그레스_엔진_설계.md',
      learningDoc: 'docs/15.학습/15-15_Worker_Pool_기반_병렬_배치_큐_및_동시성_제어_알고리즘_해설.md',
      manualDoc: 'docs/18.메뉴얼/18-01_사용자_PDF_스튜디오_이용_매뉴얼.md',
      unitTest: 'tests/ocr_batch_queue.test.ts',
      features: [
        'OcrBatchQueueManager 싱글톤/인스턴스 기반 Worker Pool 동시성 제어',
        '다국어 언어팩(kor+eng, jpn, chi) 및 3대 OCR 엔진 어댑터 라우팅',
        'Pause / Resume / Cancel 배치 작업 제어 가드레일',
        '페이지 실패 시 지수 백오프 기반 최대 3회 자동 재시도',
        '실시간 TPS 및 ETA(남은 시간) 계산기 및 옵저버 스트리밍',
        'OcrBatchProgressModal UI 신설 및 VirtualViewerStudio 연동',
        '18-01 사용자 PDF 스튜디오 매뉴얼 현행화 (v1.2)'
      ],
      promotedAt: new Date().toISOString(),
      promotedSha: devSha
    }
  };

  if (fs.existsSync(STORE_PATH)) {
    const store = JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8'));
    const session = store.sessions?.find((s: any) => s.session_id === 'SESSION-260924-0013');
    if (session) {
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
    }

    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
    console.log('\n✅ local_agent_store.json 태스크 상태 [완료] 최종 마감');
  }

  // 4. DB API 호출 (/api/agent/task/save)
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
        console.log('✅ Task DB API [완료] 저장 결과:', res.statusCode, data);
      });
    }
  );
  req.on('error', (e) => console.log('⚠️ DB API 오류 (로컬 스토어 유지):', e.message));
  req.write(body);
  req.end();

  console.log('\n================================================================');
  console.log('🎉 [TASK-0013-03] 태스크 승급 및 프로덕션 배포 완료!');
  console.log(`- 승급 브랜치: dev -> stg -> main (100% 일치)`);
  console.log(`- 승급 SHA: ${devSha}`);
  console.log('================================================================');
}

main().catch((err) => {
  console.error('Task promotion failed:', err);
  process.exit(1);
});
