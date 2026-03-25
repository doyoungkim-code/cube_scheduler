# Scheduler

개인용 데스크톱 일정 관리 앱. 24시간 타임테이블(144개 10분 블록)에 활동을 드래그로 칠하여 하루 일과를 기록한다.

## UI 구조

<img width="2613" height="815" alt="image" src="https://github.com/user-attachments/assets/c23b57a3-7c9a-4715-97ce-6f8e19f4145e" />

- 왼쪽 패널: 현재 활동에 따라 방 픽셀아트 이미지가 자동 전환
- 오른쪽 패널: 팔레트, 타임테이블, 현재 태스크
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
│   ├── App.tsx           # 루트 컴포넌트. 2컬럼 레이아웃 (아바타 + 타임테이블)
│   ├── main.tsx          # React 엔트리포인트
│   ├── components/
│   │   ├── TimeTable.tsx      # 144블록 메인 타임테이블. 드래그 페인트, 줌 뷰, 현재 태스크
│   │   ├── ActivityPalette.tsx # 활동 팔레트 칩. 클릭 선택, 우클릭 편집, 인라인 추가
│   │   ├── RoutineEditor.tsx   # 루틴 편집 모달. 미니 타임테이블로 드래그 페인트
│   │   ├── Calendar.tsx        # 월간 달력 모달. 데이터 있는 날짜에 점 표시
│   │   ├── HourDetail.tsx      # 시간 블록 클릭 시 상세 패널 (그룹 기반)
│   │   ├── DayInfo.tsx         # 날짜 정보 컴포넌트 (예비)
│   │   └── CurrentTime.tsx     # 실시간 시계 컴포넌트 (예비)
│   ├── hooks/
│   │   └── useDayData.ts # 날짜별 데이터 CRUD 훅. 루틴 자동 병합, 자동 저장
│   ├── types/
│   │   ├── schedule.ts    # 핵심 타입 정의
│   │   └── electron.d.ts  # window.electronAPI 타입 선언
│   └── styles/
│       └── global.css     # 전역 스타일 (다크 브라운 테마, 타임테이블은 흰색)
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
│   └── build-electron.js  # esbuild로 electron/ → dist-electron/ 빌드
├── package.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

## 데이터 모델

```typescript
// 10분 슬롯 하나
interface TimeSlot {
  label: string        // 활동 이름 (예: "알고리즘")
  color: string        // 색상 코드 (예: "#e8a87c")
  detail?: string      // 세부 메모
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

### 저장 파일

| 파일명 | 내용 |
|--------|------|
| `day-YYYY-MM-DD.json` | 해당 날짜의 DayData |
| `routines.json` | Routine[] (매일 반복) |
| `activities.json` | Activity[] (사용자 정의 팔레트) |

저장 위치: `%APPDATA%/scheduler-data/`

## 핵심 동작 방식

### 팔레트 선택 → 드래그 페인트
1. 팔레트에서 활동 칩 클릭 (선택 상태)
2. 타임테이블 위에서 마우스 드래그 → 선택된 활동으로 슬롯 채움
3. 지우개 선택 후 드래그 → 슬롯 삭제
4. 드래그 중 아래에 줌 뷰(3시간 확대)로 정밀 조작

마우스 위치 → 분 변환: `blocksRef.getBoundingClientRect()` + `Math.floor()`

### 태스크 그룹핑
- `groupAllSlots()`: 0~1440 전체 스캔하여 연속된 동일 활동을 하나의 그룹으로 묶음
- 시간 경계를 무시 (예: 04:00~08:30 수면 → 하나의 270분 그룹)
- 현재 시간대 패널: 현재 시간과 겹치는 그룹만 필터링하여 표시
- 각 그룹에 세부사항(detail) 입력/수정 가능, 삭제 버튼 분리

### 루틴 시스템
- 루틴은 사용자가 직접 칠하지 않은 빈 슬롯에만 자동 적용 (수동 입력 우선)
- 타임테이블에서 반투명 + 사선 패턴으로 구분 표시
- `useDayData` 훅의 `applyRoutines()`에서 병합
- 루틴 편집: 모달 내 미니 타임테이블에서 동일한 드래그 페인트 방식

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
- 타임테이블 영역: 흰색 배경 (CSS 변수 로컬 오버라이드)
- 모달 (루틴 편집, 달력): 흰색 배경
- 프레임리스 윈도우 + `titleBarOverlay` (최소화/최대화/닫기만 표시)

## 빌드 및 실행

```bash
# 의존성 설치
npm install

# 개발 모드 (Vite 서버 + Electron)
npm run dev

# 프로덕션 빌드
npm run build                  # dist/ + dist-electron/ 생성
npm run electron:build         # exe 패키징

# 결과: release/win-unpacked/Scheduler.exe
```

### 빌드 파이프라인
1. `vite build` → `dist/` (프론트엔드 번들)
2. `node scripts/build-electron.js` → `dist-electron/main.js`, `preload.js`
3. `electron-builder --win --config` → `release/win-unpacked/`

### 알려진 빌드 이슈 (Windows)
- **winCodeSign symlink 에러**: `package.json`의 `"signAndEditExecutable": false`로 우회
- **Vite exit code 127**: bash 환경 아티팩트, 빌드 결과는 정상
- **`npx electron .` 실행 불가**: `require("electron")`이 경로 문자열을 반환하는 환경 문제. 패키지된 exe로 실행해야 함
- **dist 캐싱**: 코드 변경 후 `rm -rf dist` 후 재빌드 필요할 수 있음
