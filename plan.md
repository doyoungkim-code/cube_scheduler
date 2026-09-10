# Cube Scheduler 리팩토링 계획 (초안)

> 2026-09-10 기준. 프로젝트를 처음 보는 시각으로 코드 전체를 검토해 만든 문서다.
> 각 항목의 `[ ]` 에 결정을 적어 두면 그걸 바탕으로 실행 계획을 확정한다.
> 답 예시: `[ ] A1 → id 참조로 간다`, `[ ] C5 → 유지`.

## 0. 이 문서 사용법

1. **§1 확정 버그**는 결정과 무관하게 고친다. 순서만 정하면 된다.
2. **§2 질문**은 방향을 좌우하는 것부터(★) 답한다. 답이 없으면 "(추천)" 안을 따른다.
3. **§3 세부 발견**은 참고용이다. 질문에 답할 때 근거로 본다.
4. 결정이 모이면 **§4 실행 순서** 초안대로 단계를 나눠 진행한다.

---

## 1. 결정과 무관하게 고쳐야 할 버그

| # | 위치 | 증상 | 심각도 |
|---|------|------|--------|
| B-1 | `hooks/useDayData.ts` undo 스택 | 날짜를 바꿔도 스택이 안 비워져 Ctrl+Z 가 **다른 날 데이터를 현재 날짜 키에 저장** | 데이터 파괴 |
| B-2 | `hooks/useDayData.ts` 로드 | 로드 끝나기 전 칠하면 `setDay(saved)` 가 편집을 덮음. `dirtyWeekly/dirtyActivities` 가 리셋되지 않아 인스턴스 간 덮어쓰기 | 유실 |
| B-3 | `App.tsx` | `useDayData('__unused__')` 더미 인스턴스. 같은 훅이 App×2, 대시보드, 습관 페이지에 독립으로 떠서 `activities`/`routines-weekly` 를 각자 저장 | 유실 |
| B-4 | `components/QuickMemo.tsx` | 언마운트 시 pending 타이머만 지우고 저장 안 함 → 입력 후 0.5초 내 탭 이동 시 메모 유실 | 유실 |
| B-5 | `lib/storage.ts` | 저장 실패가 `console.error` 뿐. `saveData` 는 항상 `true`. pending 중 도착한 원격 스냅샷을 버리고 재조회 없음. 실패 재시도 타이머 없음. `pagehide` flush 가 비동기라 마지막 편집 유실 가능 | 유실/무음 |
| B-6 | `components/TimeTable.tsx` dragover | HTML5 DnD 스펙상 dragover 중 `getData()` 는 빈 문자열 → "같은 활동 슬롯 강조"가 한 번도 동작한 적 없음 | 기능 불능 |
| B-7 | `pages/PatternAnalysisView.tsx` | 리포트 HTML 에 사용자 입력(제목) 미이스케이프. `text/plain` 에도 HTML 소스를 넣음 | 마크업 깨짐 |
| B-8 | `hooks/useKanbanData.ts` | `moveTicket` 이 원본 객체를 변이(`t.order = i`), 같은 컬럼 재정렬 오프바이원, 출발 컬럼 order 미정리. 티켓 번호가 배열 인덱스라 삭제 시 전부 밀림 | 버그 |
| B-9 | `auth/AuthContext.tsx` | 오프라인 콜드스타트에서 캐시 스냅샷(`fromCache`)으로 pending 오판 → 승인된 사용자가 대기 화면. 승인 해제 시 Firestore 백엔드 미정리. 거절(문서 삭제) 후 재로그인하면 pending 재생성 | 오동작 |
| B-10 | `components/HabitChecklist.tsx` | 홈과 습관 페이지에 동시 마운트 → 상태 2벌, 마지막 저장이 이김 | 유실 |
| B-11 | `hooks/useDayData.ts`, `RoutineAdherence.tsx` | `weekly[dk]` 가 undefined 인 부분 데이터 import 시 크래시. 에러 바운더리 없어 흰 화면 | 크래시 |
| B-12 | `types/kanban.ts`, `App.tsx ROOM_MAP`, `RoutineAdherence.tsx` | 활동을 **이름 문자열**로 판별(`'운동'`, `'알고리즘'`, `slot.label === r.name`). 이름 바꾸면 세부 폼·방 이미지·이행률이 조용히 끊김 | 취약 |
| B-13 | `App.tsx` `now` 1초 setState | 초 표시 하나 때문에 144블록+칸반+위젯 전체가 매초 리렌더. 메모이제이션 0건 | 성능 |
| B-14 | `WeekStrip.tsx`, `RoutineAdherence.tsx`, `HabitChecklist.tsx`, `QuickMemoView.tsx` | 슬롯 한 칸 칠할 때마다 7일 재로드 / 루틴 한 칸에 28일 재집계 / 체크마다 60일 순차 로드 / 3초 폴링으로 30개 순차 로드 | 성능 |
| B-15 | `App.tsx` Ctrl+Z | 어느 뷰에서든 항상 등록 → 대시보드에서 눌러도 보이지 않는 스케줄이 undo 됨 | 오동작 |
| B-16 | `components/TimeTable.tsx` | `tickets` prop 미사용(데드), 컨텍스트 메뉴 범위가 루틴 포함으로 계산돼 표시 범위 ≠ 삭제 범위 | 사소 |
| B-17 | `firestore.rules` | `requestedAt` 검증 없음 → 필드 없는 문서는 관리자 목록에서 숨음. displayName/photoURL 길이·형식 검증 없음 | 보안 |

