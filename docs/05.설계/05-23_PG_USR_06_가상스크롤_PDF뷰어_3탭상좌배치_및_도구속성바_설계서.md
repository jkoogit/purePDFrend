# 05-23. PG-USR-06 가상 스크롤 PDF 전용 뷰어 연동, 3탭 상단/좌측 배치 및 도구속성바 상세설계서

> **문서 번호**: `05-23`  
> **프로그램 ID**: `PG-USR-06` (문서뷰어 & 주석 스튜디오)  
> **연계 화면**: `PG-USR-05` (문서관리 라이브러리)  
> **수행 세션/태스크**: `SESSION-0020` / `TASK-0020-01`  
> **최종 개정일자**: 2026-10-01  
> **상태**: 구현 승인 및 반영 완료 (Approved)

---

## 1. 개요 및 목적 (Executive Overview)

본 설계서는 사용자 메인 서비스 화면인 **`PG-USR-06` (문서뷰어 & 주석 스튜디오)**의 고성능 가상 스크롤 PDF 전용 뷰어 연동 및 독서/서지 툴바 UI 고도화 사양을 정의합니다.

기존 와이어프레임 목업 단계를 넘어, **`PG-USR-05` 서재에서 임의의 책/문서(800쪽 이상 대용량 도서 포함)를 클릭했을 때 실제 도서 메타데이터와 페이지를 로딩하여 60fps 가상 스크롤러(`VirtualScrollEngine`)와 LRU 페이지 메모리 가드로 완벽하게 열람**할 수 있도록 구현합니다.  
또한 사용자의 피드백을 수용하여 **목차 포함 3탭(북마크/목차/주석) 영역의 [상단 가로 드로어 ⬒ ↔ 좌측 세로 패널 ◫] 원클릭 레이아웃 전환**, **8대 모드별 및 3탭 접기/펼치기(Zen Mode)**, **도구별 상세속성(선 굵기, 색상, 투명도, OCR 스냅) 인라인 미니바**를 제공합니다.

---

## 2. 화면 간 연계 및 상태 파이프라인 (Navigation Pipeline)

```mermaid
flowchart TD
    subgraph PG_USR_05 [📚 PG-USR-05 문서관리 라이브러리]
        DocCard[도서 카드 / 테이블 행 클릭]
        DocData[DocumentItem: title, totalPages, readPages, author, publisher 등]
    end

    subgraph PG_USR_06 [📖 PG-USR-06 문서뷰어 & 주석 스튜디오]
        DocCard -->|onOpenViewer(docId, doc)| ActiveDocState[activeViewingDoc 상태 주입]
        ActiveDocState --> ViewSwitch[selectedProg = 'PG-USR-06' 화면 전환]

        subgraph TopBar [전용 독서/서지 네비게이션 툴바]
            BackBtn[← 서재 목록으로 복귀]
            BookMeta[도서명 / 저자 / 출판사 / 독서진행률 바]
            ZoomRotate[줌: 50%~300%, 맞춤 / 회전: 좌우 90°]
            PageNav[쪽수 직접입력 인풋 / 슬라이더 / 1쪽·10쪽 점프]
            SearchablePdf[Searchable PDF 본문 검색 & 키워드 하이라이트]
        end

        subgraph ModeToolbar [8대 모드 툴바 & 상세속성 미니바]
            ModeTabs[주석 / 그리기 / 작성및서명 / 보기 / 즐겨찾기 / 삽입 / 변환 / 양식]
            ModeCollapseToggle[▲ 모드 접기 / Zen Mode]
            ToolPropMiniBar[도구별 상세속성: 선굵기, 8색 팔레트, 투명도, 폰트크기, OCR스냅]
        end

        subgraph ThreeTabDrawer [3대 보조 탭 영역 (북마크 / 목차 / 주석)]
            LayoutToggle[⬒ 상단배치 ↔ ◫ 좌측배치 전환 토글]
            DrawerCollapseToggle[탭 접기 / 펼치기]
            BookmarksView[북마크 목록 & 쪽수 점프]
            TocView[계층형 목차(TOC) 트리 & 클릭 이동]
            AnnotsView[주석 목록 & 본문 위치 포커스]
        end

        subgraph VirtualViewport [60fps 대용량 가상 뷰포트]
            VEngine[VirtualScrollEngine: 800쪽 가상 윈도잉]
            LRUCache[MemoryGuardManager & PageLRUCache 메모리 절약]
            CanvasRenderer[고화질 페이지 캔버스 & 텍스트/도형 오버레이]
        end

        BackBtn -->|진행률 역동기화| PG_USR_05
    end
```

---

## 3. 핵심 기능별 상세 사양

### 3.1 `PG-USR-05` ➔ `PG-USR-06` 컨텍스트 전달 및 실시간 진행도 동기화
- **상태 정의**: `activeViewingDoc: DocumentItem | null`
- **전달 흐름**: `DocumentLibraryViewer`의 도서 클릭 시 `onOpenViewer(doc.id, doc)`를 호출하여 `activeViewingDoc`에 선택된 도서 객체를 주입하고 `selectedProg`를 `PG-USR-06`으로 전환합니다.
- **역동기화**: 뷰어에서 사용자가 열람한 쪽수(`currentPage`)가 변경되면, 상단 **[← 서재 목록으로]** 복귀 시 `activeViewingDoc.readPages` 및 `progressPercent`가 서재 목록 데이터에 즉시 반영됩니다.

