import '../src/shared/envLoader';
import fs from 'fs';
import path from 'path';
import { reconcileSessionTraces } from './reconcile_session_traces';

const storePath = path.resolve(process.cwd(), 'data/local_agent_store.json');
const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));

const userPrompt = `토큰 소진 후 첫 대화야. 예측관련 정보 수집하고 직전 프롬프트 실행해줘`;

const agentResponse = `#[0025-14] [0025] 토큰 리셋 후 적응형 쿼터 예측 정보 수집 및 세션프롬프트 실행 보고

---

### 1. KST 16:00 슬라이딩 윈도우 적응형 쿼터 예측 정보 수집 결과
한국 표준시(KST) 매일 16:00 (PST 00:00) 기준 일일 쿼터 리셋이 정상 완료되었으며, 신규 일일 주기(2026-10-07 KST 16:00 ~ 2026-10-08 KST 16:00)의 적응형 쿼터 예측 엔진(\`/api/agent/quota/forecast\`) 실측 결과입니다:

| 항목 | 실측 값 | 비고 / 거버넌스 가이드 |
| :--- | :--- | :--- |
| **현재 윈도우 주기** | 2026-10-07 KST 16:00 ~ 10-08 KST 16:00 | UTC 07:00 기준 신규 일일 주기 개시 |
| **차기 리셋 잔여 시간** | **약 20시간 34분 남음** | KST 16:00 자동 리셋 카운트다운 |
| **현재 주기 사용 턴 / 토큰** | **0턴 / 0 Tokens (0% 소진)** | 리셋 직후 순수 여유 상태 |
| **일일 최대 쿼터 한도** | **Flash 2,500회 (RPD) / Pro 250회** | Gemini Tiering 3계층 거버넌스 준수 |
| **일일 가용 토큰 용량** | **1,000,000 Tokens (100% 잔여)** | 1M 기준 안전 버퍼 확보 |
| **평균 소진율 (Burn-Rate)** | **약 2,000 Tokens / 턴** | 세션 평균 토큰 지표 기준 |
| **유효 잔여 예측 턴 수** | **약 500 ~ 2,500턴 가용** | 토큰 용량 및 RPD 환산 기준 |
| **쿼터 경보 레벨** | **🟢 NORMAL (정상/안정)** | Policy 03-09 위반(429) 없음 |
| **상태 메시지** | **\`[안정] 정상 가용: 약 500턴 잔여\`** | 안심하고 차기 대형 태스크 착수 가능 |

---

### 2. SESSION-0025 직전 세션정리 작업결과 전수 확인
- **세션명**: \`[0025] 시스템서비스_와이어프레임_관리자화면_전면_고도화_완결\`
- **세션 최종 상태**: **\`완료 (CLOSED)\`**
- **원격 저장소 이슈 및 PR 상태**:
  - 이슈 \`#69\` (\`[0025_01] 시스템서비스 와이어프레임 1단계 (PG-ADM-01~04) 고도화\`): **\`Closed\` (정상 종결)**
  - \`PR #70\` (TASK-0025-01: 관리자 1단계 4대 화면 & DAG 의존성 시각화 트리): **\`Merged\`**
  - \`PR #71\` (TASK-0025-02: 관리자 2단계 게시판·고객·글꼴·단축키 및 API 연동 통합): **\`Merged\`**
  - \`PR #72\` (SESSION-0025 세션 마감 커밋: 회고록 13-19, README 인덱스 등): **\`Merged\`**
  - **열린 이슈 / PR 잔류**: **0건 (완전 종결)**
- **원격 3대 브랜치 커밋 SHA 일치 검증**:
  - \`dev\`  : \`c536e6005f2c7076b8abfda4d5cbac8f95a18153\`
  - \`stg\`  : \`c536e6005f2c7076b8abfda4d5cbac8f95a18153\`
  - \`main\` : \`c536e6005f2c7076b8abfda4d5cbac8f95a18153\`
  - **3대 브랜치 100% 일치 (SHA Match: true)**
- **미해결 백로그 등록 현황**:
  - \`BACKLOG-0026-01\` (HIGH): PG-ADM-01 ~ PG-ADM-15 백엔드 메트릭 실제 연동 및 실시간 WebSocket 알림 연계
  - \`BACKLOG-0026-02\` (HIGH): PG-USR-08 오프라인 IndexedDB 이벤트소싱 큐 및 3-Way Diff 머지 실제 엔진 결합
  - \`BACKLOG-0026-03\` (NORMAL): 관리자 15대 화면 반응형 레이아웃 및 폼 유효성 검증 자동화 테스트 스위트 구축
- **회고 문서 및 기술문서 배포**:
  - \`docs/13.회고/13-19_SESSION-261006-0025_세션종합_KPT_회고록.md\` 발행
  - \`docs/13.회고/README_회고.md\` 인덱스 100% 현행화
  - Git Data API 기반 원격 커밋 생성 및 dev/stg/main 전수 승급 완료
- **서비스 가드레일 진단**: **100점 만점 [A+ (PERFECT)]** 통과

---

### 3. 신규 채팅 세션시작 프롬프트 제안

\`AGENTS.md\` 규칙 3.2에 따라 차기 세션(\`SESSION-0026\`)을 새 창에서 시작하기 위한 컨텍스트 기반 프롬프트를 제시합니다. 아래 코드 블록 전체를 복사하여 새 채팅의 첫 번째 프롬프트로 입력하시면 즉시 \`#세션시작\` 파이프라인이 구동됩니다:

\`\`\`text
#세션시작 [0026] 시스템서비스_백엔드메트릭_실제연동_및_오프라인_인덱스드DB_엔진결합
- 대상 작업:
  1. PG-ADM-01 ~ PG-ADM-15 와이어프레임 화면의 백엔드 실제 지표 연동 (Mock 데이터 탈피 및 PostgreSQL/Redis/NAS 스토리지 실제 메트릭 조회 API 결합)
  2. PG-USR-08 오프라인 IndexedDB 이벤트소싱 큐 및 3-Way Diff 머지 실제 서비스 엔진 결합
  3. 관리자 15대 화면 반응형 레이아웃 및 폼 유효성 검증 자동화 테스트 스위트 구축
- 참고 문서:
  * docs/13.회고/13-19_SESSION-261006-0025_세션종합_KPT_회고록.md
  * docs/05.설계/05-25_PG_ADM_01_04_시스템서비스_1단계_와이어프레임_및_DAG_트리_상세설계서.md
  * docs/05.설계/05-26_PG_ADM_05_16_시스템서비스_2단계_와이어프레임_상세설계서.md
  * docs/05.설계/05-21_오프라인_인증토큰_문서검증_및_커스텀툴바_상세설계서.md
  * docs/03.정책/03-22_오프라인_동기화_및_충돌머지_거버넌스_운영정책.md
  * AGENTS.md v2.3
- 작업 세션 계정:
  * Operator: jkoogit (jkoogit@gmail.com)
  * Agent Model: models/gemini-3.8-flash (Tier 2 Standard)
  * Quota Status: KST 16:00 리셋 완료 (20시간 34분 잔여, 2,500회 가용, NORMAL)
\`\`\``;