---

## 2. 결정이 필요한 질문

★ = 다른 항목의 방향을 좌우함. 먼저 답할 것.

### A. 데이터 모델

- [ ] ★ **A1. 활동 참조를 id 로 바꿀까?** 지금은 슬롯·루틴·이행률·방 이미지·세부 폼이 모두 이름 문자열. 이름을 바꾸면 과거 기록이 전부 고아가 된다. 바꾸면 기존 `day-*`, `routines-weekly` 전체 마이그레이션 필요. *(추천: id 참조 + 로드 시 자동 마이그레이션)*
- [ ] ★ **A2. 슬롯 기록과 칸반 티켓의 관계는?** 같은 모달·같은 `Ticket` 타입을 쓰지만 저장은 완전 별개. `TimeSlot.ticketId` 는 선언만 되고 아무도 안 씀. (a) 지금처럼 내용 복사만 (b) 티켓을 시간에 배치하면 살아있는 링크(티켓 수정 시 기록도 갱신). *(추천: a, 대신 모달 제목·삭제 문구를 구분)*
- [ ] ★ **A3. 하루 슬롯 저장 표현.** 지금은 `Record<분, TimeSlot>` 144칸에 기록을 모든 칸에 복제. 구간 리스트 `{start, end, activityId, record}[]` 로 바꾸면 그룹핑 중복 6벌이 사라지고 저장이 가벼워진다. *(추천: 구간 리스트)*
- [ ] **A4. 죽은 필드 처분.** 살릴 것에 표시: `DayData.goal`(UI 없음) / `Ticket.why`(입력만 되고 어디에도 안 보임) / `general.notes`(입력·표시 불가) / `Activity.order`, `Habit.order`(저장만) / `TimeSlot.detail`(record.description 과 항상 동일) / `ViewId.home`, `today-dashboard`(라우팅 없음)
- [ ] **A5. 활동별 세부 항목(운동: 종류/km/분, 알고리즘: 문제/시간/링크)을 활동 정의의 스키마로 일반화할까?** 지금은 이름 하드코딩 + 타입 3종 고정. 값도 전부 `string` 이라 집계 불가. *(추천: 활동에 `fields: [{key, label, type}]` 데이터로)*
- [ ] **A6. 평일/주말 템플릿 유지?** 실제 일정엔 영향 없고 1회 복사 버튼일 뿐. *(추천: 요일별 루틴 + "다른 요일로 복사" 로 단순화)*
- [ ] **A7. 수면 활동을 특수 케이스(`SLEEP_ACTIVITY`)로 둘까, 일반 활동으로 흡수할까?**

### B. 상태 / 아키텍처

