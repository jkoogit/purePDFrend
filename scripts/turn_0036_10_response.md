#[0036-10] 서비스화면 소스구조 분석 보고 및 즉각 UI 개선 / 디자인시스템 쇼케이스 로드맵 제안

사용자께서 검토 및 요청해주신 4대 항목(1. 메뉴바로가기 리뷰 및 소스구조 분석, 2. 디자인시스템 쇼케이스 현황 및 확장 제안, 3. 로그인 버튼명 수정, 4. 반응형 요소간 줄바꿈 처리)에 대한 정밀 진단 결과와 즉각 조치 내역을 상세히 보고드립니다.

---

### 1. 메뉴바로가기 리뷰 및 화면·소스 구조 정밀 분석 (1.1 ~ 1.3)

#### 1.1 로고 클릭 화면과 첫화면(PG-USR-01)의 일치성 조치
- **원인 분석**:
  - 기존에는 좌상단 로고(`PdfrendLogo`) 클릭 시 `handleSystemSwitch('service')`가 호출되어 **실서비스 포털 화면**([PurePdfServicePortal.tsx](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/components/PurePdfServicePortal.tsx))으로 이동했던 반면,
  - 상단 메뉴바로가기 리본 레이어에서 `PG-USR-01(첫화면)`을 클릭하면 와이어프레임 샌드박스 쉘([WireframeStudio.tsx](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/WireframeStudio.tsx) ➔ [UserWireframes.tsx](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/UserWireframes.tsx)의 `UserLandingPage`)로 라우팅되어 서로 다른 화면이 표시되었습니다.
- **조치 완료**:
  - 사용자 지침에 따라 [Navbar.tsx](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/shared/components/Navbar.tsx)와 [App.tsx](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/App.tsx)의 `handleWireframeJump` 리스너를 수정하여, **메뉴바로가기에서 `PG-USR-01`을 선택하더라도 로고 클릭과 100% 동일한 실서비스 랜딩 화면(`PurePdfServicePortal`)으로 즉시 연결**되도록 일체화 조치를 완료하였습니다.

#### 1.2 와이어프레임 ➔ 실서비스 화면 전환 및 폐기 전략
- **아키텍처 판단 및 방향성**:
  - 지적하신 내용이 전적으로 맞습니다. 와이어프레임(`src/ppdf/views/wireframes/`)은 프로젝트 초기 25개 화면의 요구사항 정의, 레이아웃 규격, 디자인 토큰 적용 가능성을 검증하기 위한 정적 프로토타입(Mock)입니다.
  - 현재 시스템은 `src/ppdf/components/`를 통해 대용량 800쪽 가상 뷰어, 2-Way OCR 교정기 등 실제 비즈니스 기능을 구동하는 **실서비스 컴포넌트로 점진적 전환·고도화**되는 단계에 있습니다.
  - 따라서 메뉴바로가기는 임시 와이어프레임이 아니라 실제 구동되는 **실서비스 화면**으로 직접 라우팅되어야 하며, 검증이 끝난 와이어프레임은 실서비스 화면으로 완전히 흡수한 뒤 점진적으로 정리(Retire)하는 것이 올바른 개발 방향입니다.

#### 1.3 서비스 화면 vs 와이어프레임 소스 구조 비교

두 화면은 완전히 다른 폴더와 소스 파일로 분리되어 있으며, 구조는 다음과 같습니다:

