import { useCallback, useMemo } from 'react'
import { useDoc, useDocs, writeDoc } from '../store'
import { dateKeyOf, shiftDateKey } from '../lib/slots'

export interface Habit {
  id: string
  name: string
  color: string
  order: number
  createdAt: string
}

export interface HabitCheck {
  habitIds: string[]
}

const EMPTY_HABITS: Habit[] = []
const EMPTY_IDS: string[] = []
const STREAK_DAYS = 60

export function habitCheckKey(dateKey: string): string {
  return `habit-checks-${dateKey}`
}

export function useHabits(): [Habit[], (h: Habit[]) => void, boolean] {
  const doc = useDoc<Habit[]>('habits')
  const set = useCallback((h: Habit[]) => writeDoc('habits', h, { undo: true }), [])
  return [doc ?? EMPTY_HABITS, set, doc !== undefined]
}

export function useHabitChecks(dateKey: string): [string[], (ids: string[]) => void] {
  const key = habitCheckKey(dateKey)
  const doc = useDoc<HabitCheck>(key)
  const set = useCallback((ids: string[]) => writeDoc(key, { habitIds: ids } satisfies HabitCheck, { undo: true }), [key])
  return [doc?.habitIds ?? EMPTY_IDS, set]
}

/** 오늘부터 거꾸로 STREAK_DAYS 일의 연속 체크 일수. 오늘 미체크여도 어제까지의 연속은 유지. */
export function useHabitStreaks(habits: Habit[], todayKey: string): Record<string, number> {
  const keys = useMemo(() => {
    const out: string[] = []
    for (let i = 0; i < STREAK_DAYS; i++) out.push(habitCheckKey(shiftDateKey(todayKey, -i)))
    return out
  }, [todayKey])
  const checks = useDocs<HabitCheck>(keys)

  return useMemo(() => {
    const result: Record<string, number> = {}
    for (const h of habits) {
      let count = 0
      for (let i = 0; i < STREAK_DAYS; i++) {
        const ids = checks[i]?.habitIds ?? EMPTY_IDS
        if (ids.includes(h.id)) count++
        else if (i === 0) continue
        else break
      }
      result[h.id] = count
    }
    return result
  }, [habits, checks])
}

export function todayHabitKey(): string {
  return dateKeyOf(new Date())
}
