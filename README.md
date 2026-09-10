# Cube Scheduler

하루를 10분 단위로 칠해서 기록하는 개인 스케줄러. 24시간 타임테이블에 활동을 드래그로 칠하고, 기차표 모양의 칸반 티켓으로 할 일을 관리하고, 요일별 루틴과 습관을 추적한다.

- **사이트**: https://doyoungkim-code.github.io/cube_scheduler/
- **동기화**: Google 계정으로 로그인하면 어느 기기에서든 같은 데이터를 본다 (Firebase Firestore).
- **접근 제한**: 승인제. 로그인한 사용자는 관리자가 승인해야 쓸 수 있고, 각자 자기 데이터만 본다.
- **지원 환경**: 데스크톱·태블릿·모바일 브라우저. 타임테이블은 터치 드래그로도 칠할 수 있다.

## 주요 기능

### 스케줄 (홈)
- **PC 3열 대시보드**: 왼쪽 방 카드·오늘 활동 요약·오늘의 습관 / 가운데 날짜 바·주간 스트립·팔레트·타임테이블·현재 시간대·빠른 메모 / 오른쪽 칸반. 화면 높이를 채우고 열마다 따로 스크롤된다.
- **타임테이블 (PC)**: 144개(10분 단위) 블록을 가로로. 팔레트에서 활동을 고르고 드래그하면 그 구간이 칠해진다. 드래그 중 3시간 확대 뷰가 떠서 정확히 조절할 수 있다.
- **세로 타임라인 (모바일)**: 캘린더 일간 뷰처럼 시간이 위에서 아래로 흐른다. 위아래로 드래그해 칠하고, 구간을 탭하면 기록을 적는다. 가로 스크롤이 없고, 현재 시각이 화면 밖이면 "지금" 버튼이 뜬다.
- **주간 스트립**: 이번 주 7일의 타임라인을 가는 색 막대로 압축해 보여 주고, 누르면 그 날로 이동한다.
- **현재 시간대 / 시간 상세**: 지금 시각이 속한 시간대의 기록을 카드로 보여 준다. 블록을 클릭하면 그 시간의 상세 패널이 열리고, 카드를 누르면 제목·내용·활동별 세부 항목(운동 종류/거리/시간, 알고리즘 문제번호/풀이시간/링크)을 적을 수 있다.
- **활동 팔레트**: 활동 이름과 색을 자유롭게 추가·편집. 현재 활동에 따라 왼쪽 방 이미지가 바뀐다 (알고리즘, 프로젝트, 운동, 식사, 영어 공부, 수면 등).
- **날짜 이동**: 화살표로 하루씩, 달력으로 원하는 날짜로. 기록이 있는 날은 달력에 점이 찍힌다.
- **실행 취소**: Ctrl+Z (최근 50단계). 슬롯뿐 아니라 루틴·팔레트·티켓·습관 편집도 되돌린다.

### 칸반 보드
- To Do / Progress / Done 세 컬럼. 티켓에는 제목, 상세, 왜 하는지(Why), 활동 유형, 활동별 세부 항목이 들어간다.
- PC에서는 드래그앤드롭으로 컬럼 간 이동. Progress 티켓은 오른쪽 스텁을 옆으로 당기면 찢어지면서 Done으로 넘어간다.
- 넓은 화면에서는 오른쪽 열에 세로로 쌓이고, 모바일에서는 탭으로 컬럼을 전환하며 카드의 이동 버튼(`Progress →`, `Done →`)으로 옮긴다.
- Progress 티켓을 타임테이블의 같은 활동 구간 위에 놓으면 그 구간에 티켓 내용이 기록으로 연결된다.

### 대시보드
- 하루 일과 / 주간 현황 리포트. 타임라인 바, 활동별 합계, 기록 목록.
- **클립보드 복사**: 인라인 스타일이 포함된 HTML로 복사되어 Tistory, Notion, Velog 등의 HTML 편집기에 그대로 붙여넣을 수 있다.

### 습관
- **요일별 루틴**: 평일/주말 템플릿과 월~일 각각의 루틴을 미니 타임테이블에 칠한다. 루틴은 직접 칠하지 않은 빈 시간에만 반투명 사선으로 표시된다.
- **루틴 이행률**: 지난 4주 동안 루틴대로 실제 기록한 비율을 요일별로 보여 준다.
- **체크리스트 습관**: 매일 체크하는 습관 목록과 연속 달성 일수.

