import { describe, it, expect, beforeEach } from 'vitest'
import { setStorageBackend } from '../lib/storage'
import { useDocStore } from './index'
import { ensureMigrated, rerunMigrations } from './migrations'
import { FakeBackend, tick } from './fakeBackend.test-util'
import type { Activity, DayData, WeeklyRoutines } from '../types/schedule'
import { SLEEP_ACTIVITY } from '../types/schedule'

let backend: FakeBackend

async function settle() { for (let i = 0; i < 10; i++) await tick() }

beforeEach(() => {
  backend = new FakeBackend()
  setStorageBackend(backend)
  useDocStore.getState().reset()
})

describe('v1 → v2 마이그레이션', () => {
  it('팔레트가 로드되기 전에는 아무것도 하지 않는다', async () => {
    backend.data.set('day-2026-09-10', { date: '2026-09-10', goal: '', slots: { 0: { label: '운동', color: '#222' } } })
    ensureMigrated()
    await settle()
    expect(backend.data.get('day-2026-09-10')).not.toHaveProperty('v')
  })

  it('day 문서를 구간으로 바꾸고, 팔레트에 없는 이름은 보관 활동으로 만든다', async () => {
    const acts: Activity[] = [{ id: 'run', name: '운동', color: '#222', order: 0 }]
    backend.data.set('activities', acts)
    backend.data.set('day-2026-09-10', {
      date: '2026-09-10', goal: '목표',
      slots: {
        0: { label: '운동', color: '#222' }, 10: { label: '운동', color: '#222' },
        20: { label: '독서', color: '#999', detail: '3장' },
        30: { label: '수면', color: '#3a3a4a' },
      },
    })
    backend.data.set('day-2026-09-11', { date: '2026-09-11', goal: '', slots: { 0: { label: '독서', color: '#999' } } })

    useDocStore.getState().ensure('activities')
    await tick()
    ensureMigrated()
    await settle()

    const d10 = backend.data.get('day-2026-09-10') as DayData
    expect(d10.v).toBe(2)
    expect(d10.goal).toBe('목표')
    const activities = backend.data.get('activities') as Activity[]
    const reading = activities.find(a => a.name === '독서')
    expect(reading).toBeDefined()
    expect(reading?.archived).toBe(true)
    expect(reading?.id).toBe('preset:reading')   // 프리셋 이름이라 프리셋 id 로 생성 (색도 프리셋 색)
    // '독서' 는 두 날에 있어도 한 번만 생성. 수면 프리셋은 팔레트에 없어서 추가됨 → run, 독서, 수면
    expect(activities).toHaveLength(3)
    expect(d10.segments).toEqual([
      { start: 0, end: 20, activityId: 'run' },
      { start: 20, end: 30, activityId: reading!.id, record: { title: '', description: '3장' } },
      { start: 30, end: 40, activityId: SLEEP_ACTIVITY.id },
    ])
    const d11 = backend.data.get('day-2026-09-11') as DayData
    expect(d11.segments[0].activityId).toBe(reading!.id)
  })

  it('이미 v2 인 문서는 다시 쓰지 않는다', async () => {
    backend.data.set('activities', [])
    backend.data.set('day-2026-09-10', { v: 2, date: '2026-09-10', goal: '', segments: [{ start: 0, end: 10, activityId: 'x' }] })
    useDocStore.getState().ensure('activities')
    await tick()
    ensureMigrated()
    await settle()
    expect(backend.saved.filter(([k]) => k.startsWith('day-'))).toHaveLength(0)
  })

  it('routines-weekly 의 v1 루틴을 activityId 로 바꾼다', async () => {
    backend.data.set('activities', [{ id: 'run', name: '운동', color: '#222', order: 0 }])
    backend.data.set('routines-weekly', {
      weekday: [], weekend: [], mon: [{ id: 'r1', name: '운동', color: '#222', startMin: 0, endMin: 60 }],
      tue: [], wed: [], thu: [], fri: [], sat: [], sun: [],
    })
    useDocStore.getState().ensure('activities')
    await tick()
    ensureMigrated()
    await settle()
    const w = backend.data.get('routines-weekly') as WeeklyRoutines
    expect(w.mon).toEqual([{ id: 'r1', activityId: 'run', startMin: 0, endMin: 60 }])
  })

  it('v0 routines.json 만 있으면 모든 요일로 복사하며 변환한다', async () => {
    backend.data.set('activities', [])
    backend.data.set('routines', [{ id: 'r1', name: '기록', color: '#abc', startMin: 600, endMin: 660 }])
    useDocStore.getState().ensure('activities')
    await tick()
    ensureMigrated()
    await settle()
    const w = backend.data.get('routines-weekly') as WeeklyRoutines
    expect(w.mon).toHaveLength(1)
    expect(w.sun).toHaveLength(1)
    expect(w.weekday[0].activityId).toBe(w.sun[0].activityId)
    const acts = backend.data.get('activities') as Activity[]
    expect(acts.find(a => a.name === '기록')?.archived).toBe(true)
  })

  it('한 백엔드에서는 한 번만 돌고, rerunMigrations 로 다시 돌릴 수 있다', async () => {
    backend.data.set('activities', [])
    useDocStore.getState().ensure('activities')
    await tick()
    ensureMigrated()
    await settle()
    // 가져오기로 v1 문서가 새로 들어옴
    useDocStore.getState().write('day-2026-09-12', { date: '2026-09-12', goal: '', slots: { 0: { label: 'X', color: '#000' } } })
    ensureMigrated()
    await settle()
    expect(backend.data.get('day-2026-09-12')).not.toHaveProperty('v')
    rerunMigrations()
    await settle()
    expect((backend.data.get('day-2026-09-12') as DayData).v).toBe(2)
  })
})

