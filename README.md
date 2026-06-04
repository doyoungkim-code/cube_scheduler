# Scheduler

개인용 데스크톱 일정 관리 앱. **3D 방(room) 안의 가구를 클릭해 각 기능에 진입**하는 인터페이스를 가진다.
책상 위 모니터를 클릭하면 24시간 타임테이블(144개 10분 블록)과 Jira 스타일 칸반보드가 열리고,
벽 차트·코르크보드·노트·서랍 등을 클릭해 대시보드·습관 트래커·메모·설정으로 이동한다.

> **UI 스크린샷**: 3D 방 전환 작업 중. 새 스크린샷으로 교체 예정.
> (기존 2D 픽셀아트 방 + 좌측 패널 UI는 폐기되었습니다.)

## UI 구조

### 메인 화면 = 3D 방

앱을 실행하면 풀스크린 3D 방이 렌더링된다(`<App>` → `<SceneRoot>`).
방 안의 가구에 마우스를 올리면 툴팁이 뜨고, 클릭하면 카메라가 해당 가구로 줌인되며
그 위에 기능 화면이 HTML 오버레이로 표시된다. ESC 또는 닫기 버튼으로 방으로 복귀한다.

| 가구 | 진입 기능 | 설명 |
|------|-----------|------|
| 🖥️ **모니터** | 스케줄러 | 타임테이블 + 칸반보드 (메인) |
| 📊 **벽 차트** | 대시보드 | 일간/주간 활동 리포트, HTML 내보내기 |
| 📌 **코르크보드** | 습관 트래커 | 요일별 루틴 설정 · 이행률 · 체크리스트 |
| 📓 **노트** | 퀵 메모 | 메모 / 일기 *(예정)* |
| 🗄️ **서랍** | 환경설정 | 앱 환경설정 *(예정)* |

가구 ↔ 기능 매핑, 카메라 포즈, 오버레이 위치는 모두
[`src/scene3d/config/furnitureRegistry.ts`](src/scene3d/config/furnitureRegistry.ts)에 정의되어 있다.

## 기술 스택

| 영역 | 기술 |
|------|------|
| 런타임 | Electron 33 |
| 프론트엔드 | React 19 + TypeScript 5 |
| 3D 렌더링 | Three.js + React Three Fiber + drei |
| 물리 / 포스트프로세싱 | @react-three/rapier · @react-three/postprocessing |
| 상태관리 | Zustand |
| 빌드 | Vite 6 (프론트) + esbuild (Electron) |
| 패키징 | electron-builder (Windows `dir` 타겟) |
| 데이터 저장 | 로컬 JSON 파일 (`%APPDATA%/scheduler-data/`) |

## 프로젝트 구조

