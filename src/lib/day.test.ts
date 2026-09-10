import { describe, it, expect } from 'vitest'
import type { Activity, DaySegment, LegacyDayData, WeeklyRoutines } from '../types/schedule'
import { SLEEP_ACTIVITY, UNKNOWN_ACTIVITY, emptyWeekly } from '../types/schedule'
import {
  normalizeSegments, paintRange, applyRecord, expandSegments, overlayRoutines, makeResolver,
  segmentsFromLegacySlots, migrateLegacyDay, migrateWeekly, weeklyNeedsMigration, dayHasContent, isDayV2, isLegacyDay,
} from './day'

const ACTS: Activity[] = [
  { id: 'algo', name: '알고리즘', color: '#111', order: 0 },
  { id: 'run', name: '운동', color: '#222', order: 1 },
  { id: 'old', name: '옛활동', color: '#333', order: 2, archived: true },
]
const resolve = makeResolver(ACTS)
const seg = (start: number, end: number, activityId: string, record?: DaySegment['record']): DaySegment =>
  record ? { start, end, activityId, record } : { start, end, activityId }

describe('makeResolver', () => {
  it('팔레트·보관 활동·수면을 찾고, 모르는 id 는 대체값', () => {
    expect(resolve('algo').name).toBe('알고리즘')
    expect(resolve('old').name).toBe('옛활동')
    expect(resolve(SLEEP_ACTIVITY.id).name).toBe('수면')
    expect(resolve('nope')).toEqual(UNKNOWN_ACTIVITY)
  })
})

describe('normalizeSegments', () => {
  it('정렬하고 인접 같은 활동을 합친다', () => {
    const out = normalizeSegments([seg(60, 90, 'algo'), seg(0, 60, 'algo')])
    expect(out).toEqual([seg(0, 90, 'algo')])
  })

  it('기록이 다르면 합치지 않는다', () => {
    const out = normalizeSegments([seg(0, 60, 'algo', { title: 'a', description: '' }), seg(60, 90, 'algo')])
    expect(out).toHaveLength(2)
  })

  it('10분 단위로 스냅하고 빈 구간을 버린다', () => {
    const out = normalizeSegments([seg(3, 4, 'algo'), seg(100, 128, 'run')])
    expect(out).toEqual([seg(100, 130, 'run')])
  })

  it('겹치면 뒤 구간이 앞 구간을 자른다', () => {
    const out = normalizeSegments([seg(0, 60, 'algo'), seg(30, 90, 'run')])
    expect(out).toEqual([seg(0, 30, 'algo'), seg(30, 90, 'run')])
  })

  it('하루 범위 밖은 클립', () => {
    const out = normalizeSegments([seg(-20, 20, 'algo'), seg(1430, 1500, 'run')])
    expect(out).toEqual([seg(0, 20, 'algo'), seg(1430, 1440, 'run')])
  })
})

describe('paintRange', () => {
  it('빈 하루에 칠하기', () => {
    expect(paintRange([], 60, 120, 'algo')).toEqual([seg(60, 120, 'algo')])
  })

  it('가운데를 다른 활동으로 덮으면 양쪽이 남는다', () => {
    const out = paintRange([seg(0, 120, 'algo')], 30, 60, 'run')
    expect(out).toEqual([seg(0, 30, 'algo'), seg(30, 60, 'run'), seg(60, 120, 'algo')])
  })

  it('null 이면 지운다 (지우개)', () => {
    const out = paintRange([seg(0, 120, 'algo')], 30, 60, null)
    expect(out).toEqual([seg(0, 30, 'algo'), seg(60, 120, 'algo')])
  })

  it('같은 활동을 이어 칠하면 하나로 합쳐진다', () => {
    const out = paintRange([seg(0, 60, 'algo')], 60, 90, 'algo')
    expect(out).toEqual([seg(0, 90, 'algo')])
  })

  it('기록이 있는 구간 위에 같은 활동을 덧칠하면 덧칠한 부분은 기록이 없다', () => {
    const rec = { title: 't', description: 'd' }
    const out = paintRange([seg(0, 60, 'algo', rec)], 30, 90, 'algo')
    expect(out).toEqual([seg(0, 30, 'algo', rec), seg(30, 90, 'algo')])
  })

  it('입력 배열을 변이하지 않는다', () => {
    const src = [seg(0, 60, 'algo')]
    const snap = JSON.stringify(src)
    paintRange(src, 0, 30, 'run')
    expect(JSON.stringify(src)).toBe(snap)
  })
})