### 메모
- 날짜별 빠른 메모. 홈 화면의 메모 위젯과 메모 페이지가 같은 내용을 편집하며, 입력 후 자동 저장된다. 메모 페이지에는 최근 30일 목록이 있다.

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
npm test           # 유닛 테스트 (Vitest, src/**/*.test.ts)
npm run lint       # ESLint (typescript-eslint + react-hooks)
npm run dev:local  # Firebase 없이 로컬 모드로 (운영 DB 안 건드림). ?demo=1 을 붙이면 데모 데이터
```

주소에 `?view=habit-tracker` 처럼 붙이면 그 화면으로 열린다 (`scheduler` · `pattern-analysis` · `habit-tracker` · `quick-memo` · `settings`).

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

외부 라이브러리는 `firebase`, `uuid`, `zustand`, `zod` 네 개뿐이다.

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
│   │   ├── storage.ts             # 키-값 저장소 추상화 (localStorage / Firestore) + subscribe
│   │   ├── day.ts                 # 하루 구간 연산 (칠하기/기록/펼치기), v1→v2 변환 순수 함수
│   │   ├── kanban.ts              # 칸반 이동·정렬 순수 함수
│   │   ├── schema.ts              # 저장 문서 zod 스키마 (가져오기 검증)
│   │   ├── dragState.ts           # HTML5 드래그 중 공유 상태 (티켓 → 타임테이블 드롭)
│   │   └── slots.ts               # 슬롯 그룹핑·요약·날짜 키 공용 헬퍼
│   ├── components/
│   │   ├── AppHeader.tsx          # 상단 헤더 + 모바일 하단 탭바
│   │   ├── RoomCard.tsx           # 방 이미지 + 시계 카드
│   │   ├── TimeTable.tsx          # 가로 타임테이블 (PC: 드래그 페인트, 확대 뷰, 현재 시간대)
│   │   ├── TimelineVertical.tsx   # 세로 타임라인 (모바일)
│   │   ├── TodaySummary.tsx       # 활동별 누적 시간 위젯
│   │   ├── WeekStrip.tsx          # 이번 주 미니 스트립
│   │   ├── QuickMemo.tsx          # 날짜별 빠른 메모 (자동 저장)
│   │   ├── HourDetail.tsx         # 시간 상세 패널
│   │   ├── ActivityPalette.tsx    # 활동 팔레트
│   │   ├── Calendar.tsx           # 달력
│   │   ├── KanbanBoard/Column/Card.tsx   # 칸반 보드
│   │   ├── TicketModal.tsx        # 티켓 / 기록 편집 모달
│   │   ├── SlotRecordModal.tsx    # 타임라인 구간 → 기록 편집 (TicketModal 재사용)
│   │   ├── SlotGroupCard.tsx      # 구간 카드 (현재 시간대 / 시간 상세 공용)
│   │   ├── TicketActivityFields.tsx      # 활동별 세부 항목 폼
│   │   ├── MiniRoutineTimeTable.tsx      # 루틴 편집용 미니 타임테이블
│   │   ├── RoutineAdherence.tsx   # 루틴 이행률
│   │   ├── HabitChecklist.tsx     # 체크리스트 습관
│   │   ├── ViewShell.tsx          # 서브 페이지 공통 래퍼
│   │   └── Icon.tsx               # 내비게이션 SVG 아이콘
│   ├── pages/
│   │   ├── PatternAnalysisView.tsx  # 대시보드
│   │   ├── HabitTrackerView.tsx     # 습관
│   │   ├── QuickMemoView.tsx        # 메모 (편집기 + 최근 목록)
│   │   └── SettingsView.tsx         # 설정
│   ├── store/
│   │   ├── index.ts               # Zustand 문서 캐시: useDoc / useDocs / writeDoc / undo, storage 구독
│   │   └── migrations.ts          # 팔레트 로드 후 v1 문서를 v2 로 1회 변환
│   ├── hooks/
│   │   ├── useDayData.ts          # 날짜별 데이터 + 루틴 병합, 활동 팔레트, 요일별 루틴
│   │   ├── useKanbanData.ts       # 칸반 티켓 CRUD
│   │   ├── useHabits.ts           # 습관 목록, 날짜별 체크, 스트릭
│   │   ├── useMemoDoc.ts          # 날짜별 메모
│   │   ├── useNow.ts              # 현재 시각 (초 / 분 단위)
│   │   └── useMediaQuery.ts       # 반응형 분기 (모바일 / 넓은 화면)
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
컴포넌트
  ↓ useDoc(key) / useDocs(keys) / writeDoc(key, data)      (src/store)
Zustand 문서 캐시  docs: { key → JSON }
  ↓ storage.loadData / saveData            ↑ storage.subscribe (다른 기기·탭의 변경)
현재 StorageBackend  (src/lib/storage.ts)
  ├─ LocalStorageBackend  : 로그인 전, 또는 Firebase 미설정
  └─ FirestoreBackend     : 로그인 + 승인 후 → users/{uid}/store/{key}
```

- 모든 데이터는 **키-값 JSON** 이다. Firestore에서는 문서의 `json` 필드에 문자열로 저장한다.
- 화면 상태는 **스토어 한 벌**이다. 같은 키를 보는 컴포넌트가 몇 개든(홈의 습관 위젯과 습관 페이지 등) 같은 값을 보고, 한 곳의 편집이 즉시 다른 곳에 반영된다.
- `FirestoreBackend` 는 사용자의 `store` 컬렉션 전체를 실시간 구독한다. 다른 기기에서 고친 내용은 `storage.subscribe` 를 통해 스토어에 들어와 **새로고침 없이** 화면에 반영된다. 저장은 키별로 600ms 디바운스 후 기록하고, 탭을 벗어나거나 닫을 때 즉시 flush 하며, 실패하면 5초 뒤 재시도한다.
- 실행 취소(Ctrl+Z)는 "키의 이전 값"을 되돌리는 방식이라 슬롯·루틴·팔레트·티켓·습관 모두에 적용된다.
- 오프라인이면 Firestore 로컬 캐시에 쌓였다가 재접속 시 동기화된다.

