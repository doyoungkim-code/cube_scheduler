/**
 * 하루 데이터(v2, 구간 리스트)에 대한 순수 연산.
 *
 * 저장은 segments 로 하고, 화면은 expandSegments 로 만든 10분 슬롯 맵을 쓴다.
 * 활동은 id 로만 참조하며 이름·색은 ActivityResolver 로 매번 조회한다.
 */
import type {
  Activity, DayData, DaySegment, LegacyDayData, LegacyRoutine, LegacyTimeSlot,
  Routine, RoutineView, SlotRecord, TimeSlot, WeeklyRoutines, WeeklyRoutinesView,
} from '../types/schedule'
import { SLEEP_ACTIVITY, UNKNOWN_ACTIVITY, WEEKLY_KEYS, emptyWeekly } from '../types/schedule'
import { TOTAL_MIN } from './slots'

export const SLOT_MIN = 10

// ---------------------------------------------------------------- 활동 조회

export type ActivityResolver = (id: string) => Pick<Activity, 'name' | 'color'>

/** 팔레트(보관된 것 포함) + 수면으로 resolver 를 만든다. 모르는 id 는 UNKNOWN_ACTIVITY. */
export function makeResolver(activities: readonly Activity[]): ActivityResolver {
  const map = new Map<string, Activity>()
  map.set(SLEEP_ACTIVITY.id, SLEEP_ACTIVITY)
  for (const a of activities) map.set(a.id, a)
  return id => map.get(id) ?? UNKNOWN_ACTIVITY
}

// ---------------------------------------------------------------- 구간 연산

function snap(m: number): number {
  return Math.round(m / SLOT_MIN) * SLOT_MIN
}

function sameRecord(a?: SlotRecord, b?: SlotRecord): boolean {
  if (!a && !b) return true
  if (!a || !b) return false
  return a.title === b.title && a.description === b.description
    && JSON.stringify(a.activityFields ?? null) === JSON.stringify(b.activityFields ?? null)
}

/** 정렬·클립·빈 구간 제거·인접 동일 구간 병합. 모든 쓰기 경로가 마지막에 거친다. */
export function normalizeSegments(segments: readonly DaySegment[]): DaySegment[] {
  const clipped = segments
    .map(s => ({ ...s, start: Math.max(0, snap(s.start)), end: Math.min(TOTAL_MIN, snap(s.end)) }))
    .filter(s => s.end > s.start && s.activityId)
    .sort((a, b) => a.start - b.start)

  const out: DaySegment[] = []
  for (const s of clipped) {
    const last = out[out.length - 1]
    if (last && s.start < last.end) {
      // 겹침: 뒤 구간이 이긴다 (앞을 자른다)
      last.end = s.start
      if (last.end <= last.start) out.pop()
    }
    const prev = out[out.length - 1]
    if (prev && prev.end === s.start && prev.activityId === s.activityId && sameRecord(prev.record, s.record)) {
      prev.end = s.end
    } else {
      out.push({ ...s })
    }
  }
  return out
}

/** [start, end) 를 비우고 activityId 가 있으면 그 자리에 새 구간을 넣는다. */
export function paintRange(segments: readonly DaySegment[], start: number, end: number, activityId: string | null, record?: SlotRecord): DaySegment[] {
  const s0 = Math.max(0, snap(start)), e0 = Math.min(TOTAL_MIN, snap(end))
  if (e0 <= s0) return [...segments]
  const out: DaySegment[] = []
  for (const s of segments) {
    if (s.end <= s0 || s.start >= e0) { out.push(s); continue }
    if (s.start < s0) out.push({ ...s, end: s0 })
    if (s.end > e0) out.push({ ...s, start: e0 })
  }
  if (activityId) out.push(record ? { start: s0, end: e0, activityId, record } : { start: s0, end: e0, activityId })
  return normalizeSegments(out)
}

/** [start, end) 안에 있는 구간(경계에 걸치면 잘라서)에 기록을 붙인다. 빈 자리는 건드리지 않는다. */
export function applyRecord(segments: readonly DaySegment[], start: number, end: number, record: SlotRecord | undefined): DaySegment[] {
  const s0 = Math.max(0, snap(start)), e0 = Math.min(TOTAL_MIN, snap(end))
  const out: DaySegment[] = []
  for (const s of segments) {
    if (s.end <= s0 || s.start >= e0) { out.push(s); continue }
    if (s.start < s0) out.push({ ...s, end: s0 })
    const mid: DaySegment = { start: Math.max(s.start, s0), end: Math.min(s.end, e0), activityId: s.activityId }
    if (record) mid.record = record
    out.push(mid)
    if (s.end > e0) out.push({ ...s, start: e0 })
  }
  return normalizeSegments(out)
}

/** 구간 리스트 → 10분 슬롯 맵 (화면용) */
export function expandSegments(segments: readonly DaySegment[], resolve: ActivityResolver): Record<number, TimeSlot> {
  const slots: Record<number, TimeSlot> = {}
  for (const s of segments) {
    const a = resolve(s.activityId)
    for (let m = s.start; m < s.end; m += SLOT_MIN) {
      const slot: TimeSlot = { activityId: s.activityId, label: a.name, color: a.color }
      if (s.record) { slot.record = s.record; slot.detail = s.record.description }
      slots[m] = slot
    }
  }
  return slots
}

