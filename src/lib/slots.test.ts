import { describe, it, expect } from 'vitest'
import {
  TOTAL_MIN, pad2, fmtMin, fmtDuration,
  dateKeyOf, parseDateKey, shiftDateKey, weekOf,
  groupAllSlots, buildRoutineMap, summarizeByActivity, compressDayBar,
} from './slots'
import type { RoutineView, TimeSlot } from '../types/schedule'

// ---------------------------------------------------------------- 포맷

describe('pad2 / fmtMin', () => {
  it('두 자리로 채운다', () => {
    expect(pad2(0)).toBe('00')
    expect(pad2(7)).toBe('07')
    expect(pad2(12)).toBe('12')
  })

  it('분 → HH:MM', () => {
    expect(fmtMin(0)).toBe('00:00')
    expect(fmtMin(70)).toBe('01:10')
    expect(fmtMin(1430)).toBe('23:50')
  })
})

describe('fmtDuration', () => {
  it('60분 미만은 m 만', () => {
    expect(fmtDuration(10)).toBe('10m')
    expect(fmtDuration(50)).toBe('50m')
  })

  it('정확히 시간 단위면 trailing space 없이 h 만', () => {
    expect(fmtDuration(60)).toBe('1h')
    expect(fmtDuration(120)).toBe('2h')
  })

  it('시간 + 분', () => {
    expect(fmtDuration(90)).toBe('1h 30m')
    expect(fmtDuration(150)).toBe('2h 30m')
  })
})

// ---------------------------------------------------------------- 날짜 키