| 키 | 내용 |
|----|------|
| `day-YYYY-MM-DD` | 그 날의 `DayData` (목표, 구간 리스트) |
| `activities` | `Activity[]` 팔레트 (보관된 활동 포함) |
| `routines-weekly` | 요일별 `Routine[]` |
| `tickets` | 칸반 `Ticket[]` 전체 |
| `habits`, `habit-checks-YYYY-MM-DD` | 습관 목록, 날짜별 체크 |
| `memo-YYYY-MM-DD` | 날짜별 메모 `{ text, updatedAt }` |

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
- `users/{uid}/store/**` 는 본인이면서 `approved` 인 경우에만 읽고 쓸 수 있다. 관리자도 남의 데이터는 볼 수 없다.
- 저장 문서는 `{ json: string, updatedAt }` 모양만 허용하고 `json` 은 900KB 까지.

> 규칙을 바꾼 뒤에는 콘솔에 다시 붙여넣어 게시해야 한다. 저장소의 `firestore.rules` 와 콘솔이 어긋나면 UI 는 열리는데 쓰기가 전부 거부되는 식으로 조용히 깨진다.

### 데이터 모델

```ts
interface Activity { id: string; name: string; color: string; order: number; archived?: boolean }
// 팔레트에서 지운 활동은 삭제하지 않고 archived 로 숨긴다 (과거 기록이 id 로 참조하므로)

interface DaySegment { start: number; end: number; activityId: string; record?: SlotRecord }  // [start, end) 분, 10분 정렬
interface DayData { v: 2; date: string; goal: string; segments: DaySegment[] }            // 저장 형식
interface SlotRecord { title: string; description: string; activityFields?: ActivitySpecificFields }

// 화면은 segments 를 펼친 10분 슬롯 맵(TimeSlot: activityId + 활동에서 조회한 label/color)을 받는다.
// 활동 이름·색을 바꾸면 과거 기록도 함께 바뀐다.

interface Ticket {
  id: string; seq?: number      // seq: 표시용 고정 번호 (T12). 삭제돼도 밀리지 않는다
  title: string; description: string; why: string
  activityId: string
  status: 'todo' | 'progress' | 'done'
  activityFields: ActivitySpecificFields  // exercise | algorithm | general
  order: number; createdAt: string; updatedAt: string
}

interface Routine { id: string; activityId: string; startMin: number; endMin: number }
type WeeklyRoutines = Record<'weekday' | 'weekend' | DayOfWeek, Routine[]>
```

**마이그레이션**: 예전 형식(v1: `slots` 맵에 활동 이름·색 문자열, 루틴에 `name/color`)은 앱을 열면 활동 팔레트가 로드된 뒤 자동으로 v2 로 변환된다(`src/store/migrations.ts`). 팔레트에 없는 이름은 그 이름·색으로 보관(archived) 활동을 만들어 참조를 잇는다. 변환 전 문서도 화면에는 그대로 보인다. 백업 가져오기는 `src/lib/schema.ts` 의 zod 스키마로 검증하고 통과한 문서만 반영한다.

### 화면 구성

| 폭 | 구성 |
|----|------|
| ≥1280px | 3열: 위젯(방 카드, 오늘 요약, 습관) / 타임테이블·현재 시간대·메모 / 칸반 세로 스택. 화면 높이를 채우고 열마다 독립 스크롤 |
| 1024–1279px | 2열: 위젯 / 가운데(칸반은 가운데 열 아래 가로 3컬럼) |
| 720–1023px | 1열. 방 카드는 가로형 |
| ≤719px | 1열 + 하단 탭바. 세로 타임라인, 칸반 탭, 바텀 시트 모달. 가로 스크롤 요소 없음 |

타임테이블·세로 타임라인·루틴 편집·티켓 찢기는 포인터 이벤트로 구현되어 마우스와 터치를 모두 지원한다.

## 테마

- "종이 스튜디오": 크림 바탕 `#f4efe7`, 카드 `#fbf8f2`, 글자 `#2b211e`, 포인트 `#c9713f`. 토큰은 `global.css` 의 `:root` 에만 있고 컴포넌트는 토큰만 쓴다.
- 카드는 배경에 녹이고 활동색과 타이포 위계로 구분한다. 팔레트 칩은 활동색 아웃라인, 선택하면 채워진다.
- 칸반 티켓은 종이색 기차표. Progress 상태는 스텁이 살짝 흔들리고, Done 은 스텁이 떼어진 모양이다.
- 시안과 탈락안은 `design/` 에 있다 (`node design/build-mockups.mjs` 로 재생성).

## 로드맵

- 지인만 가입할 수 있는 초대 링크
- PWA (홈 화면 추가, 오프라인 실행)
