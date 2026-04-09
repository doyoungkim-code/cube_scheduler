import { useState, useEffect, useCallback, useRef } from 'react'
import type { Activity, DayData, Routine, TimeSlot, WeeklyRoutines } from '../types/schedule'
import { emptyWeekly, dayKeyFromDate } from '../types/schedule'

export function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function makeEmptyDay(date: string): DayData {
  return { date, goal: '', slots: {} }
}

function applyRoutines(day: DayData, routines: Routine[]): DayData {
  const slots = { ...day.slots }
  for (const r of routines) {
    for (let m = r.startMin; m < r.endMin; m += 10) {
      if (!slots[m]) {
        slots[m] = { label: r.name, color: r.color }
      }
    }
  }
  return { ...day, slots }
}

// dateKey string → Date → DayOfWeek
function getDayRoutines(weekly: WeeklyRoutines, dateKey: string): Routine[] {
  const [y, m, d] = dateKey.split('-').map(Number)
  if (!y || !m || !d) return []
  const date = new Date(y, m - 1, d)
  const dk = dayKeyFromDate(date)
  return weekly[dk]
}

export function useDayData(dateKey: string) {
  const [day, setDay] = useState<DayData>(() => makeEmptyDay(dateKey))
  const [weekly, setWeekly] = useState<WeeklyRoutines>(() => emptyWeekly())
  const [activities, setActivities] = useState<Activity[]>([])
  const [loaded, setLoaded] = useState(false)
  const dirtyDay = useRef(false)
  const dirtyWeekly = useRef(false)
  const dirtyActivities = useRef(false)

  useEffect(() => {
    let cancelled = false
    setLoaded(false)
    dirtyDay.current = false
    async function load() {
      if (window.electronAPI) {
        try {
          const saved = await window.electronAPI.loadData(`day-${dateKey}`) as DayData | null
          const savedWeekly = await window.electronAPI.loadData('routines-weekly') as WeeklyRoutines | null
          const savedActivities = await window.electronAPI.loadData('activities') as Activity[] | null
          if (cancelled) return

          if (savedWeekly) {
            setWeekly(savedWeekly)
          } else {
            // 마이그레이션: 기존 routines.json → 모든 요일에 복사
            const legacy = await window.electronAPI.loadData('routines') as Routine[] | null
            if (cancelled) return
            if (legacy && legacy.length > 0) {
              const migrated: WeeklyRoutines = {
                weekday: legacy, weekend: legacy,
                mon: legacy, tue: legacy, wed: legacy, thu: legacy, fri: legacy, sat: legacy, sun: legacy,
              }
              setWeekly(migrated)
              // 마이그레이션 즉시 저장
              window.electronAPI.saveData('routines-weekly', migrated)
            } else {
              setWeekly(emptyWeekly())
            }
          }

          if (savedActivities) setActivities(savedActivities)
          setDay(saved ?? makeEmptyDay(dateKey))
        } catch {
          if (!cancelled) setDay(makeEmptyDay(dateKey))
        }
      }
      if (!cancelled) setLoaded(true)
    }
    load()
    return () => { cancelled = true }
  }, [dateKey])

  useEffect(() => {
    if (!loaded || !dirtyDay.current) return
    if (window.electronAPI) window.electronAPI.saveData(`day-${dateKey}`, day)
  }, [day, dateKey, loaded])

  useEffect(() => {
    if (!loaded || !dirtyWeekly.current) return
    if (window.electronAPI) window.electronAPI.saveData('routines-weekly', weekly)
  }, [weekly, loaded])

  useEffect(() => {
    if (!loaded || !dirtyActivities.current) return
    if (window.electronAPI) window.electronAPI.saveData('activities', activities)
  }, [activities, loaded])

  // 해당 날짜 요일의 루틴 적용
  const dayRoutines = getDayRoutines(weekly, dateKey)
  const dayWithRoutines = applyRoutines(day, dayRoutines)

  const setGoal = useCallback((g: string) => {
    dirtyDay.current = true
    setDay(d => ({ ...d, goal: g }))
  }, [])

  const setSlot = useCallback((min: number, slot: TimeSlot | null) => {
    dirtyDay.current = true
    setDay(d => {
      const slots = { ...d.slots }
      if (slot) { slots[min] = slot } else { delete slots[min] }
      return { ...d, slots }
    })
  }, [])

  const setSlotRange = useCallback((startMin: number, endMin: number, slot: TimeSlot | null) => {
    dirtyDay.current = true
    setDay(d => {
      const slots = { ...d.slots }
      for (let m = startMin; m < endMin; m += 10) {
        if (slot) { slots[m] = slot } else { delete slots[m] }
      }
      return { ...d, slots }
    })
  }, [])

  const wrappedSetWeekly = useCallback((w: WeeklyRoutines) => {
    dirtyWeekly.current = true
    setWeekly(w)
  }, [])

  const wrappedSetActivities = useCallback((a: Activity[]) => {
    dirtyActivities.current = true
    setActivities(a)
  }, [])

  return {
    day: dayWithRoutines,
    rawDay: day,
    routines: dayRoutines,  // 호환성: 오늘 요일 루틴
    weekly,
    activities,
    setGoal,
    setSlot,
    setSlotRange,
    setWeekly: wrappedSetWeekly,
    setActivities: wrappedSetActivities,
  }
}