- [ ] ★ **B1. 상태 관리.** (a) Zustand 단일 스토어 (b) Context + reducer 3분할 (c) 훅 유지 + 메모이제이션. 중복 인스턴스 문제(B-3, B-10)는 (a)/(b) 에서 자연 해소. *(추천: a)*
- [ ] ★ **B2. 다기기 실시간 반영을 진짜 구현?** 지금은 캐시만 갱신되고 화면은 새로고침 전까지 안 바뀜(README 문구가 사실과 다름). 구현하려면 `storage` 에 subscribe API + `useSyncExternalStore`. *(추천: 구현. B1(a) 와 함께)*
- [ ] **B3. Firestore 문서 모델.** (a) 키별 `{json: string}` 유지 (b) 하루 1문서 필드화 (c) 월 1문서. 지금은 세션마다 전 기간 문서를 전량 읽고, 규칙으로 필드 검증 불가, `tickets`/`activities` 가 단일 문서. *(추천: b + 최근 N주만 구독, 과거는 지연 로드)*
- [ ] **B4. 스키마 버전 + 마이그레이션 파이프라인 + 로드 시 검증(zod)?** 지금은 `as DayData` 단언 19곳, 마이그레이션 1건 하드코딩. *(추천: 도입. A1/A3 를 하면 필수)*
- [ ] **B5. 라우터(URL) 도입?** 뷰 전환이 `useState` 라 딥링크·뒤로가기·코드 분할 불가. *(추천: 도입, `/schedule/2026-09-10`)*
- [ ] **B6. CSS.** (a) 단일 파일 + 사이즈/스페이싱 토큰 정비 + 흰 카드 오버라이드 4벌 → 유틸 1개 (b) CSS Modules 로 분할 (c) Tailwind. *(추천: a 먼저, 필요 시 b)*
- [ ] **B7. 품질 도구.** Vitest(lib/ 유닛부터) / ESLint(react-hooks) + Prettier / PR 검증 CI. 지금은 셋 다 없음(`eslint-disable` 주석만 존재). *(추천: 셋 다)*
- [ ] **B8. 번들.** Firestore(747KB) 를 로그인 후 동적 로드, 뷰별 `React.lazy`, Pretendard 셀프호스팅(CDN·SRI 없음). *(추천: 셋 다)*
- [ ] **B9. 슬롯 표현과 별개로 `Record<number,…>` 를 유지한다면 `noUncheckedIndexedAccess` 를 켤까?** undefined 접근이 전부 무검사.

### C. 기능 / UX