| 구분 | 실서비스 소스 (`src/ppdf/components/`) | 와이어프레임 소스 (`src/ppdf/views/wireframes/`) |
| :--- | :--- | :--- |
| **목적** | **실제 사용자 비즈니스 기능 구동 (Production)** | **화면 기획/요건 검증용 프로토타입 (Mock & Sandbox)** |
| **첫화면 (랜딩)** | [PurePdfServicePortal.tsx](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/components/PurePdfServicePortal.tsx) (60KB)<br>• 7대 PDF 도구 퀵그리드, 실제 도서 모달, 공개문서 검색, 롤링배너 | [UserWireframes.tsx](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/UserWireframes.tsx) 내 `UserLandingPage`<br>• 단일 정적 롤링배너 및 카드 목업 |
| **PDF 뷰어** | [VirtualViewerStudio.tsx](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/components/VirtualViewerStudio.tsx) (42KB)<br>• 800쪽 대용량 가상스크롤 캔버스, 줌/회전/북마크 실제 구동 | [UserWireframes.tsx](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/UserWireframes.tsx) 내 `UserVirtualViewer`<br>• Xodo 스타일 툴바 UI 뼈대 및 모의 캔버스 |
| **OCR 스튜디오** | [OCRCorrectionStudio.tsx](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/components/OCRCorrectionStudio.tsx) (32KB)<br>• 2-Way 바운딩박스 정밀교정, Tesseract 실제 연동 | [UserWireframes.tsx](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/UserWireframes.tsx) 내 목업 텍스트 리스트 |
| **문서 라이브러리** | [DocumentLibraryViewer.tsx](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/components/DocumentLibraryViewer.tsx) (131KB)<br>• 8대 필터, 카테고리 접힘, 파일 업로드/다운로드 | [UserWireframes.tsx](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/UserWireframes.tsx) 내 `UserDocumentLibrary` 목업 |
| **관리자 화면군** | 실제 REST API 연동 완료 (`PG-ADM-01~08`) | [AdminWireframes.tsx](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/AdminWireframes.tsx) 및 `admin/` 하위 8개 와이어프레임 파일 |
| **환경 쉘** | [Navbar.tsx](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/shared/components/Navbar.tsx) 기반 통합 상단 헤더 | `shells/` ([StudioShell.tsx](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/shells/StudioShell.tsx), `UserShell`, `AdminShell`)<br>• PC/태블릿/모바일 반응형 뷰포트 시뮬레이터 쉘 |

---

### 2. 디자인시스템 쇼케이스 현황 및 개선 과제 검토 (2.1 ~ 2.8)

#### "아래 내용으로 정의된 화면이 DS-SHOWCASE 말고 더 있나?"
- **현황 확인**: 현재 프로젝트 전체에서 디자인 시스템 컴포넌트/토큰 쇼케이스로 구현된 화면은 `DS-SHOWCASE` ([DesignSystemShowcase.tsx](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/views/wireframes/DesignSystemShowcase.tsx)) **단 1개 화면**뿐입니다.
- **현재 구현 범위**:
  - `tokens.ts` 기초 색상(Brand, Neutral, Semantic), 타이포그래피, 4pt 그리드 스페이싱 규격
  - 8대 원자 컴포넌트(`Button`, `Input`, `Badge`, `Card`, `Textarea`, `Modal`, `KeyCap`, `ToolIcon`)
- **요청하신 2.1 ~ 2.8 확장 요구사항의 성격**:
  - **2.1 (30여 종 표준 원자/분자 컴포넌트)**: Top/Body/Footer 레이어, 타이틀영역, 검색필드, 콤보박스(아이콘 옵션), 필터칩, 라디오/체크박스/토글, 건수/상태뱃지, 드래그 위치이동 카테고리트리, 프로필아바타, 스테퍼, 탭네비게이션, 슬라이드드래그휠, 롱프레스 툴팁/복사, 안내팝업, 모바일 바텀시트, 모바일 하단바, 오프라인바, 인라인 피드백 배너, Bento 플랫 카드, 반응형 라벨/금액, 플로팅 도크/토스트.
  - **2.2 ~ 2.8 (인터랙티브 기능)**: 구현 코드 토글 표시, 옵션/상태별 제어, 4모드 테마 실시간 바인딩, 사용화면 ID 점프 링크, 상단 요소 검색, Zero-Pill 규격 유지, 텍스트 전수 선택 가능(`select-text`).
