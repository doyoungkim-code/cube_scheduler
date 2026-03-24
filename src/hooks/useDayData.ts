import { useState, useEffect, useCallback } from 'react'
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

  useEffect(() => {
    let cancelled = false
    setLoaded(false)
    async function load() {
      if (window.electronAPI) {
        const saved = await window.electronAPI.loadData(`day-${dateKey}`) as DayData | null
        const savedRoutines = await window.electronAPI.loadData('routines') as Routine[] | null
        const savedActivities = await window.electronAPI.loadData('activities') as Activity[] | null
        if (cancelled) return
        if (savedRoutines) setRoutines(savedRoutines)
        if (savedActivities) setActivities(savedActivities)
        setDay(saved ?? makeEmptyDay(dateKey))
      }
      if (!cancelled) setLoaded(true)
    }
    load()
    return () => { cancelled = true }
  }, [dateKey])

  useEffect(() => {
    if (!loaded) return
    if (window.electronAPI) window.electronAPI.saveData(`day-${dateKey}`, day)
  }, [day, dateKey, loaded])

  useEffect(() => {
    if (!loaded) return
    if (window.electronAPI) window.electronAPI.saveData('routines', routines)
  }, [routines, loaded])

  useEffect(() => {
    if (!loaded) return
    if (window.electronAPI) window.electronAPI.saveData('activities', activities)
  }, [activities, loaded])

  const dayWithRoutines = applyRoutines(day, routines)

  const setGoal = useCallback((g: string) => setDay(d => ({ ...d, goal: g })), [])

  const setSlot = useCallback((min: number, slot: TimeSlot | null) => {
    setDay(d => {
      const slots = { ...d.slots }
      if (slot) { slots[min] = slot } else { delete slots[min] }
      return { ...d, slots }
    })
  }, [])

  const setSlotRange = useCallback((startMin: number, endMin: number, slot: TimeSlot | null) => {
    setDay(d => {
      const slots = { ...d.slots }
      for (let m = startMin; m < endMin; m += 10) {
        if (slot) { slots[m] = slot } else { delete slots[m] }
      }
      return { ...d, slots }
    })
  }, [])

  return {
    day: dayWithRoutines,
    rawDay: day,
    routines,
    activities,
    setGoal,
    setSlot,
    setSlotRange,
    setRoutines,
    setActivities,
  }
}
