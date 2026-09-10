/**
 * 저장 문서 스키마 (zod). 가져오기(import)와 마이그레이션에서 문서 모양을 검증한다.
 *
 * 로드 경로에서는 쓰지 않는다 — 약간 어긋난 문서를 버리면 데이터가 사라지므로,
 * 화면은 관대하게 읽고(docToSlots 등) 검증은 바깥에서 들어오는 파일에만 건다.
 */
import { z } from 'zod'

const min = z.number().int().min(0).max(1440)

export const SlotRecordSchema = z.object({
  title: z.string(),
  description: z.string(),
  activityFields: z.unknown().optional(),
})

export const ActivitySchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  color: z.string(),
  order: z.number(),
  archived: z.boolean().optional(),
})
export const ActivitiesSchema = z.array(ActivitySchema)

export const DaySegmentSchema = z.object({
  start: min,
  end: min,
  activityId: z.string().min(1),
  record: SlotRecordSchema.optional(),
})

export const DayDataV2Schema = z.object({
  v: z.literal(2),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  goal: z.string().default(''),
  segments: z.array(DaySegmentSchema),
})

export const LegacyTimeSlotSchema = z.object({
  label: z.string(),
  color: z.string(),
  detail: z.string().optional(),
  ticketId: z.string().optional(),
  record: SlotRecordSchema.optional(),
})

export const LegacyDayDataSchema = z.object({
  date: z.string(),
  goal: z.string().optional(),
  slots: z.record(z.string(), LegacyTimeSlotSchema),
})

/** day-* 문서: v2 또는 v1 */
export const DayDocSchema = z.union([DayDataV2Schema, LegacyDayDataSchema])

export const RoutineSchema = z.object({
  id: z.string(),
  activityId: z.string().min(1),
  startMin: min,
  endMin: min,
})
export const LegacyRoutineSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  startMin: min,
  endMin: min,
})
const RoutineListSchema = z.array(z.union([RoutineSchema, LegacyRoutineSchema]))

export const WeeklyRoutinesSchema = z.object({
  weekday: RoutineListSchema.default([]),
  weekend: RoutineListSchema.default([]),
  mon: RoutineListSchema.default([]),
  tue: RoutineListSchema.default([]),
  wed: RoutineListSchema.default([]),
  thu: RoutineListSchema.default([]),
  fri: RoutineListSchema.default([]),
  sat: RoutineListSchema.default([]),
  sun: RoutineListSchema.default([]),
})

export const TicketSchema = z.object({
  id: z.string().min(1),
  seq: z.number().optional(),
  title: z.string(),
  description: z.string().default(''),
  why: z.string().default(''),
  activityId: z.string().default(''),
  status: z.enum(['todo', 'progress', 'done']),
  activityFields: z.unknown(),
  order: z.number().default(0),
  createdAt: z.string(),
  updatedAt: z.string().default(''),
})
export const TicketsSchema = z.array(TicketSchema)

export const HabitSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  color: z.string(),
  order: z.number().default(0),
  createdAt: z.string().default(''),
})
export const HabitsSchema = z.array(HabitSchema)
export const HabitCheckSchema = z.object({ habitIds: z.array(z.string()) })
export const MemoDocSchema = z.object({ text: z.string(), updatedAt: z.string().default('') })

/** 키 접두어 → 스키마. 알 수 없는 키는 undefined (가져오기에서 건너뜀). */
export function schemaForKey(key: string): z.ZodType | undefined {
  if (key.startsWith('day-')) return DayDocSchema
  if (key === 'routines-weekly') return WeeklyRoutinesSchema
  if (key === 'routines') return z.array(LegacyRoutineSchema)
  if (key === 'activities') return ActivitiesSchema
  if (key === 'tickets') return TicketsSchema
  if (key === 'habits') return HabitsSchema
  if (key.startsWith('habit-checks-')) return HabitCheckSchema
  if (key.startsWith('memo-')) return MemoDocSchema
  return undefined
}


/** 가져오기용: 키에 맞는 스키마로 검증하고 정리된 값을 돌려준다 */
export function validateDoc(key: string, value: unknown): { ok: true; value: unknown } | { ok: false; reason: string } {
  const schema = schemaForKey(key)
  if (!schema) return { ok: false, reason: '알 수 없는 키' }
  const r = schema.safeParse(value)
  if (r.success) return { ok: true, value: r.data }
  const first = r.error.issues[0]
  return { ok: false, reason: first ? `${first.path.join('.') || '(root)'}: ${first.message}` : '형식 오류' }
}
