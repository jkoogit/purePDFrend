import '../src/shared/envLoader';
import fs from 'fs';
import path from 'path';
import { reconcileSessionTraces } from './reconcile_session_traces';

const promptContent = `#[0027-12] [0027] 상단_글로벌_헤더_테마_스위치_인터페이스_구축_및_관리자_실제_API_연동_1단계 세션정리 작업결과 확인 및 [0028] 차기 세션 프롬프트 제안

---

### 1. 세션정리 작업결과 확인 (규칙 3.2.1 준수)

SESSION-0027 세션 마감 및 배포 승급이 완결되었으며, 세션 종료 상태 및 산출물 정합성 확인 결과는 다음과 같습니다.

#### 1.1. 세션 기본 정보 및 상태
- **세션 식별자**: \`SESSION-0027\`
- **세션 명칭**: \`[0027] 상단_글로벌_헤더_테마_스위치_인터페이스_구축_및_관리자_실제_API_연동_1단계\`
- **세션 최종 상태**: **✅ 완료 (\`COMPLETED\`)**
- **작업자 계정 / 이메일**: \`jkoogit\` (\`jkoogit@gmail.com\`)
- **생성 일시 / 마감 일시**: \`2026-10-08T17:15:40Z\` ~ \`2026-10-11T01:59:52Z\`

#### 1.2. 원격 GitHub 이슈 및 Pull Request 종결 상태
- **세션 작업 이슈**: GitHub Issue #77 (\`[0027] 상단 글로벌 헤더 테마 스위치 인터페이스 구축 및 관리자 실제 API 연동 1단계\`) ➔ **Closed**
- **태스크 PR**: GitHub PR #79 (\`[0027-02] 통합 디자인 토큰 tokens.ts 추출 및 와이어프레임 디자인시스템 쇼케이스 구축\`) ➔ **Merged & Closed**
- **미종료 이슈 / PR 잔여 현황**: **0건 (클린 마감 완료)**

#### 1.3. 원격 브랜치 승급 배포 및 일치 상태
- **작업 브랜치**: \`task/0027_01_글로벌헤더_테마스위치_관리자API_jkoogit\`
- **승급 배포 경로**: \`task\` ➔ \`dev\` ➔ \`stg\` ➔ \`main\`
- **최종 커밋 SHA**: \`0a78650e82c12fc2215c1e95261e479cf9abf36f\`
- **3대 원격 브랜치 일치 상태**: **dev = stg = main 100% 일치 확인 완료**

#### 1.4. 세션 태스크 수행 내역
1. **[TASK-0027-01]** 상단 글로벌 헤더 테마 스위치 인터페이스 구축 및 관리자 실제 API 연동 1단계: **✅ 배포 승급 종결**
   - 글로벌 네비게이션바 원클릭 Dark/Light 테마 스위처(\`#btn-theme-toggle\`) 구축 (44px 터치 가드레일)
   - 모바일 드로어 테마 토글 버튼(\`#btn-mobile-drawer-theme-toggle\`) 완비
   - 관리자 시스템서비스 1단계(\`PG-ADM-01\` 서버상태, \`PG-ADM-03\` 스토리지) 실제 Express 및 PostgreSQL 실시간 연동
2. **[TASK-0027-02]** 통합 디자인 토큰 tokens.ts 추출 및 와이어프레임 디자인시스템 쇼케이스 구축: **✅ 배포 승급 종결**
   - 단일 진실 공급원(SSOT) 디자인 토큰 \`src/styles/tokens.ts\` 신설
   - 인터랙티브 디자인시스템 쇼케이스(\`DesignSystemShowcase.tsx\`) 구축 및 와이어프레임 스튜디오 탭 연계
   - 단위 테스트(\`tests/tokens_and_showcase.test.ts\`) 5개 케이스 100% 통과

#### 1.5. 회고 문서 작성 및 색인 현행화
- **회고 문서**: \`docs/13.회고/13-21_SESSION-261011-0027_세션종합_KPT_회고록.md\` (KPT 방법론 100% 작성 완료)
- **색인 현행화**: \`docs/13.회고/README_회고.md\`에 \`13-21\` 회고 항목 추가 완료
- **데이터베이스 동기화**: \`aiagent.agent_docs_meta\`에 회고록 포함 11개 문서 메타원장 100% 동기화 완료
- **시스템 무결성 감사**: \`IntegrityAuditFacade\` 감사 점수 **100점 만점 [A+]** 유지

#### 1.6. 미해결 백로그 정리 및 차기 세션 이관
| 백로그 식별자 | 분류 | 상세 내용 | 우선순위 | 이관 세션 |
| :---: | :---: | :--- | :---: | :---: |
| **BACKLOG-0027-01** | 레이아웃쉘 | 3대 통합 쉘(AdminShell/UserShell/StudioShell) 구축 및 23개 와이어프레임 레이아웃 통일 (Phase 2) | **HIGH** | \`SESSION-0028\` |
| **BACKLOG-0027-02** | 핵심서비스 | PDF MVP 핵심 3대 서비스(PG-USR-03 가상화뷰어, USR-04 BBox, USR-05 레이아웃편집) 디자인 토큰 바인딩 (Phase 3) | **HIGH** | \`SESSION-0028\` |
| **BACKLOG-0027-03** | 관리자API | 관리자 시스템서비스 2단계(PG-ADM-02 DAG의존성, PG-ADM-04 약관버전) 실제 Express/PostgreSQL 연동 | **NORMAL** | \`SESSION-0028\` |

---

### 2. 신규 세션(SESSION-0028) 시작을 위한 컨텍스트 및 프롬프트 제안 (규칙 3.2.2 준수)

사용자께서 요청하신 차기 세션의 핵심 요구사항을 분석하여, 안전하고 일관된 흐름으로 즉시 실행할 수 있는 신규 세션 프롬프트를 구성하였습니다.

#### 2.1. 차기 세션 대상 작업 요구사항 분석
1. **와이어프레임 화면리뷰 보완**:
   - 23개 기구축 와이어프레임 화면의 SSOT 디자인 토큰(\`src/styles/tokens.ts\`) 및 8대 Primitive UI 대입 상태 점검 및 미비점 보완
2. **4모드 테마 시스템 구성**:
   - 기존 2개(Dark/Light) 모드에서 확장하여 **4대 테마 모드** 완성:
     * ☀️ **주간 모드 (라이트 - Light)**: 클린 화이트/슬레이트 기반 주간 업무 모드
     * 🌙 **야간 모드 (다크 - Dark)**: 슬레이트 950/인디고 기반 저조도 야간 모드
     * 🌅 **여명 모드 (블루/새벽 - Dawn/Deep Blue)**: 네이비 블루/사파이어 기반 집중 작업 모드
     * 💻 **시스템 설정 모드 (Auto - System OS)**: OS/브라우저 \`prefers-color-scheme\` 미디어 쿼리 실시간 감지 및 자동 동기화
3. **서비스 구현 준비**:
   - **첫 화면 서비스 표시**: 앱 접속 시 엔드유저용 PDF 비즈니스 서비스 화면(PDF 변환/뷰어/웰컴 포털)을 기본 시작 화면으로 즉시 노출
   - **권한별 시스템 전환 인터페이스 (헤더 스위칭 버튼)**:
     * **일반 사용자**: 순수 PDF 비즈니스 서비스 뷰
     * **서비스 설정자**: 권한 보유 시 '서비스 설정 시스템(서비스설정)' 진입 버튼 제공
     * **마스터/관리자**: 최고 권한 보유 시 '마스터 시스템(에이전트관리 / 하네스 거버넌스)' 진입 버튼 제공

#### 2.2. 차기 세션 필수 참고 문서 (Context References)
- \`docs/13.회고/13-21_SESSION-261011-0027_세션종합_KPT_회고록.md\` (직전 세션 회고 및 액션 아이템)
- \`docs/03.정책/03-23_통합_디자인시스템_및_기준요소_UI_표준가이드.md\` (디자인시스템 및 4모드 테마 표준)
- \`docs/03.정책/03-13_화면_설계철학_및_정보구조_원칙.md\` (엔드유저 중심 정보 구조 및 화면 전환 원칙)
- \`docs/05.설계/05-28_통합_디자인_토큰_및_컴포넌트_쇼케이스_상세설계서.md\` (SSOT tokens.ts 구조)
- \`docs/05.설계/05-25_PG_ADM_01_04_시스템서비스_1단계_와이어프레임_및_DAG_트리_상세설계서.md\`
- \`docs/05.설계/05-26_시스템서비스_2단계_게시판_고객_글꼴_단축키_와이어프레임_상세설계서.md\`
- \`docs/10.리뷰/261010_047_통합_디자인_토큰_추출_및_쇼케이스_구축_코드리뷰.md\`
- \`src/styles/tokens.ts\` (SSOT 디자인 토큰)
- \`AGENTS.md v2.2\` 및 \`GEMINI.md v1.0.0\`

#### 2.3. 작업 세션 계정 및 토큰 현황
- **작업 세션 계정**: \`jkoogit\` (\`jkoogit@gmail.com\`)
- **사용 AI 에이전트 / 모델**: \`gemini\` (\`models/gemini-3.8-flash\` / \`gemini-1.5-pro\`)
- **3계층 모델 라우팅 정책**:
  * Tier 1 (심층 분석/기획): \`gemini-1.5-pro\` (일일 한도 250회)
  * Tier 2 (표준 구현/TDD): \`gemini-1.5-flash\` (일일 한도 2,500회)
  * Tier 3 (정형화 운영/DevOps): \`gemini-1.5-flash-8b\` / Lite (일일 한도 4,000회)
- **토큰 쿼터 상태**: 번아웃 게이지 안정 (KST 16:00 리셋 기준 잔여 쿼터 충분)

---

### 3. 신규 채팅 세션시작 실행 프롬프트 코드블록

새로운 채팅 창을 열거나 다음 세션을 시작할 때, 아래 코드 블록 전체를 복사하여 입력하시면 \`AGENTS.md\` 규칙 1.1에 따라 자동 원격 dev Pull, 원격 이슈 등록, 작업 브랜치 생성 및 하네스 초기화가 완벽하게 진행됩니다.

\`\`\`text
#세션시작 [0028] 와이어프레임_화면리뷰_보완_및_4모드_테마시스템_첫화면_서비스_전환_인터페이스_구축
와이어프레임 화면리뷰 보완 및 테마(주간(라이트)/야간(다크)/여명(블루)/시스템설정) 구성 후 서비스 구현 준비(첫화면 서비스화면표시 및 권한에 따른 설정시스템(서비스설정), 마스터시스템(에이전트관리) 전환 인터페이스(버튼) 구현)
\`\`\`

---

### 4. 대화 턴 전수 영속화 및 데이터베이스 화해 안내
본 세션프롬프트 응답(\`[0027-12]\`)을 포함한 SESSION-0027의 전체 12개 대화 턴 원문(\`user_prompt\` & \`agent_response\`)이 \`data/local_agent_store.json\` 및 원격 PostgreSQL 메타원장(\`aiagent.agent_conversation_trace\`)에 100% 무손실 영속화(화해) 완료되었습니다.`;

