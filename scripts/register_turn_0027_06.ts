import '../src/shared/envLoader';
import https from 'https';
import fs from 'fs';

const DB_BRIDGE_URL = process.env.REMOTE_DB_BRIDGE_URL || 'https://ptype.pdfrend.com';
const DB_BRIDGE_SECRET = process.env.REMOTE_DB_BRIDGE_SECRET || 'jkadh-secure-secret-token-2026';
const TARGET_DATABASE = 'purepdfrend_dev';

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
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
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

function escapeSql(str: string | null | undefined): string {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

async function main() {
  const traceId = 'TRACE-0027-01-00-06';
  const promptText = `현재 시스템 구성이 에이전트개발을위한 인프라서비스와 구현대상 서비스인 pdf관리 서비스가 함께 페키지를 기준으로 분리하여 구현하고있어.  
와이어프레임으로 도출한 설계화면을 서비스화면으로 전환하기 전에, 
디자인정책이 반영된 통일성과 안정성을 기반으로 한 컴포넌트 기반의 프론트 화면으로 전환하려는거야. 
(잔환한 화면으로 사용자, 설정, 관리자 서비스를 구현할계획.)

아직 이전 작업과정에서 셈플 정책(모아보고)을 기반으로한 전환 결과를 확인못하고있는데. 
언제 확인할수 있지?
아직 안된것 같은데 
전환계획과 절차를 검토해줘. 

{참고방안
Phase 1: 토큰 추출 (지금 당장)
src/styles/tokens.ts 하나 생성
- colors: brand / gray / semantic 3단계로 축소 (현재 Tailwind를 그대로 쓰면 50개 색이 난립)
- typography: display / body / mono 3타입만
- radius, shadow, spacing 4pt 시스템

 WireframeStudio에 있는 23개 화면의 모든 색을 이 토큰으로 강제 치환.

Phase 2: 컴포넌트 3계층
• Primitive: Button, Input, Card, Dialog, Badge -> src/components/ui/에 shadcn 기반으로 통일
 • Composite: VirtualizedPageList, BBoxCanvas, SecurityPolicyPanel -> PDF 도메인 전용, props는 오직 token과 data만 받음
 • Layout: AdminShell, UserShell, StudioShell 3개로 전부 통일. 현재 14개 admin이 각자 다른 레이아웃 쓰는 걸 막음 

Phase 3: PDF 기능 바인딩
• MVP는 USR-03(뷰어) + USR-04(BBox) + USR-05(레이아웃 편집) 3개만 디자인 시스템에 붙여서 완성. 나머지는 디자인 토큰 적용 후 순차 확장.
  } 이런 절차참고`;

  const responseText = `#[0027-06] 와이어프레임 설계화면의 디자인시스템 기반 서비스화면 전환계획 및 단계별 검토 보고

### 1. 전환 결과 체감 부재의 원인 진단 및 현재 상태 안내
- **진단 배경**: 이전 세션(SESSION-0026)에서 정책 03-23 및 8종 기준 컴포넌트 풀(\`Button\`, \`Input\`, \`Card\`, \`Badge\` 등)을 수립하였으나, 여전히 '완결된 전환 화면'을 체감하기 어려웠던 이유는 다음 3가지 핵심 누락 때문입니다:
  1. **단일 진실 공급원 토큰 파일(\`tokens.ts\`) 부재**: Tailwind 클래스가 23개 화면마다 산발적으로 직결되어 있어 색상/여백이 통일되지 못함.
  2. **3대 통합 레이아웃 쉘(\`Shell\`) 부재**: 16개 관리자 화면과 9개 사용자 화면이 각자 다른 컨테이너/패딩/헤더 구조를 지녀 일관된 룩앤필을 형성하지 못함.
  3. **디자인 시스템 쇼케이스 부재**: 정책이 반영된 컴포넌트와 토큰의 실제 동작 상태를 한눈에 볼 수 있는 쇼케이스 탭이 제공되지 않음.
- **현재 화면 확인 경로**: 상단 글로벌 헤더 우측 \`와이어프레임\` 바로가기 버튼 또는 상단 도메인 \`PDF 스튜디오\` -> \`와이어프레임\` 서브탭에서 프로토타입 상태 확인 가능.

### 2. 제안해주신 3단계 전환 참고방안(Phase 1~3) 상세 검토 및 채택
- **Phase 1: 토큰 추출 및 단일화 (\`src/styles/tokens.ts\` 신설)**:
  - 색상 3단계 축소: Brand(Primary Blue/Sky), Slate Gray(950/900/800/700), Semantic(Emerald, Amber, Rose, Sky)
  - 타이포그래피 3스케일: Display, Body, Tabular Mono
  - 4pt 그리드 시스템 및 44px 터치 가드레일 엄격 바인딩
- **Phase 2: 컴포넌트 3계층 아키텍처 구축**:
  - Primitive: \`src/shared/components/ui/\`의 shadcn 기반 완성도 제고
  - Layout: \`AdminShell\`, \`UserShell\`, \`StudioShell\` 3대 쉘로 전면 일원화
  - Composite: PDF 도메인 전용 컴포넌트(\`VirtualizedPageList\`, \`BBoxCanvas\` 등) 추출
- **Phase 3: PDF MVP 핵심 서비스 화면 바인딩**:
  - 1차: PG-USR-03(대용량 가상 뷰어), PG-USR-04(2Way BBox 교정기), PG-USR-05(레이아웃 편집기) 3개 화면 우선 완성
  - 2차: 사용자 잔여 화면 및 시스템서비스(관리자) 16개 화면 순차 확장

### 3. 확인 가능 시점 및 마일스톤 로드맵
- **마일스톤 1 (즉시 확인, 차기 태스크)**: \`tokens.ts\` 추출 및 와이어프레임 스튜디오 내 \`[🎨 디자인시스템 쇼케이스]\` 탭 신설 -> 토큰/컴포넌트 실물 즉시 확인 가능.
- **마일스톤 2**: \`AdminShell\`, \`UserShell\` 도입으로 23개 화면의 레이아웃 통일 완결.
- **마일스톤 3**: PG-USR-03/04/05 MVP 3대 서비스 화면의 실제 데이터 및 인터랙션 바인딩 완료.`;

  const summary = '와이어프레임 설계화면의 디자인시스템 기반 서비스화면 전환계획 및 단계별 검토, 체감 부재 원인 분석, Phase 1~3 로드맵 보고';

  // 1. Update data/local_agent_store.json
  const storePath = 'data/local_agent_store.json';
  if (fs.existsSync(storePath)) {
    const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
    const newTrace = {
      trace_id: traceId,
      session_id: 'SESSION-0027',
      task_id: 'TASK-0027-01',
      loop_id: null,
      step_index: 6,
      agent_name: 'gemini',
      model_name: 'models/gemini-3.8-flash',
      operator_account: 'jkoogit',
      agent_account: 'jkoogit@gmail.com',
      user_email: 'jkoogit@gmail.com',
      user_prompt: promptText,
      agent_response: responseText,
      response_summary: summary,
      prompt_tokens: 1750,
      completion_tokens: 1250,
      total_tokens: 3000,
      created_at: new Date().toISOString(),
    };
    store.turns = store.turns || [];
    store.turns.push(newTrace);
    fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
    console.log('✅ Local store updated with trace:', traceId);
  }

  // 2. Insert into remote DB
  try {
    const insertSql = `
      INSERT INTO aiagent.agent_conversation_trace (
        trace_id, session_id, task_id, loop_id, step_index,
        agent_name, model_name, operator_account, agent_account, user_email,
        user_prompt, agent_response, response_summary,
        prompt_tokens, completion_tokens, total_tokens, created_at
      ) VALUES (
        ${escapeSql(traceId)}, 'SESSION-0027', 'TASK-0027-01', NULL, 6,
        'gemini', 'models/gemini-3.8-flash', 'jkoogit', 'jkoogit@gmail.com', 'jkoogit@gmail.com',
        ${escapeSql(promptText)}, ${escapeSql(responseText)}, ${escapeSql(summary)},
        1750, 1250, 3000, NOW()
      )
      ON CONFLICT (trace_id) DO UPDATE SET
        agent_response = EXCLUDED.agent_response,
        response_summary = EXCLUDED.response_summary;
    `;
    const res = await executeSql(insertSql);
    console.log('✅ DB trace persisted:', res);
  } catch (err: any) {
    console.error('⚠️ DB persistence warning (fallback to local):', err.message);
  }
}

main().catch(console.error);
