# Scheduler

개인용 데스크톱 일정 관리 앱. 24시간 타임테이블(144개 10분 블록)에 활동을 드래그로 칠하여 하루 일과를 기록하고, Jira 스타일 칸반보드로 업무를 관리한다.

## UI 구조

<img width="2613" height="815" alt="image" src="https://github.com/user-attachments/assets/c23b57a3-7c9a-4715-97ce-6f8e19f4145e" />

- 왼쪽 패널: 현재 활동에 따라 방 픽셀아트 이미지가 자동 전환
- 오른쪽 상단: 팔레트, 타임테이블, 현재 태스크
- 오른쪽 하단: 칸반보드 (Todo / Progress / Done)
- 접기 버튼(◀)으로 왼쪽 패널만 표시 가능 (창 크기 연동)

## 기술 스택

| 영역 | 기술 |
|------|------|
| 런타임 | Electron 33 |
| 프론트엔드 | React 19 + TypeScript 5 |
| 빌드 | Vite 6 (프론트) + esbuild (Electron) |
| 패키징 | electron-builder (Windows `dir` 타겟) |
| 데이터 저장 | 로컬 JSON 파일 (`%APPDATA%/scheduler-data/`) |

## 프로젝트 구조

```
scheduler/
├── electron/
│   ├── main.ts          # Electron 메인 프로세스 (BrowserWindow, IPC, 창 크기 토글)
│   ├── preload.ts       # contextBridge로 렌더러에 API 노출
│   └── store.ts         # JSON 파일 기반 로컬 스토리지
├── src/
│   ├── App.tsx           # 루트 컴포넌트. 상하 분할 레이아웃 (타임테이블 + 칸반)
│   ├── main.tsx          # React 엔트리포인트
│   ├── components/
│   │   ├── TimeTable.tsx          # 144블록 메인 타임테이블. 드래그 페인트, 줌 뷰, 현재 태스크
│   │   ├── ActivityPalette.tsx    # 활동 팔레트 칩. 클릭 선택, 우클릭 편집, 인라인 추가
│   │   ├── RoutineEditor.tsx      # 루틴 편집 모달. 미니 타임테이블로 드래그 페인트
│   │   ├── Calendar.tsx           # 월간 달력 모달. 데이터 있는 날짜에 점 표시
│   │   ├── HourDetail.tsx         # 시간 블록 클릭 시 상세 패널 (티켓 스타일)
│   │   ├── KanbanBoard.tsx        # 칸반보드 컨테이너. 3컬럼 + 티켓 CRUD
│   │   ├── KanbanColumn.tsx       # 칸반 컬럼 (드롭 타겟, 드롭 인디케이터)
│   │   ├── KanbanCard.tsx         # 기차표 스타일 드래그 가능 티켓 카드
│   │   ├── TicketModal.tsx        # 티켓 생성/편집 모달
│   │   ├── TicketActivityFields.tsx # 활동별 조건부 세부 필드 (운동/알고리즘)
│   │   ├── DayInfo.tsx            # 날짜 정보 컴포넌트 (예비)
│   │   └── CurrentTime.tsx        # 실시간 시계 컴포넌트 (예비)
│   ├── hooks/
│   │   ├── useDayData.ts    # 날짜별 데이터 CRUD 훅. 루틴 자동 병합, 자동 저장
│   │   └── useKanbanData.ts # 칸반 티켓 CRUD 훅. dirty flag 자동 저장
│   ├── types/
│   │   ├── schedule.ts    # 타임테이블 타입 (TimeSlot, DayData, Routine, Activity)
│   │   ├── kanban.ts      # 칸반 타입 (Ticket, KanbanStatus, ActivitySpecificFields)
│   │   └── electron.d.ts  # window.electronAPI 타입 선언
│   └── styles/
│       └── global.css     # 전역 스타일 (다크 브라운 테마, 기차표 티켓 CSS)
├── public/
│   ├── room.png           # 기본 방 이미지 (활동 없을 때)
│   ├── room_algo.png      # 알고리즘
│   ├── room_coding.png    # 프로젝트
│   ├── room_coffee.png    # 커피, 음악, 독서
│   ├── room_diary.png     # 기록
│   ├── room_eat.png       # 식사
│   ├── room_english.png   # 영어 공부
│   ├── room_exercise.png  # 운동
│   ├── room_outside.png   # 샤워
│   └── room_sleep.png     # 수면
├── scripts/
│   ├── build-electron.js  # esbuild로 electron/ → dist-electron/ 빌드
│   └── apply-icon.js      # rcedit로 exe에 아이콘 적용
├── package.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

## 데이터 모델

### 타임테이블

```typescript
// 10분 슬롯 하나
interface TimeSlot {
  label: string        // 활동 이름 (예: "알고리즘")
  color: string        // 색상 코드 (예: "#e8a87c")
  detail?: string      // 세부 메모
  ticketId?: string    // 연결된 칸반 티켓 ID
}

