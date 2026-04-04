# Scheduler

개인용 데스크톱 일정 관리 앱. 24시간 타임테이블(144개 10분 블록)에 활동을 드래그로 칠하여 하루 일과를 기록하고, Jira 스타일 칸반보드로 업무를 관리한다.

## UI 구조
<img width="2419" height="1561" alt="스크린샷 2026-04-04 225740" src="https://github.com/user-attachments/assets/111e0a02-d642-498f-818d-cebf9149f210" />

### 메인 화면 (스케줄러)
- **왼쪽 패널**: 현재 활동에 따라 방 픽셀아트 이미지가 자동 전환 + 네비게이션 아이콘
- **오른쪽 상단**: 팔레트, 타임테이블, 현재 시간대 기록
- **오른쪽 하단**: 칸반보드 (Todo / Progress / Done)
- 접기 버튼(◀)으로 왼쪽 패널만 표시 가능 (창 크기 연동)

### 네비게이션 아이콘 (왼쪽 패널 하단)
방 이미지 아래에 아이콘 버튼으로 다른 뷰에 접근:
- 📊 **대시보드** — 하루/주간 활동 리포트, HTML 내보내기
- ✅ **습관 트래커** — (예정)
- 📝 **퀵 메모** — (예정)
- ⚙️ **환경설정** — (예정)

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
│   ├── main.ts          # Electron 메인 프로세스 (BrowserWindow, IPC, 클립보드)
│   ├── preload.ts       # contextBridge로 렌더러에 API 노출
│   └── store.ts         # JSON 파일 기반 로컬 스토리지
├── src/
│   ├── App.tsx           # 루트 컴포넌트. 뷰 스위처 + 스케줄러 메인 화면
│   ├── main.tsx          # React 엔트리포인트
│   ├── components/
│   │   ├── TimeTable.tsx          # 144블록 메인 타임테이블. 드래그 페인트, 줌 뷰
│   │   ├── ActivityPalette.tsx    # 활동 팔레트 칩. 클릭 선택, 우클릭 편집
│   │   ├── RoutineEditor.tsx      # 루틴 편집 모달. 미니 타임테이블로 드래그 페인트
│   │   ├── Calendar.tsx           # 월간 달력 모달
│   │   ├── HourDetail.tsx         # 시간 블록 클릭 시 상세 패널 (모달 편집)
│   │   ├── KanbanBoard.tsx        # 칸반보드 컨테이너. 3컬럼 + 티켓 CRUD
│   │   ├── KanbanColumn.tsx       # 칸반 컬럼 (드롭 타겟)
│   │   ├── KanbanCard.tsx         # 기차표 스타일 드래그 가능 티켓 카드
│   │   ├── TicketModal.tsx        # 티켓 생성/편집 모달
│   │   ├── TicketActivityFields.tsx # 활동별 조건부 세부 필드 (운동/알고리즘)
│   │   ├── ViewShell.tsx          # 서브 뷰 공통 래퍼 (돌아가기 버튼 + 제목)
│   │   └── MenuCard.tsx           # 홈 메뉴 카드 (미사용, 예비)
│   ├── pages/
│   │   ├── PatternAnalysisView.tsx # 대시보드: 일간/주간 리포트 + HTML 내보내기
│   │   ├── HabitTrackerView.tsx    # 습관 트래커 (예정)
│   │   ├── QuickMemoView.tsx       # 퀵 메모 / 일기 (예정)
│   │   └── SettingsView.tsx        # 환경설정 (예정)
│   ├── hooks/
│   │   ├── useDayData.ts    # 날짜별 데이터 CRUD 훅. 루틴 자동 병합, 자동 저장
│   │   └── useKanbanData.ts # 칸반 티켓 CRUD 훅. dirty flag 자동 저장
│   ├── types/
│   │   ├── schedule.ts    # 타임테이블 타입 (TimeSlot, SlotRecord, DayData, Routine, Activity)
│   │   ├── kanban.ts      # 칸반 타입 (Ticket, KanbanStatus, ActivitySpecificFields)
│   │   ├── navigation.ts  # 뷰 네비게이션 타입 (ViewId)
│   │   └── electron.d.ts  # window.electronAPI 타입 선언
│   └── styles/
│       └── global.css     # 전역 스타일 (다크 브라운 테마, 기차표 티켓 CSS)
├── public/
│   ├── room.png ~ room_sleep.png  # 활동별 방 픽셀아트 이미지 (9종)
│   └── icon.ico                   # 앱 아이콘
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
// 타임라인 기록 (슬롯에 저장되는 상세 정보)
interface SlotRecord {
  title: string
  description: string
  activityFields?: ActivitySpecificFields
}

// 10분 슬롯 하나
interface TimeSlot {
  label: string        // 활동 이름 (예: "알고리즘")
  color: string        // 색상 코드 (예: "#e8a87c")
  detail?: string      // 세부 메모
  ticketId?: string    // 칸반 티켓 드래그 연결 시 참조용
  record?: SlotRecord  // 타임라인 기록 (칸반과 별개)
}