```
scheduler/
├── electron/
│   ├── main.ts          # Electron 메인 프로세스 (BrowserWindow, IPC, 알림, 클립보드)
│   ├── preload.ts       # contextBridge로 렌더러에 window.electronAPI 노출
│   └── store.ts         # JSON 파일 기반 로컬 스토리지 (원자적 tmp→rename 쓰기)
├── src/
│   ├── App.tsx           # 루트 컴포넌트 (SceneRoot만 렌더)
│   ├── main.tsx          # React 엔트리포인트
│   ├── scene3d/          # ▼ 3D 방 씬 (내비게이션의 핵심)
│   │   ├── SceneRoot.tsx       # Canvas + Stage + CameraRig + Effects + FocusOverlay
│   │   ├── Stage.tsx           # 방·가구·캐릭터·조명·물리 소품 배치
│   │   ├── CameraRig.tsx       # focus 상태에 따라 카메라 줌인/복귀 애니메이션
│   │   ├── config/
│   │   │   └── furnitureRegistry.ts  # 가구↔기능 매핑, 카메라 포즈, 오버레이 좌표
│   │   ├── interaction/
│   │   │   ├── useFocusStore.ts      # zustand: hoveredId / focusedId
│   │   │   ├── FocusOverlay.tsx      # 포커스된 가구 위에 기능 화면 오버레이
│   │   │   ├── HoverTooltip.tsx      # 가구 hover 툴팁
│   │   │   └── InteractiveFurniture.tsx (furniture/)  # 클릭/hover 래퍼
│   │   ├── surfaces/
│   │   │   └── SchedulerSurface.tsx  # 모니터 오버레이 = 타임테이블+칸반 화면
│   │   ├── furniture/    # Desk, Chair, Monitor, Corkboard, WallChart, Notebook, Drawer
│   │   ├── environment/  # Room, Window, Decor
│   │   ├── characters/   # Characters.tsx (GLB 모델 로드, public/models/)
│   │   ├── lighting/     # LightingRig.tsx
│   │   ├── physics/      # PhysicsProps.tsx (rapier)
│   │   └── postprocessing/ # Effects.tsx
│   ├── components/
│   │   ├── TimeTable.tsx          # 144블록 메인 타임테이블. 드래그 페인트, 줌 뷰
│   │   ├── ActivityPalette.tsx    # 활동 팔레트 칩. 클릭 선택, 우클릭 편집
│   │   ├── MiniRoutineTimeTable.tsx # 습관 트래커용 미니 타임테이블 (루틴 페인트)
│   │   ├── Calendar.tsx           # 월간 달력 모달
│   │   ├── HourDetail.tsx         # 시간 블록 클릭 시 상세 패널
│   │   ├── KanbanBoard.tsx        # 칸반보드 컨테이너. 3컬럼 + 티켓 CRUD
│   │   ├── KanbanColumn.tsx       # 칸반 컬럼 (드롭 타겟)
│   │   ├── KanbanCard.tsx         # 기차표 스타일 드래그 가능 티켓 카드
│   │   ├── TicketModal.tsx        # 티켓 생성/편집 모달
│   │   ├── TicketActivityFields.tsx # 활동별 조건부 세부 필드 (운동/알고리즘)
│   │   ├── RoutineAdherence.tsx   # 루틴 이행률 표시
│   │   ├── HabitChecklist.tsx     # 체크리스트형 습관 관리
│   │   └── ViewShell.tsx          # 서브 뷰 공통 래퍼 (돌아가기 버튼 + 제목)
│   ├── pages/
│   │   ├── PatternAnalysisView.tsx # 대시보드: 일간/주간 리포트 + HTML 내보내기 (구현됨)
│   │   ├── HabitTrackerView.tsx    # 습관 트래커: 요일별 루틴·이행률·체크리스트 (구현됨)
│   │   ├── QuickMemoView.tsx       # 퀵 메모 / 일기 (placeholder)
│   │   └── SettingsView.tsx        # 환경설정 (placeholder)
│   ├── hooks/
│   │   ├── useDayData.ts    # 날짜별 데이터 CRUD 훅. 요일 루틴 자동 병합, undo, 자동 저장
│   │   └── useKanbanData.ts # 칸반 티켓 CRUD 훅. dirty flag 자동 저장
│   ├── types/
│   │   ├── schedule.ts    # 타임테이블 타입 (TimeSlot, SlotRecord, DayData, Routine, WeeklyRoutines, Activity)
│   │   ├── kanban.ts      # 칸반 타입 (Ticket, KanbanStatus, ActivitySpecificFields)
│   │   ├── navigation.ts  # 뷰 식별자 타입 (ViewId)
│   │   └── electron.d.ts  # window.electronAPI 타입 선언
│   └── styles/
│       └── global.css     # 전역 스타일 (다크 브라운 테마, 기차표 티켓, 오버레이 CSS)
├── public/
│   ├── models/           # 3D 모델 (cat.glb 등 GLB 파일)
│   └── icon.ico          # 앱 아이콘
├── scripts/
│   ├── dev.js            # 개발용: vite build → electron 빌드 → electron 실행
│   ├── pack.js           # 패키징: vite build → electron 빌드 → electron-builder → 아이콘 적용
│   ├── build-electron.js # esbuild로 electron/ → dist-electron/ 빌드
│   ├── run-electron.js   # 빌드된 electron 실행
│   └── apply-icon.js     # rcedit로 exe에 아이콘 적용
├── package.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts        # manualChunks(three/r3f), minify·treeshake off, base './'
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
  date: string                    // "2026-06-04"
  goal: string                    // 오늘의 목표
  slots: Record<number, TimeSlot> // key: 분(0~1430, 10 단위), 총 144칸
}
```