describe('dateKeyOf / parseDateKey', () => {
  it('로컬 날짜를 YYYY-MM-DD 로', () => {
    expect(dateKeyOf(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(dateKeyOf(new Date(2026, 11, 31))).toBe('2026-12-31')
  })

  it('왕복 변환이 같은 날짜', () => {
    const key = '2026-09-11'
    const d = parseDateKey(key)
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(8)
    expect(d.getDate()).toBe(11)
    expect(dateKeyOf(d)).toBe(key)
  })
})

describe('shiftDateKey', () => {
  it('월·연 경계를 넘긴다', () => {
    expect(shiftDateKey('2026-01-31', 1)).toBe('2026-02-01')
    expect(shiftDateKey('2026-12-31', 1)).toBe('2027-01-01')
    expect(shiftDateKey('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('0 이면 그대로', () => {
    expect(shiftDateKey('2026-09-11', 0)).toBe('2026-09-11')
  })
})

describe('weekOf', () => {
  it('월요일 시작 7일을 돌려준다', () => {
    // 2026-09-11 은 금요일
    const week = weekOf('2026-09-11')
    expect(week).toEqual([
      '2026-09-07', '2026-09-08', '2026-09-09', '2026-09-10',
      '2026-09-11', '2026-09-12', '2026-09-13',
    ])
  })

  it('일요일도 같은 주(월~일)에 속한다', () => {
    expect(weekOf('2026-09-13')[0]).toBe('2026-09-07')
    expect(weekOf('2026-09-07')[6]).toBe('2026-09-13')
  })
})

// ---------------------------------------------------------------- 그룹핑

const A: TimeSlot = { activityId: 'algo', label: '알고리즘', color: '#111' }
const B: TimeSlot = { activityId: 'run', label: '운동', color: '#222' }

function day(slots: Record<number, TimeSlot>) {
  return { date: '2026-09-11', goal: '', slots }
}

describe('buildRoutineMap', () => {
  it('루틴 구간을 10분 키로 펼친다', () => {
    const r: RoutineView = { id: 'r1', activityId: 'sleep', name: '수면', color: '#000', startMin: 0, endMin: 30 }
    const map = buildRoutineMap([r])
    expect(Object.keys(map).map(Number).sort((a, b) => a - b)).toEqual([0, 10, 20])
    expect(map[0]).toBe(r)
    expect(map[30]).toBeUndefined()
  })
})

describe('groupAllSlots', () => {
  it('연속 같은 활동을 한 구간으로 묶는다', () => {
    const d = day({ 0: A, 10: A, 20: A, 40: B })
    const groups = groupAllSlots(d, d.slots, {}, -1)
    expect(groups).toHaveLength(2)
    expect(groups[0]).toMatchObject({ label: '알고리즘', startMin: 0, endMin: 30, isRoutine: false })
    expect(groups[1]).toMatchObject({ label: '운동', startMin: 40, endMin: 50 })
  })

  it('활동이 바뀌면 인접해도 나눈다', () => {
    const d = day({ 0: A, 10: B, 20: A })
    const groups = groupAllSlots(d, d.slots, {}, -1)
    expect(groups.map(g => g.label)).toEqual(['알고리즘', '운동', '알고리즘'])
  })

  it('활동 id 가 다르면 같은 이름이어도 나눈다', () => {
    const d = day({ 0: A, 10: { ...A, activityId: 'algo2' } })
    expect(groupAllSlots(d, d.slots, {}, -1)).toHaveLength(2)
  })

  it('raw 에 없고 루틴 맵에 있는 슬롯은 isRoutine', () => {
    const routine: RoutineView = { id: 'r', activityId: 'sleep', name: '수면', color: '#000', startMin: 0, endMin: 20 }
    const routineSlot: TimeSlot = { activityId: 'sleep', label: '수면', color: '#000' }
    // day 는 루틴이 병합된 결과, raw 는 직접 칠한 것만
    const merged = day({ 0: routineSlot, 10: routineSlot, 20: A })
    const raw = { 20: A }
    const groups = groupAllSlots(merged, raw, buildRoutineMap([routine]), -1)
    expect(groups).toHaveLength(2)
    expect(groups[0]).toMatchObject({ label: '수면', isRoutine: true, startMin: 0, endMin: 20 })
    expect(groups[1]).toMatchObject({ label: '알고리즘', isRoutine: false })
  })

  it('직접 칠한 슬롯과 루틴 슬롯은 같은 이름이어도 분리', () => {
    const routine: RoutineView = { id: 'r', activityId: 'algo', name: '알고리즘', color: '#111', startMin: 0, endMin: 20 }
    const merged = day({ 0: A, 10: A, 20: A })
    const raw = { 20: A }
    const groups = groupAllSlots(merged, raw, buildRoutineMap([routine]), -1)
    expect(groups.map(g => g.isRoutine)).toEqual([true, false])
  })

  it('nowSlotMin 이 속한 구간에 containsNow', () => {
    const d = day({ 0: A, 10: A, 30: B })
    const groups = groupAllSlots(d, d.slots, {}, 10)
    expect(groups[0].containsNow).toBe(true)
    expect(groups[1].containsNow).toBe(false)
  })

  it('detail / record 는 구간 내 첫 값을 쓴다', () => {
    const rec = { title: 'T', description: 'D' }
    const d = day({
      0: A,
      10: { ...A, detail: 'first', record: rec },
      20: { ...A, detail: 'second' },
    })
    const [g] = groupAllSlots(d, d.slots, {}, -1)
    expect(g.detail).toBe('first')
    expect(g.record).toBe(rec)
  })

  it('빈 하루는 빈 배열', () => {
    const d = day({})
    expect(groupAllSlots(d, d.slots, {}, -1)).toEqual([])
  })

  it('마지막 슬롯(1430)까지 닫힌다', () => {
    const d = day({ 1420: A, 1430: A })
    const [g] = groupAllSlots(d, d.slots, {}, -1)
    expect(g.endMin).toBe(TOTAL_MIN)
  })
})

// ---------------------------------------------------------------- 요약

describe('summarizeByActivity', () => {
  it('활동별 분 합계를 내림차순으로', () => {
    const { items, total } = summarizeByActivity({ 0: A, 10: B, 20: B, 30: B })
    expect(total).toBe(40)
    expect(items).toEqual([
      { label: '운동', color: '#222', minutes: 30 },
      { label: '알고리즘', color: '#111', minutes: 10 },
    ])
  })

  it('빈 슬롯은 0', () => {
    expect(summarizeByActivity({})).toEqual({ items: [], total: 0 })
  })
})

describe('compressDayBar', () => {
  it('세그먼트 pct 합이 100', () => {
    const segs = compressDayBar({ 0: A, 10: A, 100: B })
    const sum = segs.reduce((s, x) => s + x.pct, 0)
    expect(sum).toBeCloseTo(100, 6)
  })

  it('빈 하루는 null 세그먼트 하나', () => {
    const segs = compressDayBar({})
    expect(segs).toHaveLength(1)
    expect(segs[0].color).toBeNull()
    expect(segs[0].pct).toBeCloseTo(100, 6)
  })

  it('연속 같은 색은 합치고 빈 구간은 null 로 분리', () => {
    const segs = compressDayBar({ 0: A, 10: A, 20: B })
    expect(segs.slice(0, 3).map(s => s.color)).toEqual(['#111', '#222', null])
    expect(segs[0].pct).toBeCloseTo(200 / 144, 6)
  })
})
