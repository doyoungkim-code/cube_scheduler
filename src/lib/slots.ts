/**
 * 슬롯 / 날짜 공용 헬퍼. TimeTable, TimelineVertical, 위젯들이 함께 사용한다.
 */
import type { RoutineView, TimeSlot, SlotRecord } from '../types/schedule'

export const TOTAL_MIN = 1440

export function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

export function fmtMin(m: number): string {
  return `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`
}

/** 분 → "2h 30m" / "40m" */
export function fmtDuration(mins: number): string {
  if (mins >= 60) {
    const h = Math.floor(mins / 60)
    const mm = mins % 60
    return mm ? `${h}h ${mm}m` : `${h}h`
  }
  return `${mins}m`
}

// ---------------------------------------------------------------- 날짜 키

export function dateKeyOf(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function shiftDateKey(key: string, days: number): string {
  const d = parseDateKey(key)
  d.setDate(d.getDate() + days)
  return dateKeyOf(d)
}

/** 해당 날짜가 속한 주의 월~일 7개 키 */
export function weekOf(key: string): string[] {
  const d = parseDateKey(key)
  const dow = (d.getDay() + 6) % 7 // 월=0
  const monday = new Date(d)
  monday.setDate(d.getDate() - dow)
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(monday)
    x.setDate(monday.getDate() + i)
    return dateKeyOf(x)
  })
}

// ---------------------------------------------------------------- 그룹핑

export interface TaskGroup {
  activityId: string
  label: string
  color: string
  detail: string
  record: SlotRecord | undefined
  startMin: number
  endMin: number
  isRoutine: boolean
  containsNow: boolean
}

/** 연속된 같은 활동 슬롯을 구간으로 묶는다 (루틴 전용 구간은 isRoutine) */
export function groupAllSlots(
  day: { slots: Record<number, TimeSlot> },
  rawSlots: Record<number, TimeSlot>,
  routineMap: Record<number, RoutineView>,
  nowSlotMin: number,
): TaskGroup[] {
  const groups: TaskGroup[] = []
  let current: TaskGroup | null = null

  for (let m = 0; m < TOTAL_MIN; m += 10) {
    const slot = day.slots[m]
    if (!slot) {
      if (current) { groups.push(current); current = null }
      continue
    }
    const raw = rawSlots[m]
    const isRoutine = !raw && !!routineMap[m]

    if (current && current.activityId === slot.activityId && current.color === slot.color && current.isRoutine === isRoutine) {
      current.endMin = m + 10
      if (m === nowSlotMin) current.containsNow = true
      if (slot.detail && !current.detail) current.detail = slot.detail
      if (slot.record && !current.record) current.record = slot.record
    } else {
      if (current) groups.push(current)
      current = {
        activityId: slot.activityId,
        label: slot.label,
        color: slot.color,
        detail: slot.detail ?? '',
        record: slot.record,
        startMin: m,
        endMin: m + 10,
        isRoutine,
        containsNow: m === nowSlotMin,
      }
    }
  }
  if (current) groups.push(current)
  return groups
}

export function buildRoutineMap(routines: readonly RoutineView[]): Record<number, RoutineView> {
  const map: Record<number, RoutineView> = {}
  for (const r of routines) {
    for (let m = r.startMin; m < r.endMin; m += 10) map[m] = r
  }
  return map
}

// ---------------------------------------------------------------- 요약

export interface ActivitySummary { label: string; color: string; minutes: number }

/** 활동별 누적 시간 (내림차순) */
export function summarizeByActivity(slots: Record<number, TimeSlot>): { items: ActivitySummary[]; total: number } {
  const map = new Map<string, ActivitySummary>()
  let total = 0
  for (const slot of Object.values(slots)) {
    const cur = map.get(slot.label)
    if (cur) cur.minutes += 10
    else map.set(slot.label, { label: slot.label, color: slot.color, minutes: 10 })
    total += 10
  }
  return { items: [...map.values()].sort((a, b) => b.minutes - a.minutes), total }
}

/** 하루 슬롯을 연속 색 구간으로 압축 (미니 바 렌더용) */
export function compressDayBar(slots: Record<number, TimeSlot>): { color: string | null; pct: number }[] {
  const segs: { color: string | null; pct: number }[] = []
  for (let m = 0; m < TOTAL_MIN; m += 10) {
    const color = slots[m]?.color ?? null
    const last = segs[segs.length - 1]
    if (last && last.color === color) last.pct += 100 / 144
    else segs.push({ color, pct: 100 / 144 })
  }
  return segs
}
