#[0034-02] [00] Phase 4 관리자 2단계 핵심화면(PG-ADM-05~08) 실제 REST API 연동 및 관리자 전 화면 tokens.ts 전면 완결 계획 수립

---

### 1. 도메인 분석 및 아키텍처 영향도 평가

- **대상 도메인**:
  1. **Phase 4 관리자 2단계 4대 핵심화면 (Mock 상태 ➔ 실제 REST API 바인딩)**:
     - [PG-ADM-05](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/admin/AdminRolesAndMenusView.tsx) (역할 및 세부 권한 매핑): 역할 그룹 목록, 프로그램-권한 매핑, 사용자-권한 매핑 3대 서브탭의 Express/PostgreSQL 실제 REST API 연동
     - [PG-ADM-06](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/admin/AdminRolesAndMenusView.tsx) (메뉴 및 화면 계층 트리 구조): 메뉴 트리 계층 구조, 순서/위치 관리, 순환 참조(Cycle Detection) 방지, 화면 프로그램 매핑 실제 REST API 연동
     - [PG-ADM-07](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/admin/AdminLogsView.tsx) (시스템 실시간 접속 및 활동 로그 스트림): 접속 IP, 작업자, 이벤트 구분, 대상 리소스 실시간 검색 및 타임라인 스트림 REST API 연동
     - [PG-ADM-08](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/admin/AdminLogsView.tsx) (시스템 에러 및 예외 스택 추적 모달): 예외 발생 현황, 심각도(FATAL/ERROR/WARN) 필터링, 상세 스택트레이스 모달 REST API 연동
  2. **관리자 잔여 8개 와이어프레임 tokens.ts 전면 대입 점검 및 100% 완결**:
     - [PG-ADM-09](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/admin/AdminExtendedModulesView.tsx) (알림 및 시스템 공지 발송 센터): 다채널 발송 탭 및 토큰화
     - [PG-ADM-10](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/admin/AdminExtendedModulesView.tsx) (서비스 공지사항 게시판 운영): 첨부/기간 필터 및 토큰화
     - [PG-ADM-11](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/admin/AdminExtendedModulesView.tsx) (메인 롤링 이벤트 배너 관리): 미리보기 슬라이더 토큰화
     - [PG-ADM-12](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/admin/AdminExtendedModulesView.tsx) (플랫폼 시스템 전역 환경설정): 3단 설정 폼 토큰화
     - [PG-ADM-13](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/admin/AdminExtendedModulesView.tsx) (고객 지원 문의 및 FAQ 관리): 인라인 답변 모달 토큰화
     - [PG-ADM-14](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/admin/AdminExtendedModulesView.tsx) (1:1 고객 상담 및 답변 센터): 상태별 배지 탭 토큰화
     - [PG-ADM-15](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/admin/AdminExtendedModulesView.tsx) (무료 웹폰트 패키지 배포 관리): 가로형 카드 뷰 토큰화
     - [PG-ADM-16](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/AdminWireframes.tsx) (전역 단축키 및 도구그룹 매핑): 플로우 카드 뷰 토큰화
     - **관리자 16대 전 화면 tokens.ts 대입률 100% 완성 (플랫폼 전체 25개 와이어프레임 토큰화 100% 완전 정복)**
