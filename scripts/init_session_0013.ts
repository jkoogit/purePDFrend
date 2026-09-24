import https from 'https';
import fs from 'fs';
import path from 'path';
import '../src/shared/envLoader';

const DB_BRIDGE_URL = 'https://ptype.pdfrend.com';
const DB_BRIDGE_SECRET = 'jkadh-secure-secret-token-2026';
const TARGET_DATABASE = 'purepdfrend_dev';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const GITHUB_OWNER = 'jkoogit';
const GITHUB_REPO = 'purePDFrend';

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

function requestGitHub<T = any>(endpoint: string, method = 'GET', data?: any): Promise<{ status: number; body: T }> {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : null;
    const req = https.request(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}${endpoint}`, {
      method,
      headers: {
        'User-Agent': 'purePDFrend-agent',
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        ...(payload ? {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        } : {}),
      },
    }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        try {
          const parsed = text ? JSON.parse(text) : {};
          resolve({ status: res.statusCode || 200, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode || 200, body: text as any });
        }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function run() {
  console.log('================================================================');
  console.log('🚀 [0013] 세션 시작 초기화 및 거버넌스 점검');
  console.log('================================================================');

  // 1. 원격 이슈 및 PR 점검
  console.log('\n[단계 1] 원격 GitHub 레포 Open Issues 및 Pull Requests 점검...');
  const issuesRes = await requestGitHub<any[]>('/issues?state=open');
  const pullsRes = await requestGitHub<any[]>('/pulls?state=open');

  const openIssues = (issuesRes.body || []).filter((i: any) => !i.pull_request);
  const openPulls = pullsRes.body || [];

  console.log(`- Open Issues: ${openIssues.length}건`);
  openIssues.forEach((i: any) => console.log(`  * #${i.number}: ${i.title}`));
  console.log(`- Open PRs: ${openPulls.length}건`);
  openPulls.forEach((p: any) => console.log(`  * #${p.number}: ${p.title}`));

  // 2. 원격 3대 브랜치 일치 여부 점검
  console.log('\n[단계 2] 원격 3대 브랜치(main, dev, stg) 최신 커밋 SHA 일치 여부 점검...');
  const mainRef = await requestGitHub<any>('/git/ref/heads/main');
  const devRef = await requestGitHub<any>('/git/ref/heads/dev');
  const stgRef = await requestGitHub<any>('/git/ref/heads/stg');

  const mainSha = mainRef.body?.object?.sha;
  const devSha = devRef.body?.object?.sha;
  const stgSha = stgRef.body?.object?.sha;

  console.log(`- main SHA: ${mainSha}`);
  console.log(`- dev  SHA: ${devSha}`);
  console.log(`- stg  SHA: ${stgSha}`);
  const isBranchesSynced = (mainSha === devSha && devSha === stgSha);
  console.log(`- 3대 브랜치 동기화 여부: ${isBranchesSynced ? '✅ 100% 일치 (동기화 완료)' : '⚠️ 불일치 확인 필요'}`);

  // 3. 신규 세션 GitHub 이슈 등록
  console.log('\n[단계 3] SESSION-260924-0013 원격 이슈 등록...');
  const issuePayload = {
    title: '[SESSION-260924-0013] Web Worker 백그라운드 컴파일 파이프라인 구축 및 [사용/관리] 서비스 매뉴얼(v1.0) 작성',
    body: `## 📌 세션 정보
- **세션 ID**: \`SESSION-260924-0013\`
- **세션명**: \`[0013]Web Worker 백그라운드 컴파일 파이프라인 구축 및 [사용/관리] 서비스 매뉴얼(v1.0) 작성\`
- **작업자**: Gemini 3.7 Flash / jkoogit
- **기준 SHA**: \`${devSha}\`
- **시작 일시**: \`${new Date().toISOString()}\`

## 🎯 주요 작업 목표 및 계획 태스크
1. **[태스크 1] docs/18.메뉴얼 폴더 신설 및 [사용/관리] 서비스별 상세 매뉴얼(v1.0) 작성**
   - \`docs/18.메뉴얼/README_메뉴얼.md\` (매뉴얼 체계 및 버전 현황표)
   - \`docs/18.메뉴얼/18-01_사용자_PDF_스튜디오_이용_매뉴얼.md\` (가상 뷰어, 레이아웃 편집, 2-Way BBox OCR 교정기, Searchable PDF 다운로드)
   - \`docs/18.메뉴얼/18-02_관리자_하네스_및_시스템_운영_매뉴얼.md\` (하네스 거버넌스, 비-LLM 긴급 Push, 세션 DR 복구, 쿼터/토큰 모니터링)
   - \`docs/18.메뉴얼/images/\` 최신 브라우저 화면 캡처 저장 및 버전 명시 규칙 적용

2. **[태스크 2] Web Worker 스레드 오프로딩 Searchable PDF 합성 엔진 구현 (TASK-0019)**
   - pdf-lib 및 폰트 렌더링 작업을 백그라운드 Web Worker로 분리하여 대용량 도서 컴파일 시 메인 UI 프리징 방어 (Zero-Hang)

3. **[태스크 3] 다국어 OCR 병렬 배치 큐(Worker Pool) 및 세부 프로그레스 바 UI 구현 (TASK-0020)**
   - 다중 Worker Pool 기반 동시 페이지 OCR 처리 및 전처리->인식->BBox 단계별 시각화

4. **[태스크 4] PDF 메타데이터 주입기 및 암호화/보안 권한 제어 엔진 구현 (TASK-0021)**
   - 문서 메타데이터(제목, 저자, 키워드) 및 비밀번호 보호/인쇄·복사 권한 설정

## 🛡️ 거버넌스 준수
- AGENTS.md v2.1 및 GEMINI.md 정책 엄격 준수`
  };

  const newIssue = await requestGitHub<any>('/issues', 'POST', issuePayload);
  console.log(`- 신규 원격 이슈 생성 완료: #${newIssue.body?.number} (${newIssue.body?.html_url})`);

  // 4. 신규 작업 브랜치 생성
  const branchName = 'task/0013_0019_manual-and-worker-pipeline_Gemini';
  console.log(`\n[단계 4] 신규 작업 브랜치 생성 (${branchName})...`);
  
  const checkBranch = await requestGitHub<any>(`/git/ref/heads/${branchName}`);
  if (checkBranch.status === 200) {
    console.log(`- 작업 브랜치가 이미 존재합니다. (${branchName})`);
  } else {
    const createRefRes = await requestGitHub<any>('/git/refs', 'POST', {
      ref: `refs/heads/${branchName}`,
      sha: devSha
    });
    console.log(`- 신규 작업 브랜치 생성 결과 status: ${createRefRes.status}`);
  }

  // 5. 로컬 하네스 스토어 (local_agent_store.json) 갱신
  console.log('\n[단계 5] 로컬 하네스 스토어(data/local_agent_store.json) 동기화...');
  const storePath = path.resolve(process.cwd(), 'data', 'local_agent_store.json');
  let store: any = { sessions: [], tasks: [], loops: [], snapshots: [] };
  if (fs.existsSync(storePath)) {
    try {
      store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
    } catch (e) {
      console.warn('Failed to parse existing local_agent_store.json, creating new structure');
    }
  }

  const newSessionRecord = {
    session_id: 'SESSION-260924-0013',
    session_name: '[0013]Web Worker 백그라운드 컴파일 파이프라인 구축 및 [사용/관리] 서비스 매뉴얼(v1.0) 작성',
    work_group: 'purePDFrend',
    ai_agent: 'gemini',
    ai_model: 'models/gemini-3.7-flash',
    status_cd: '진행중',
    started_at: new Date().toISOString(),
    ended_at: null,
    doc_payload: {
      planned_tasks: [
        'TASK-260924-0013-01: [0019]docs/18.메뉴얼 폴더 신설 및 [사용/관리] 서비스별 상세 매뉴얼(v1.0) 작성',
        'TASK-260924-0013-02: [0020]Web Worker 스레드 오프로딩 Searchable PDF 합성 엔진 구현',
        'TASK-260924-0013-03: [0021]다국어 OCR 병렬 배치 큐(Worker Pool) 및 세부 프로그레스 바 UI 구현',
        'TASK-260924-0013-04: [0022]PDF 메타데이터 주입기 및 암호화/보안 권한 제어 엔진 구현'
      ],
      branchName,
      issueNumber: newIssue.body?.number,
      objective: 'Web Worker 백그라운드 컴파일 파이프라인 구축 및 서비스 매뉴얼(v1.0) 완성',
      activeAgent: 'Gemini 3.7 Flash',
      baseSha: devSha,
      theme: 'Web Worker 컴파일 파이프라인 및 서비스 매뉴얼'
    },
    created_sys: 'agent-harness',
    created_by: 'system',
    updated_sys: 'agent-harness',
    updated_by: 'system',
    version: 1,
    updated_at: new Date().toISOString()
  };

  const existingIdx = store.sessions.findIndex((s: any) => s.session_id === newSessionRecord.session_id);
  if (existingIdx >= 0) {
    store.sessions[existingIdx] = newSessionRecord;
  } else {
    store.sessions.unshift(newSessionRecord);
  }

  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
  console.log(`- local_agent_store.json 세션 등록 완료 (SESSION-260924-0013)`);

  // 6. DB 동기화 시도 (HTTPS DB Bridge)
  console.log('\n[단계 6] DB(aiagent.harness_session_meta) 동기화 시도...');
  try {
    const payloadEscaped = JSON.stringify(newSessionRecord.doc_payload).replace(/'/g, "''");
    const sessionNameEscaped = newSessionRecord.session_name.replace(/'/g, "''");

    const sql = `
      INSERT INTO aiagent.harness_session_meta (
        session_id, session_name, work_group, ai_agent, ai_model, status_cd,
        started_at, ended_at, doc_payload, version, updated_at
      ) VALUES (
        '${newSessionRecord.session_id}',
        '${sessionNameEscaped}',
        '${newSessionRecord.work_group}',
        '${newSessionRecord.ai_agent}',
        '${newSessionRecord.ai_model}',
        '${newSessionRecord.status_cd}',
        '${newSessionRecord.started_at}',
        NULL,
        '${payloadEscaped}'::jsonb,
        1,
        NOW()
      )
      ON CONFLICT (session_id) DO UPDATE SET
        session_name = EXCLUDED.session_name,
        status_cd = EXCLUDED.status_cd,
        doc_payload = EXCLUDED.doc_payload,
        updated_at = NOW(),
        version = aiagent.harness_session_meta.version + 1;
    `;
    const res = await executeSql(sql);
    console.log(`- HTTPS DB Bridge aiagent.harness_session_meta 세션 등록 완료:`, JSON.stringify(res));
  } catch (err: any) {
    console.warn(`- DB 동기화 생략 또는 실패 (로컬 스토어 안전 보장됨): ${err.message}`);
  }

  console.log('\n================================================================');
  console.log('✨ [0013] 세션 시작 초기화 절차 완료');
  console.log('================================================================');
}

run().catch(console.error);
