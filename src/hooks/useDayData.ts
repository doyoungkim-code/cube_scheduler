import { useCallback, useEffect, useMemo } from 'react'
import type {
  Activity, DayData, LegacyDayData, RoutineView, SlotRecord, TimeSlot, WeeklyRoutines, WeeklyRoutinesView,
} from '../types/schedule'
import { emptyWeekly, dayKeyFromDate } from '../types/schedule'
import { parseDateKey, dateKeyOf } from '../lib/slots'
import {
  applyRecord, expandSegments, isDayV2, isLegacyDay, makeEmptyDay, makeResolver, overlayRoutines,
  paintRange, resolveWeekly, toStoredWeekly, type ActivityResolver,
} from '../lib/day'
import { useDoc, useDocs, useDocStore, writeDoc, undoLast } from '../store'
import { ensureMigrated, migrateDayDocNow } from '../store/migrations'

export function todayKey(): string {
  return dateKeyOf(new Date())
}

export function dayDocKey(dateKey: string): string {
  return `day-${dateKey}`
}

/** 화면용 하루: 10분 슬롯 맵 (저장 형식 아님) */
export interface DayView {
  date: string
  goal: string
  slots: Record<number, TimeSlot>
}

const EMPTY_SLOTS: Record<number, TimeSlot> = {}
const EMPTY_ACTIVITIES: Activity[] = []

// ---------------------------------------------------------------- 활동 팔레트

/** 팔레트 전체 (보관된 것 포함). 화면 팔레트는 useVisibleActivities. */
export function useActivities(): [Activity[], (a: Activity[]) => void] {
  const doc = useDoc<Activity[]>('activities')
  useEffect(() => { ensureMigrated() }, [doc])
  const set = useCallback((a: Activity[]) => writeDoc('activities', a, { undo: true }), [])
  return [doc ?? EMPTY_ACTIVITIES, set]
}

export function useActivityResolver(): ActivityResolver {
  const [activities] = useActivities()
  return useMemo(() => makeResolver(activities), [activities])
}

/** 팔레트에 보이는 활동만 (archived 제외), order 순 */
export function useVisibleActivities(): [Activity[], (a: Activity[]) => void] {
  const [all, setAll] = useActivities()
  const visible = useMemo(() => all.filter(a => !a.archived).sort((a, b) => a.order - b.order), [all])
  // 화면 팔레트의 편집 결과를 전체 목록에 합쳐 저장 (보관된 활동은 유지)
  const set = useCallback((next: Activity[]) => {
    const nextIds = new Set(next.map(a => a.id))
    const archived = all.filter(a => a.archived && !nextIds.has(a.id))
    // 팔레트에서 지운 활동은 삭제 대신 보관 (과거 기록이 참조)
    const removed = all.filter(a => !a.archived && !nextIds.has(a.id)).map(a => ({ ...a, archived: true }))
    setAll([...next, ...archived, ...removed])
  }, [all, setAll])
  return [visible, set]
}

// ---------------------------------------------------------------- 요일별 루틴

export function useWeeklyRoutines(): [WeeklyRoutinesView, (w: WeeklyRoutines | WeeklyRoutinesView) => void] {
  const doc = useDoc<WeeklyRoutines>('routines-weekly')
  const resolve = useActivityResolver()
  const weekly = useMemo(() => resolveWeekly(doc ? { ...emptyWeekly(), ...doc } : emptyWeekly(), resolve), [doc, resolve])
  const set = useCallback((w: WeeklyRoutines | WeeklyRoutinesView) => writeDoc('routines-weekly', toStoredWeekly(w), { undo: true }), [])
  return [weekly, set]
}

// ---------------------------------------------------------------- 하루 문서 읽기

/** v2 / 아직 안 바뀐 v1 문서 모두를 슬롯 맵으로. (v1 은 마이그레이션 전까지 이름·색을 그대로 보여 준다) */
export function docToSlots(doc: unknown, resolve: ActivityResolver): Record<number, TimeSlot> {
  if (isDayV2(doc)) return expandSegments(doc.segments, resolve)
  if (isLegacyDay(doc)) {
    const out: Record<number, TimeSlot> = {}
    for (const [k, s] of Object.entries((doc as LegacyDayData).slots ?? {})) {
      if (!s || typeof s.label !== 'string') continue
      const slot: TimeSlot = { activityId: `legacy:${s.label}`, label: s.label, color: s.color }
      if (s.record) { slot.record = s.record; slot.detail = s.record.description }
      else if (s.detail) slot.detail = s.detail
      out[Number(k)] = slot
    }
    return out
  }
  return EMPTY_SLOTS
}