// 하루 데이터
interface DayData {
  date: string                    // "2026-03-24"
  goal: string                    // 오늘의 목표
  slots: Record<number, TimeSlot> // key: 분(0~1430, 10 단위), 총 144칸
}

// 루틴 (빈 슬롯에 자동 채워짐)
interface Routine {
  id: string
  name: string
  color: string
  startMin: number    // 시작 분 (예: 0)
  endMin: number      // 종료 분 (예: 420)
}

// 활동 (팔레트에 표시)
interface Activity {
  id: string
  name: string
  color: string
  order: number
}
```

### 칸반 티켓

```typescript
type KanbanStatus = 'todo' | 'progress' | 'done'

interface Ticket {
  id: string
  title: string             // 티켓 제목
  description: string       // 상세 내용
  why: string               // 이 일을 하는 이유
  activityId: string        // 연결된 활동 유형
  status: KanbanStatus
  activityFields: ActivitySpecificFields  // 활동별 세부 필드
  order: number
  createdAt: string
  updatedAt: string
}

// 활동별 세부 필드 (조건부)
// 운동: { exerciseType, km, minutes }
// 알고리즘: { problemNumber, solveTime, link }
// 기타: 없음
```

### 저장 파일

| 파일명 | 내용 |
|--------|------|
| `day-YYYY-MM-DD.json` | 해당 날짜의 DayData |
| `routines.json` | Routine[] (매일 반복) |
| `activities.json` | Activity[] (사용자 정의 팔레트) |
| `tickets.json` | Ticket[] (칸반 보드 전체, 날짜 무관) |

저장 위치: `%APPDATA%/scheduler-data/`

## 핵심 동작 방식

### 팔레트 선택 → 드래그 페인트
1. 팔레트에서 활동 칩 클릭 (선택 상태)
2. 타임테이블 위에서 마우스 드래그 → 선택된 활동으로 슬롯 채움
3. 지우개 선택 후 드래그 → 슬롯 삭제
4. 드래그 중 아래에 줌 뷰(3시간 확대)로 정밀 조작

마우스 위치 → 분 변환: `blocksRef.getBoundingClientRect()` + `Math.floor()`

### 칸반보드 (Jira 스타일)
- **3컬럼**: Todo / Progress / Done
- **티켓 생성**: `+ 티켓 추가` 버튼 → 모달에서 제목, 상세, 활동 유형, Why 입력
- **활동별 필드**: 운동(종류/km/분), 알고리즘(문제번호/풀이시간/링크) 자동 표시
- **드래그앤드롭**: HTML5 DnD API로 컬럼 간 이동, 순서 변경
- **기차표 비주얼**: 왼쪽 본문 + 세로 절취선 + 오른쪽 컬러 스텁 + 톱니 가장자리

### 티켓 → 타임테이블 연동
- **Progress 티켓**을 타임테이블의 **이미 같은 활동으로 칠해진 슬롯** 위로 드래그앤드롭
- 해당 연속 구간 전체에 `ticketId`가 연결됨
- 현재 시간대 / 시간 상세 패널에서 연결된 티켓의 전체 내용(제목, 상세, 활동별 필드, WHY) 표시

### 바코드 뜯기 (Progress → Done)
- Progress 티켓의 오른쪽 스텁(바코드 영역)을 **오른쪽으로 드래그**
- 절취선이 실시간으로 벌어지고, 50px 이상 당기면 스텁이 날아가며 뜯어짐
- 자동으로 Done 컬럼으로 이동
- **상태별 비주얼**:
  - Todo: 깔끔한 기차표
  - Progress: 스텁이 살짝 흔들림 (뜯을랑 말랑 애니메이션)
  - Done: 스텁 제거 + 찢긴 가장자리 표시 + 투명도 65%

### 태스크 그룹핑 (티켓 스타일)
- `groupAllSlots()`: 0~1440 전체 스캔하여 연속된 동일 활동을 하나의 그룹으로 묶음
- 시간 경계를 무시 (예: 04:00~08:30 수면 → 하나의 270분 그룹)
- 현재 시간대 패널: 루틴 제외, 수동 입력만 티켓 카드 형태로 표시
- 연결된 칸반 티켓이 있으면 티켓의 전체 내용을 표시

### 루틴 시스템
- 루틴은 사용자가 직접 칠하지 않은 빈 슬롯에만 자동 적용 (수동 입력 우선)
- 타임테이블에서 반투명 + 사선 패턴으로 구분 표시
- `useDayData` 훅의 `applyRoutines()`에서 병합
- 루틴 편집: 모달 내 미니 타임테이블에서 동일한 드래그 페인트 방식
- 현재 시간대 패널에서는 루틴 미표시

### 방 이미지 연동 (App.tsx의 ROOM_MAP)
- 현재 시간의 활동명으로 `ROOM_MAP` 조회 → 매칭되는 이미지로 왼쪽 패널 변경
- 오늘 날짜를 보고 있으면 `data.day.slots` 사용 (실시간 반영)
- 다른 날짜를 보고 있으면 별도의 `todayDataAux` 훅으로 오늘 데이터 참조

### 접기/펼치기
- 왼쪽 패널의 ◀ 버튼 → 오른쪽 타임테이블 영역 숨김
- IPC `window:toggle-collapse`로 Electron 창 크기도 연동 축소/복원

## IPC 통신

```
렌더러 (React)
  ↓ window.electronAPI.loadData / saveData / listDayKeys / toggleCollapse