- [ ] **C1. undo 범위.** 지금은 슬롯 전용 + Ctrl+Z 뿐(모바일 불가, redo 없음). 티켓·루틴·팔레트·습관까지 넓힐지, 모바일 undo 버튼·redo 를 둘지. *(추천: 스토어 도입 시 전 도메인 patch 기반 undo/redo + 토스트)*
- [ ] **C2. 파괴적 동작 정책.** 활동 삭제·구간 삭제·시간 전체 삭제·가져오기는 확인 없음, 템플릿 적용·거절만 `confirm()`. (a) 커스텀 확인 대화 (b) 실행 후 undo 토스트. *(추천: b, 되돌릴 수 없는 것만 a)*
- [ ] **C3. 모바일에서 빠진 기능 복구 범위.** 시간 상세 / 현재 시간대 카드 / 티켓 드롭 / 활동 편집(PC 는 우클릭 전용이라 터치 불가) / 칸반 순서 변경 / Shift 연장 / 우클릭 메뉴 / 오늘 요약 위젯.
- [ ] **C4. 클릭 단위.** 10분 단위로 칠하는데 클릭은 "1시간 상세"를 연다. 구간(연속 같은 활동) 단위 상세로 바꿀까? *(추천: 구간 단위)*
- [ ] **C5. 칠한 뒤 팔레트 자동 해제 유지?** 연속으로 여러 구간 칠하려면 매번 재선택. Shift 연장은 해제 안 돼 비대칭.
- [ ] **C6. 칸반 확장.** Done 아카이브/자동 정리, 컬럼별 추가 버튼, 우선순위·마감일·태그·검색, 날짜와 무관한 보드를 스케줄 화면 안에 둘지 별도 탭으로 뺄지, 티켓 고정 번호(seq).
- [ ] **C7. 이행률·스트릭 정의 확정.** 이행률: 기록 없는 날을 분모에서 뺄지(현재) 0% 로 셀지, 오늘을 포함할지(현재 포함). 스트릭: 오늘 미체크여도 어제까지 연속을 표시(현재). 
- [ ] **C8. 습관 페이지 분리.** 루틴 편집 / 이행률 / 체크리스트가 한 페이지. "루틴" 과 "습관" 을 나눌지. 과거 날짜 체크(지금은 오늘만) 허용할지. 습관 이름·색·순서 편집 UI.
- [ ] **C9. 대시보드.** React 와 HTML 문자열 2벌 → React 단일 소스 + 직렬화로 통일할지. 추가 지표(습관 체크, 메모, 티켓 완료 수, 운동 km 합계 등). 주간 모드의 주 이동 UI, "오늘로". 이름이 `PatternAnalysis` 인데 패턴 분석 없음.
- [ ] **C10. 메모.** 삭제·검색·더보기, 리포트/달력 점에 포함, 홈 위젯에서 날짜 이동.
- [ ] **C11. 방 이미지 매핑을 사용자 설정으로?** 지금은 활동 이름 하드코딩 9종. 그리고 RoomCard 만 "오늘" 기준이고 나머지는 선택 날짜 기준 (혼동).
- [ ] **C12. 실제 환경설정 필요?** 테마(라이트), 주 시작 요일, 시간 표기, 시작 화면, 슬롯 단위.
- [ ] **C13. 접근성 수준.** 타임테이블 키보드 조작, `role="dialog"`+포커스 트랩, 아이콘 버튼 라벨, 활동색 위 텍스트 대비 자동 계산.
- [ ] **C14. 문체·용어 통일.** 빈 상태 문구가 반말/해요체/합쇼체 혼재, "Board / To Do / IN PROGRESS / DAILY REPORT" 한영 혼용. 하나로 정할 것.
- [ ] **C15. 자정 처리.** 자정에 `isToday` 만 조용히 바뀜. "날짜가 바뀌었어요 → 오늘로" 안내를 둘지.
- [ ] **C16. 로딩·오프라인·저장 상태 표시.** 첫 진입 빈 화면 깜빡임, 오프라인 배지, 저장 중/실패 인디케이터.

### D. 보안 / 운영

- [ ] ★ **D1. 가입 개방성.** 지금은 Google 계정만 있으면 누구나 pending 생성(봇 가능, App Check 없음). (a) 초대 코드 (b) 이메일 화이트리스트를 규칙에 (c) App Check(reCAPTCHA). *(추천: a)*
- [ ] ★ **D2. 관리자 식별.** 이메일이 `firebaseConfig.ts` 와 `firestore.rules` 두 곳 하드코딩(불일치 시 UI 만 열리고 쓰기 전부 거부). (a) `members.role == 'admin'` 문서 기반(복수 관리자 가능) (b) 커스텀 클레임 (c) 유지 + 빌드 시 일치 검사. 포크하면 원작자가 관리자가 되는 문제도 있음. *(추천: a)*
- [ ] **D3. 거절 = 영구 차단?** 지금은 문서 삭제라 재로그인 시 재요청. `status: 'blocked'` 도입 여부.
- [ ] **D4. 계정 삭제 + 데이터 완전 삭제 UI.** 지금 없음. 클라이언트 순회 삭제 + `deleteUser()` 로 가능.
- [ ] **D5. 가져오기 안전장치.** 자동 백업 다운로드 → 덮어쓸 키 수 표시 → 확인, 스키마 검증(실패 항목 skip 리포트), 내보내기에 버전 필드, goal/메모만 있는 날 누락 해결.
- [ ] **D6. 로그아웃 시 로컬 캐시(IndexedDB, localStorage) 삭제?** 공용 PC 흔적 vs 재로그인 시 전량 재다운로드.
- [ ] **D7. 규칙 CI 배포 + 에뮬레이터 규칙 테스트?** 지금은 콘솔 복붙이라 저장소와 드리프트 가능. 규칙에 `email_verified`, `requestedAt == request.time`, 필드 길이 검증 추가.
- [ ] **D8. dev/prod Firebase 분리 + `.env` 설정?** 지금 `npm run dev` 가 운영 Firestore 에 직접 붙음.
- [ ] **D9. photoURL 저장 제거(어디서도 안 씀) + 개인정보 고지 문서.**
- [ ] **D10. PWA(홈 화면 추가, 오프라인 셸) / 에러 리포팅(Sentry) / Dependabot.**
- [ ] **D11. 배포 워크플로.** PR 검증 없음, `cancel-in-progress: true`(배포 중단 위험), 롤백 절차·빌드 버전 표기 없음, base path 3곳 하드코딩.
- [ ] **D12. 문서 정정.** "관리자는 항상 허용"(실제는 본인 데이터만), "다른 기기 변경 바로 반영"(실제는 새로고침 필요), SETUP 의 `storageBucket` 예시가 구형식.

