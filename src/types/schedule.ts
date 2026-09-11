import type { ActivitySpecificFields } from './kanban'

/** 구간에 붙는 기록 (제목 / 설명 / 활동별 세부 항목) */
export interface SlotRecord {
  title: string
  description: string
  activityFields?: ActivitySpecificFields
}

// ---------------------------------------------------------------- 활동

export interface Activity {
  id: string
  name: string
  color: string
  order: number
  /** 팔레트에서 지운 활동. 과거 기록이 참조하므로 문서는 남기고 숨긴다. */
  archived?: boolean
  /** 카탈로그 프리셋에 연결된 활동 (lib/activityCatalog.ts). 방 이미지·세부 폼이 여기서 결정된다. */
  presetId?: string
  /** 방 이미지 키 (rooms/<키>.png). 없으면 프리셋 이미지, 그것도 없으면 기본 방. */
  roomImage?: string
}

export const SLEEP_ACTIVITY: Activity = {
  id: '__sleep__',
  name: '수면',
  color: '#3a3a4a',
  order: -1,
}

/** 팔레트의 지우개. 선택하면 드래그한 구간이 지워진다. 저장되는 일은 없다. */
export const ERASER_ACTIVITY: Activity = {
  id: 'eraser',
  name: '지우개',
  color: '#ff3b30',
  order: -1,
}

/** 참조가 끊긴 활동 id 를 그릴 때 쓰는 대체 */
export const UNKNOWN_ACTIVITY: Pick<Activity, 'name' | 'color'> = { name: '(삭제된 활동)', color: '#8e8e93' }

// ---------------------------------------------------------------- 하루 (저장 형식 v2)

/** [start, end) 분 단위 구간. 10분 정렬, 겹치지 않고 start 오름차순. */
export interface DaySegment {
  start: number
  end: number
  activityId: string
  record?: SlotRecord
}

export interface DayData {
  v: 2
  date: string
  goal: string
  segments: DaySegment[]
}

/**
 * 화면용 10분 슬롯. 저장하지 않고 segments + 활동 팔레트에서 매번 만든다.
 * key 0~1430. label/color 는 활동에서 조회한 값.
 */
export interface TimeSlot {
  activityId: string
  label: string
  color: string
  detail?: string
  record?: SlotRecord
}

// ---------------------------------------------------------------- 루틴

/** 저장 형식: 활동은 id 로만 참조 */
export interface Routine {
  id: string
  activityId: string
  startMin: number
  endMin: number
}

/** 화면용: 이름·색을 활동에서 채운 것 */
export interface RoutineView extends Routine {
  name: string
  color: string
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

export type WeeklyRoutinesView = Record<keyof WeeklyRoutines, RoutineView[]>

export const DAY_KEYS: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
export const WEEKLY_KEYS: (keyof WeeklyRoutines)[] = ['weekday', 'weekend', ...DAY_KEYS]

export function emptyWeekly(): WeeklyRoutines {
  return { weekday: [], weekend: [], mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] }
}

// JS Date.getDay(): 0=일, 1=월, ..., 6=토
export function dayKeyFromDate(date: Date): DayOfWeek {
  const dow = date.getDay()
  return dow === 0 ? 'sun' : DAY_KEYS[dow - 1]
}

// ---------------------------------------------------------------- 예전 형식 (v1, 마이그레이션 전용)

export interface LegacyTimeSlot {
  label: string
  color: string
  detail?: string
  ticketId?: string
  record?: SlotRecord
}

export interface LegacyDayData {
  date: string
  goal?: string
  slots: Record<number, LegacyTimeSlot>
}

export interface LegacyRoutine {
  id: string
  name: string
  color: string
  startMin: number
  endMin: number
}