Preload (contextBridge)
  ↓ ipcRenderer.invoke
메인 프로세스 (ipcMain.handle)
  ↓
Store (JSON 파일 읽기/쓰기)
```

| 채널 | 용도 |
|------|------|
| `store:load` | 키로 JSON 데이터 로드 |
| `store:save` | 키로 JSON 데이터 저장 |
| `store:listKeys` | 접두사로 키 목록 조회 (달력 점 표시용) |
| `window:toggle-collapse` | 창 크기 토글 |
| `notification:show` | 시스템 알림 표시 |

## UI 테마

- 전체 배경: `#56423f` (다크 브라운)
- 타임테이블/칸반 영역: 흰색 배경 (CSS 변수 로컬 오버라이드)
- 칸반 티켓: `#f5f0e6` (크림) + 활동 컬러 헤더/스텁
- 모달 (루틴 편집, 달력, 티켓): 흰색 배경
- 프레임리스 윈도우 + `titleBarOverlay` (최소화/최대화/닫기만 표시)
- 창 크기: 1400×900 (기존 1500×475에서 칸반보드 추가로 확대)

## 빌드 및 실행

```bash
# 의존성 설치
npm install

# 개발 모드 (Vite 서버 + Electron)
npm run dev

# 프로덕션 빌드
npm run build                  # dist/ + dist-electron/ 생성
npm run electron:build         # exe 패키징 + 아이콘 적용

# 결과: release/win-unpacked/Scheduler.exe
```

### 빌드 파이프라인
1. `vite build` → `dist/` (프론트엔드 번들)
2. `node scripts/build-electron.js` → `dist-electron/main.js`, `preload.js`
3. `electron-builder --win --config` → `release/win-unpacked/`
4. `node scripts/apply-icon.js` → exe에 아이콘 적용

### 알려진 빌드 이슈 (Windows)
- **winCodeSign symlink 에러**: `package.json`의 `"signAndEditExecutable": false`로 우회
- **Vite exit code 127**: bash 환경 아티팩트, 빌드 결과는 정상. `rm -rf dist` 후 재빌드 필요
- **`npx electron .` 실행 불가**: `require("electron")`이 경로 문자열을 반환하는 환경 문제. 패키지된 exe로 실행해야 함
- **exe 잠금**: Scheduler.exe 실행 중 재빌드 시 `taskkill //IM "Scheduler.exe" //F` 후 재시도