### 3.2 800쪽 대용량 가상 스크롤러 및 LRU 메모리 가드
- **페이지 생성기**: `PdfPageStore.generateMockBook(activeDoc.totalPages, activeDoc.title)`를 호출하여 도서별 실제 쪽수(예: 800쪽)에 맞는 가상 페이지 배열을 즉시 바인딩.
- **가상 스크롤 엔진**: 가시 영역(`startIndex` ~ `endIndex`)과 상/하단 스페이서 높이(`topSpacerHeight`, `bottomSpacerHeight`)를 실시간 계산하여 800쪽 스크롤 시에도 DOM 노드 수를 3~5개로 최소화.
- **LRU 메모리 가드**: 최대 20쪽까지만 비트맵 캐시를 유지하고 나머지는 즉시 가비지 컬렉션(GC)을 유도하여 50MB 미만의 초경량 브라우저 메모리 점유율 유지.

### 3.3 목차 포함 3탭 영역 상단배치 vs 좌측배치 전환 기능
- **레이아웃 모드**: `tabLayoutPosition: 'left' | 'top'`
- **좌측 패널 모드 (`left`)**: 뷰어 좌측에 260~280px 폭의 세로 패널로 배치. 도서 본문과 목차/주석을 동시에 나란히 열람하기에 적합.
- **상단 드로어 모드 (`top`)**: 뷰어 상단 툴바 바로 아래에 가로형 슬림 드로어로 배치. 캔버스 가로 폭을 100% 최대로 확보하여 와이드 모니터나 태블릿 가로보기 시 본문 집중도를 극대화.
- **접기/펼치기 (`isTabDrawerCollapsed`)**: 원클릭으로 3탭 영역을 완전히 접어 캔버스 영역을 넓힐 수 있음.

### 3.4 8대 모드별 접기/펼치기 및 도구별 상세속성 미니바
- **모드 바 접기 (`isModeToolbarCollapsed`)**: 8대 모드 전환 칩을 `▲ 위로 접기`하여 완벽한 책 읽기 전용 **독서 몰입(Zen Mode)**을 활성화.
- **도구별 상세속성 미니바 (`activeToolProperties`)**:
  - `pen`, `brush`: 선 굵기 슬라이더 (1px ~ 20px), 선 색상 팔레트 (검정, 빨강, 파랑, 초록, 보라, 노랑 등), 투명도 (10%~100%).
  - `highlight`: 형광펜 색상 (형광노랑, 형광초록, 형광핑크, 형광하늘), OCR 텍스트 자석 스냅(Snap) ON/OFF.
  - `textbox`: 폰트 크기 (10pt ~ 36pt), 글자색, 테두리 표시.
  - `rect`, `circle`, `arrow`, `line`: 선 두께, 테두리색, 배경 채우기 투명도.
  - `sign_pad`, `stamp_approved`: 서명/도장 색상, 날짜스탬프 포맷.

### 3.5 독서/서지 전용 상단 툴바
- **줌 제어**: 50% ~ 300% 줌인/줌아웃, 100% 원본, 화면 너비 맞춤.
- **회전 제어**: 시계 반대방향 90°(좌회전), 시계방향 90°(우회전).
- **페이지 네비게이션**:
  - 직접 입력 인풋 (`[ 42 ] / 800 쪽`): 숫자 입력 후 Enter 시 즉시 점프.
  - 이전/다음 1쪽 이동 (`◀`, `▶`), 10쪽 고속 이동 (`-10P`, `+10P`).
  - 프로그레스 슬라이더 바.
- **Searchable PDF 검색**:
  - 검색어 입력 시 본문 텍스트 내 매칭 단어 개수 표시 및 하이라이트.

---

## 4. 모바일 반응형 및 디자인 거버넌스 준수 (정책 03-13, 03-14)

- **360~390px 스마트폰 화면**: 툴바가 2열 이상으로 깨지지 않도록 `HorizontalSlideContainer`로 가로 스와이프를 지원하고, 핵심 컨트롤(페이지 점프, 줌, 서재 복귀)을 우선 배치.
- **색상 및 폰트**: Tailwind CSS `bg-slate-950`, `border-slate-800`, 포인트 컬러 `sky-500`/`sky-600` 적용.
- **Zero-Pill 규율**: 알약형(Pill) 배지 남발을 배제하고 단정한 rounded-lg / rounded-xl 사각형 디자인 시스템 준수.
- **터치 타겟**: 모바일 버튼 최소 터치 영역 44x44px 확보.

---

## 5. 결론 및 향후 계획

본 설계를 바탕으로 `DocumentLibraryViewer.tsx`와 `UserWireframes.tsx`의 연동 인터페이스를 확장하고, `PG-USR-06` 뷰어를 고도화하여 프로덕션 수준의 안정성과 사용자 경험을 확보합니다.