// 하루 데이터
interface DayData {
  date: string                    // "2026-03-24"
  goal: string                    // 오늘의 목표
  slots: Record<number, TimeSlot> // key: 분(0~1430, 10 단위), 총 144칸
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
3. **드래그 완료 시 활동 선택 자동 해제** → 현재 시간대 패널로 전환
4. 지우개 선택 후 드래그 → 슬롯 삭제
5. 드래그 중 아래에 줌 뷰(3시간 확대)로 정밀 조작

### 타임라인 기록 (칸반과 독립)
- 현재 시간대 / 시간 블록 클릭 시 기록 카드 표시
- **카드 클릭 → TicketModal이 모달로 열림** (제목, 상세, 활동별 필드 편집)
- 저장 시 슬롯의 `record` 필드에 저장 (칸반보드에는 추가되지 않음)
- 활동 유형에 따라 자동으로 세부 필드 표시 (운동: 종류/km/분, 알고리즘: 문제번호/시간/링크)
- 루틴은 현재 시간대/시간 상세 패널에서 표시되지 않음

### 칸반보드 (Jira 스타일)
- **3컬럼**: Todo / Progress / Done
- **티켓 생성**: `+ 티켓 추가` 버튼 → 모달에서 제목, 상세, 활동 유형, Why 입력
- **드래그앤드롭**: HTML5 DnD API로 컬럼 간 이동, 순서 변경
- **기차표 비주얼**: 왼쪽 본문(활동 컬러 헤더바) + 세로 절취선 + 오른쪽 컬러 스텁 + 톱니 가장자리

### 바코드 뜯기 (Progress → Done)
- Progress 티켓의 오른쪽 스텁을 **오른쪽으로 드래그** → 50px 이상 당기면 뜯어짐
- 자동으로 Done 컬럼으로 이동
- **상태별 비주얼**:
  - Todo: 깔끔한 기차표
  - Progress: 스텁이 살짝 흔들림 (뜯을랑 말랑 애니메이션)
  - Done: 스텁 제거 + 찢긴 가장자리 표시 + 투명도 65%

### 칸반 → 타임테이블 연동
- **Progress 티켓**을 타임테이블의 **이미 같은 활동으로 칠해진 슬롯** 위로 드래그앤드롭
- 해당 연속 구간 전체에 `ticketId`가 연결됨
- 타임라인에서 삭제해도 칸반에는 영향 없음 (독립적)

### 대시보드 (일간/주간 리포트)
- 왼쪽 패널 📊 아이콘으로 진입
- **하루 일과**: 타임라인 바 + 활동별 시간 요약 + 기록 제목별 상세 (루틴 제외)
- **주간 현황**: 월~일 7일 타임라인 + 주간 합산 활동별 시간 (제목 기반 그룹핑)
- **날짜 선택**: date input으로 원하는 날짜/주 선택 가능
- **타임라인 hover**: 마우스 올리면 `00:30 ~ 03:20 알고리즘 스터디` 형태로 연속 구간 범위 표시
- **HTML 클립보드 복사**: 인라인 스타일이 포함된 HTML 소스코드를 텍스트로 복사 → 블로그 HTML 편집기에 붙여넣기
  - tooltip CSS(`<style>` 블록)도 포함하여 블로그에서도 hover 동작
  - 첫 복사 시 Tistory/블로그 붙여넣기 튜토리얼 모달 표시
  - 하단에 Cube Scheduler GitHub 링크 포함

### 루틴 시스템
- 루틴은 사용자가 직접 칠하지 않은 빈 슬롯에만 자동 적용 (수동 입력 우선)
- 타임테이블에서 반투명 + 사선 패턴으로 구분 표시
- 현재 시간대 패널, 대시보드에서는 루틴 미표시

### 방 이미지 연동
- 현재 시간의 활동명으로 `ROOM_MAP` 조회 → 매칭되는 이미지로 왼쪽 패널 변경
- 다른 날짜를 보고 있어도 오늘 데이터 기준으로 이미지 결정

## IPC 통신

```
렌더러 (React)
  ↓ window.electronAPI
Preload (contextBridge)
  ↓ ipcRenderer.invoke
메인 프로세스 (ipcMain.handle)
  ↓
Store / clipboard
```

| 채널 | 용도 |
|------|------|
| `store:load` | 키로 JSON 데이터 로드 |
| `store:save` | 키로 JSON 데이터 저장 |
| `store:listKeys` | 접두사로 키 목록 조회 (달력 점 표시용) |
| `window:toggle-collapse` | 창 크기 토글 |
| `notification:show` | 시스템 알림 표시 |
| `clipboard:writeHtml` | HTML + 텍스트를 클립보드에 복사 |

## UI 테마

- 전체 배경: `#56423f` (다크 브라운)
- 타임테이블/칸반 영역: 흰색 배경 (CSS 변수 로컬 오버라이드)
- 칸반 티켓: `#f5f0e6` (크림) + 활동 컬러 헤더/스텁
- 대시보드 리포트 카드: `#f5f0e6` 배경 + `#56423f` 헤더
- 모달: 흰색 배경
- 프레임리스 윈도우 + `titleBarOverlay`
- 창 크기: 1400×900

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
- **`npx electron .` 실행 불가**: `require("electron")`이 경로 문자열을 반환하는 환경 문제. 패키지된 exe로 실행
- **exe 잠금**: Scheduler.exe 실행 중 재빌드 시 `taskkill //IM "Scheduler.exe" //F` 후 재시도
