#[0032-02] [00] Phase 2 사용자 와이어프레임(PG-USR-05~07) tokens.ts 전면 대입 및 가상뷰어·문서관리 4모드 고대비 표준화 상세 계획

---

### 1. 도메인 분석 및 아키텍처 영향도 평가

- **대상 도메인**: 
  - purePDFrend 사용자 서비스 와이어프레임 2단계 핵심 3개 프로그램:
    1. **PG-USR-05**: 내 문서관리 라이브러리 (`DocumentLibraryViewer.tsx`)
    2. **PG-USR-06**: 대용량 800쪽 가상스크롤 문서뷰어 및 3탭 주석스튜디오 (`UserWireframes.tsx` L4473~L8329)
    3. **PG-USR-07**: 실시간 문서공유 및 협업작업 관리 대시보드 (`UserWireframes.tsx` L8330~L9500)
- **아키텍처 영향도**:
  - **단일 진실 공급원(SSOT) 준수**: `src/styles/tokens.ts`의 `getThemeAdaptiveClasses` 및 시맨틱 토큰을 완전 바인딩하여 하드코딩된 다크 클래스(`bg-slate-950`, `border-slate-800`, `text-slate-300`)를 100% 제거.
  - **4모드(Light, Dark, Dawn, System) 고대비 가독성**: 야간(Dark) 뿐만 아니라 주간(Light, 흰색/회색조) 및 여명(Dawn, 미드나잇 블루/시안) 환경에서 뷰어 툴바, 가상 캔버스, 주석 패널, 테이블/그리드 카드가 WCAG AA(4.5:1 이상) 명도 대비를 완벽 유지하도록 보장.
  - **컴포넌트 인터페이스 확장**: `DocumentLibraryViewer.tsx`에 `themeMode?: ThemeMode` 프로퍼티를 주입하고 내부 하위 모달(ImageEditLayerModal 등)까지 테마 적응형 클래스 연쇄 전파.
  - **기존 비즈니스 로직 100% 보존**: 가상 스크롤, 800쪽 점프, 3단계 주석 이벤트, Undo/Redo 불변 스택, 공유 링크 생성 로직의 기능적 무결성을 철저히 보존.

---

### 2. 세션 / 태스크 / 루프 식별 체계

- **세션 ID**: `SESSION-0032`
- **태스크 ID**: `TASK-0032-01`
- **루프 계획 (Loop Identification)**:
  - `LOOP-0032-01`: PG-USR-05 내 문서관리 라이브러리(`DocumentLibraryViewer.tsx`) tokens.ts 대입 및 4모드 고대비화
  - `LOOP-0032-02`: PG-USR-06 가상뷰어(초슬림 2단 툴바, 3탭 패널, 가상 캔버스, 속성바) tokens.ts 전면 전환
  - `LOOP-0032-03`: PG-USR-07 협업/공유 대시보드(2대 탭, 권한 칩, 참여자 피드, 모달) tokens.ts 전환
  - `LOOP-0032-04`: 단위 테스트(`tests/wireframe_shells_and_tokens.test.ts`) 및 4단계 서비스 전수 검증 (100점 만점)

---

### 3. 세부 작업 항목별 실행 계획 및 사전 확인

1. **[작업 1] PG-USR-05 DocumentLibraryViewer tokens.ts 대입 및 테마 바인딩 (서비스)**
   - `DocumentLibraryViewerProps`에 `themeMode?: ThemeMode` 추가 및 `getThemeAdaptiveClasses` 연동
   - 8대 상세필터, 검색창, 폴더 트리 사이드바, 문서 등록(PDF/이미지) 모달, 4종 다운로드 모달의 인라인 다크 클래스를 `themeClasses`로 100% 치환
   - 44px 최소 터치 영역 및 Zero-Pill 사각 라운딩 규격 강제