### 루틴 (요일별)

루틴은 평일/주말 **템플릿** + 월~일 **개별 요일**로 관리한다.
습관 트래커에서 템플릿을 칠한 뒤 "월~금 적용" / "토~일 적용" 버튼으로 일괄 복사할 수 있다.

```typescript
interface Routine {
  id: string
  name: string
  color: string
  startMin: number   // 시작(분)
  endMin: number     // 종료(분)
}

interface WeeklyRoutines {
  weekday: Routine[]  // 평일 템플릿
  weekend: Routine[]  // 주말 템플릿
  mon: Routine[]; tue: Routine[]; wed: Routine[]; thu: Routine[]
  fri: Routine[]; sat: Routine[]; sun: Routine[]
}
```

해당 날짜의 요일 루틴은 사용자가 직접 칠하지 않은 빈 슬롯에만 자동 적용된다(수동 입력 우선).

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
// 운동(exercise):   { exerciseType, km, minutes }
// 알고리즘(algorithm): { problemNumber, solveTime, link }
// 일반(general):    { notes }
```

### 저장 파일

| 파일명 | 내용 |
|--------|------|
| `day-YYYY-MM-DD.json` | 해당 날짜의 DayData |
| `routines-weekly.json` | WeeklyRoutines (요일별 루틴) |
| `activities.json` | Activity[] (사용자 정의 팔레트) |
| `tickets.json` | Ticket[] (칸반 보드 전체, 날짜 무관) |

저장 위치: `%APPDATA%/scheduler-data/`

> **마이그레이션**: 구버전의 `routines.json`(매일 반복 단일 루틴)이 있으면 최초 로드 시
> 모든 요일에 복사하여 `routines-weekly.json`으로 자동 변환한다.

## 핵심 동작 방식

### 3D 방 내비게이션
- 가구에 hover → 툴팁 표시, 클릭 → `useFocusStore.focus(id)`로 포커스 설정
- `CameraRig`이 해당 가구의 `focusPose`로 카메라를 부드럽게 이동
- `FocusOverlay`가 매핑된 기능 화면을 HTML 오버레이로 렌더 (스케줄러는 모니터 풀화면 스타일)
- ESC / 닫기 버튼 / 배경 클릭 → `unfocus()`로 방 복귀
- 물리 소품은 `VITE_ENABLE_PHYSICS=0`으로 비활성화 가능

### 팔레트 선택 → 드래그 페인트
1. 팔레트에서 활동 칩 클릭 (선택 상태)
2. 타임테이블 위에서 마우스 드래그 → 선택된 활동으로 슬롯 채움
3. **드래그 완료 시 활동 선택 자동 해제** → 현재 시간대 패널로 전환
4. 지우개 선택 후 드래그 → 슬롯 삭제
5. 드래그 중 아래에 줌 뷰(확대)로 정밀 조작
6. `Ctrl/Cmd+Z`로 undo (최대 20단계)

### 타임라인 기록 (칸반과 독립)
- 현재 시간대 / 시간 블록 클릭 시 기록 카드 표시 → 클릭하면 모달에서 제목·상세·활동별 필드 편집
- 저장 시 슬롯의 `record` 필드에 저장 (칸반보드에는 추가되지 않음)
- 활동 유형에 따라 세부 필드 자동 표시 (운동: 종류/km/분, 알고리즘: 문제번호/시간/링크)

### 칸반보드 (Jira 스타일)
- **3컬럼**: Todo / Progress / Done
- 티켓 생성 모달에서 제목·상세·활동 유형·Why 입력
- HTML5 DnD로 컬럼 간 이동·순서 변경
- **기차표 비주얼**: 본문(활동 컬러 헤더) + 절취선 + 컬러 스텁 + 톱니 가장자리
- **바코드 뜯기**: Progress 티켓 스텁을 오른쪽으로 50px 이상 당기면 Done으로 이동

### 칸반 → 타임테이블 연동
- Progress 티켓을 타임테이블의 **같은 활동으로 칠해진 슬롯** 위로 드롭
- 해당 연속 구간 전체에 티켓 기록(`record`)이 연결됨 (타임라인↔칸반은 독립적)

### 대시보드 (일간/주간 리포트)
- 벽 차트 클릭으로 진입
- 일간: 타임라인 바 + 활동별 시간 요약 + 기록 제목별 상세 (루틴 제외)
- 주간: 월~일 7일 타임라인 + 주간 합산 활동별 시간
- 타임라인 hover로 연속 구간 범위 표시
- **HTML 클립보드 복사**: 인라인 스타일 포함 HTML을 복사 → 블로그 편집기에 붙여넣기

### 습관 트래커
- 평일/주말 템플릿 + 월~일 개별 요일 루틴을 미니 타임테이블로 페인트
- "월~금 적용" / "토~일 적용" 버튼으로 템플릿 일괄 복사
- 루틴 이행률(RoutineAdherence) + 체크리스트형 습관(HabitChecklist) 관리

## IPC 통신

```
렌더러 (React)
  ↓ window.electronAPI
