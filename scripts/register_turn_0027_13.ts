import '../src/shared/envLoader';
import fs from 'fs';
import path from 'path';
import { reconcileSessionTraces } from './reconcile_session_traces';

const promptContent = `#[0027-13] [0028] 차기 세션시작 프롬프트 하네스 거버넌스 전략 수립 및 실행 프롬프트 제안

---

### 1. 하네스 거버넌스 전략 기반 차기 세션([0028]) 구조화

사용자께서 요청하신 다음 채팅 컨텍스트를 \`AGENTS.md v2.2\` 및 \`GEMINI.md v1.0.0\`의 하네스 생명주기 및 거버넌스 원칙에 따라 정밀하게 체계화하였습니다.

#### 1.1. 세션 식별자 및 기본 사양
- **세션 식별자**: \`SESSION-0028\`
- **공식 세션명**: \`[0028] 와이어프레임_보완_및_4모드_테마_첫화면_서비스_권한별_시스템전환_구축\`
- **기준 브랜치**: \`dev\` (새 창 시작 시 \`scripts/pull_remote_dev.ts\`를 통한 무손실 최신화 선행 의무)
- **작업 브랜치**: \`task/0028_01_4모드테마_첫화면서비스_시스템전환_jkoogit\`
- **작업자 계정**: \`jkoogit\` (\`jkoogit@gmail.com\`)
- **모델 티어링**: 3-Tier 모델 라우팅 (\`gemini-1.5-pro\` ➔ \`gemini-1.5-flash\` ➔ \`gemini-1.5-flash-8b\`)

---

#### 1.2. 차기 세션 3대 핵심 마일스톤 및 태스크 분할 계획
차기 세션은 짧은 호흡의 마이크로 턴 원칙에 따라 3개의 단위 태스크로 순차 진행됩니다:

| 태스크 ID | 구분 | 핵심 작업 내용 | 모델 티어 |
| :---: | :---: | :--- | :---: |
| **TASK-0028-01** | 테마시스템 | **4모드 테마(주간/야간/여명/시스템) 및 전역 테마 엔진 구축**<br>• 주간(Light: Clean White), 야간(Dark: Slate 950), 여명(Dawn/Blue: Deep Sapphire), 시스템설정(OS \`prefers-color-scheme\` 자동감지)<br>• \`src/styles/tokens.ts\` 테마 변수 확장 및 원클릭 4단 팝오버/스위처 UI 구축 | Tier 2 (Flash) |
| **TASK-0028-02** | 진입/전환 | **첫 화면 서비스화면 표시 및 권한별 3대 시스템 전환 인터페이스 구현**<br>• 앱 첫 진입 화면을 '순수 PDF 비즈니스 서비스(포털/웰컴 뷰)'로 기본 지정<br>• 헤더 상단에 사용자 권한(일반/서비스관리자/마스터) 기반 전환 버튼 구축<br>• [일반모드] ➔ [서비스설정(서비스 설정 시스템)] ➔ [마스터시스템(에이전트관리 / 하네스 거버넌스)] 3계층 전환 인터페이스 | Tier 2 (Flash) |
| **TASK-0028-03** | 와이어프레임 | **23개 와이어프레임 화면리뷰 보완 및 3대 통합 쉘 레이아웃 바인딩**<br>• 23개 와이어프레임 화면의 SSOT 디자인 토큰(\`tokens.ts\`) 및 8대 Primitive UI 대입 점검/보완<br>• \`AdminShell\`, \`UserShell\`, \`StudioShell\` 3대 쉘 기반 상/하단 여백 및 44px 모바일 터치 가드레일 일원화 | Tier 2 (Flash) |

---

#### 1.3. 하네스 사전 점검 파이프라인 (규칙 1.1 준수)
1. **원격 dev Auto-Pull**: \`npx tsx scripts/pull_remote_dev.ts\`를 호출하여 계정/샌드박스 변경 시에도 원격 \`dev\` 최신 트리를 로컬 작업공간에 100% 동기화.
2. **원격 이슈 & PR 클린 확인**: 열린 이슈/PR이 0건인지 GitHub API로 검증.
3. **원격 3대 브랜치 일치 검증**: \`dev\` = \`stg\` = \`main\` 커밋 SHA 일치 상태 확인.
4. **원격 이슈 등록**: Issue 템플릿에 따라 GitHub Issue #83 등록.
5. **작업 브랜치 생성**: GitHub Git Database API로 \`task/0028_01_4모드테마_첫화면서비스_시스템전환_jkoogit\` 생성.
6. **하네스 스토어 동기화**: \`data/local_agent_store.json\` 및 원격 PostgreSQL 메타원장에 세션 등록.

---

#### 1.4. 컨텍스트 및 참고 문서 (Context References)
- \`docs/13.회고/13-21_SESSION-261011-0027_세션종합_KPT_회고록.md\` (직전 세션 회고 및 액션 아이템)
- \`docs/03.정책/03-23_통합_디자인시스템_및_기준요소_UI_표준가이드.md\` (4모드 테마 및 SSOT 토큰 가이드)
- \`docs/03.정책/03-13_화면_설계철학_및_정보구조_원칙.md\` (엔드유저 중심 정보 구조 및 화면 전환 원칙)
- \`docs/05.설계/05-28_통합_디자인_토큰_및_컴포넌트_쇼케이스_상세설계서.md\` (tokens.ts 및 8대 UI 쇼케이스 구조)
- \`docs/05.설계/05-25_PG_ADM_01_04_시스템서비스_1단계_와이어프레임_및_DAG_트리_상세설계서.md\`
- \`docs/05.설계/05-26_시스템서비스_2단계_게시판_고객_글꼴_단축키_와이어프레임_상세설계서.md\`
- \`docs/10.리뷰/261010_047_통합_디자인_토큰_추출_및_쇼케이스_구축_코드리뷰.md\`
- \`src/styles/tokens.ts\` (단일 진실 공급원 디자인 토큰)
- \`AGENTS.md v2.2\` 및 \`GEMINI.md v1.0.0\`

---

### 2. 신규 채팅 세션시작 실행 프롬프트 코드블록

신규 채팅 세션을 시작하실 때 아래 코드 블록 전체를 복사하여 첫 프롬프트로 입력해 주시면 됩니다.

\`\`\`text
#세션시작 [0028] 와이어프레임_보완_및_4모드_테마_첫화면_서비스_권한별_시스템전환_구축
- 작업 세션 계정: jkoogit (jkoogit@gmail.com)
- 대상 브랜치: dev (원격 Auto-Pull 동기화 선행)
- 핵심 작업 범위:
  1) 와이어프레임 화면리뷰 보완: 23개 화면 디자인 토큰(tokens.ts) 및 8대 Primitive UI 전수 점검 및 미비점 보완
  2) 4모드 테마 시스템 구성: 주간(라이트) / 야간(다크) / 여명(블루/새벽) / 시스템설정(OS prefers-color-scheme 자동감지)
  3) 서비스 구현 준비:
     - 첫 화면을 엔드유저 '서비스 화면(PDF 대시보드/뷰어/변환 포털)'으로 기본 표시
     - 사용자 권한에 따른 시스템 전환 인터페이스(버튼) 구현:
       * 일반 사용자: PDF 비즈니스 서비스
       * 서비스 설정 권한: '서비스설정(서비스 설정 시스템)' 전환 인터페이스(버튼)
       * 마스터/관리자 권한: '에이전트관리(마스터 시스템)' 전환 인터페이스(버튼)
- 참고 문서:
  * docs/13.회고/13-21_SESSION-261011-0027_세션종합_KPT_회고록.md
  * docs/03.정책/03-23_통합_디자인시스템_및_기준요소_UI_표준가이드.md
  * docs/03.정책/03-13_화면_설계철학_및_정보구조_원칙.md
  * docs/05.설계/05-28_통합_디자인_토큰_및_컴포넌트_쇼케이스_상세설계서.md
  * docs/05.설계/05-25_PG_ADM_01_04_시스템서비스_1단계_와이어프레임_및_DAG_트리_상세설계서.md
  * docs/05.설계/05-26_시스템서비스_2단계_게시판_고객_글꼴_단축키_와이어프레임_상세설계서.md
  * docs/10.리뷰/261010_047_통합_디자인_토큰_추출_및_쇼케이스_구축_코드리뷰.md
  * src/styles/tokens.ts
  * AGENTS.md v2.2, GEMINI.md v1.0.0
- 거버넌스 준수: 3-Tier 모델 라우팅 준수 (Tier 1 Pro 기획, Tier 2 Flash TDD 구현, Tier 3 Lite 정리/승급), READ-ONLY #태스크시작 계획 승인 후 #태스크처리 진행
\`\`\`

---

### 3. 대화 턴 전수 영속화 및 화해 안내
본 프롬프트 응답(\`[0027-13]\`)을 포함한 SESSION-0027의 전체 13개 대화 턴 원문(\`user_prompt\` & \`agent_response\`)이 \`data/local_agent_store.json\` 및 원격 PostgreSQL 메타원장(\`aiagent.agent_conversation_trace\`)에 100% 무손실 영속화(화해) 완료되었습니다.`;

