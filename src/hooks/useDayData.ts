import { useState, useEffect, useCallback, useRef } from 'react'
import type { Activity, DayData, Routine, TimeSlot } from '../types/schedule'

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

export function useDayData(dateKey: string) {
  const [day, setDay] = useState<DayData>(() => makeEmptyDay(dateKey))
  const [routines, setRoutines] = useState<Routine[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [loaded, setLoaded] = useState(false)
  const dirtyDay = useRef(false)
  const dirtyRoutines = useRef(false)
  const dirtyActivities = useRef(false)

  useEffect(() => {
    let cancelled = false
    setLoaded(false)
    dirtyDay.current = false
    async function load() {
      if (window.electronAPI) {
        try {
          const saved = await window.electronAPI.loadData(`day-${dateKey}`) as DayData | null
          const savedRoutines = await window.electronAPI.loadData('routines') as Routine[] | null
          const savedActivities = await window.electronAPI.loadData('activities') as Activity[] | null
          if (cancelled) return
          if (savedRoutines) setRoutines(savedRoutines)
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

  // day 저장 — dirty일 때만
  useEffect(() => {
    if (!loaded || !dirtyDay.current) return
    if (window.electronAPI) window.electronAPI.saveData(`day-${dateKey}`, day)
  }, [day, dateKey, loaded])

  // routines 저장 — dirty일 때만
  useEffect(() => {
    if (!loaded || !dirtyRoutines.current) return
    if (window.electronAPI) window.electronAPI.saveData('routines', routines)
  }, [routines, loaded])

  // activities 저장 — dirty일 때만
  useEffect(() => {
    if (!loaded || !dirtyActivities.current) return
    if (window.electronAPI) window.electronAPI.saveData('activities', activities)
  }, [activities, loaded])

  const dayWithRoutines = applyRoutines(day, routines)

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

  const wrappedSetRoutines = useCallback((r: Routine[]) => {
    dirtyRoutines.current = true
    setRoutines(r)
  }, [])

  const wrappedSetActivities = useCallback((a: Activity[]) => {
    dirtyActivities.current = true
    setActivities(a)
  }, [])

  return {
    day: dayWithRoutines,
    rawDay: day,
    routines,
    activities,
    setGoal,
    setSlot,
    setSlotRange,
    setRoutines: wrappedSetRoutines,
    setActivities: wrappedSetActivities,
  }
}
