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
  const traceId = 'TRACE-0028-01-00-03';
  const promptText = `#태스크처리 
1. 정림점검 버튼 옆에 테마 버튼 아이콘과 함께 타이틀 표시한 버튼으로 수정
2. 현재 서비스 메인화면은 PDF서비스 > 사용자서비스(User) 메뉴 화면인데
    와이어페임의 화면을 그대로 가져오지 말고 
    - 서비스슬정 > 사용자서비스 > 첫화면 의 선택한 div 영역을 위주로 화면을 전개했으면 해.
    - 서비스 화면을 구현하려는거야. 
    - 해당화면부터 서비스를 구현하면 로그인을 해야 로그인한 권한에 따라 관리자서비스, 에이전트서비스[현재 서비스 메인화면은 PDF서비스 > 사용자서비스(User) 메뉴 화면] 으로 이동하는 의미로 사용자 권한에 따른 버튼을 표시해야한다는거였어.
Apply style changes to the selected element(s).
[AIS_METADATA_SECTION_START]
CSS selector 1: div#root:nth-of-type(1) > div:nth-of-type(1) > main:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(2)
CSS 1: {

}
[AIS_METADATA_SECTION_END]`;

  const responseText = `#[0028-03] [0028-01] 테마 버튼 타이틀 보완 및 서비스 첫화면 PG-USR-01 div 중심 전개 및 로그인 권한별 시스템 전환 구현 보고

### 1. 주요 구현 및 수정 사항

#### (1) 상단 네비게이션바(Navbar) 테마 버튼 개선
- **위치**: 상단 우측 \`정밀점검\` 버튼 바로 옆
- **버튼 UI**:
  - 테마 모드별 고유 아이콘 (\`Sun\`, \`Moon\`, \`Sunrise\`, \`Monitor\`) 표시
  - 명확한 텍스트 타이틀 표기: \`테마 (주간/야간/여명/시스템)\`
  - 드롭다운 \`ChevronDown\` 인디케이터 탑재
- **동작**:
  - **클릭 시**: 4대 모드(주간, 야간, 여명, 시스템) 상세 팝오버 메뉴 오픈
  - **더블클릭 시**: 다음 테마로 즉시 순환(Cycle) 전환
  - **팝오버 내부**: 각 모드별 상세 설명 및 '⚡ 다음 테마로 즉시 순환' 퀵 버튼 제공

#### (2) 서비스 첫 화면(포털) 구조 개편 - 'PG-USR-01 첫화면(랜딩)' div 영역 중심 전개
- 와이어프레임 화면을 단순 복제하지 않고, 실제 사용자용 **PDF 비즈니스 서비스 첫 화면**으로 완성
- 선택된 핵심 div 영역 요소를 중심으로 전개:
  1. **공개 열람 문서 조회 바**:
     - \`🔍 공개 열람 문서 조회\` 헤더 및 문서번호(\`DOC-xxxx\`) / 공유 링크 검색창
     - \`열람하기 ➔\` 버튼 클릭 시 실제 800쪽 대용량 가상화 뷰어(\`VirtualViewerStudio\`) 팝업 즉시 구동
     - 추천 열람 문서 칩(\`DOC-32000\`, \`DOC-OCR-26\`, \`DOC-ARC-01\`) 원클릭 열람 지원
  2. **중앙 롤링 이벤트 및 프로모션 배너 슬라이더**:
     - 가로 슬라이딩 필름 트랙, 부드러운 스와이프/마우스 드래그/휠 스크롤 이벤트 격리
     - 미니멀 슬림 인디케이터 바 및 슬라이드 카운터
     - '배너 없는 상태 테스트' / '배너 목록 복구' 상태 전환 버튼 탑재
  3. **하단 서비스 정보 탭**:
     - \`공지사항\`: v2.0 정식 런칭, 800쪽 가상화 뷰어 메모리가드 패치 등 공지 내역
     - \`사용자 리뷰\`: 연구원, 변호사, 엔지니어의 실제 서비스 사용 후기
     - \`단계별 이용 가이드\`: 3단계 (문서 등록 -> 가상화 주석 작성 -> Searchable PDF 내보내기)
  4. **고객지원 및 푸터**:
     - 플랫폼 정보, 이용약관, 개인정보처리방침, 시스템 관리자 이메일(\`jkoogit@gmail.com\`) 명시

#### (3) 사용자 인증(로그인) 상태에 따른 시스템 전환 버튼 제어
- **비로그인(게스트) 상태**:
  - 서비스 첫 화면에서 일반 사용자는 공개 열람 및 배너/공지 조회를 자유롭게 이용
  - 상단 우측에 **[로그인 / 권한선택]** 및 **[회원가입]** 버튼 배치
  - 안내 문구: *"로그인하시면 사용자 권한에 따라 '서비스설정' 및 '에이전트관리' 시스템으로 이동할 수 있습니다."*
- **로그인 시뮬레이션 및 권한별 시스템 전환 인터페이스**:
  - 모달을 통해 간편하게 권한별 계정 로그인 시뮬레이션 지원:
    * 👤 **일반사용자 (\`ROLE_USER\`)**: 로그인 시 일반회원 프로필 노출, 서비스 화면에 머무르며 열람/주석 전용 이용
    * ⚙️ **서비스설정자 (\`ROLE_OPERATOR\`)**: 로그인 즉시 상단에 **[🛠 서비스설정 시스템]** 전환 버튼 활성화
    * 🛡️ **마스터관리자 (\`ROLE_ADMIN\`)**: 로그인 즉시 상단에 **[🛠 서비스설정 시스템]** 및 **[🤖 에이전트관리 (마스터)]** 버튼 모두 활성화
  - 각 전환 버튼 클릭 시 해당 도메인 시스템(25개 와이어프레임 & 시스템 설정 또는 에이전트 하네스 마스터)으로 매끄럽게 즉시 전환

### 2. 빌드 및 검증 결과
- **TypeScript 린트 (\`npm run lint\` / \`tsc --noEmit\`)**: 에러 0건 (100% 통과)
- **Vite 번들 컴파일 (\`npm run build\`)**: 정상 컴파일 및 프로덕션 번들 생성 완료
- **서비스 가드레일 전수점검 (\`check:service\`)**: DB 7종 인덱스, 93개 노드 작업그래프, 60개 기술문서 해시 전원 정상 확인`;

  const traceObj = {
    trace_id: traceId,
    session_id: 'SESSION-0028',
    task_id: 'TASK-0028-01',
    loop_id: null,
    step_index: 3,
    agent_name: 'purePDFrend-engineer',
    model_name: 'gemini-3.8-flash',
    operator_account: 'jkoogit',
    agent_account: 'purePDFrend-agent',
    user_email: 'jkoogit@gmail.com',
    user_prompt: promptText,
    agent_response: responseText,
    response_summary: '#[0028-03] [0028-01] 테마 버튼 타이틀 보완 및 서비스 첫화면 PG-USR-01 div 중심 전개 및 로그인 권한별 시스템 전환 구현 보고',
    prompt_tokens: 380,
    completion_tokens: 1450,
    total_tokens: 1830,
    created_at: new Date().toISOString(),
  };

  // 1. Update local agent store
  try {
    const storeRaw = fs.readFileSync('data/local_agent_store.json', 'utf-8');
    const store = JSON.parse(storeRaw);
    if (!store.traces) store.traces = [];
    const otherTraces = (store.traces || []).filter((t: any) => t.trace_id !== traceId);
    store.traces = [...otherTraces, traceObj];
    fs.writeFileSync('data/local_agent_store.json', JSON.stringify(store, null, 2), 'utf-8');
    console.log('✅ Local agent store turn 0028-03 updated.');
  } catch (err) {
    console.error('Local store update error:', err);
  }

  // 2. Insert to DB
  const sqlTrace = `
    INSERT INTO aiagent.agent_conversation_trace (
      trace_id, session_id, task_id, loop_id, step_index,
      agent_name, model_name, operator_account, agent_account, user_email,
      user_prompt, agent_response, response_summary,
      prompt_tokens, completion_tokens, total_tokens,
      created_sys, created_at, created_by, updated_sys, updated_at, updated_by, version
    ) VALUES (
      ${escapeSql(traceObj.trace_id)}, ${escapeSql(traceObj.session_id)}, ${escapeSql(traceObj.task_id)}, ${escapeSql(traceObj.loop_id)}, ${traceObj.step_index},
      ${escapeSql(traceObj.agent_name)}, ${escapeSql(traceObj.model_name)}, ${escapeSql(traceObj.operator_account)}, 'purePDFrend-agent', ${escapeSql(traceObj.user_email)},
      ${escapeSql(traceObj.user_prompt)}, ${escapeSql(traceObj.agent_response)}, ${escapeSql(traceObj.response_summary)},
      ${traceObj.prompt_tokens}, ${traceObj.completion_tokens}, ${traceObj.total_tokens},
      'agent-harness', ${escapeSql(traceObj.created_at)}, 'jkoogit', 'agent-harness', now(), 'jkoogit', 1
    ) ON CONFLICT (trace_id) DO UPDATE SET
      user_prompt = EXCLUDED.user_prompt,
      agent_response = EXCLUDED.agent_response,
      response_summary = EXCLUDED.response_summary,
      total_tokens = EXCLUDED.total_tokens,
      updated_at = now();
  `;

  try {
    const res = await executeSql(sqlTrace);
    console.log('✅ Remote DB Bridge turn 0028-03 trace upserted:', JSON.stringify(res));
  } catch (err) {
    console.error('Remote DB Bridge trace upsert error:', err);
  }
}

main().catch(console.error);
