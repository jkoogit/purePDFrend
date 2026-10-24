import '../src/shared/envLoader';
import fs from 'fs';
import https from 'https';
import { HarnessRepository } from '../src/aiagent/domain/harness/HarnessRepository';

const storePath = 'data/local_agent_store.json';
const store = HarnessRepository.getLocalStore();

const userPrompt = `[0034] Phase 4 관리자 2단계 핵심화면(PG-ADM-05~08) 실제 REST API 연동 및 관리자 전 화면 tokens.ts 전면 완결

#세션시작 [0034] Phase 4 관리자 2단계 핵심화면(PG-ADM-05~08) 실제 REST API 연동 및 관리자 전 화면 tokens.ts 전면 완결

[작업 세션 컨텍스트]
- 작업자: jkok2j2m (jkok2j2m@gmail.com)
- 추천 모델: Gemini 1.5 Flash (Tier 2, RPD 2,500회 무중단 모드)
- 직전 세션 기준 SHA: 467cb5aa (dev/stg/main 100% 일치)
- 핵심 참조 문서:
  * docs/07.로드맵/07-02_화면별_디자인_토큰_적용현황_및_단계별_로드맵.md (v1.4.0)
  * docs/13.회고/13-26_SESSION-261024-0033_세션종합_KPT_회고록.md (DOC-13-26)
  * docs/10.리뷰/261024_055_하네스_메타원장_도메인레포지토리_및_스키마표준화_코드리뷰.md (DOC-10-55)
  * docs/15.학습/15-25_하네스_메타원장_도메인레포지토리_및_스키마표준화_아키텍처.md (DOC-15-25)
  * docs/03.정책/03-23_통합_디자인시스템_및_기준요소_UI_표준가이드.md
  * src/styles/tokens.ts
  * src/ppdf/views/wireframes/AdminWireframes.tsx
  * src/aiagent/domain/harness/HarnessRepository.ts
  * AGENTS.md v2.2
  * GEMINI.md v1.0.0

[세션 핵심 작업 목표]
1. Phase 4 관리자 2단계 핵심 4개 화면 실제 REST API 연동 (BACKLOG-0033-01):
   - PG-ADM-05: 역할 및 세부 권한 매핑 그리드 (Express/PostgreSQL REST API 연동)
   - PG-ADM-06: 메뉴 및 화면 계층 트리 구조 (순환 방지 및 실시간 트리 API 연동)
   - PG-ADM-07: 시스템 실시간 접속 및 활동 로그 스트림 (원격 DB 실시간 로그 조회)
   - PG-ADM-08: 시스템 에러 및 예외 스택 추적 모달 (스택트레이스 및 에러 현황 API 연동)
2. 관리자 잔여 화면(PG-ADM-09~16, 8종) tokens.ts 전면 대입 점검 및 100% 완결 (BACKLOG-0033-02):
   - PG-ADM-09(알림센터), 10(공지게시판), 11(롤링배너), 12(환경설정), 13(고객문의), 14(1:1상담), 15(웹폰트), 16(단축키매핑)
   - 4모드(Light, Dark, Dawn, System) WCAG AA 고대비 가독성, 44px 모바일 터치타깃, Table-to-Card 반응형 가드레일 전수 보장
   - 관리자 16대 전 화면 tokens.ts 대입률 100% 달성 (플랫폼 전체 25개 와이어프레임 토큰화 완전 정복)
3. 도메인 레포지토리(HarnessRepository) 기반 세션/태스크/루프 관리:
   - DDL 100% 일치 스키마 헬퍼 및 Zero-Hang 5초 타임아웃 자율 폴백 가동
4. 하네스 거버넌스 및 품질 가드레일:
   - 4단계 서비스 전수 점검 100점 만점 [A+ (PERFECT)] 유지
   - Zero-Loss 대화 턴 전수 영속화 및 dev/stg/main 3대 브랜치 동기화`;

