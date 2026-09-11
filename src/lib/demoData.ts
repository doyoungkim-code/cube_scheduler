/**
 * 데모 데이터 (로컬 모드 전용).
 * `npm run dev:local` 로 띄운 뒤 `?demo=1` 을 붙이면 localStorage 가 비어 있을 때 한 번 심는다.
 * UI 작업·스크린샷용이며 Firebase 모드에서는 절대 실행되지 않는다.
 */
import type { Activity, DayData, WeeklyRoutines } from '../types/schedule'
import { SLEEP_ACTIVITY, emptyWeekly } from '../types/schedule'
import { activityFromPreset, presetById } from '../lib/activityCatalog'
import type { Ticket } from '../types/kanban'
import { dateKeyOf, shiftDateKey } from './slots'
import { storage } from './storage'

// 프리셋에서 담은 것과 같은 모양 (id = 프리셋 id) + 커스텀 하나
const ACTS: Activity[] = [
  activityFromPreset(presetById('__sleep__')!, 0),
  activityFromPreset(presetById('preset:algorithm')!, 1),
  activityFromPreset(presetById('preset:project')!, 2),
  activityFromPreset(presetById('preset:exercise')!, 3),
  activityFromPreset(presetById('preset:meal')!, 4),
  activityFromPreset(presetById('preset:english')!, 5),
  activityFromPreset(presetById('preset:coffee')!, 6),
  activityFromPreset(presetById('preset:running')!, 7),   // 이미지 없음 → "준비 중" 확인용
  { id: 'demo-custom', name: '고양이 놀아주기', color: '#ff2d55', order: 8, roomImage: 'coffee' },
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
    [0, 420, S], [450, 480, 'preset:meal'], [540, 690, 'preset:algorithm', 'BOJ 1753 다익스트라'], [720, 750, 'preset:meal'],
    [780, 960, 'preset:project', '스케줄러 v2 마이그레이션'], [1020, 1080, 'preset:exercise', '러닝 5km'], [1110, 1140, 'preset:meal'],
    [1200, 1260, 'preset:english', 'Shadowing 2ch'], [1290, 1350, 'preset:coffee'], [1380, 1440, S],
  ]))
  for (let i = 1; i <= 4; i++) {
    const d = shiftDateKey(today, -i)
    await storage.saveData(`day-${d}`, day(d, [
      [0, 420 + i * 10, S], [540, 660 + i * 20, 'preset:algorithm'], [780, 900, 'preset:project'], [1020 + i * 10, 1080, 'preset:exercise'], [1380, 1440, S],
    ]))
  }
  const weekly: WeeklyRoutines = emptyWeekly()
  for (const k of ['mon', 'tue', 'wed', 'thu', 'fri'] as const) {
    weekly[k] = [
      { id: `r-${k}-1`, activityId: S, startMin: 0, endMin: 420 },
      { id: `r-${k}-2`, activityId: 'preset:exercise', startMin: 1020, endMin: 1080 },
    ]
  }
  await storage.saveData('routines-weekly', weekly)
  const tickets: Ticket[] = [
    { id: 'demo-t1', seq: 14, title: '스케줄러 v2 마이그레이션', description: '활동 id 참조 + 구간 리스트', why: '', activityId: 'preset:project', status: 'progress', activityFields: { type: 'general', data: { notes: '' } }, order: 0, createdAt: '2026-09-10T09:00:00Z', updatedAt: '' },
    { id: 'demo-t2', seq: 12, title: 'BOJ 1753 다익스트라', description: '우선순위 큐 복습', why: '', activityId: 'preset:algorithm', status: 'progress', activityFields: { type: 'algorithm', data: { problemNumber: '1753', solveTime: '', link: '' } }, order: 1, createdAt: '2026-09-09T09:00:00Z', updatedAt: '' },
    { id: 'demo-t3', seq: 15, title: 'Shadowing 2챕터', description: '', why: '', activityId: 'preset:english', status: 'todo', activityFields: { type: 'general', data: { notes: '' } }, order: 0, createdAt: '2026-09-11T09:00:00Z', updatedAt: '' },
    { id: 'demo-t4', seq: 11, title: '러닝 5km', description: '한강 코스', why: '', activityId: 'preset:exercise', status: 'done', activityFields: { type: 'exercise', data: { exerciseType: '러닝', km: '5', minutes: '32' } }, order: 0, createdAt: '2026-09-08T09:00:00Z', updatedAt: '' },
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
