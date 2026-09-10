# Sanity DB 연동 및 Vercel 배포 가이드

본 프로젝트는 **Sanity Headless CMS**와 **Vercel** 배포를 완벽하게 지원합니다.
관리자 모드에서 수정한 내용이 웹사이트에 즉시 반영되며, Sanity DB와 실시간 동기화할 수 있습니다.

---

## 1. Sanity 프로젝트 생성 (무료)

1. [Sanity.io](https://www.sanity.io/)에 접속하여 무료 계정 생성 및 로그인합니다.
2. [sanity.io/manage](https://www.sanity.io/manage)에서 **Create Project**를 클릭합니다.
3. 프로젝트 이름 (예: `hanwoori-reading`)을 입력하고 데이터셋을 기본값 `production`으로 만듭니다.
4. 생성된 프로젝트의 **Project ID**를 복사합니다.

### API 토큰 발급 (웹사이트 관리자 모드에서 Sanity로 바로 저장할 때 필요)
1. Sanity 프로젝트 대시보드 -> **API** 메뉴 -> **Tokens** 섹션으로 이동합니다.
2. **Add API token** 클릭:
   - Name: `web-admin`
   - Permissions: **Editor** 선택
3. 발급된 토큰 문자열을 복사합니다.

---

## 2. 웹사이트 관리자 모드에서 즉시 연동하기 (가장 쉬운 방법)

1. 웹사이트 하단 푸터 우측의 **⚙️ 관리자 모드** 버튼 클릭 (또는 푸터 3회 연속 클릭).
2. 관리자 비밀번호 `hanwoori2024` 입력 후 로그인.
3. 사이드바 맨 아래 **"Sanity DB 연동"** 탭 클릭.
4. 복사한 **Project ID**와 **API Token**을 입력하고 **"저장 및 연결 테스트"** 클릭.
5. **"현재 데이터를 Sanity에 업로드"** 버튼을 누르면 초기 웹사이트 콘텐츠(Q&A, 수업소식 등)가 Sanity에 자동 등록됩니다.
6. 이후 관리자 모드에서 내용을 수정하고 "저장하기"를 누르면 웹사이트와 Sanity DB에 자동 반영됩니다!

---

## 3. Vercel 배포 시 환경 변수 설정 (선택 사항)

Vercel에 배포할 때 아래 환경 변수를 Vercel 프로젝트의 **Environment Variables**에 추가해두면, 방문자 브라우저에서도 Sanity DB의 최신 데이터가 자동으로 표시됩니다:

- `VITE_SANITY_PROJECT_ID`: 당신의 Sanity Project ID
- `VITE_SANITY_DATASET`: `production`
- `VITE_SANITY_API_VERSION`: `2024-03-01`
- `VITE_SANITY_TOKEN`: 발급받은 Sanity Editor Token

---

## 4. Vercel 배포 방법

1. GitHub 저장소에 코드를 push합니다.
2. [Vercel](https://vercel.com/)에서 **Add New Project** -> 해당 저장소 import.
3. Framework Preset: **Vite** 선택.
4. Environment Variables에 위 Sanity 환경 변수들을 등록.
5. **Deploy** 클릭!
