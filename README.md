# Cube Scheduler

하루를 10분 단위로 칠해서 기록하는 개인 스케줄러. 24시간 타임테이블에 활동을 드래그로 칠하고, 기차표 모양의 칸반 티켓으로 할 일을 관리하고, 요일별 루틴과 습관을 추적한다.

- **사이트**: https://doyoungkim-code.github.io/cube_scheduler/
- **동기화**: Google 계정으로 로그인하면 어느 기기에서든 같은 데이터를 본다 (Firebase Firestore).
- **접근 제한**: 승인제. 로그인한 사용자는 관리자가 승인해야 쓸 수 있고, 각자 자기 데이터만 본다.
- **지원 환경**: 데스크톱·태블릿·모바일 브라우저. 타임테이블은 터치 드래그로도 칠할 수 있다.

## 주요 기능

### 스케줄
- **타임테이블**: 144개(10분 단위) 블록. 팔레트에서 활동을 고르고 드래그하면 그 구간이 칠해진다. 드래그 중 3시간 확대 뷰가 떠서 정확히 조절할 수 있다.
- **현재 시간대 / 시간 상세**: 지금 시각이 속한 시간대의 기록을 카드로 보여 준다. 블록을 클릭하면 그 시간의 상세 패널이 열리고, 카드를 누르면 제목·내용·활동별 세부 항목(운동 종류/거리/시간, 알고리즘 문제번호/풀이시간/링크)을 적을 수 있다.
- **활동 팔레트**: 활동 이름과 색을 자유롭게 추가·편집. 현재 활동에 따라 왼쪽 방 이미지가 바뀐다 (알고리즘, 프로젝트, 운동, 식사, 영어 공부, 수면 등).
- **날짜 이동**: 화살표로 하루씩, 달력으로 원하는 날짜로. 기록이 있는 날은 달력에 점이 찍힌다.
- **실행 취소**: Ctrl+Z (최근 20단계).

### 칸반 보드
- To Do / Progress / Done 세 컬럼. 티켓에는 제목, 상세, 왜 하는지(Why), 활동 유형, 활동별 세부 항목이 들어간다.
- 데스크톱에서는 드래그앤드롭으로 컬럼 간 이동. Progress 티켓은 오른쪽 스텁을 옆으로 당기면 찢어지면서 Done으로 넘어간다.
- Progress 티켓을 타임테이블의 같은 활동 구간 위에 놓으면 그 구간에 티켓 내용이 기록으로 연결된다.

### 대시보드
- 하루 일과 / 주간 현황 리포트. 타임라인 바, 활동별 합계, 기록 목록.
- **클립보드 복사**: 인라인 스타일이 포함된 HTML로 복사되어 Tistory, Notion, Velog 등의 HTML 편집기에 그대로 붙여넣을 수 있다.

### 습관
- **요일별 루틴**: 평일/주말 템플릿과 월~일 각각의 루틴을 미니 타임테이블에 칠한다. 루틴은 직접 칠하지 않은 빈 시간에만 반투명 사선으로 표시된다.
- **루틴 이행률**: 지난 4주 동안 루틴대로 실제 기록한 비율을 요일별로 보여 준다.
- **체크리스트 습관**: 매일 체크하는 습관 목록과 연속 달성 일수.

### 설정
- 계정 정보와 로그아웃.
- 관리자에게만 보이는 **사용자 승인** 목록 (승인 / 해제 / 거절).
- **백업 내보내기 / 가져오기** (JSON). 예전 데스크톱 버전의 데이터 파일도 그대로 가져올 수 있다.

## 시작하기

```bash
npm install
npm run dev        # http://localhost:5173/cube_scheduler/
npm run build      # 타입 검사 + dist/ 생성
npm run preview    # 빌드 결과 미리보기
```

`src/lib/firebaseConfig.ts` 의 `firebaseConfig` 가 `null` 이면 로그인 없이 브라우저 `localStorage` 에만 저장하는 **로컬 모드**로 동작한다.

Firebase 프로젝트 만들기, 보안 규칙 게시, GitHub Pages 배포, 사용자 승인, 예전 데이터 이전 절차는 **[docs/SETUP.md](docs/SETUP.md)** 에 단계별로 정리되어 있다.