describe('applyRecord', () => {
  const rec = { title: '문제 풀이', description: '#1234' }

  it('구간 전체에 기록', () => {
    const out = applyRecord([seg(0, 60, 'algo')], 0, 60, rec)
    expect(out).toEqual([seg(0, 60, 'algo', rec)])
  })

  it('구간 일부에만 기록하면 경계에서 나뉜다', () => {
    const out = applyRecord([seg(0, 120, 'algo')], 30, 60, rec)
    expect(out).toEqual([seg(0, 30, 'algo'), seg(30, 60, 'algo', rec), seg(60, 120, 'algo')])
  })

  it('빈 자리에는 아무것도 만들지 않는다', () => {
    expect(applyRecord([], 0, 60, rec)).toEqual([])
  })

  it('undefined 로 기록을 지운다', () => {
    const out = applyRecord([seg(0, 60, 'algo', rec)], 0, 60, undefined)
    expect(out).toEqual([seg(0, 60, 'algo')])
  })
})

describe('expandSegments / overlayRoutines', () => {
  it('구간을 10분 슬롯으로 펼치고 활동 이름·색을 채운다', () => {
    const rec = { title: 't', description: 'd' }
    const slots = expandSegments([seg(0, 20, 'algo', rec), seg(20, 30, 'nope')], resolve)
    expect(Object.keys(slots).map(Number).sort((a, b) => a - b)).toEqual([0, 10, 20])
    expect(slots[0]).toEqual({ activityId: 'algo', label: '알고리즘', color: '#111', record: rec, detail: 'd' })
    expect(slots[20].label).toBe(UNKNOWN_ACTIVITY.name)
  })

  it('루틴은 빈 자리에만 얹힌다', () => {
    const slots = expandSegments([seg(0, 10, 'algo')], resolve)
    const out = overlayRoutines(slots, [{ id: 'r', activityId: 'run', startMin: 0, endMin: 30, name: '운동', color: '#222' }])
    expect(out[0].activityId).toBe('algo')
    expect(out[10].activityId).toBe('run')
    expect(out[20].label).toBe('운동')
  })
})

describe('v1 → v2 마이그레이션', () => {
  const created: Record<string, string> = {}
  const idByName = (name: string, color: string) => {
    const hit = ACTS.find(a => a.name === name)
    if (hit) return hit.id
    created[name] ??= `new-${name}-${color}`
    return created[name]
  }

  it('연속 같은 활동은 한 구간으로, 없는 이름은 새 활동 id 로', () => {
    const legacy: LegacyDayData = {
      date: '2026-09-11', goal: '',
      slots: {
        0: { label: '알고리즘', color: '#111' },
        10: { label: '알고리즘', color: '#111' },
        20: { label: '독서', color: '#999', detail: '3장' },
        40: { label: '수면', color: '#3a3a4a' },
      },
    }
    const idByNameWithSleep = (n: string, c: string) => n === '수면' ? SLEEP_ACTIVITY.id : idByName(n, c)
    const v2 = migrateLegacyDay(legacy, idByNameWithSleep)
    expect(v2.v).toBe(2)
    expect(v2.segments).toEqual([
      seg(0, 20, 'algo'),
      seg(20, 30, 'new-독서-#999', { title: '', description: '3장' }),
      seg(40, 50, SLEEP_ACTIVITY.id),
    ])
  })

  it('record 가 다른 인접 슬롯은 나뉜다', () => {
    const rec = { title: 'A', description: '' }
    const segs = segmentsFromLegacySlots({ 0: { label: '운동', color: '#222', record: rec }, 10: { label: '운동', color: '#222' } }, idByName)
    expect(segs).toHaveLength(2)
  })

  it('weekly: v1 루틴만 변환하고 v2 는 그대로', () => {
    const weekly: WeeklyRoutines = {
      ...emptyWeekly(),
      mon: [{ id: 'r1', name: '운동', color: '#222', startMin: 0, endMin: 60 } as never],
      tue: [{ id: 'r2', activityId: 'algo', startMin: 0, endMin: 60 }],
    }
    expect(weeklyNeedsMigration(weekly)).toBe(true)
    const out = migrateWeekly(weekly, idByName)
    expect(out.mon).toEqual([{ id: 'r1', activityId: 'run', startMin: 0, endMin: 60 }])
    expect(out.tue).toEqual([{ id: 'r2', activityId: 'algo', startMin: 0, endMin: 60 }])
    expect(weeklyNeedsMigration(out)).toBe(false)
  })

  it('판별 함수', () => {
    expect(isDayV2({ v: 2, date: 'x', goal: '', segments: [] })).toBe(true)
    expect(isLegacyDay({ date: 'x', goal: '', slots: {} })).toBe(true)
    expect(isLegacyDay({ v: 2, segments: [] })).toBe(false)
    expect(dayHasContent({ v: 2, segments: [seg(0, 10, 'a')] })).toBe(true)
    expect(dayHasContent({ v: 2, segments: [] })).toBe(false)
    expect(dayHasContent({ slots: { 0: {} } })).toBe(true)
    expect(dayHasContent(null)).toBe(false)
  })
})