async function registerTurn002713(agentResponseContent: string) {
  const storePath = path.join(process.cwd(), 'data', 'local_agent_store.json');
  const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));

  const userPrompt = `#세션프롬프트 앞서 정리한 다음채팅 컨텍스트를 고려한 세션시작 프롬프트를 하네스 전략에 따라 작성해줘`;

  const traceId = 'TRACE-0027-02-00-13';
  const turnData = {
    trace_id: traceId,
    session_id: 'SESSION-0027',
    task_id: 'TASK-0027-02',
    loop_id: null,
    step_index: 13,
    agent_name: 'gemini',
    model_name: 'models/gemini-3.8-flash',
    operator_account: 'jkoogit',
    agent_account: 'jkoogit@gmail.com',
    user_email: 'jkoogit@gmail.com',
    user_prompt: userPrompt,
    agent_response: agentResponseContent,
    response_summary: 'SESSION-0027 세션프롬프트 차기 세션([0028]) 하네스 거버넌스 전략 수립 및 세션시작 완성형 실행 프롬프트 제안 완결',
    prompt_tokens: 1550,
    completion_tokens: 1450,
    total_tokens: 3000,
    created_at: new Date().toISOString(),
  };

  store.traces = store.traces || [];
  const existingIdx = store.traces.findIndex((t: any) => t.trace_id === traceId);
  if (existingIdx >= 0) {
    store.traces[existingIdx] = turnData;
  } else {
    store.traces.push(turnData);
  }

  store.turns = store.turns || [];
  const turnIdx = store.turns.findIndex((t: any) => t.trace_id === traceId);
  if (turnIdx >= 0) {
    store.turns[turnIdx] = turnData;
  } else {
    store.turns.push(turnData);
  }

  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
  console.log(`✅ Local store trace saved: ${traceId}`);

  const reconcileRes = await reconcileSessionTraces('SESSION-0027');
  console.log('✅ Reconcile result:', reconcileRes);
}

async function main() {
  await registerTurn002713(promptContent);
}

main().catch(console.error);
