import '../src/shared/envLoader';
import fs from 'fs';
import path from 'path';
import http from 'http';
import { promoteTaskToStgAndMain, requestGitHub } from './harness_git_engine';

const STORE_PATH = path.join(process.cwd(), 'data', 'local_agent_store.json');

async function main() {
  console.log('================================================================');
  console.log('🚀 [TASK-0013-02] 태스크 승급: stg/main 배포 승급 및 상태 마감');
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
    task_id: 'TASK-0013-02',
    session_id: 'SESSION-260924-0013',
    task_name: '[0013-02]Web Worker 스레드 오프로딩 Searchable PDF 합성 엔진 구현',
    status_cd: '완료',
    git_branch: 'task/0013_0019_manual-and-worker-pipeline_Gemini',
    started_at: '2026-09-24T15:25:00.000Z',
    ended_at: new Date().toISOString(),
    doc_payload: {
      reviewDoc: 'docs/10.리뷰/260925_032_Web_Worker_Searchable_PDF_컴파일_엔진_구현_리뷰.md',
      designDoc: 'docs/05.설계/05-15_Web_Worker_Searchable_PDF_백그라운드_컴파일_엔진_설계.md',
      learningDoc: 'docs/15.학습/15-14_Web_Worker_스레드_오프로딩_및_Transferable_Zero_Copy_기법.md',
      manualDoc: 'docs/18.메뉴얼/18-01_사용자_PDF_스튜디오_이용_매뉴얼.md',
      unitTest: 'tests/searchable_pdf_worker.test.ts',
      features: [
        'Web Worker 백그라운드 스레드 분리 (SearchablePdfWorker.ts)',
        'pdf-lib 0ms 메인 UI 블로킹 무프리징 합성',
        'Transferable Objects (ArrayBuffer) 0-Copy 메모리 소유권 전송',
        'SearchablePdfWorkerClient 싱글톤 파사드 및 Graceful Fallback',
        '컴파일 취소(cancelCurrentJob) 안전 가드레일',
        '18-01 사용자 PDF 스튜디오 매뉴얼 현행화 (v1.1)'
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

    const taskIndex = store.tasks?.findIndex((t: any) => t.task_id === 'TASK-0013-02');
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
  console.log('🎉 [TASK-0013-02] 태스크 승급 및 프로덕션 배포 완료!');
  console.log(`- 승급 브랜치: dev -> stg -> main (100% 일치)`);
  console.log(`- 승급 SHA: ${devSha}`);
  console.log('================================================================');
}

main().catch((err) => {
  console.error('Task promotion failed:', err);
  process.exit(1);
});
