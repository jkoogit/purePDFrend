#[0031-11] 실행 환경별 GitHub 연동 아키텍처 진단 및 Antigravity IDE 하이브리드 처리 가이드

---

### 1. 지적 사항 확인 및 정확한 아키텍처 진단

**사용자께서 정확하게 핵심을 짚어주셨습니다. 100% 맞습니다.**

| 구분 | Google AI Studio 환경 | Antigravity IDE 환경 (현재 환경) |
| :--- | :--- | :--- |
| **실행 인프라** | 클라우드 가상 샌드박스 (Linux Container) | 사용자 로컬 PC (Windows Desktop) |
| **인증 주체** | IDE 세션 및 로컬 키체인이 존재하지 않음 | **IDE 내장 GitHub 계정 연동** (GitHub Auth Provider) |
| **올바른 통신 방식** | **`GITHUB_TOKEN` 기반 GitHub REST/Git Data API** | **IDE 연동 또는 로컬 Git CLI (GCM / IDE Auth)** |
| **머지/승급 주체** | GitHub API 직접 호출 (`POST /repos/.../merges`) | IDE 소스 제어 UI 또는 로컬 Git 브랜치 동기화 |

---

### 2. 이번 세션에서 불일치가 발생했던 근본 원인

1. **AI Studio 전용 하네스의 잔재**:
   - 기존 하네스 규약(`AGENTS.md` 제0-1조)과 배포 스크립트(`scripts/github_sync_push.ts`)는 **AI Studio 웹 컨테이너 환경을 기준으로 개발**되어 오직 `process.env.GITHUB_TOKEN`이 주입된 상황만을 전제로 작동하도록 하드코딩되어 있었습니다.
2. **Antigravity IDE 샌드박스의 비대화형(Non-interactive) 셸 제약**:
   - Antigravity IDE 환경에서는 시스템 `PortableGit`의 자격증명 헬퍼가 `credential.helper = helper-selector`로 설정되어 있습니다.
   - IDE 화면(Source Control 탭)에서는 IDE의 GitHub 로그인을 통해 정상 통신하지만, 백그라운드 비대화형 서브셸 프로세스에서 `git push`를 직접 호출하면 팝업 선택창(`helper-selector`)을 대화형으로 띄우지 못해 프로세스가 무한 대기(Hang)되는 현상이 있었습니다.

---

### 3. Antigravity IDE 환경에서의 권장 처리 절차

작업 소스는 현재 로컬 브랜치(`task/0031_01_tokens_apply_usr_02_04_Gemini`)에 **8개 커밋으로 100% 안전하게 보존**되어 있습니다. 아래 2가지 중 편하신 방식으로 즉시 원격 동기화가 가능합니다:

#### 🌟 [방법 A] Antigravity IDE 내장 '소스 제어' UI 활용 (가장 추천)
Antigravity IDE는 VS Code 기반이므로 IDE에 이미 로그인된 GitHub 계정을 즉시 사용할 수 있습니다:
1. 좌측 사이드바에서 **[소스 제어 (Source Control)]** 아이콘 클릭 (단축키: `Ctrl + Shift + G`).
2. 상단 브랜치(`task/0031_01_tokens_apply_usr_02_04_Gemini`) 옆의 **`브랜치 게시 (Publish Branch)`** 또는 `...` 메뉴 ➔ **`푸시 (Push)`** 클릭.
3. 원격에 브랜치가 푸시되면 GitHub 웹 화면 또는 IDE에서 `dev`로 PR 생성/머지 진행.

#### 🛠️ [방법 B] 로컬 Git Credential Manager 설정 (에이전트 완전 자동화)
터미널에서 1회만 Windows 자격증명 관리자로 전환해 주시면, 에이전트가 백그라운드에서도 프롬프트 없이 네이티브 `git push`를 완전 자동으로 수행할 수 있습니다:
```powershell
# Windows Git Credential Manager로 설정 (1회만 실행)
git config --global credential.helper manager

# 이후 로컬에서 dev 머지 및 원격 동기화 일괄 실행
git push origin task/0031_01_tokens_apply_usr_02_04_Gemini
git checkout dev
git merge task/0031_01_tokens_apply_usr_02_04_Gemini
git push origin dev
git checkout task/0031_01_tokens_apply_usr_02_04_Gemini
```

---

### 4. 하네스 엔진 고도화 계획 (AI Studio & Antigravity 듀얼 모드)

향후 두 환경 어디서 작업하더라도 혼선이 없도록 하네스 스크립트(`scripts/github_sync_push.ts`)를 다음과 같이 고도화하겠습니다:
- `GITHUB_TOKEN` 존재 시 ➔ **AI Studio API 모드**로 동작.
- `GITHUB_TOKEN` 부재 & 로컬 IDE 환경 감지 시 ➔ **Antigravity IDE 네이티브 Git CLI 모드**로 자동 분기 처리.

방법 A(IDE 소스 제어 탭에서 브랜치 게시)로 원격 푸시를 진행해 보시겠습니까? 진행 완료 후 알려주시면 하네스 스토어와 원격 동기화 상태를 최종 검증하겠습니다!