describe('프리셋 연결', () => {
  it('이름이 카탈로그와 같은 기존 활동에 presetId 를 붙이고, 묶인 이름은 프리셋 이름으로 바꾼다', async () => {
    backend.data.set('activities', [
      { id: 'u1', name: '운동', color: '#222', order: 0 },
      { id: 'u2', name: '커피, 음악, 독서', color: '#a2845e', order: 1 },
      { id: 'u3', name: '내 활동', color: '#000', order: 2 },
    ])
    useDocStore.getState().ensure('activities')
    await tick()
    ensureMigrated()
    await settle()
    const acts = backend.data.get('activities') as Activity[]
    expect(acts.find(a => a.id === 'u1')).toMatchObject({ presetId: 'preset:exercise', name: '운동' })
    expect(acts.find(a => a.id === 'u2')).toMatchObject({ presetId: 'preset:coffee', name: '커피' })
    expect(acts.find(a => a.id === 'u3')?.presetId).toBeUndefined()
    // 수면 프리셋이 문서에 없었으므로 추가됨
    expect(acts.find(a => a.id === SLEEP_ACTIVITY.id)).toMatchObject({ presetId: SLEEP_ACTIVITY.id, name: '수면' })
  })

  it('같은 프리셋 이름이 둘이면 첫 번째만 연결된다', async () => {
    backend.data.set('activities', [
      { id: 'u1', name: '운동', color: '#222', order: 0 },
      { id: 'u2', name: '운동', color: '#333', order: 1 },
    ])
    useDocStore.getState().ensure('activities')
    await tick()
    ensureMigrated()
    await settle()
    const acts = backend.data.get('activities') as Activity[]
    expect(acts.filter(a => a.presetId === 'preset:exercise')).toHaveLength(1)
  })

  it('v1 day 에만 있던 프리셋 이름은 프리셋 id 로 활동을 만든다', async () => {
    backend.data.set('activities', [])
    backend.data.set('day-2026-09-10', { date: '2026-09-10', goal: '', slots: { 0: { label: '독서', color: '#999' } } })
    useDocStore.getState().ensure('activities')
    await tick()
    ensureMigrated()
    await settle()
    const acts = backend.data.get('activities') as Activity[]
    const reading = acts.find(a => a.name === '독서')
    expect(reading).toMatchObject({ id: 'preset:reading', presetId: 'preset:reading', archived: true })
    const d = backend.data.get('day-2026-09-10') as DayData
    expect(d.segments[0].activityId).toBe('preset:reading')
  })
})
