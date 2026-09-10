/**
 * 데모 데이터 (로컬 모드 전용).
 * `npm run dev:local` 로 띄운 뒤 `?demo=1` 을 붙이면 localStorage 가 비어 있을 때 한 번 심는다.
 * UI 작업·스크린샷용이며 Firebase 모드에서는 절대 실행되지 않는다.
 */
import type { Activity, DayData, WeeklyRoutines } from '../types/schedule'
import { SLEEP_ACTIVITY, emptyWeekly } from '../types/schedule'
import type { Ticket } from '../types/kanban'
import { dateKeyOf, shiftDateKey } from './slots'
import { storage } from './storage'

const ACTS: Activity[] = [
  { id: 'demo-algo', name: '알고리즘', color: '#4a9eff', order: 0 },
  { id: 'demo-proj', name: '프로젝트', color: '#af52de', order: 1 },
  { id: 'demo-run', name: '운동', color: '#34c759', order: 2 },
  { id: 'demo-meal', name: '식사', color: '#ff9500', order: 3 },
  { id: 'demo-eng', name: '영어 공부', color: '#5ac8fa', order: 4 },
  { id: 'demo-coffee', name: '커피, 음악, 독서', color: '#a2845e', order: 5 },
]

function day(date: string, segs: [number, number, string, string?][]): DayData {
  return {
    v: 2, date, goal: '',
    segments: segs.map(([start, end, activityId, title]) =>
      title ? { start, end, activityId, record: { title, description: '' } } : { start, end, activityId }),
  }
}

export async function seedDemoDataIfEmpty(): Promise<boolean> {
  if (await storage.loadData('activities')) return false
  const today = dateKeyOf(new Date())
  const S = SLEEP_ACTIVITY.id
  await storage.saveData('activities', ACTS)
  await storage.saveData(`day-${today}`, day(today, [
    [0, 420, S], [450, 480, 'demo-meal'], [540, 690, 'demo-algo', 'BOJ 1753 다익스트라'], [720, 750, 'demo-meal'],
    [780, 960, 'demo-proj', '스케줄러 v2 마이그레이션'], [1020, 1080, 'demo-run', '러닝 5km'], [1110, 1140, 'demo-meal'],
    [1200, 1260, 'demo-eng', 'Shadowing 2ch'], [1290, 1350, 'demo-coffee'], [1380, 1440, S],
  ]))
  for (let i = 1; i <= 4; i++) {
    const d = shiftDateKey(today, -i)
    await storage.saveData(`day-${d}`, day(d, [
      [0, 420 + i * 10, S], [540, 660 + i * 20, 'demo-algo'], [780, 900, 'demo-proj'], [1020 + i * 10, 1080, 'demo-run'], [1380, 1440, S],
    ]))
  }
  const weekly: WeeklyRoutines = emptyWeekly()
  for (const k of ['mon', 'tue', 'wed', 'thu', 'fri'] as const) {
    weekly[k] = [
      { id: `r-${k}-1`, activityId: S, startMin: 0, endMin: 420 },
      { id: `r-${k}-2`, activityId: 'demo-run', startMin: 1020, endMin: 1080 },
    ]
  }
  await storage.saveData('routines-weekly', weekly)
  const tickets: Ticket[] = [
    { id: 'demo-t1', seq: 14, title: '스케줄러 v2 마이그레이션', description: '활동 id 참조 + 구간 리스트', why: '', activityId: 'demo-proj', status: 'progress', activityFields: { type: 'general', data: { notes: '' } }, order: 0, createdAt: '2026-09-10T09:00:00Z', updatedAt: '' },
    { id: 'demo-t2', seq: 12, title: 'BOJ 1753 다익스트라', description: '우선순위 큐 복습', why: '', activityId: 'demo-algo', status: 'progress', activityFields: { type: 'algorithm', data: { problemNumber: '1753', solveTime: '', link: '' } }, order: 1, createdAt: '2026-09-09T09:00:00Z', updatedAt: '' },
    { id: 'demo-t3', seq: 15, title: 'Shadowing 2챕터', description: '', why: '', activityId: 'demo-eng', status: 'todo', activityFields: { type: 'general', data: { notes: '' } }, order: 0, createdAt: '2026-09-11T09:00:00Z', updatedAt: '' },
    { id: 'demo-t4', seq: 11, title: '러닝 5km', description: '한강 코스', why: '', activityId: 'demo-run', status: 'done', activityFields: { type: 'exercise', data: { exerciseType: '러닝', km: '5', minutes: '32' } }, order: 0, createdAt: '2026-09-08T09:00:00Z', updatedAt: '' },
  ]
  await storage.saveData('tickets', tickets)
  await storage.saveData('habits', [
    { id: 'demo-h1', name: '물 8잔', color: '#4a9eff', order: 0, createdAt: '' },
    { id: 'demo-h2', name: '스트레칭', color: '#34c759', order: 1, createdAt: '' },
    { id: 'demo-h3', name: '일기', color: '#ff9500', order: 2, createdAt: '' },
  ])
  for (let i = 0; i < 12; i++) {
    const d = shiftDateKey(today, -i)
    await storage.saveData(`habit-checks-${d}`, { habitIds: i < 5 ? ['demo-h1', 'demo-h2'] : ['demo-h1'] })
  }
  await storage.saveData(`memo-${today}`, { text: 'v2 마이그레이션 끝나면 대시보드 주간 리포트에 습관 체크 수 넣기', updatedAt: new Date().toISOString() })
  return true
}