- **권장 진행 방식**:
  - 본 요구사항은 엔터프라이즈급 UI 컴포넌트 라이브러리를 통째로 구축하는 방대한 분량입니다.
  - 따라서 현재 세션의 후속 독립 태스크 **`[0036-05] 30대 표준 원자/분자 컴포넌트 및 인터랙티브 디자인시스템 쇼케이스 전면 고도화`**로 정식 등록하고, TDD 단위 테스트 및 체계적인 모듈 분리(원자/분자/유기체)를 통해 완성하는 것을 제안드립니다.

---

### 3. 로그인 버튼명 수정 조치 완료 (3.1)

- **대상 요소**: `document.querySelector("#btn-portal-open-login > span")`
- **조치 파일**: [PurePdfServicePortal.tsx](file:///d:/dev/repository/git.jkoogit/purePDFrend/src/ppdf/components/PurePdfServicePortal.tsx)
- **변경 내용**:
  ```tsx
  // 변경 전
  <span>로그인 / 권한시뮬</span>

  // 변경 후
  <span>로그인</span>
  ```

---

### 4. 가로넓이 초과시 반응형 요소간 줄바꿈 처리 완료 (4.1)

- **대상 요소**:
  `#root > div > main > div > div > div ... > div.flex.items-center.gap-2.flex-wrap.justify-end > div > button` (로그인 및 회원가입 버튼 그룹)
- **문제점 진단**:
  - 화면 폭이 좁아질 때 버튼 내부 텍스트("로그인", "회원가입")가 두 줄로 쪼개져 가독성이 저해되거나, 버튼 그룹 내부 컨테이너가 래핑을 지원하지 않아 우측으로 삐져나오는 현상 발생.
- **조치 내용**:
  1. 버튼 요소에 `whitespace-nowrap` 클래스 적용: 버튼 내부 텍스트의 임의 줄바꿈을 100% 원천 방지.
  2. 버튼 그룹 부모 컨테이너에 `flex-wrap` 적용: 화면 너비가 부족할 경우 텍스트가 깨지는 대신 **버튼 요소 자체가 다음 줄로 자연스럽게 배치(Wrap)**되도록 반응형 flexbox 레이아웃 최적화.
  ```tsx
  <div className="flex items-center gap-2 flex-wrap">
    <button
      type="button"
      id="btn-portal-open-login"
      className={`min-h-[38px] px-4 py-1.5 rounded-xl text-xs ${themeClasses.buttonPrimary} flex items-center gap-1.5 cursor-pointer shadow-sm whitespace-nowrap`}
    >
      <LogIn className="w-3.5 h-3.5" />
      <span>로그인</span>
    </button>
    <button
      type="button"
      className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs ${themeClasses.buttonOutline} flex items-center gap-1.5 cursor-pointer whitespace-nowrap`}
    >
      <UserPlus className="w-3.5 h-3.5" />
      <span>회원가입</span>
    </button>
  </div>
  ```

---

### 5. 정적 검증 및 품질 현황

- **TypeScript 컴파일 검증**: `node ./node_modules/typescript/bin/tsc --noEmit` ➔ **0 errors (Exit code 0, Clean Compile)**.
- **로컬 및 원격 DB 트레이스**: Turn 10 프롬프트 및 응답 전문이 `data/local_agent_store.json`과 원격 PostgreSQL DB에 100% 무손실 영속화되었습니다.

---

### 6. 다음 단계 실행 선택지 제안

위 1~4 항목 검토 결과에 따라 다음 작업을 선택하여 진행하실 수 있습니다:

1. **선택 A (추천): 디자인시스템 쇼케이스 전면 고도화 태스크 착수**
   ```bash
   #태스크시작 [0036-05] 30대 표준 원자/분자 컴포넌트 및 인터랙티브 디자인시스템 쇼케이스(DS-SHOWCASE) 전면 고도화 계획 수립
   ```
2. **선택 B: 기존 태스크 정리 및 브랜치 승급 우선 완료**
   ```bash
   #태스크정리 : [0036-04] 서비스화면리뷰 UI/UX 개선 태스크 정리
   #태스크승급 까지 일괄 처리해줘
   ```
