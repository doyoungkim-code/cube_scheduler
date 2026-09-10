# 설치 및 배포 가이드

이 문서는 Cube Scheduler 를 **GitHub Pages + Firebase** 로 띄우는 절차다. 최초 1회만 하면 되고, 전체 15분 정도 걸린다.

- 1단계: Firebase 프로젝트 만들기
- 2단계: Google 로그인 켜기
- 3단계: Firestore 만들기 + 보안 규칙 게시
- 4단계: 설정값을 코드에 넣기
- 5단계: GitHub Pages 배포
- 6단계: 사용자 승인
- 부록: 예전 데스크톱 버전 데이터 옮기기

---

## 0. 시작 전에 알아둘 것

- **Firebase 는 Google 이 운영하는 백엔드 서비스**다. 우리는 그중 두 가지만 쓴다.
  - **Authentication**: "Google 계정으로 로그인" 버튼을 처리해 준다.
  - **Firestore**: 사용자별 스케줄 데이터를 저장하는 클라우드 DB. 어느 기기에서 접속해도 같은 데이터를 본다.
- 무료 요금제(Spark)로 충분하다. 결제 정보를 넣을 필요 없다.
- 이 프로젝트에서 **Firebase 설정값은 비밀이 아니다**. 공개 저장소에 커밋해도 된다. 남이 내 데이터를 못 보게 막는 건 3단계의 **보안 규칙**이 담당한다.
- 관리자(승인 권한자)는 **이메일 주소**로 판별한다. 아래에서 `kwat09k@gmail.com` 이라고 적힌 곳은 **실제로 로그인할 본인 Google 계정**으로 바꾸면 된다. 코드 한 곳, 규칙 한 곳 총 두 군데다.

---

## 1. Firebase 프로젝트 만들기

1. https://console.firebase.google.com 접속 → Google 계정으로 로그인 (관리자로 쓸 계정 권장)
2. **프로젝트 만들기** 클릭
3. 프로젝트 이름 입력 (예: `cube-scheduler`) → 계속
4. "Google 애널리틱스 사용 설정" 은 **꺼도 된다** → 프로젝트 만들기
5. 잠시 후 "새 프로젝트가 준비되었습니다" → 계속

---

## 2. Google 로그인 켜기

1. 왼쪽 메뉴 **빌드 → Authentication** → **시작하기**
2. **로그인 방법(Sign-in method)** 탭 → **Google** 클릭
3. **사용 설정** 토글 ON → 프로젝트 지원 이메일 선택 → **저장**
4. 같은 화면 상단의 **설정(Settings)** 탭 → **승인된 도메인(Authorized domains)** → **도메인 추가**
   - `doyoungkim-code.github.io` 입력 → 추가
   - `localhost` 는 기본으로 들어 있다 (로컬 개발용)

> 이 단계를 빼먹으면 배포된 사이트에서 로그인 버튼을 눌렀을 때 `auth/unauthorized-domain` 에러가 난다.

---

## 3. Firestore 만들기 + 보안 규칙

### 3-1. 데이터베이스 생성

1. 왼쪽 메뉴 **빌드 → Firestore Database** → **데이터베이스 만들기**
2. 위치: **`asia-northeast3 (Seoul)`** 권장 (나중에 못 바꾼다)
3. 보안 규칙: **프로덕션 모드로 시작** 선택 → 만들기
   (테스트 모드는 30일 후 아무도 접근 못 하게 되므로 쓰지 않는다. 어차피 다음 단계에서 규칙을 덮어쓴다.)

### 3-2. 보안 규칙 게시

1. Firestore 화면 상단 **규칙(Rules)** 탭
2. 편집기 내용을 전부 지우고, 저장소의 [`firestore.rules`](../firestore.rules) 파일 내용을 그대로 붙여넣기
3. 규칙 안의 아래 줄에서 이메일을 **본인 Google 계정**으로 수정:
   ```
   return signedIn() && request.auth.token.email == 'kwat09k@gmail.com';
   ```
4. **게시(Publish)** 클릭

이 규칙이 하는 일:
- 로그인한 사람은 자기 `members/{uid}` 문서를 **대기(pending) 상태로만** 만들 수 있다.
- 승인/해제/삭제는 관리자 이메일만 할 수 있다.
- 스케줄 데이터(`users/{uid}/store/...`)는 **본인이면서 승인된 사용자**만 읽고 쓸 수 있다. 관리자도 자기 데이터만 본다.

---

## 4. 설정값을 코드에 넣기