const agentResponse = `#[0034-01] SESSION-0034 세션 시작 및 환경 점검 완결 (Phase 4 관리자 REST API 연동 & 관리자 전 화면 tokens.ts 100% 완결 준비)

---

### 1. 세션 환경 점검 및 초기화 결과 요약

[AGENTS.md v2.2 규칙 1.1] 및 [GEMINI.md v1.0.0] 거버넌스 규정에 따라 원격 저장소 동기화, 이슈/PR 상태, 3대 브랜치 일치 상태, 하네스 스토어 등록을 성공적으로 완결하였습니다.

| 점검 항목 | 결과 / 상태 | 상세 내용 |
| :--- | :---: | :--- |
| **세션 ID 및 명칭** | **SESSION-0034** | \`[0034] Phase 4 관리자 2단계 핵심화면(PG-ADM-05~08) 실제 REST API 연동 및 관리자 전 화면 tokens.ts 전면 완결\` |
| **원격 \`dev\` 자동 풀** | **100% 완료** | \`npx tsx scripts/pull_remote_dev.ts\` 무손실 동기화 완결 (\`467cb5aac65d186ccd56a144185122e172015e31\`) |
| **원격 이슈 & PR 점검** | **0건 (이상무)** | Open Issues: 0건, Open PRs: 0건 (모두 정상 마감 확인) |
| **3대 원격 브랜치 일치** | **100% 일치** | \`dev\`, \`stg\`, \`main\` 브랜치 최신 커밋 SHA (\`467cb5aac65d186ccd56a144185122e172015e31\`) 완벽 일치 |
| **로컬 작업 브랜치 점검** | **클린 (이상무)** | 원격에 반영되지 않은 미푸시 코드 없음, 안전한 작업 기반 확인 |
| **신규 GitHub 이슈** | **[#99](https://github.com/jkoogit/purePDFrend/issues/99)** | 세션 목표 및 로드맵 연계 신규 등록 완료 |
| **신규 작업 브랜치** | **준비 완료** | \`task/0034_01_admin_p4_api_tokens_Gemini\` 원격 생성(201) 및 로컬 체크아웃 완결 |
| **하네스 메타 스토어** | **동기화 완료** | \`HarnessRepository\` 기반 \`SESSION-0034\` 및 \`TASK-0034-01\` 로컬 스토어 및 PostgreSQL DB 동기화 성공 |
| **4단계 서비스 헬스체크** | **100점 만점 [A+]** | 인프라, 하네스 정합성, 시스템 무결성, 60개 문서 전문검색 전 부문 합격 |

---

### 2. 이번 세션 주요 작업 목표 및 이행 전략

회고 문서([13-26](file:///d:/dev/repository/git.jkoogit/purePDFrend/docs/13.회고/13-26_SESSION-261024-0033_세션종합_KPT_회고록.md))의 잔여 백로그(\`BACKLOG-0033-01\`, \`BACKLOG-0033-02\`)와 로드맵([07-02](file:///d:/dev/repository/git.jkoogit/purePDFrend/docs/07.로드맵/07-02_화면별_디자인_토큰_적용현황_및_단계별_로드맵.md) v1.4.0)에 따른 핵심 추진 과업입니다.

1. **Phase 4 관리자 2단계 4대 핵심화면 Express/PostgreSQL 실제 REST API 연동 (\`BACKLOG-0033-01\`)**:
   - [PG-ADM-05](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/AdminWireframes.tsx) (역할 및 세부 권한 매핑): 역할 목록, 프로그램/메뉴별 읽기/쓰기/삭제 권한 매트릭스 그리드 실시간 REST API 연동
   - [PG-ADM-06](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/AdminWireframes.tsx) (메뉴 및 화면 계층 트리 구조): 순환 의존 방지(Cycle Detection) 및 메뉴 인덴트 트리 구조 실시간 API 연동
   - [PG-ADM-07](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/AdminWireframes.tsx) (시스템 실시간 접속 및 활동 로그 스트림): 접속 IP, 세션, 이벤트 로그 실시간 조회 및 자동 갱신 API 연동
   - [PG-ADM-08](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/AdminWireframes.tsx) (시스템 에러 및 예외 스택 추적 모달): 예외 목록, 심각도(FATAL/ERROR/WARN) 필터링, 스택트레이스 상세 모달 API 연동
2. **관리자 잔여 와이어프레임(8종) tokens.ts 전면 완결 (\`BACKLOG-0033-02\`)**:
   - [PG-ADM-09](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/AdminWireframes.tsx) (알림 및 시스템 공지 발송 센터): 다채널 발송 탭 및 토큰화
   - [PG-ADM-10](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/AdminWireframes.tsx) (서비스 공지사항 게시판 운영): 첨부/기간 필터 및 토큰화
   - [PG-ADM-11](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/AdminWireframes.tsx) (메인 롤링 이벤트 배너 관리): 미리보기 슬라이더 토큰화
   - [PG-ADM-12](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/AdminWireframes.tsx) (플랫폼 시스템 전역 환경설정): 3단 설정 폼 토큰화
   - [PG-ADM-13](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/AdminWireframes.tsx) (고객 지원 문의 및 FAQ 관리): 인라인 답변 모달 토큰화
   - [PG-ADM-14](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/AdminWireframes.tsx) (1:1 고객 상담 및 답변 센터): 상태별 배지 탭 토큰화
   - [PG-ADM-15](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/AdminWireframes.tsx) (무료 웹폰트 패키지 배포 관리): 가로형 카드 뷰 토큰화
   - [PG-ADM-16](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/AdminWireframes.tsx) (전역 단축키 및 도구그룹 매핑): 플로우 카드 뷰 토큰화
   - **관리자 16대 전 화면 tokens.ts 대입률 100% 완성 (플랫폼 전체 25개 와이어프레임 토큰화 100% 완전 정복)**
3. **디자인 규격 및 모바일 반응형 가드레일**:
   - 4모드(Light, Dark, Dawn, System) WCAG AA(4.5:1 이상) 고대비 가독성 100% 보장
   - 44px 모바일 최소 터치 타깃(\`min-h-[44px]\`) 및 Table-to-Card 반응형 가드레일(가로스크롤 0px 방어) 전수 준수
4. **거버넌스 및 품질 무결성 보장**:
   - [HarnessRepository](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/aiagent/domain/harness/HarnessRepository.ts) 기반 세션/태스크/루프 상태 관리 및 Zero-Hang 5초 타임아웃 방어
   - 4단계 서비스 전수 점검 100점 만점 [A+ (PERFECT)] 유지 및 Zero-Loss 대화 턴 전수 영속화

---

### 3. 후속 실행 프롬프트 제안

세션 초기화 및 사전 점검이 완료되었으므로, [AGENTS.md 규칙 2.1]에 따라 READ-ONLY 분석 및 계획 수립을 위한 \`#태스크시작\`을 진행합니다.

\`\`\`markdown
#태스크시작 [0034-01] Phase 4 관리자 2단계 핵심화면(PG-ADM-05~08) 실제 REST API 연동 및 관리자 전 화면 tokens.ts 전면 완결 계획 수립
\`\`\``;

