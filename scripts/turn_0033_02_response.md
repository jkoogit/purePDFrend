#[0033-02] [00] Phase 3 관리자 1단계 핵심화면(PG-ADM-01~04) 실제 REST API 연동 및 사용자 잔여화면(PG-USR-08~09) tokens.ts 전면 완결 계획 수립

---

### 1. 도메인 분석 및 아키텍처 영향도 평가

- **대상 도메인**:
  1. **Phase 3 관리자 1단계 4대 핵심화면 (Mock 상태 ➔ 실제 REST API 바인딩)**:
     - [PG-ADM-01](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/admin/AdminSecurityView.tsx) (보안 IP 통제 관리): 실제 화이트리스트/블랙리스트 IP 목록 조회, 신규 IP 등록, 차단 해제 CRUD REST API 바인딩
     - [PG-ADM-02](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/admin/AdminProgramsView.tsx) (프로그램 DAG 의존성 관리): 프로그램 간 계층 트리, 다중 권한 매핑, 순환 참조(Cycle Detection) 방지 REST API 바인딩
     - [PG-ADM-03](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/admin/AdminUsersView.tsx) (관리자 및 사용자 계정 관리): 계정 목록, 권한 변경, 2FA 강제화, 계정 상태(정상/제한/휴면) 토글 REST API 바인딩
     - [PG-ADM-04](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/admin/AdminTermsView.tsx) (이용약관 및 개인정보 버전 관리): 약관 버전별 마크다운 본문, 최신 적용 상태 설정, 개정판/경미수정 버전 발행 REST API 바인딩
  2. **사용자 잔여 와이어프레임 tokens.ts 전면 대입 (대입률 100% 완결)**:
     - [PG-USR-08](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/UserWireframes.tsx#L6708) (오프라인 작업 큐 및 동기화): 리소스모드/문서모드 정리, 3-Way 충돌머지 UI의 인라인 다크 클래스 전면 제거 및 \`tokens.ts\` 100% 대입
     - [PG-USR-09](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/UserWireframes.tsx#L7302) (사용자 정밀 환경설정): 단축키 설정(PC/태블릿), 도구그룹 매핑, 뷰어/테마 옵션의 인라인 다크 클래스 전면 제거 및 \`tokens.ts\` 100% 대입
     - **사용자 서비스 9개 전 화면([PG-USR-01](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/UserWireframes.tsx) ~ [PG-USR-09](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/UserWireframes.tsx)) 토큰 대입률 100% 완전 완결**
- **아키텍처 영향도**:
  - **Express 백엔드 REST API 구현 ([server.ts](file:///d:/dev/repository/git.jkoogit/purePDFrend/server.ts))**:
    - \`/api/admin/security/ips\`, \`/api/admin/programs\`, \`/api/admin/users\`, \`/api/admin/terms\` 4대 RESTful 라우트 구축
    - PostgreSQL DB 쿼리 우선 실행 + DB 연결 장애 시 로컬 고신뢰 캐시로의 무중단 자율 폴백 (정책 02-01 ~ 02-05 준수)
  - **DAG 순환 의존성 검증 알고리즘**: 프로그램 부모-자식 설정 시 자기 자신 또는 하위 노드를 부모로 지정하는 순환 그래프 방지 로직 탑재
  - **단일 진실 공급원(SSOT) 준수**: [tokens.ts](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/styles/tokens.ts)의 \`getThemeAdaptiveClasses\` 유틸리티를 PG-USR-08, 09 영역에 완전 바인딩하여 4모드 고대비, 44px 모바일 터치타깃, Zero-Pill 규격 보장

---

### 2. 세션 / 태스크 / 루프 식별 체계

- **세션 ID**: \`SESSION-0033\`
- **태스크 ID**: \`TASK-0033-01\`
- **루프 계획 (Loop Identification)**:
  - \`LOOP-0033-01\`: Express 백엔드 관리자 1단계 4종 REST API 엔드포인트 구현 ([server.ts](file:///d:/dev/repository/git.jkoogit/purePDFrend/server.ts))
  - \`LOOP-0033-02\`: 관리자 4대 뷰([AdminSecurityView](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/admin/AdminSecurityView.tsx), [AdminProgramsView](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/admin/AdminProgramsView.tsx), [AdminUsersView](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/admin/AdminUsersView.tsx), [AdminTermsView](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/admin/AdminTermsView.tsx)) REST API 실제 데이터 상태 바인딩
  - \`LOOP-0033-03\`: PG-USR-08 오프라인 작업 큐 및 동기화 tokens.ts 전면 대입 및 4모드 고대비화
  - \`LOOP-0033-04\`: PG-USR-09 정밀 사용자 환경설정 tokens.ts 전면 대입 및 사용자 전 화면 100% 완결
  - \`LOOP-0033-05\`: 단위 테스트 확장, 정적 컴파일(\`tsc --noEmit\`) 및 4단계 서비스 전수점검 100점 만점 검증

---

### 3. 세부 작업 항목별 실행 계획 및 사전 확인

1. **[작업 1] Express 백엔드 관리자 1단계 4종 REST API 엔드포인트 구현 (백엔드)**
   - \`GET /api/admin/security/ips\`, \`POST /api/admin/security/ips\`, \`DELETE /api/admin/security/ips\`
   - \`GET /api/admin/programs\`, \`POST /api/admin/programs\`, \`PUT /api/admin/programs/:id\`, \`DELETE /api/admin/programs/:id\` (DAG 순환 방지 검증 포함)
   - \`GET /api/admin/users\`, \`POST /api/admin/users\`, \`PUT /api/admin/users/:id\`, \`DELETE /api/admin/users/:id\`
   - \`GET /api/admin/terms\`, \`POST /api/admin/terms\`, \`PUT /api/admin/terms/:id\`
   - DB 장애 시 로컬 고신뢰 캐시 폴백으로 프론트엔드 정지 방지
2. **[작업 2] 관리자 1단계 핵심 4개 화면 REST API 실제 상태 바인딩 (프론트/서비스)**
   - [AdminSecurityView](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/admin/AdminSecurityView.tsx): 백엔드 REST API 상태 로드 및 신규 IP 등록/삭제 실시간 반영
   - [AdminProgramsView](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/admin/AdminProgramsView.tsx): 인메모리 Mock 제거 ➔ REST API 비동기 로드/등록/수정/삭제 바인딩
   - [AdminUsersView](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/admin/AdminUsersView.tsx): 인메모리 Mock 제거 ➔ 사용자 목록 조회, 권한 변경, 2FA 토글 API 연동
   - [AdminTermsView](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/admin/AdminTermsView.tsx): 인메모리 Mock 제거 ➔ 약관 목록 조회, 버전 발행, 적용 버전 스위칭 API 연동
3. **[작업 3] PG-USR-08 오프라인 작업 큐 및 동기화 tokens.ts 전면 대입 (프론트/서비스)**
   - 리소스모드/문서모드 탭, 6대 정밀 필터, 동기화 큐 테이블, 3-Way 충돌 머지 패널의 하드코딩 다크 클래스를 \`themeClasses\`로 100% 치환
   - 4모드(Light, Dark, Dawn, System) WCAG AA 고대비 가독성 및 44px 모바일 터치타깃 보장
4. **[작업 4] PG-USR-09 사용자 정밀 환경설정 tokens.ts 전면 대입 (프론트/서비스)**
   - 단축키 설정 폼, 도구그룹 매핑 카드, 뷰어 렌더링 옵션의 하드코딩 다크 클래스를 \`themeClasses\`로 100% 치환
   - 사용자 서비스 9대 전 화면([PG-USR-01](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/UserWireframes.tsx) ~ [PG-USR-09](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/UserWireframes.tsx)) 토큰 대입률 100% 달성 및 로드맵 07-02 현행화
5. **[작업 5] 단위 테스트 확장 및 4단계 서비스 전수점검 무결성 검증 (에이전트/테스트)**
   - \`tests/wireframe_shells_and_tokens.test.ts\`에 관리자 API 연동 및 PG-USR-08, 09 토큰 대입 검증 케이스 추가
   - \`tsc --noEmit\` 정적 컴파일 0 에러 및 \`service_health_check.ts\` 100점 만점 [A+ (PERFECT)] 무결성 달성

> **사전 확인 안내**:
> 제시된 모든 작업 항목(1~5번)은 본 세션의 Phase 3 관리자 1단계 API 연동 및 사용자 와이어프레임 토큰화 완결 범위에 100% 부합하며, 범위를 벗어난 예외 항목은 확인되지 않았습니다. 즉시 전체 항목을 포함하여 순차적으로 구현을 진행합니다.

---

### 4. 루프 분석 (Loop Analysis)

- **문제의 목표**: 관리자 1단계 핵심 4개 화면의 Express/PostgreSQL 실제 REST API 연동 및 사용자 잔여 2개 화면 토큰화 완결을 통한 서비스 완성도 극대화.
- **데이터 분석**:
  - 관리자 4개 뷰([AdminSecurityView](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/admin/AdminSecurityView.tsx), [AdminProgramsView](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/admin/AdminProgramsView.tsx), [AdminUsersView](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/admin/AdminUsersView.tsx), [AdminTermsView](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/admin/AdminTermsView.tsx))의 Mock 데이터를 실제 API 데이터로 치환.
  - [UserWireframes.tsx](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/UserWireframes.tsx) 내 PG-USR-08(L6708~L7301, 약 600라인), PG-USR-09(L7302~L7700, 약 400라인) 내 150여 개 인라인 색상 클래스를 \`tokens.ts\`로 치환.
- **조건 및 범위**: 기존 UI 레이아웃, 기능 동작(3-Way 머지, 단축키 편집, DAG 순환방지), 인터페이스를 100% 보존하면서 스타일 및 데이터 계층만 고도화.
- **입력/출력 변수**:
  - 입력: 백엔드 REST API 응답 JSON, \`themeMode\`, \`themeClasses\`
  - 출력: 실제 데이터 연동 완료된 관리자 뷰 및 사용자 전 화면 100% 토큰화 산출물
- **평가 기준**:
  1. TypeScript 정적 컴파일 무오류 (\`tsc --noEmit\`)
  2. Vitest 단위 테스트 100% 통과
  3. 사용자 전 화면([PG-USR-01](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/UserWireframes.tsx) ~ [PG-USR-09](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/UserWireframes.tsx)) 토큰 대입률 100% 달성
  4. 4단계 서비스 전수점검 100점 만점 [A+ (PERFECT)]

---

### 5. 후속 실행 프롬프트 제안

계획이 수립되었으므로, 승인 후 실제 구현 및 단위 검증을 착수하기 위한 정제된 \`#태스크처리\` 프롬프트를 제시합니다.

\`\`\`markdown
#태스크처리 [0033-01] Phase 3 관리자 1단계 핵심화면(PG-ADM-01~04) 실제 REST API 연동 및 사용자 잔여화면(PG-USR-08~09) tokens.ts 전면 완결 구현
\`\`\`
