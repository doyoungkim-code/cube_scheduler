import type { ActivitySpecificFields } from './kanban'

export interface SlotRecord {
  title: string
  description: string
  activityFields?: ActivitySpecificFields
}

export interface TimeSlot {
  label: string
  color: string
  detail?: string
  ticketId?: string
  record?: SlotRecord
}

export interface Routine {
  id: string
  name: string
  color: string
  startMin: number
  endMin: number
}

export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

export interface WeeklyRoutines {
  weekday: Routine[]   // 템플릿
  weekend: Routine[]   // 템플릿
  mon: Routine[]
  tue: Routine[]
  wed: Routine[]
  thu: Routine[]
  fri: Routine[]
  sat: Routine[]
  sun: Routine[]
}

export const DAY_KEYS: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

export function emptyWeekly(): WeeklyRoutines {
  return { weekday: [], weekend: [], mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] }
}

// JS Date.getDay(): 0=일, 1=월, ..., 6=토
export function dayKeyFromDate(date: Date): DayOfWeek {
  const dow = date.getDay()
  return dow === 0 ? 'sun' : DAY_KEYS[dow - 1]
}

export interface Activity {
  id: string
  name: string
  color: string
  order: number
}

export const SLEEP_ACTIVITY: Activity = {
  id: '__sleep__',
  name: '수면',
  color: '#3a3a4a',
  order: -1,
}

/** 팔레트의 지우개. 선택하면 드래그한 구간이 지워진다. */
export const ERASER_ACTIVITY: Activity = {
  id: 'eraser',
  name: '지우개',
  color: '#ff3b30',
  order: -1,
}

export interface DayData {
  date: string
  goal: string
  slots: Record<number, TimeSlot>
}