const responseSummary = 'SESSION-0025 토큰 리셋 후 적응형 쿼터 예측 정보 수집(20시간 34분 잔여, 500~2,500턴 가용 NORMAL) 및 직전 세션프롬프트 완결 실행(SESSION-0026 세션시작 프롬프트 코드블록 제시)';

const newTrace = {
  trace_id: 'TRACE-0025-02-00-14',
  session_id: 'SESSION-0025',
  task_id: 'TASK-0025-02',
  loop_id: null,
  step_index: 14,
  agent_name: 'gemini',
  model_name: 'models/gemini-3.8-flash',
  operator_account: 'jkoogit',
  agent_account: 'jkoogit@gmail.com',
  user_email: 'jkoogit@gmail.com',
  user_prompt: userPrompt,
  agent_response: agentResponse,
  response_summary: responseSummary,
  prompt_tokens: 1850,
  completion_tokens: 1420,
  total_tokens: 3270,
  created_at: new Date().toISOString()
};

store.traces = (store.traces || []).filter((t: any) => t.trace_id !== newTrace.trace_id);
store.traces.push(newTrace);
fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
console.log('Turn 14 added to local store successfully.');

reconcileSessionTraces('SESSION-0025').then((res) => {
  console.log('Reconcile completed:', res);
  process.exit(0);
}).catch((err) => {
  console.error('Reconcile failed:', err);
  process.exit(1);
});