const responseSummary = 'SESSION-0034 세션 시작 점검 완결, 원격 dev 최신 커밋(SHA: 467cb5aa) 무손실 동기화, 3대 브랜치 일치 검증, 신규 이슈 등록(#99) 및 작업 브랜치 생성, HarnessRepository 기반 스토어 및 DB 동기화 완료';

const turn0034_01 = {
  trace_id: 'TRACE-0034-01-00-01',
  session_id: 'SESSION-0034',
  task_id: 'TASK-0034-01',
  loop_id: null,
  step_index: 1,
  turn_num: '1',
  turn_number: 1,
  turn_identifier: '[0034-01]',
  operator_account: 'jkok2j2m',
  agent_account: 'jkok2j2m@gmail.com',
  user_email: 'jkok2j2m@gmail.com',
  user_prompt: userPrompt,
  agent_response: agentResponse,
  response_summary: responseSummary,
  status: 'SUCCESS',
  created_at: new Date().toISOString()
};

// 1. local_agent_store.json traces & conversation_turns 동기화
if (!Array.isArray(store.traces)) {
  store.traces = [];
}
store.traces = store.traces.filter((t: any) => t.trace_id !== 'TRACE-0034-01-00-01');
store.traces.push({
  ...turn0034_01,
  agent_name: 'gemini',
  model_name: 'models/gemini-1.5-flash',
  prompt_tokens: 0,
  completion_tokens: 0,
  total_tokens: 0
});

if (!Array.isArray(store.conversation_turns)) {
  store.conversation_turns = [];
}
store.conversation_turns = store.conversation_turns.filter((t: any) => !(t.session_id === 'SESSION-0034' && (t.turn_number === 1 || t.turn_identifier === '[0034-01]')));
store.conversation_turns.push(turn0034_01);

HarnessRepository.saveLocalStore(store);
console.log('✅ data/local_agent_store.json (traces & conversation_turns) [0034-01] 동기화 완료');

// 2. PostgreSQL aiagent.agent_conversation_trace 동기화
function escapeSql(str: string | null | undefined): string {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

const payload = JSON.stringify({
  database: 'purepdfrend_dev',
  sql: `INSERT INTO aiagent.agent_conversation_trace (
    trace_id, session_id, task_id, loop_id, step_index, agent_name, model_name,
    operator_account, agent_account, user_email,
    user_prompt, agent_response, response_summary, prompt_tokens, completion_tokens, total_tokens, created_at
  ) VALUES (
    'TRACE-0034-01-00-01', 'SESSION-0034', 'TASK-0034-01', NULL, 1, 'gemini', 'models/gemini-1.5-flash',
    'jkok2j2m', 'jkok2j2m@gmail.com', 'jkok2j2m@gmail.com',
    ${escapeSql(userPrompt)}, ${escapeSql(agentResponse)}, ${escapeSql(responseSummary)},
    0, 0, 0, now()
  ) ON CONFLICT (trace_id) DO UPDATE SET
    user_prompt = EXCLUDED.user_prompt,
    agent_response = EXCLUDED.agent_response,
    response_summary = EXCLUDED.response_summary;`
});

const req = https.request('https://ptype.pdfrend.com/api/query', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-JKADH-SECRET': 'jkadh-secure-secret-token-2026',
    'Authorization': 'Bearer jkadh-secure-secret-token-2026',
    'Content-Length': String(Buffer.byteLength(payload)),
  },
  rejectUnauthorized: false,
  timeout: 5000,
}, (res) => {
  let b = '';
  res.on('data', c => b += c);
  res.on('end', () => console.log('원격 DB 턴 적재 결과:', b.slice(0, 100)));
});
req.on('error', e => console.log('원격 DB 비동기 에러 (로컬 정상):', e.message));
req.write(payload);
req.end();