---

## 3. 세부 발견 (참고용)

### 3.1 중복 코드
- 날짜 키 생성 함수 6벌: `lib/slots.ts`, `useDayData.ts`, `HabitChecklist.tsx`, `RoutineAdherence.tsx`, `PatternAnalysisView.tsx`, `AdminPanel.tsx`
- 날짜 파싱 규약 2종: `parseDateKey` vs `new Date(key + 'T00:00:00')`
- "연속 구간 찾기" 6벌: `slots.ts groupAllSlots`, `HourDetail groupAllDaySlots`, `PatternAnalysisView groupSlotRecords / buildTimelineHtml / TimelineBar`, `App.tsx` 와 `TimeTable.tsx` 의 인라인 while. 병합 기준도 제각각(label+color vs title)
- duration 포맷 4벌(`TimeTable.duration`, `PatternAnalysisView.fmtTime` 은 trailing space 버그), `fmtMin` 2벌, `padStart` 4곳
- 페인트 드래그 상태머신 2벌(`TimeTable` ↔ `TimelineVertical`, justPainted 150ms vs 200ms)
- "구간 → TicketModal" 로직 3벌(`TimeTable.CurrentTasks`, `HourDetail`, `TimelineVertical`)
- 리포트 렌더러 2벌(React 카드 vs HTML 문자열 빌더, 이미 갈라짐)
- 색 팔레트 3종(`ActivityPalette` 12색, `HabitChecklist` 8색, `SLEEP_ACTIVITY`), 위험색 2종(`--danger:#ff6b5e` vs 실제 `#ff3b30` 18회)
- 상태 라벨 맵 3벌(`KanbanBoard`, `KanbanColumn`, `KanbanCard`), `'eraser'` 가짜 활동 리터럴 2곳
- `routineMap` 생성 2벌, `TOTAL_MIN` 있는데 `1440/144/1430/10` 리터럴 산재

### 3.2 컴포넌트 경계
- `TimeTable.tsx` 521줄: 트랙 + 줌 뷰 + 컨텍스트 메뉴 IIFE + 중첩 `CurrentTasks`
- `PatternAnalysisView.tsx` 489줄: 순수 함수 + HTML 빌더 + 프리뷰 + 페이지. `reportRef` 데드 코드
- `KanbanCard.tsx` 198줄: 프레젠테이션 + DnD + 찢기 제스처 + 필드 포매팅
- `HabitTrackerView` 의 `applyWeekday/applyWeekend` 복붙, 팔레트 UI 복제(편집 기능은 빠짐)
- `HourDetail` 의 "빈 슬롯 추가" UI 는 페인트 모드에서 `TimeTable` 이 `HourDetail` 자체를 숨겨 **도달 불가**