- **아키텍처 영향도**:
  - **Express 백엔드 REST API 구현 ([server.ts](file:///d:/dev/repository/git.jkoogit/purePDFrend/server.ts))**:
    - `/api/admin/roles`, `/api/admin/menus`, `/api/admin/logs/audit`, `/api/admin/logs/errors` 4대 RESTful 라우트 구축
    - PostgreSQL DB 쿼리 우선 실행 + DB 연결 장애 시 로컬 고신뢰 캐시로의 무중단 자율 폴백 (정책 02-01 ~ 02-05 준수)
  - **순환 참조 방지(Cycle Detection)**: 메뉴 트리 계층 구성 시 부모-자식 순환 방지 검증 알고리즘 적용
  - **단일 진실 공급원(SSOT) 준수**: [tokens.ts](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/styles/tokens.ts)의 `getThemeAdaptiveClasses` 유틸리티를 관리자 뷰 전역에 완전 바인딩하여 4모드 고대비, 44px 모바일 터치타깃, Table-to-Card 반응형 가드레일 보장

---

### 2. 세션 / 태스크 / 루프 식별 체계

- **세션 ID**: `SESSION-0034`
- **태스크 ID**: `TASK-0034-01`
- **루프 계획 (Loop Identification)**:
  - `LOOP-0034-01`: Express 백엔드 관리자 2단계 4종 REST API 엔드포인트 구현 ([server.ts](file:///d:/dev/repository/git.jkoogit/purePDFrend/server.ts))
  - `LOOP-0034-02`: 관리자 4대 뷰([AdminRolesAndMenusView](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/admin/AdminRolesAndMenusView.tsx), [AdminLogsView](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/admin/AdminLogsView.tsx)) REST API 실제 데이터 상태 바인딩
  - `LOOP-0034-03`: 관리자 잔여 화면 8종([AdminExtendedModulesView](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/admin/AdminExtendedModulesView.tsx) 등) tokens.ts 전면 대입 및 4모드 고대비화
  - `LOOP-0034-04`: 관리자 16대 전 화면 Table-to-Card 모바일 가드레일 및 반응형 검증
  - `LOOP-0034-05`: 단위 테스트 확장, 정적 컴파일(`tsc --noEmit`) 및 4단계 서비스 전수점검 100점 만점 무결성 검증

---

### 3. 세부 작업 항목별 실행 계획 및 사전 확인

1. **[작업 1] Express 백엔드 관리자 2단계 4종 REST API 엔드포인트 구현 (백엔드)**
   - `GET /api/admin/roles`, `POST /api/admin/roles`, `PUT /api/admin/roles/:id/programs`, `POST/DELETE /api/admin/roles/:id/users`
   - `GET /api/admin/menus`, `POST /api/admin/menus`, `PUT /api/admin/menus/:id`, `DELETE /api/admin/menus/:id` (순환 방지 검증 포함)
   - `GET /api/admin/logs/audit`, `POST /api/admin/logs/audit`
   - `GET /api/admin/logs/errors`, `GET /api/admin/logs/errors/:id`, `PUT /api/admin/logs/errors/:id/resolve`
   - DB 장애 시 로컬 고신뢰 캐시 폴백으로 프론트엔드 정지 방지
2. **[작업 2] 관리자 2단계 핵심 4개 화면 REST API 실제 상태 바인딩 (프론트/서비스)**
   - [AdminRolesView](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/admin/AdminRolesAndMenusView.tsx): 백엔드 REST API 상태 로드, 신규 권한 그룹 추가, 프로그램 권한 토글, 사용자 권한 배정/해제 실시간 반영
   - [AdminMenusView](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/admin/AdminRolesAndMenusView.tsx): 인메모리 Mock 제거 ➔ REST API 비동기 로드/등록/수정/삭제 바인딩
   - [AdminLogsView](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/admin/AdminLogsView.tsx): 실시간 감사로그 스트림 API 조회, 검색 필터링, CSV 내보내기 연동
   - [AdminErrorsModal / AdminLogsView](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/admin/AdminLogsView.tsx): 에러 목록 및 스택트레이스 상세 모달 API 연동
3. **[작업 3] 관리자 잔여 화면 8종 tokens.ts 전면 대입 (프론트/서비스)**
   - [AdminExtendedModulesView.tsx](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/admin/AdminExtendedModulesView.tsx) 및 [AdminWireframes.tsx](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/AdminWireframes.tsx) 내 PG-ADM-09~16 인라인 하드코딩 색상 클래스를 `themeClasses`로 100% 치환
   - 4모드(Light, Dark, Dawn, System) WCAG AA 고대비 가독성 및 44px 모바일 터치타깃 보장
   - **관리자 16대 전 화면 tokens.ts 대입률 100% 달성 ➔ 플랫폼 전체 25개 와이어프레임 토큰화 완전 정복**
4. **[작업 4] 관리자 16대 전 화면 모바일 Table-to-Card 반응형 가드레일 완결 (프론트/서비스)**
   - 모바일 뷰포트에서 0px 가로스크롤 보장 및 Table-to-Card 완결성 전수 점검
5. **[작업 5] 단위 테스트 확장 및 4단계 서비스 전수점검 무결성 검증 (에이전트/테스트)**
   - 단위 테스트에 관리자 2단계 API 및 토큰 대입 검증 케이스 추가
   - `tsc --noEmit` 정적 컴파일 0 에러 및 `service_health_check.ts` 100점 만점 [A+ (PERFECT)] 무결성 달성

> **사전 확인 안내**:
> 제시된 모든 작업 항목(1~5번)은 본 세션의 Phase 4 관리자 2단계 API 연동 및 관리자 잔여 화면 토큰화 완결 범위에 100% 부합하며, 범위를 벗어난 예외 항목은 확인되지 않았습니다. 즉시 전체 항목을 포함하여 순차적으로 구현을 진행합니다.

---

### 4. 루프 분석 (Loop Analysis)

- **문제의 목표**: 관리자 2단계 핵심 4개 화면의 Express/PostgreSQL 실제 REST API 연동 및 관리자 잔여 8개 화면 토큰화 완결을 통한 관리자 전 화면 및 플랫폼 전체 25개 와이어프레임 토큰화 100% 완전 정복.
- **데이터 분석**:
  - 관리자 뷰([AdminRolesAndMenusView](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/admin/AdminRolesAndMenusView.tsx), [AdminLogsView](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/admin/AdminLogsView.tsx))의 Mock 데이터를 실제 API 데이터로 치환.
  - [AdminExtendedModulesView.tsx](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/admin/AdminExtendedModulesView.tsx) 및 [AdminWireframes.tsx](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/AdminWireframes.tsx) 내 인라인 색상 클래스를 `tokens.ts`로 치환.
- **조건 및 범위**: 기존 UI 레이아웃, 기능 동작(순환 방지, 권한 매핑, 필터링), 인터페이스를 100% 보존하면서 스타일 및 데이터 계층만 고도화.
- **입력/출력 변수**:
  - 입력: 백엔드 REST API 응답 JSON, `themeMode`, `themeClasses`
  - 출력: 실제 데이터 연동 완료된 관리자 뷰 및 관리자 전 화면 100% 토큰화 산출물
- **평가 기준**:
  1. TypeScript 정적 컴파일 무오류 (`tsc --noEmit`)
  2. Vitest 단위 테스트 100% 통과
  3. 관리자 전 화면([PG-ADM-01](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/AdminWireframes.tsx) ~ [PG-ADM-16](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/AdminWireframes.tsx)) 및 플랫폼 25개 와이어프레임 토큰 대입률 100% 달성
  4. 4단계 서비스 전수점검 100점 만점 [A+ (PERFECT)]

---

### 5. 후속 실행 프롬프트 제안

계획이 수립되었으므로, 승인 후 실제 구현 및 단위 검증을 착수하기 위한 정제된 `#태스크처리` 프롬프트를 제시합니다.

```markdown
#태스크처리 [0034-01] Phase 4 관리자 2단계 핵심화면(PG-ADM-05~08) 실제 REST API 연동 및 관리자 전 화면 tokens.ts 전면 완결 구현
```