1. Firebase 콘솔 왼쪽 상단 **톱니바퀴 → 프로젝트 설정**
2. 아래로 내려 **내 앱** 섹션 → 앱이 없으면 **`</>` (웹)** 아이콘 클릭
3. 앱 닉네임 입력 (예: `web`) → "Firebase 호스팅 설정" 은 **체크 안 함** → 앱 등록
4. 화면에 이런 코드가 나온다. 이 중 `firebaseConfig` 객체만 복사한다:
   ```js
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "cube-scheduler-xxxx.firebaseapp.com",
     projectId: "cube-scheduler-xxxx",
     storageBucket: "cube-scheduler-xxxx.firebasestorage.app",
     messagingSenderId: "1234567890",
     appId: "1:1234567890:web:abcdef"
   };
   ```
5. 저장소의 [`src/lib/firebaseConfig.ts`](../src/lib/firebaseConfig.ts) 를 열어 `null` 을 그 값으로 바꾼다:
   ```ts
   export const firebaseConfig: FirebaseWebConfig | null = {
     apiKey: 'AIza...',
     authDomain: 'cube-scheduler-xxxx.firebaseapp.com',
     projectId: 'cube-scheduler-xxxx',
     storageBucket: 'cube-scheduler-xxxx.firebasestorage.app',
     messagingSenderId: '1234567890',
     appId: '1:1234567890:web:abcdef',
   }

   export const ADMIN_EMAIL = 'kwat09k@gmail.com'   // 3-2 에서 넣은 이메일과 동일하게
   ```
6. 로컬에서 확인:
   ```bash
   npm run dev
   ```
   `http://localhost:5173/cube_scheduler/` 에 로그인 화면이 뜨고, 관리자 계정으로 로그인하면 바로 앱이 열려야 한다.

---

## 5. GitHub Pages 배포

1. GitHub 저장소 페이지 → **Settings → Pages**
2. **Build and deployment → Source** 를 **GitHub Actions** 로 변경 (저장 버튼 없음, 선택하면 끝)
3. 4단계까지 반영한 코드를 `main` 에 push:
   ```bash
   git add -A
   git commit -m "Feat: GitHub Pages + Firebase 전환"
   git push
   ```
4. 저장소 **Actions** 탭에서 "Deploy to GitHub Pages" 워크플로가 초록색으로 끝나면
   https://doyoungkim-code.github.io/cube_scheduler/ 에서 접속 가능

이후로는 `main` 에 push 할 때마다 자동으로 재배포된다.

> 저장소 이름을 바꾸면 `vite.config.ts` 의 `base: '/cube_scheduler/'` 와 2단계의 승인된 도메인도 함께 바꿔야 한다.

---

## 6. 사용자 승인

1. 다른 사람이 사이트에 접속 → **Google 계정으로 로그인** 클릭
2. 그 사람 화면에는 **"승인 대기 중"** 이 표시된다. 아직 아무 데이터도 읽고 쓸 수 없다.
3. 관리자가 사이트에 로그인 → 왼쪽 하단 **⚙️(환경설정)** → **사용자 승인** 섹션
4. 대기 목록에서 이름/이메일 확인 후 **승인** 클릭 (원치 않으면 **거절**)
5. 상대방 화면이 **새로고침 없이** 자동으로 앱으로 넘어간다.

같은 화면에서 언제든 **승인 해제**할 수 있다. 해제하면 그 사람은 다시 대기 화면으로 돌아가고, 저장된 데이터는 삭제되지 않고 남아 있다.

관리자 본인은 첫 로그인 때 자동으로 승인된다.

---

## 부록. 예전 데스크톱(Electron) 버전 데이터 옮기기

1. 예전 버전이 설치돼 있던 PC 에서 탐색기 주소창에 입력:
   ```
   %APPDATA%\scheduler\scheduler-data\
   ```
2. 그 폴더의 `*.json` 파일 전부 (`day-2026-03-23.json`, `tickets.json`, `activities.json` 등)
3. 새 사이트에 로그인 → **⚙️ 환경설정 → 데이터 → 가져오기 (JSON)** → 파일 전체 선택
4. "N개 항목을 가져왔습니다" 가 뜨면 새로고침

파일명이 그대로 저장 키가 된다. 같은 화면의 **백업 내보내기**로 만든 파일도 같은 방법으로 다시 가져올 수 있다.

---

## 문제가 생기면

| 증상 | 원인 / 해결 |
|------|------------|
| 로그인 버튼 누르면 `auth/unauthorized-domain` | 2-4 승인된 도메인에 `doyoungkim-code.github.io` 누락 |
| 로그인 후 "권한 정보를 읽지 못했습니다" | 3-2 규칙이 게시되지 않았거나 잘못 붙여넣음 |
| 관리자인데 승인 대기 화면이 뜸 | `firestore.rules` 와 `firebaseConfig.ts` 의 이메일이 로그인한 계정과 다름 (대소문자 포함) |
| 배포 후 흰 화면 | Settings → Pages → Source 가 GitHub Actions 인지 확인, Actions 탭에서 빌드 실패 여부 확인 |
| 로컬에서 로그인 화면 대신 바로 앱이 뜸 | `firebaseConfig` 가 아직 `null` (로컬 모드) |