### 3.3 페이지별 UX 메모
- 홈: 날짜 텍스트와 "달력" 버튼이 같은 동작. 날짜 바꿔도 팔레트 선택·`selectedHour` 유지. 티켓 드롭이 루틴 유령 슬롯을 실제 기록으로 바꾸고, 실패 시 무음, 기존 record 덮어쓰기 undo 불가
- 타임테이블: Shift 연장·우클릭 메뉴가 숨은 기능. 줌 헤더 "0.7시간" 표기. 컨텍스트 메뉴 화면 밖 넘침
- 세로 타임라인: 루틴 탭하면 무반응(안내 없음). 20분 구간은 라벨 안 보임. 날짜 바꿔도 재스크롤 안 함
- 팔레트: 편집 우클릭 전용, `order` 미사용, 중복 이름 허용, 커스텀 색 없음, 삭제 확인·사용처 표시 없음, Escape 로 해제 안 됨
- 시간 상세: 과거 날짜에서도 "현재 시간대" 카드가 지금 시각 기준. "전체 삭제" 확인 없음. 빈 슬롯 추가는 10분 1칸, undo 불가
- 티켓 모달: 기록 편집인데 제목 "티켓 편집". 기록 모드의 활동 유형 셀렉트는 저장 시 버려짐(죽은 컨트롤). 제목 비면 무음 실패. 활동 유형 바꾸면 세부값 확인 없이 소실. `general.notes` 입력 불가. 접근성 속성 0건
- 칸반: Why 어디서도 안 보임. `setDraggingId` write-only. dragLeave 후 드롭은 항상 맨 끝. 모바일 순서 변경 불가. 찢기 취소 없음. Done 무한 누적. 추가 버튼은 상단 1개 고정 todo
- 대시보드: 튜토리얼이 새로고침마다 재등장(dismiss 미저장). 주간 로딩 표시 없음, `weekData[6]` 무검사. 날짜 이동이 `<input type=date>` 하나. `exercise/algorithm` 값은 어디에도 집계 안 됨
- 습관: 체크는 오늘만. 스트릭 60일 순차 로드. 습관 편집 UI 없음, 삭제 확인 없음, 고아 체크 잔존. 미니 타임테이블은 인접 병합 안 해 조각 무한 누적, 라벨·시간 표시 없음, undo·전체 지우기 없음. 모바일 `min-width: 720px` 가로 스크롤(README 와 모순)
- 메모: 저장 상태 표시가 실제와 무관("저장 중…"이 실제론 시작 전), 삭제 수단 없음, 3초 폴링
- 설정: `KEY_PREFIXES` 수동 관리, 가져오기 후 "새로고침하세요", 로그아웃 시 화면 그대로 로컬 데이터로 갈아치워짐, 승인 해제 시 데이터 잔존 안내 없음
- 전역: 빈 상태 문구 문체 혼재, `div onClick` 위주로 키보드 불가, 로딩 상태 없음, 오프라인 표시 없음, 에러 바운더리 없음, 시계 타이머 3개(1s/30s/30s)

### 3.4 Firestore / 비용
- 규칙 `isApproved()` 가 매 요청 `get()` 1회 → 읽기 비용 약 2배. 커스텀 클레임으로 제거 가능
- 세션마다 `store` 컬렉션 전체 구독(1년 후 ~370문서). `tickets`/`activities` 단일 문서(1MB 한도, 쓰기 경합)
- `persistentLocalCache()` 단일 탭 모드 → 두 번째 탭 영속성 실패 가능. `persistentMultipleTabManager()` 검토
- 키 단위 last-write-wins. `updatedAt` 저장만 하고 병합·충돌 감지 안 함

---

## 4. 실행 순서 초안 (결정 후 확정)

1. **안전망**: Vitest + ESLint 도입, `lib/slots.ts` 유닛 테스트, 에러 바운더리, 저장 상태 인디케이터
2. **확정 버그 §1** 일괄 수정 (B-1 ~ B-17)
3. **데이터 모델** (A1/A3/B4): 활동 id 참조, 구간 리스트, 스키마 버전 + 마이그레이션 + zod
4. **스토어** (B1/B2): Zustand, 중복 인스턴스 제거, storage subscribe, undo/redo 일반화
5. **Firestore 모델 + 규칙** (B3/D1/D2/D7): 문서 구조 변경, 초대 코드, role 기반 관리자, 규칙 CI
6. **기능/UX** (C 항목): 결정된 것부터
7. **운영** (D4~D12, B8): 계정 삭제, 가져오기 안전장치, 번들 최적화, PWA, 문서 정정

---
