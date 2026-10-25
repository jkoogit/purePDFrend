import '../src/shared/envLoader';
import https from 'https';
import fs from 'fs';
import { execSync } from 'child_process';
import { HarnessRepository } from '../src/aiagent/domain/harness/HarnessRepository';

const OWNER = 'jkoogit';
const REPO = 'purePDFrend';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const DB_BRIDGE_URL = process.env.REMOTE_DB_BRIDGE_URL || 'https://ptype.pdfrend.com';
const DB_BRIDGE_SECRET = process.env.REMOTE_DB_BRIDGE_SECRET || 'jkadh-secure-secret-token-2026';
const TARGET_DATABASE = 'purepdfrend_dev';

function requestGitHub<T = any>(endpoint: string, method = 'GET', data?: any): Promise<{ status: number; body: T }> {
  return new Promise((resolve) => {
    const payload = data ? JSON.stringify(data) : null;
    const headers: Record<string, string> = {
      'User-Agent': 'purePDFrend-agent',
      'Accept': 'application/vnd.github.v3+json',
    };
    if (GITHUB_TOKEN) {
      headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`;
    }
    if (payload) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = String(Buffer.byteLength(payload));
    }

    const req = https.request(`https://api.github.com/repos/${OWNER}/${REPO}${endpoint}`, {
      method,
      headers,
      timeout: 5000,
    }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        try {
          const parsed = text ? JSON.parse(text) : {};
          resolve({ status: res.statusCode || 200, body: parsed });
        } catch {
          resolve({ status: res.statusCode || 200, body: text as any });
        }
      });
    });
    req.on('error', (err) => {
      console.warn('GitHub API 요청 경고 (로컬 폴백 처리):', err.message);
      resolve({ status: 500, body: { error: err.message } as any });
    });
    req.on('timeout', () => {
      req.destroy();
      resolve({ status: 408, body: { error: 'Request Timeout' } as any });
    });
    if (payload) req.write(payload);
    req.end();
  });
}

