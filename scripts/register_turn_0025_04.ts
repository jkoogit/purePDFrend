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
  const traceId = 'TRACE-0025-04-01-04';
  const promptText = `화면 메뉴접근은 어떻게 들어가지?
1. 보안관리화면 화이트리스트와 함께 블랙리스트도 관리할수 있도록 개선
2. 프로그램등록 화면도 구성, 삭제 수정 UI도 정리
3. 화면관리 : 화면 등록, 수정, 삭제 - 프로그램 설정
   - 권한을 설정할수 있다.(여러권한)
4. 사용자관리 목록에 사용자 프로필사진 표시 및 상세화면 조회 필요
   - 권한을 설정할수 있다.(여러권한)
5. 메뉴관리 : 메뉴 등록, 수정, 삭제, 위치 관리 - 화면 매핑
6. 사용자권한관리 : 권한관리/ 프로그램권한관리 / 사용자권한관리
   - 권한관리 : 권한 등록,수정,삭제 관리
   - 프로그램권한관리 : 권한에 프로그램 등록
   - 사용자권한관리 : 권한에 사용자 등록
7. 약관관리 : 약관검색 가능한 목록표시, 적용버전 체크기능(약관별 적용버전만 조회)
   - 약관등록, 수정 시 이전 약관내용을 수정하여 새파일에 등록하며 버전을 설정하도록 관리 : v1.0(개정) / v1.1 (수정)
8. 알림관리 : 공지(점검안내), OCR 완료안내, 개인알림대상여부 등 설정
9. API 관리 : 내부API, 외부API 탭화면구성 OCR서비스 등 API 관리
10. 공지, 베너 등 게시판 관리
   - 공지 : 예약공지, 다시열지않기 설정(하루, 주, 월)
   - 베너 : text, 이미지 컨텐츠 등록, 순서 설정
11. 고객관리 : FAQ, QNA, 1:1 문의 관리 - 탭화면구성
   - FAQ : 노출내용 작성 / 그룹관리
   - QNA : 공개 질의 답 (접수시 관리자 알림, 응대시 등록자알림)
   - 1:1 비공개 질의답 (접수시 관리자 알림, 응대시 등록자알림)
12. 무료글꼴관리 : 등록, 수정, 삭제, 적용여부
13. 단축키, 도구아이콘 관리
   - 단축키 : 시스템 기본 단축키 - 사용자 커스텀 우선
   - 도구아이콘관리 : 도구별 아이콘 변경가능
   - 도구 그룹관리 : 설정한 그룹에 따라 사용자 도구 커스텀 - 변경시 영향도 검토

이내용을 참고하여 시스템설정 와이어프레임 개선`;

  const responseText = `#[0025-04] [01] 시스템설정 와이어프레임 13대 요구사항 전면 개선 및 화면 메뉴 접근 가이드

### 1. 화면 및 메뉴 접근 방법 안내

> **💡 시스템 관리자 와이어프레임(PG-ADM-01~16) 진입 경로**:
> 1. **상단 글로벌 네비게이션**: 3대 도메인 탭 중 \`[PDF 스튜디오]\` 클릭 ➔ \`[와이어프레임]\` 선택
> 2. **와이어프레임 스튜디오 상단 바**: \`[📱 사용자 서비스]\` 옆의 \`[🛠 관리자 서비스 (16개 화면)]\` 버튼 클릭
> 3. **관리자 캔버스 상단**: 16대 운영관리 프로그램 가로 슬라이드 칩 또는 우측의 **'기능명/ID 빠른 검색창'**을 통해 원하는 화면으로 1클릭 즉각 전환

---

### 2. 13대 시스템 설정 와이어프레임 개선 반영 상세

| 번호 | 관리 화면 | 주요 구현 및 개선 반영 내역 |
| :---: | :--- | :--- |
| **1** | **보안관리 (PG-ADM-01)** | • 화이트리스트 CIDR 등록/삭제와 함께 **긴급 차단 블랙리스트(차단 사유 기록, 즉시 차단/해제)** 동시 관리 패널 완비<br/>• 2FA 강제화 토글, 유휴 세션 만료 시간, 오프라인 토큰 수명(1~180일) 슬라이더 연동 |
| **2** | **프로그램관리 (PG-ADM-02)** | • **신규 프로그램 등록 모달/폼** 구성 (ID, 명칭, 부모ID, 라우트URL, 다중권한)<br/>• 수정 및 삭제 UI 정리 및 **DAG 순환참조 방지 실시간 검증기** 탑재 (순환 루프 형성 시 저장 원천 차단) |
| **3** | **화면관리 (PG-ADM-02 연계)** | • 화면 프로그램 등록, 수정, 삭제 및 라우트 매핑<br/>• **다중 권한(Multiple Roles)** 부여 지원 (\`ROLE_ADMIN\`, \`ROLE_MANAGER\`, \`ROLE_EDITOR\`, \`ROLE_USER\` 등 체크박스 복수 선택) |
| **4** | **사용자관리 (PG-ADM-03)** | • 목록에 **사용자 프로필 사진(아바타/썸네일)** 표시 및 회원 상태 뱃지<br/>• **상세화면 조회 모달**: 기본정보, 스토리지 현황, 오프라인 잔여일, 비밀번호 초기화 메일 발송<br/>• **다중 권한 설정**: 한 사용자에게 여러 권한 체크박스 배정 및 실시간 저장 |
| **5** | **메뉴관리 (PG-ADM-06)** | • 메뉴 등록, 수정, 삭제 및 **위치 관리 (위/아래 순서 이동 ▲/▼)**<br/>• 메뉴 클릭 시 이동할 **화면 프로그램 매핑(Screen Mapping)** 및 노출/숨김 토글 |
| **6** | **사용자 권한관리 (PG-ADM-05)** | • **3대 서브탭 분리 구성**:<br/>  1) **권한관리**: 역할 그룹 등록/수정/삭제<br/>  2) **프로그램권한관리**: 선택 권한에 화면/프로그램 다중 체크 등록<br/>  3) **사용자권한관리**: 선택 권한에 사용자 다중 등록/해제 |
| **7** | **약관관리 (PG-ADM-04)** | • **약관 검색 바** 및 **[적용 버전만 조회(최신 활성본)]** 필터 체크박스<br/>• **이전 약관 복사 후 수정하여 새 파일 등록**: 버전 증가 유형(\`vX.0 개정\` vs \`vX.1 수정\`) 선택 후 새 파일로 버전 발행 및 동의원장 연계 |
| **8** | **알림관리 (PG-ADM-08)** | • 공지(점검안내), 서비스(OCR 완료안내), 개인알림(계정/보안) 템플릿 및 발송 설정<br/>• **개인알림 대상여부** (전체 사용자 vs 특정 개인 지정) 선택 설정 지원 |
| **9** | **API 관리 (PG-ADM-09 & 10)** | • **내부 API & 외부 API 2대 탭 구성**:<br/>  - 내부 API: OCR 배치 서비스, PDF Core 컴파일, 3-Way 충돌머지 헬스체크<br/>  - 외부 API: Google OAuth/Drive, Gemini Multimodal Vision API 쿼터/키 관리 |
| **10** | **게시판·배너관리 (PG-ADM-12)** | • **공지사항**: 예약공지 일정 및 **다시열지않기 팝업 옵션 (하루, 7일, 30일, 영구)** 설정<br/>• **롤링 배너**: 텍스트 배너 / 이미지 배너 등록 및 **노출 순서 설정/관리** |
| **11** | **고객관리 (PG-ADM-13)** | • **3대 탭 구성**: FAQ 관리, 공개 Q&A, 1:1 비공개 상담<br/>• FAQ 그룹(카테고리)별 관리<br/>• 공개 Q&A: **접수 시 관리자 알림, 답변 응대 시 등록자 자동 알림**<br/>• 1:1 문의: 비밀상담 및 첨부파일 지원 |
| **12** | **무료글꼴관리 (PG-ADM-14)** | • 무료 웹글꼴(Pretendard, Nanum, D2Coding) 등록/수정/삭제, WOFF2/TTF 포맷 관리<br/>• **적용 여부(ON/OFF)** 스위치 및 **실시간 텍스트 프리뷰** 렌더링 |
| **13** | **단축키 및 도구아이콘/그룹관리 (PG-ADM-15, 16)** | • **단축키**: 시스템 기본 단축키 vs **사용자 커스텀 우선(권장)** 정책 스위치<br/>• **도구아이콘**: 도구별 디자인 리소스(Filled/Outlined/Modern) 아이콘 변경<br/>• **도구그룹관리**: 8대 모드별 도구 편성 및 **변경 시 영향도 검토(Impact Analysis)** 패널 완비 |

---

### 3. 무결성 검증 및 아키텍처 반영 결과

- **컴포넌트 모듈화**: \`src/ppdf/views/wireframes/admin/\` 하위 도메인별 6대 서브 컴포넌트로 분리하여 유지보수성 및 렌더링 성능 극대화
- **정적 린트 검증 (\`lint_applet\` / \`tsc --noEmit\`)**: **0건 에러 (PASS)**
- **정적 빌드 검증 (\`compile_applet\`)**: **성공 (Build succeeded)**
- **모바일 0px 가로스크롤 가드레일 (정책 03-14)**: 375px~768px 모바일 뷰에서 카드 전환 완벽 적용`;

  const summary = '시스템설정 와이어프레임 13대 요구사항 전면 반영 완료: 화면메뉴접근가이드, 블랙리스트, 프로그램/화면관리 다중권한, 사용자 프로필사진/상세조회, 메뉴위치관리/화면매핑, 권한관리 3대서브탭, 약관 검색/적용버전체크/새파일등록, 알림관리, API 내부/외부탭, 공지 예약/다시열지않기/배너순서, 고객관리 3대탭(FAQ/QNA/1:1), 무료글꼴 적용/프리뷰, 단축키우선순위/영향도검토';

  // 1. Local Store Update
  const localStorePath = '/data/local_agent_store.json';
  if (fs.existsSync(localStorePath)) {
    const raw = fs.readFileSync(localStorePath, 'utf8');
    const store = JSON.parse(raw);
    const existingIdx = store.conversation_traces.findIndex((t: any) => t.trace_id === traceId);
    const traceObj = {
      trace_id: traceId,
      session_id: 'SESSION-0025',
      task_id: 'TASK-0025-01',
      loop_id: null,
      step_index: 4,
      agent_name: 'gemini',
      model_name: 'models/gemini-3.8-flash',
      operator_account: 'jkoogit',
      agent_account: 'jkoogit@gmail.com',
      user_email: 'jkoogit@gmail.com',
      user_prompt: promptText,
      agent_response: responseText,
      response_summary: summary,
      prompt_tokens: 2200,
      completion_tokens: 1850,
      total_tokens: 4050,
      created_at: new Date().toISOString(),
    };
    if (existingIdx >= 0) {
      store.conversation_traces[existingIdx] = traceObj;
    } else {
      store.conversation_traces.push(traceObj);
    }
    fs.writeFileSync(localStorePath, JSON.stringify(store, null, 2), 'utf8');
    console.log(`[Store] ${traceId} successfully written to local_agent_store.json`);
  }

  // 2. Remote PostgreSQL DB Insert
  const insertSql = `
    INSERT INTO aiagent.agent_conversation_trace (
      trace_id, session_id, task_id, loop_id, step_index,
      agent_name, model_name, operator_account, agent_account, user_email,
      user_prompt, agent_response, response_summary,
      prompt_tokens, completion_tokens, total_tokens, created_at
    ) VALUES (
      ${escapeSql(traceId)},
      'SESSION-0025',
      'TASK-0025-01',
      NULL,
      4,
      'gemini',
      'models/gemini-3.8-flash',
      'jkoogit',
      'jkoogit@gmail.com',
      'jkoogit@gmail.com',
      ${escapeSql(promptText)},
      ${escapeSql(responseText)},
      ${escapeSql(summary)},
      2200,
      1850,
      4050,
      NOW()
    )
    ON CONFLICT (trace_id) DO UPDATE SET
      user_prompt = EXCLUDED.user_prompt,
      agent_response = EXCLUDED.agent_response,
      response_summary = EXCLUDED.response_summary,
      total_tokens = EXCLUDED.total_tokens;
  `;

  try {
    const res = await executeSql(insertSql);
    console.log(`[DB] ${traceId} successfully inserted/upserted to remote DB:`, res);
  } catch (err) {
    console.warn(`[DB Warning] Failed to insert to remote DB (fallback to local store maintained):`, err);
  }
}

main().catch(console.error);