## 기술 스택

| 영역 | 기술 |
|------|------|
| UI | React 19, TypeScript 5, Vite 6 |
| 스타일 | 단일 CSS (`src/styles/global.css`), CSS 변수 토큰, 컨테이너 쿼리, Pretendard |
| 인증 | Firebase Authentication (Google 로그인) |
| 데이터 | Cloud Firestore, 오프라인 캐시(IndexedDB) |
| 배포 | GitHub Pages, GitHub Actions (`main` push 시 자동) |

외부 라이브러리는 `firebase`, `uuid` 두 개뿐이다.

## 프로젝트 구조

```
cube_scheduler/
├── .github/workflows/deploy.yml   # GitHub Pages 자동 배포
├── docs/SETUP.md                  # Firebase / 배포 / 승인 설정 가이드
├── firestore.rules                # Firestore 보안 규칙 (콘솔에 붙여넣기)
├── public/                        # 앱 아이콘, 활동별 방 이미지(room_*.png)
├── src/
│   ├── main.tsx                   # 엔트리. AuthProvider > AuthGate > App
│   ├── App.tsx                    # 헤더 + 탭 전환 + 스케줄 페이지
│   ├── auth/
│   │   ├── AuthContext.tsx        # 로그인 상태, members/{uid} 승인 상태 구독, 저장소 백엔드 전환
│   │   ├── AuthGate.tsx           # 로그인 / 승인 대기 화면
│   │   └── AdminPanel.tsx         # 관리자용 승인 목록
│   ├── lib/
│   │   ├── firebaseConfig.ts      # Firebase 설정값 + 관리자 이메일 (설정은 여기만)
│   │   ├── firebase.ts            # Auth / Firestore 초기화
│   │   └── storage.ts             # 키-값 저장소 추상화 (localStorage / Firestore)
│   ├── components/
│   │   ├── AppHeader.tsx          # 상단 헤더 + 모바일 하단 탭바
│   │   ├── RoomCard.tsx           # 방 이미지 + 시계 카드
│   │   ├── TimeTable.tsx          # 타임테이블 (드래그 페인트, 확대 뷰, 현재 시간대)
│   │   ├── HourDetail.tsx         # 시간 상세 패널
│   │   ├── ActivityPalette.tsx    # 활동 팔레트
│   │   ├── Calendar.tsx           # 달력
│   │   ├── KanbanBoard/Column/Card.tsx   # 칸반 보드
│   │   ├── TicketModal.tsx        # 티켓 / 기록 편집 모달
│   │   ├── TicketActivityFields.tsx      # 활동별 세부 항목 폼
│   │   ├── MiniRoutineTimeTable.tsx      # 루틴 편집용 미니 타임테이블
│   │   ├── RoutineAdherence.tsx   # 루틴 이행률
│   │   ├── HabitChecklist.tsx     # 체크리스트 습관
│   │   ├── ViewShell.tsx          # 서브 페이지 공통 래퍼
│   │   └── Icon.tsx               # 내비게이션 SVG 아이콘
│   ├── pages/
│   │   ├── PatternAnalysisView.tsx  # 대시보드
│   │   ├── HabitTrackerView.tsx     # 습관
│   │   ├── QuickMemoView.tsx        # 메모 (예정)
│   │   └── SettingsView.tsx         # 설정
│   ├── hooks/
│   │   ├── useDayData.ts          # 날짜별 데이터, 루틴 병합, 자동 저장, 실행 취소
│   │   └── useKanbanData.ts       # 칸반 티켓 CRUD, 자동 저장
│   ├── types/                     # schedule.ts, kanban.ts, navigation.ts
│   └── styles/global.css
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts                 # base: /cube_scheduler/
```

## 동작 원리

### 데이터 흐름

```
컴포넌트 / 훅
  ↓ storage.loadData(key) / saveData(key, data) / listKeys(prefix)
현재 StorageBackend  (src/lib/storage.ts)
  ├─ LocalStorageBackend  : 로그인 전, 또는 Firebase 미설정
  └─ FirestoreBackend     : 로그인 + 승인 후 → users/{uid}/store/{key}
```

