import { useCallback, useEffect, useMemo } from 'react'
import type { Activity, DayData, Routine, TimeSlot, WeeklyRoutines } from '../types/schedule'
import { emptyWeekly, dayKeyFromDate } from '../types/schedule'
import { parseDateKey, dateKeyOf } from '../lib/slots'
import { useDoc, useDocStore, writeDoc, undoLast } from '../store'

export function todayKey(): string {
  return dateKeyOf(new Date())
}

export function dayDocKey(dateKey: string): string {
  return `day-${dateKey}`
}

function makeEmptyDay(date: string): DayData {
  return { date, goal: '', slots: {} }
}

function applyRoutines(day: DayData, routines: Routine[]): DayData {
  if (routines.length === 0) return day
  const slots = { ...day.slots }
  for (const r of routines) {
    for (let m = r.startMin; m < r.endMin; m += 10) {
      if (!slots[m]) slots[m] = { label: r.name, color: r.color }
    }
  }
  return { ...day, slots }
}

function getDayRoutines(weekly: WeeklyRoutines, dateKey: string): Routine[] {
  const [y, m, d] = dateKey.split('-').map(Number)
  if (!y || !m || !d) return []
  return weekly[dayKeyFromDate(parseDateKey(dateKey))] ?? []
}

const EMPTY_ACTIVITIES: Activity[] = []

// ---------------------------------------------------------------- 활동 팔레트

export function useActivities(): [Activity[], (a: Activity[]) => void] {
  const doc = useDoc<Activity[]>('activities')
  const set = useCallback((a: Activity[]) => writeDoc('activities', a, { undo: true }), [])
  return [doc ?? EMPTY_ACTIVITIES, set]
}

// ---------------------------------------------------------------- 요일별 루틴

let legacyMigrationStarted = false

export function useWeeklyRoutines(): [WeeklyRoutines, (w: WeeklyRoutines) => void] {
  const doc = useDoc<WeeklyRoutines>('routines-weekly')
  const legacy = useDoc<Routine[]>('routines')

  // 마이그레이션: 예전 routines.json → 모든 요일에 복사 (한 번만)
  useEffect(() => {
    if (doc !== null || legacy === undefined || legacyMigrationStarted) return
    if (!legacy || legacy.length === 0) return
    legacyMigrationStarted = true
    const migrated: WeeklyRoutines = {
      weekday: legacy, weekend: legacy,
      mon: legacy, tue: legacy, wed: legacy, thu: legacy, fri: legacy, sat: legacy, sun: legacy,
    }
    writeDoc('routines-weekly', migrated)
  }, [doc, legacy])

  const weekly = useMemo(() => doc ? { ...emptyWeekly(), ...doc } : emptyWeekly(), [doc])
  const set = useCallback((w: WeeklyRoutines) => writeDoc('routines-weekly', w, { undo: true }), [])
  return [weekly, set]
}

// ---------------------------------------------------------------- 하루 데이터

/**
 * 날짜 하나의 슬롯 + 루틴 병합 + 편집 액션.
 * 같은 dateKey 를 보는 컴포넌트가 여러 개여도 스토어 상태는 한 벌이다.
 */
export function useDayData(dateKey: string) {
  const key = dayDocKey(dateKey)
  const saved = useDoc<DayData>(key)
  const [weekly, setWeekly] = useWeeklyRoutines()
  const [activities, setActivities] = useActivities()

  const rawDay = useMemo(() => saved ?? makeEmptyDay(dateKey), [saved, dateKey])
  const dayRoutines = useMemo(() => getDayRoutines(weekly, dateKey), [weekly, dateKey])
  const day = useMemo(() => applyRoutines(rawDay, dayRoutines), [rawDay, dayRoutines])

  const current = useCallback((): DayData => {
    return (useDocStore.getState().docs[key] as DayData | null | undefined) ?? makeEmptyDay(dateKey)
  }, [key, dateKey])

  const setGoal = useCallback((g: string) => {
    writeDoc(key, { ...current(), goal: g }, { undo: true })
  }, [key, current])

  const setSlot = useCallback((min: number, slot: TimeSlot | null) => {
    const d = current()
    const slots = { ...d.slots }
    if (slot) slots[min] = slot; else delete slots[min]
    writeDoc(key, { ...d, slots }, { undo: true })
  }, [key, current])

  const setSlotRange = useCallback((startMin: number, endMin: number, slot: TimeSlot | null) => {
    const d = current()
    const slots = { ...d.slots }
    for (let m = startMin; m < endMin; m += 10) {
      if (slot) slots[m] = slot; else delete slots[m]
    }
    writeDoc(key, { ...d, slots }, { undo: true })
  }, [key, current])

  /** 여러 슬롯을 한 번에 갱신 (undo 1단계) */
  const updateSlots = useCallback((updater: (slots: Record<number, TimeSlot>) => Record<number, TimeSlot>) => {
    const d = current()
    writeDoc(key, { ...d, slots: updater({ ...d.slots }) }, { undo: true })
  }, [key, current])

  return {
    day,
    rawDay,
    routines: dayRoutines,
    weekly,
    activities,
    loaded: saved !== undefined,
    setGoal,
    setSlot,
    setSlotRange,
    updateSlots,
    undo: undoLast,
    setWeekly,
    setActivities,
  }
}
