export interface SlotRecord {
  title: string
  description: string
  activityFields?: import('../types/kanban').ActivitySpecificFields
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

export interface DayData {
  date: string
  goal: string
  slots: Record<number, TimeSlot>
}