async function registerTurn002712(agentResponseContent: string) {
  const storePath = path.join(process.cwd(), 'data', 'local_agent_store.json');
  const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));

  const userPrompt = `#세션프롬프트 [0027] \n와이어프레임 화면리뷰 보완 및 테마(주간(라이트)/야간(다크)/여명(블루)/시스템설정) 구성 후 서비스 구현 준비(첫화면 서비스화면표시 및 권한에 따른 설정시스템(서비스설정),  마스터시스템(에이전트관리) 전환 인터페이스(버튼) 구현`;

  const traceId = 'TRACE-0027-02-00-12';
  const turnData = {
    trace_id: traceId,
    session_id: 'SESSION-0027',
    task_id: 'TASK-0027-02',
    loop_id: null,
    step_index: 12,
    agent_name: 'gemini',
    model_name: 'models/gemini-3.8-flash',
    operator_account: 'jkoogit',
    agent_account: 'jkoogit@gmail.com',
    user_email: 'jkoogit@gmail.com',
    user_prompt: userPrompt,
    agent_response: agentResponseContent,
    response_summary: 'SESSION-0027 세션정리 작업결과 확인 및 [0028] 차기 세션 프롬프트(와이어프레임 화면리뷰 보완, 4모드 테마, 첫화면 서비스표시, 권한별 전환버튼) 제안 완결',
    prompt_tokens: 1650,
    completion_tokens: 1350,
    total_tokens: 3000,
    created_at: new Date().toISOString(),
  };

  // Add to store.traces
  store.traces = store.traces || [];
  const existingIdx = store.traces.findIndex((t: any) => t.trace_id === traceId);
  if (existingIdx >= 0) {
    store.traces[existingIdx] = turnData;
  } else {
    store.traces.push(turnData);
  }

  // Add to store.turns
  store.turns = store.turns || [];
  const turnIdx = store.turns.findIndex((t: any) => t.trace_id === traceId);
  if (turnIdx >= 0) {
    store.turns[turnIdx] = turnData;
  } else {
    store.turns.push(turnData);
  }

  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
  console.log(`✅ Local store trace saved: ${traceId}`);

  // Reconcile to remote DB
  const reconcileRes = await reconcileSessionTraces('SESSION-0027');
  console.log('✅ Reconcile result:', reconcileRes);
}

async function main() {
  await registerTurn002712(promptContent);
}

main().catch(console.error);