/** 루틴을 유령 구간으로 얹는다 (직접 칠한 자리는 그대로). */
export function overlayRoutines(slots: Record<number, TimeSlot>, routines: readonly RoutineView[]): Record<number, TimeSlot> {
  if (routines.length === 0) return slots
  const out = { ...slots }
  for (const r of routines) {
    for (let m = r.startMin; m < r.endMin; m += SLOT_MIN) {
      if (!out[m]) out[m] = { activityId: r.activityId, label: r.name, color: r.color }
    }
  }
  return out
}

export function makeEmptyDay(date: string): DayData {
  return { v: 2, date, goal: '', segments: [] }
}

export function dayHasContent(doc: unknown): boolean {
  if (!doc || typeof doc !== 'object') return false
  const d = doc as Partial<DayData> & Partial<LegacyDayData>
  if (Array.isArray(d.segments)) return d.segments.length > 0
  if (d.slots && typeof d.slots === 'object') return Object.keys(d.slots).length > 0
  return false
}

// ---------------------------------------------------------------- 루틴 조회

export function resolveRoutines(routines: readonly Routine[], resolve: ActivityResolver): RoutineView[] {
  return routines.map(r => ({ ...r, ...resolve(r.activityId) }))
}

export function resolveWeekly(weekly: WeeklyRoutines, resolve: ActivityResolver): WeeklyRoutinesView {
  const out = {} as WeeklyRoutinesView
  for (const k of WEEKLY_KEYS) out[k] = resolveRoutines(weekly[k] ?? [], resolve)
  return out
}

/** 저장 전에 화면용 필드(name/color)를 떼어낸다 */
export function toStoredRoutine(r: Routine | RoutineView): Routine {
  return { id: r.id, activityId: r.activityId, startMin: r.startMin, endMin: r.endMin }
}

export function toStoredWeekly(weekly: WeeklyRoutines | WeeklyRoutinesView): WeeklyRoutines {
  const out = emptyWeekly()
  for (const k of WEEKLY_KEYS) out[k] = (weekly[k] ?? []).map(toStoredRoutine)
  return out
}

// ---------------------------------------------------------------- v1 → v2 마이그레이션

export function isDayV2(doc: unknown): doc is DayData {
  return !!doc && typeof doc === 'object' && (doc as DayData).v === 2 && Array.isArray((doc as DayData).segments)
}

export function isLegacyDay(doc: unknown): doc is LegacyDayData {
  return !!doc && typeof doc === 'object' && !('v' in (doc as object)) && typeof (doc as LegacyDayData).slots === 'object'
}

export function isLegacyRoutine(r: unknown): r is LegacyRoutine {
  return !!r && typeof r === 'object' && typeof (r as LegacyRoutine).name === 'string' && !('activityId' in (r as object))
}

/** 이름(+색)으로 활동 id 를 찾아 주는 함수. 없으면 만들어서라도 돌려준다. */
export type ActivityIdByName = (name: string, color: string) => string

/**
 * v1 슬롯 맵 → v2 구간. 연속된 같은 label+color+record 를 한 구간으로.
 * 예전 `detail` 만 있고 record 가 없던 슬롯은 record.description 으로 옮긴다.
 */
export function segmentsFromLegacySlots(slots: Record<number, LegacyTimeSlot>, idByName: ActivityIdByName): DaySegment[] {
  const segs: DaySegment[] = []
  for (let m = 0; m < TOTAL_MIN; m += SLOT_MIN) {
    const s = slots[m]
    if (!s || typeof s.label !== 'string') continue
    const activityId = idByName(s.label, s.color)
    let record: SlotRecord | undefined = s.record
    if (!record && s.detail) record = { title: '', description: s.detail }
    segs.push(record ? { start: m, end: m + SLOT_MIN, activityId, record } : { start: m, end: m + SLOT_MIN, activityId })
  }
  return normalizeSegments(segs)
}

export function migrateLegacyDay(doc: LegacyDayData, idByName: ActivityIdByName): DayData {
  return {
    v: 2,
    date: doc.date,
    goal: doc.goal ?? '',
    segments: segmentsFromLegacySlots(doc.slots ?? {}, idByName),
  }
}

export function migrateLegacyRoutine(r: LegacyRoutine, idByName: ActivityIdByName): Routine {
  return { id: r.id, activityId: idByName(r.name, r.color), startMin: r.startMin, endMin: r.endMin }
}

/** weekly 안에 v1 루틴이 하나라도 있으면 true */
export function weeklyNeedsMigration(weekly: WeeklyRoutines | null | undefined): boolean {
  if (!weekly) return false
  return WEEKLY_KEYS.some(k => (weekly[k] ?? []).some(r => isLegacyRoutine(r)))
}

export function migrateWeekly(weekly: WeeklyRoutines, idByName: ActivityIdByName): WeeklyRoutines {
  const out = emptyWeekly()
  for (const k of WEEKLY_KEYS) {
    out[k] = (weekly[k] ?? []).map(r => isLegacyRoutine(r) ? migrateLegacyRoutine(r, idByName) : toStoredRoutine(r))
  }
  return out
}