- 모든 데이터는 **키-값 JSON** 이다. Firestore에서는 문서의 `json` 필드에 문자열로 저장한다.
- `FirestoreBackend` 는 사용자의 `store` 컬렉션 전체를 실시간 구독해 메모리에 들고 있으므로 다른 기기에서 고친 내용도 바로 반영된다. 저장은 키별로 600ms 디바운스 후 기록하고, 탭을 벗어나거나 닫을 때 즉시 flush 한다.
- 오프라인이면 Firestore 로컬 캐시에 쌓였다가 재접속 시 동기화된다.

| 키 | 내용 |
|----|------|
| `day-YYYY-MM-DD` | 그 날의 `DayData` (목표, 슬롯) |
| `activities` | `Activity[]` 팔레트 |
| `routines-weekly` | 요일별 `Routine[]` |
| `tickets` | 칸반 `Ticket[]` 전체 |
| `habits`, `habit-checks-YYYY-MM-DD` | 습관 목록, 날짜별 체크 |

### 인증 / 승인

```
onAuthStateChanged
  ├─ 로그아웃  → 로그인 화면 (localStorage 백엔드)
  └─ 로그인    → members/{uid} 문서 구독
        ├─ 문서 없음        → status 'pending' 으로 생성 (관리자 이메일이면 'approved')
        ├─ status pending   → "승인 대기 중" 화면
        └─ status approved  → FirestoreBackend 활성화 → 앱 표시
```

관리자는 이메일로 판별하며 `src/lib/firebaseConfig.ts` 의 `ADMIN_EMAIL` 과 `firestore.rules` 두 곳에 같은 값을 둔다. 보안 규칙은 다음을 강제한다.

- 본인은 자기 `members` 문서를 `pending` 으로 한 번만 만들 수 있다.
- 승인·해제·삭제와 전체 목록 조회는 관리자만.
- `users/{uid}/store/**` 는 본인이면서 `approved` 인 경우에만 읽고 쓸 수 있다 (관리자는 항상).

### 데이터 모델

```ts
interface TimeSlot {            // 10분 슬롯
  label: string                 // 활동 이름
  color: string
  detail?: string
  ticketId?: string             // 칸반 티켓 연결
  record?: SlotRecord           // 제목 / 설명 / 활동별 세부 항목
}
interface DayData { date: string; goal: string; slots: Record<number, TimeSlot> }  // key: 0~1430

interface Ticket {
  id: string; title: string; description: string; why: string
  activityId: string
  status: 'todo' | 'progress' | 'done'
  activityFields: ActivitySpecificFields  // exercise | algorithm | general
  order: number; createdAt: string; updatedAt: string
}

interface Routine { id: string; name: string; color: string; startMin: number; endMin: number }
type WeeklyRoutines = Record<'weekday' | 'weekend' | DayOfWeek, Routine[]>
```

### 화면 구성

- **데스크톱**: 상단 헤더(로고, 탭, 시계, 계정) + 스케줄 페이지는 방 카드 사이드 / 메인 2열.
- **태블릿 (≤1023px)**: 한 열. 방 카드는 가로형.
- **모바일 (≤719px)**: 하단 탭바. 타임테이블과 루틴 편집기는 가로 스크롤(처음 열면 현재 시각 위치), 칸반은 컬럼 단위 스냅 스크롤, 모달은 바텀 시트.
- 타임테이블·루틴 편집·티켓 찢기는 포인터 이벤트로 구현되어 마우스와 터치를 모두 지원한다.

## 테마

- 배경 `#56423f` 다크 브라운, 포인트 `#e8a87c`. 토큰은 `global.css` 의 `:root` 에 있다.
- 타임테이블·칸반·모달은 흰 배경 카드로 대비를 준다 (해당 영역에서 CSS 변수를 로컬로 덮어씀).
- 칸반 티켓은 크림색 기차표. Progress 상태는 스텁이 살짝 흔들리고, Done 은 스텁이 떼어진 모양이다.

## 로드맵

- 메모 / 일기 페이지
- 지인만 가입할 수 있는 초대 링크
- PWA (홈 화면 추가, 오프라인 실행)