async function main() {
  console.log('================================================================');
  console.log('🔍 [1단계] GitHub 이슈 및 PR 점검');
  console.log('================================================================');

  const issuesRes = await requestGitHub<any[]>('/issues?state=open');
  const pullsRes = await requestGitHub<any[]>('/pulls?state=open');

  const openIssues = (Array.isArray(issuesRes.body) ? issuesRes.body : []).filter((i: any) => !i.pull_request);
  const openPulls = Array.isArray(pullsRes.body) ? pullsRes.body : [];

  console.log(`현재 열린 이슈 수: ${openIssues.length}`);
  openIssues.forEach((i: any) => console.log(` - 이슈 #${i.number}: ${i.title}`));
  console.log(`현재 열린 PR 수: ${openPulls.length}`);
  openPulls.forEach((p: any) => console.log(` - PR #${p.number}: ${p.title}`));

  console.log('\n================================================================');
  console.log('🌿 [2단계] 원격 브랜치 커밋 SHA 일치 점검 (main, stg, dev)');
  console.log('================================================================');

  let devSha = '';
  let mainSha = '';
  let stgSha = '';

  try {
    const mainRef = await requestGitHub<any>('/git/ref/heads/main');
    const devRef = await requestGitHub<any>('/git/ref/heads/dev');
    const stgRef = await requestGitHub<any>('/git/ref/heads/stg');
    mainSha = mainRef.body?.object?.sha;
    devSha = devRef.body?.object?.sha;
    stgSha = stgRef.body?.object?.sha;
  } catch {}

  if (!devSha || !mainSha || !stgSha) {
    mainSha = execSync('git rev-parse origin/main', { encoding: 'utf8' }).trim();
    stgSha = execSync('git rev-parse origin/stg', { encoding: 'utf8' }).trim();
    devSha = execSync('git rev-parse origin/dev', { encoding: 'utf8' }).trim();
  }

  console.log(`- main SHA: ${mainSha}`);
  console.log(`- stg  SHA: ${stgSha}`);
  console.log(`- dev  SHA: ${devSha}`);

  const isBranchesSynced = (mainSha === devSha && devSha === stgSha);
  console.log(`3대 브랜치 일치 여부: ${isBranchesSynced ? '✅ 100% 일치' : 'ℹ️ 차이 확인됨 (dev: ' + devSha + ')'}`);

  console.log('\n================================================================');
  console.log('🎫 [3단계] SESSION-0036 세션 정보 및 이슈 수립');
  console.log('================================================================');

  const issueTitle = '[0036] 상단 리본 네비게이션 인라인 일체화(화면 부유 증상 조치) 및 Phase 5 관리자 3단계 확장화면(PG-ADM-09~12) 실제 REST API 연동';
  let issueNumber = 106;

  if (GITHUB_TOKEN) {
    const issueBody = `## 📌 세션 정보
- **세션 ID**: \`SESSION-0036\`
- **세션명**: \`[0036] 상단 리본 네비게이션 인라인 일체화(화면 부유 증상 조치) 및 Phase 5 관리자 3단계 확장화면(PG-ADM-09~12) 실제 REST API 연동\`
- **작업자**: Gemini 1.5 Flash / jkok2j2m (jkok2j2m@gmail.com)
- **작업 그룹**: \`purePDFrend\`
- **기준 브랜치**: \`dev\` (${devSha})

## 🎯 핵심 작업 목표
1. **[화면배치 조치] 상단 리본 네비게이션 인라인 일체화 (BACKLOG-0035-04)**:
   - 상단 리본 네비게이션(\`#btn-top-ribbon-trigger\`)의 absolute top-0 z-50 부유 구조를 Navbar 정규 인라인 버튼으로 일체화하여 화면 가림 및 붕 떠있는 증상 완결 조치
2. **[Phase 5 API] 관리자 3단계 확장화면(PG-ADM-09~12) 실제 REST API 연동 (BACKLOG-0035-01)**:
   - PG-ADM-09: 실시간 시스템 알림 및 웹 푸시 센터
   - PG-ADM-10: 관리자 보안 및 세션 정책 관리
   - PG-ADM-11: OpenAPI 발급 및 웹훅 이벤트 전송 관리
   - PG-ADM-12: 공지사항 및 롤링 배너 CMS 관리
   - Express/PostgreSQL 실제 엔드포인트 연동 및 목업 폴백 체계 완비
3. **[PDF 뷰어] 순수 뷰어/가상 스크롤/OCR 스튜디오 실서비스 tokens.ts 통합 (BACKLOG-0035-02)**:
   - 와이어프레임 25개 완료에 이어 실제 PDF 비즈니스 3대 뷰어 화면 실서비스 tokens.ts 통합 및 렌더링 최적화
4. **[거버넌스 및 품질 가드레일]**:
   - HarnessRepository 기반 세션/태스크 DDL 정규화 및 Zero-Hang 5초 타임아웃 자율 폴백 가동
   - 4단계 서비스 종합점검 100점 만점 [A+ (PERFECT)] 유지 및 Zero-Loss 대화 턴 전수 영속화
   - dev/stg/main 3대 브랜치 100% 패리티 동기화`;

    const newIssueRes = await requestGitHub('/issues', 'POST', {
      title: issueTitle,
      body: issueBody
    });
    if (newIssueRes.body?.number) {
      issueNumber = newIssueRes.body.number;
      console.log(`✅ 신규 GitHub 이슈 등록 완료: #${issueNumber} (${newIssueRes.body?.html_url})`);
    } else {
      console.log(`ℹ️ GitHub API 이슈 등록 스킵/기본 번호 사용: #${issueNumber}`);
    }
  } else {
    console.log(`ℹ️ GITHUB_TOKEN 미설정으로 로컬 이슈 번호 #${issueNumber} 할당`);
  }

  console.log('\n================================================================');
  console.log('🌱 [4단계] 작업 브랜치 확인 및 준비');
  console.log('================================================================');

  const branchName = 'task/0036_01_ribbon_inline_and_phase5_api_Gemini';
  if (GITHUB_TOKEN) {
    try {
      const createRefRes = await requestGitHub('/git/refs', 'POST', {
        ref: `refs/heads/${branchName}`,
        sha: devSha
      });
      console.log(`원격 브랜치 생성 상태: ${createRefRes.status}`);
    } catch (e: any) {
      console.warn('원격 브랜치 생성 경고:', e.message);
    }
  }

  try {
    execSync(`git checkout -B ${branchName} dev`, { stdio: 'pipe' });
    console.log(`✅ 작업 브랜치 [${branchName}] 로컬 체크아웃 완료`);
  } catch (err: any) {
    console.warn(`브랜치 체크아웃 경고:`, err.message);
  }

  console.log('\n================================================================');
  console.log('💾 [5단계] HarnessRepository 기반 SESSION-0036 및 TASK-0036-01 등록');
  console.log('================================================================');

  const session0036 = {
    session_id: 'SESSION-0036',
    session_name: '[0036] 상단 리본 네비게이션 인라인 일체화(화면 부유 증상 조치) 및 Phase 5 관리자 3단계 확장화면(PG-ADM-09~12) 실제 REST API 연동',
    work_group: 'purePDFrend',
    ai_agent: 'gemini',
    ai_model: 'models/gemini-1.5-flash',
    status_cd: '진행중',
    started_at: new Date().toISOString(),
    ended_at: null,
    doc_payload: {
      objective: '상단 리본 네비게이션(#btn-top-ribbon-trigger)의 absolute top-0 z-50 부유 구조를 Navbar 정규 인라인 버튼으로 일체화하여 화면 가림 및 붕 떠있는 증상 완결 조치, Phase 5 관리자 3단계 확장화면(PG-ADM-09~12) 실제 REST 엔드포인트 연동 및 목업 데이터 폴백 완비, PDF 뷰어 실서비스 tokens.ts 통합 및 렌더링 최적화, 4단계 서비스 종합점검 100점 만점 [A+ (PERFECT)] 유지',
      issue_number: issueNumber,
      branch: branchName,
      base_sha: devSha,
      operator_account: 'jkok2j2m',
      user_email: 'jkok2j2m@gmail.com',
      linked_from_session: 'SESSION-0035',
      reference_docs: [
        'docs/13.회고/13-28_SESSION-261025-0035_세션종합_KPT_회고록.md',
        'docs/05.설계/05-33_상단_리본_접이식_레이어_모듈_네비게이션_설계서.md',
        'docs/10.리뷰/261025_058_상단_리본_접이식_레이어_모듈_네비게이션_코드리뷰.md',
        'docs/07.로드맵/07-02_화면별_디자인_토큰_적용현황_및_단계별_로드맵.md',
        'src/styles/tokens.ts',
        'src/ppdf/components/WireframeRibbonLayer.tsx',
        'src/shared/components/Navbar.tsx',
        'src/ppdf/views/wireframes/admin/AdminExtendedModulesView.tsx',
        'src/aiagent/domain/harness/HarnessRepository.ts',
        'AGENTS.md v2.2',
        'GEMINI.md v1.0.0'
      ],
      tasks: [
        {
          task_id: 'TASK-0036-01',
          task_name: '상단 리본 네비게이션 인라인 일체화 및 Phase 5 관리자 3단계 확장화면(PG-ADM-09~12) 실제 REST API 연동',
          status: '준비'
        }
      ]
    },
    created_sys: 'agent-harness',
    created_by: 'jkok2j2m',
    updated_sys: 'agent-harness',
    updated_by: 'jkok2j2m',
    version: 1,
    operator_account: 'jkok2j2m',
    user_email: 'jkok2j2m@gmail.com'
  };

  const sessionRes = await HarnessRepository.upsertSession(session0036);
  console.log(`✅ HarnessRepository.upsertSession 완료: ${sessionRes.success ? '성공' : sessionRes.error}`);

  const task0036_01 = {
    task_id: 'TASK-0036-01',
    session_id: 'SESSION-0036',
    task_name: '상단 리본 네비게이션 인라인 일체화 및 Phase 5 관리자 3단계 확장화면(PG-ADM-09~12) 실제 REST API 연동',
    status_cd: '준비',
    work_group: 'purePDFrend',
    started_at: new Date().toISOString(),
    ended_at: null,
    doc_payload: {
      scope: '상단 리본 네비게이션 absolute 부유 구조의 Navbar 정규 인라인 버튼 전환 및 화면 가림 해소, PG-ADM-09~12 실제 REST API 연동 및 오프라인 폴백, PDF 핵심 3대 뷰어 실서비스 tokens.ts 통합 및 렌더링 최적화',
      branch: branchName,
      issue_number: issueNumber,
      backlog_ids: ['BACKLOG-0035-04', 'BACKLOG-0035-01', 'BACKLOG-0035-02', 'BACKLOG-0035-03']
    },
    created_sys: 'agent-harness',
    created_by: 'jkok2j2m',
    updated_sys: 'agent-harness',
    updated_by: 'jkok2j2m',
    version: 1,
    operator_account: 'jkok2j2m',
    user_email: 'jkok2j2m@gmail.com'
  };

  const taskRes = await HarnessRepository.upsertTask(task0036_01);
  console.log(`✅ HarnessRepository.upsertTask 완료: ${taskRes.success ? '성공' : taskRes.error}`);

  console.log('\n================================================================');
  console.log('🎉 SESSION-0036 세션 초기화 완료!');
  console.log(`- 세션 ID: SESSION-0036`);
  console.log(`- 작업 브랜치: ${branchName}`);
  console.log(`- GitHub 이슈: #${issueNumber}`);
  console.log(`- 기준 SHA: ${devSha}`);
  console.log('================================================================');
}

main().catch(console.error);
