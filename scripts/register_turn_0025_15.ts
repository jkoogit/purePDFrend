import '../src/shared/envLoader';
import fs from 'fs';
import path from 'path';
import { reconcileSessionTraces } from './reconcile_session_traces';

const storePath = path.resolve(process.cwd(), 'data/local_agent_store.json');
const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));

const userPrompt = `전반적으로 수용하고 다음세션에서 작업을 진행했으면 해
관련내용 문제없이 진행될 수 있게 세션프롬프트 작성해줘`;

const agentResponse = `#[0025-15] [0025] 디자인 시스템 도입 전략 수용 및 SESSION-0026 세션시작 프롬프트 제안 보고

---

### 1. 전략적 의사결정 수용 요약 (moabogo 디자인 정책 purePDFrend 이식)
상담에서 논의된 4단계 점진적 도입 전략(Zero-Regression Strategy)과 4대 특이 케이스(밀도 이원화, 캔버스 z-index 방어, Table-to-Card 규격화, Keycap/ToolIcon 승격)를 차기 세션의 핵심 과제로 확정하였습니다:

1. **안전성 최우선 (기존 PDF 캔버스 & 비즈니스 로직 100% 보존)**:
   - 한 번에 전체 화면을 뜯어고치는 '빅뱅(전면) 교체'를 엄격히 금지하고, **[정책 및 토큰 문서화] ➔ [공통 기준 컴포넌트 풀 독립 구축] ➔ [관리자 화면 점진 교체] ➔ [사용자 뷰어 적용]** 순서로 질서 있게 진행합니다.
2. **밀도 프리셋(Density Preset) 이원화 규격화**:
   - 사용자 PDF 뷰어(PG-USR)를 위한 **몰입형(Immersive/Spacious)** 규격과 관리자 백오피스(PG-ADM)를 위한 **고밀도(Compact)** 규격을 디자인 토큰 레벨에서 분리 정의합니다.
3. **Z-Index 계층 스케일(Z-Index Scale) 공식화**:
   - Fabric.js 캔버스 렌더링 레이어, 바운딩 박스 드래그 영역, 플로팅 툴바, 전역 모달/드로어 간의 z-index 간섭을 원천 차단합니다.

---

### 2. SESSION-0026 신규 채팅 세션시작 프롬프트 제안

새 채팅창을 여신 후 첫 번째 메시지로 아래 코드 블록 전체를 복사하여 입력해 주시면, \`SESSION-0026\` 세션이 규칙에 맞게 즉시 초기화되고 안전하게 작업이 시작됩니다:

\`\`\`text
#세션시작 [0026] 통합_디자인시스템_기준요소_정의_및_단계적_화면_재구성
- 대상 작업:
  1. [정책 수립] moabogo 디자인 패턴을 벤치마킹한 통합 디자인 정책 문서 수립 (docs/03.정책/03-23_통합_디자인시스템_및_기준요소_UI_표준가이드.md)
     - Color Palette(Primary, Slate, Semantic 상태색), Typography Scale, Spacing(44px 터치타깃), Z-Index Scale 정의
     - 4대 특이케이스(밀도 이원화 compact/viewer, 캔버스 오버레이 z-index, 모바일 Table-to-Card, 복합키 Keycap/ToolIcon) 명문화
  2. [기준 컴포넌트 풀 구축] src/shared/components/ui/ (또는 design-system/) 내 원자/분자 기준 컴포넌트 독립 개발
     - Button(다양한 변형 및 44px 터치), Input/Textarea, Card, Badge, Modal/Dialog, KeyCap, ToolIcon 개발 및 단위 검증
  3. [점진적 교체 1단계] 비즈니스 로직 영향도가 적은 관리자 시스템서비스(PG-ADM-01~04 등)부터 기준 컴포넌트 순차 대입 및 모바일 반응형 검증
- 참고 문서:
  * docs/13.회고/13-19_SESSION-261006-0025_세션종합_KPT_회고록.md
  * docs/03.정책/03-14_모바일반응형_카드전환_및_가로스크롤_원천방지_디자인가이드.md
  * docs/03.정책/03-22_오프라인_동기화_및_충돌머지_거버넌스_운영정책.md
  * docs/05.설계/05-25_PG_ADM_01_04_시스템서비스_1단계_와이어프레임_및_DAG_트리_상세설계서.md
  * docs/05.설계/05-26_PG_ADM_05_16_시스템서비스_2단계_와이어프레임_상세설계서.md
  * AGENTS.md v2.3
- 작업 세션 계정 및 환경:
  * Operator: jkoogit (jkoogit@gmail.com)
  * Agent Model: models/gemini-3.8-flash (Tier 2 Standard)
  * Quota Status: 일일 2,500회 가용 (리셋 완료, 잔여 충분)
\`\`\``;

const responseSummary = 'SESSION-0025 moabogo 디자인 시스템 도입 전략 수용 및 SESSION-0026 세션시작 프롬프트(정책문서 수립, 공통 기준컴포넌트 구축, 관리자 화면 점진교체) 제안 완결';

const newTrace = {
  trace_id: 'TRACE-0025-02-00-15',
  session_id: 'SESSION-0025',
  task_id: 'TASK-0025-02',
  loop_id: null,
  step_index: 15,
  agent_name: 'gemini',
  model_name: 'models/gemini-3.8-flash',
  operator_account: 'jkoogit',
  agent_account: 'jkoogit@gmail.com',
  user_email: 'jkoogit@gmail.com',
  user_prompt: userPrompt,
  agent_response: agentResponse,
  response_summary: responseSummary,
  prompt_tokens: 1650,
  completion_tokens: 1350,
  total_tokens: 3000,
  created_at: new Date().toISOString()
};

store.traces = (store.traces || []).filter((t: any) => t.trace_id !== newTrace.trace_id);
store.traces.push(newTrace);
fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
console.log('Turn 15 added to local store successfully.');

reconcileSessionTraces('SESSION-0025').then((res) => {
  console.log('Reconcile completed:', res);
  process.exit(0);
}).catch((err) => {
  console.error('Reconcile failed:', err);
  process.exit(1);
});