/** 여러 날의 슬롯 맵. 키 순서와 같은 배열. undefined = 로딩 중. */
export function useDaysSlots(dateKeys: readonly string[]): (Record<number, TimeSlot> | undefined)[] {
  const docs = useDocs<unknown>(useMemo(() => dateKeys.map(dayDocKey), [dateKeys]))
  const resolve = useActivityResolver()
  return useMemo(() => docs.map(d => d === undefined ? undefined : docToSlots(d, resolve)), [docs, resolve])
}

// ---------------------------------------------------------------- 하루 데이터 + 편집

function getDayRoutines(weekly: WeeklyRoutinesView, dateKey: string): RoutineView[] {
  const [y, m, d] = dateKey.split('-').map(Number)
  if (!y || !m || !d) return []
  return weekly[dayKeyFromDate(parseDateKey(dateKey))] ?? []
}

/**
 * 날짜 하나의 슬롯 + 루틴 병합 + 편집 액션.
 * 같은 dateKey 를 보는 컴포넌트가 여러 개여도 스토어 상태는 한 벌이다.
 */
export function useDayData(dateKey: string) {
  const key = dayDocKey(dateKey)
  const saved = useDoc<unknown>(key)
  const [weekly, setWeekly] = useWeeklyRoutines()
  const [activities, setActivities] = useVisibleActivities()
  const resolve = useActivityResolver()

  const rawSlots = useMemo(() => saved ? docToSlots(saved, resolve) : EMPTY_SLOTS, [saved, resolve])
  const goal = isDayV2(saved) || isLegacyDay(saved) ? ((saved as DayData).goal ?? '') : ''
  const rawDay = useMemo<DayView>(() => ({ date: dateKey, goal, slots: rawSlots }), [dateKey, goal, rawSlots])
  const dayRoutines = useMemo(() => getDayRoutines(weekly, dateKey), [weekly, dateKey])
  const day = useMemo<DayView>(() => ({ ...rawDay, slots: overlayRoutines(rawSlots, dayRoutines) }), [rawDay, rawSlots, dayRoutines])

  /** 쓰기 직전의 최신 v2 문서. 아직 v1 이면 그 자리에서 변환해 기존 기록을 잃지 않는다. */
  const current = useCallback((): DayData => {
    const doc = useDocStore.getState().docs[key]
    if (isDayV2(doc)) return doc
    return migrateDayDocNow(doc, dateKey) ?? makeEmptyDay(dateKey)
  }, [key, dateKey])

  const setGoal = useCallback((g: string) => {
    writeDoc(key, { ...current(), goal: g }, { undo: true })
  }, [key, current])

  /** [startMin, endMin) 을 활동으로 칠하거나(activityId) 지운다(null) */
  const setSlotRange = useCallback((startMin: number, endMin: number, activityId: string | null) => {
    const d = current()
    writeDoc(key, { ...d, segments: paintRange(d.segments, startMin, endMin, activityId) }, { undo: true })
  }, [key, current])

  const setSlot = useCallback((min: number, activityId: string | null) => {
    setSlotRange(min, min + 10, activityId)
  }, [setSlotRange])

  /** 구간의 슬롯에 기록(제목·설명·세부 항목)을 붙인다. 빈 자리는 건드리지 않는다. */
  const setRecordRange = useCallback((startMin: number, endMin: number, record: SlotRecord) => {
    const d = current()
    writeDoc(key, { ...d, segments: applyRecord(d.segments, startMin, endMin, record) }, { undo: true })
  }, [key, current])

  return {
    day,
    rawDay,
    routines: dayRoutines,
    weekly,
    activities,
    resolve,
    loaded: saved !== undefined,
    setGoal,
    setSlot,
    setSlotRange,
    setRecordRange,
    undo: undoLast,
    setWeekly,
    setActivities,
  }
}