Preload (contextBridge)
  ↓ ipcRenderer.invoke
메인 프로세스 (ipcMain.handle)
  ↓
Store / Notification / clipboard
```

| 채널 | electronAPI | 용도 |
|------|-------------|------|
| `store:load` | `loadData(key)` | 키로 JSON 데이터 로드 |
| `store:save` | `saveData(key, data)` | 키로 JSON 데이터 저장 |
| `store:listKeys` | `listDayKeys()` | `day-` 접두사 키 목록 (달력 점 표시용) |
| `window:toggle-collapse` | `toggleCollapse(collapsed)` | 창 크기 토글 |
| `notification:show` | `showNotification(title, body)` | 시스템 알림 표시 |
| `clipboard:writeHtml` | `copyHtmlToClipboard(html, text)` | HTML + 텍스트 클립보드 복사 |

## UI 테마

- 전체 배경: `#56423f` (다크 브라운) / 3D 씬 배경: `#050302`
- 칸반 티켓: `#f5f0e6` (크림) + 활동 컬러 헤더/스텁
- 모달·오버레이: 흰색/크림 배경
- 프레임리스 윈도우 + `titleBarOverlay` (`#56423f`)
- 창 크기: 1400×900

## 빌드 및 실행

```bash
# 의존성 설치
npm install

# 개발 (vite build → electron 빌드 → electron 실행)
npm run dev

# 프로덕션 빌드 (dist/ + dist-electron/ 생성)
npm run build

# exe 패키징 + 아이콘 적용
npm run electron:build

# 결과: release/win-unpacked/Scheduler.exe
```

### 빌드 파이프라인 (`scripts/pack.js`)
1. `dist/` 정리 후 `vite build` → `dist/` (프론트엔드 번들)
2. `node scripts/build-electron.js` → `dist-electron/main.js`, `preload.js`
3. `npx electron-builder` → `release/win-unpacked/`
4. `node scripts/apply-icon.js` → exe에 아이콘 적용

### 알려진 빌드 이슈 (Windows)
- **stale chunk 누락**: Windows/MINGW + Vite 6에서 기존 출력이 남아 있으면 청크 쓰기를 건너뛰는 경우가 있어, 빌드 스크립트가 매번 `dist/`를 먼저 삭제한다.
- **winCodeSign symlink 에러**: `package.json`의 `"signAndEditExecutable": false`로 우회.
- **`npx electron .` 실행 불가**: `require("electron")`이 경로 문자열을 반환하는 환경 문제 → 빌드된 exe 또는 `scripts/run-electron.js`로 실행.
- **exe 잠금**: Scheduler.exe 실행 중 재빌드 시 `taskkill /IM "Scheduler.exe" /F` 후 재시도.