2. **[작업 2] PG-USR-06 800쪽 가상뷰어 초슬림 2단 툴바 및 뷰어 쉘 표준화 (서비스)**
   - Top 1단 글로벌/문서 툴바 및 Top 2단 뷰어 기능 툴바의 배경, 테두리, 아이콘 버튼을 `themeClasses.panel` / `card` / `buttonSecondary`로 치환
   - 8대 모드 전환 버튼, 줌/회전/페이지 점프 인풋, 800쪽 플로팅 칩의 고대비 텍스트/경계선 보장
3. **[작업 3] PG-USR-06 3탭(북마크, 목차, 주석) 패널 및 팝오버 렌더러 전환 (서비스)**
   - 주석 통합 렌더러(`renderIntegratedAnnotationPanel`), 목차 렌더러(`renderTOCFlatRow`), 북마크 렌더러(`renderBookmarkFlatRow`)에 `themeClasses` 전면 바인딩
   - 상황별 팝오버(ToolStylePopover, AnnotationActionPopover) 및 인앱 토스트 알림의 4모드 가독성 보장
4. **[작업 4] PG-USR-07 문서공유 및 협업작업 관리 대시보드 토큰 대입 (서비스)**
   - 공유관리/사용관리 2대 탭 컨테이너, 권한 뱃지(읽기/검토자/관리자), 참여자 아바타 그리드, 활동 로그 피드 토큰화
   - 공유 링크 생성/수정 모달 및 비밀번호 설정 폼의 4모드 스타일 일체화
5. **[작업 5] 단위 테스트 확장 및 4단계 서비스 전수점검 무결성 검증 (에이전트/테스트)**
   - `tests/wireframe_shells_and_tokens.test.ts`에 PG-USR-05~07 토큰 대입 및 4모드 적응형 헬퍼 검증 테스트 케이스 추가
   - `npx vitest run` 및 `npx tsc --noEmit` 정적 컴파일 검증 100% 무결점 통과

> **사전 확인 안내**:
> 제시된 모든 작업 항목(1~5번)은 본 세션의 Phase 2 범위에 100% 부합하며, 범위를 벗어난 예외 항목은 확인되지 않았습니다. 즉시 전체 항목을 포함하여 순차적으로 구현을 진행합니다.

---

### 4. 루프 분석 (Loop Analysis)

- **문제의 목표**: 방대한 규모의 뷰어 및 라이브러리 와이어프레임(약 6,000라인)에서 하드코딩된 스타일을 tokens.ts 유틸리티로 무손실 치환.
- **데이터 분석**: `DocumentLibraryViewer.tsx`(2,656라인), `UserWireframes.tsx`의 PG-USR-06(3,856라인), PG-USR-07(1,170라인) 내 400여 개 인라인 색상 클래스 존재.
- **조건 및 범위**: 기존 UI 레이아웃, 기능 동작(가상 스크롤, 주석, 공유), 변수명을 100% 유지하면서 CSS 클래스만 tokens.ts 체계로 치환.
- **입력/출력 변수**:
  - 입력: `themeMode`, `resolvedTheme`, `themeClasses`
  - 출력: 4모드 완벽 적응형 와이어프레임 렌더링 결과물
- **평가 기준**:
  1. TypeScript 컴파일 무오류 (`tsc --noEmit`)
  2. Vitest 단위 테스트 100% 통과
  3. Light, Dark, Dawn 3대 테마 전환 시 텍스트/배경 명도 대비 4.5:1 이상 유지
  4. 모바일 터치 타깃 44px 이상 및 Zero-Pill 규격 준수율 100%

---

### 5. 후속 실행 프롬프트 제안

계획이 수립되었으므로, 승인 후 실제 구현 및 검증을 착수하기 위한 정제된 `#태스크처리` 프롬프트를 제시합니다.

```markdown
#태스크처리 [0032-01] Phase 2 사용자 와이어프레임(PG-USR-05~07) tokens.ts 전면 대입 및 4모드 고대비 표준화 구현
```
