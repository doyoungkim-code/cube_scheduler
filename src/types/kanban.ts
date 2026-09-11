export type KanbanStatus = 'todo' | 'progress' | 'done'

export interface ExerciseFields {
  exerciseType: string
  km: string
  minutes: string
}

export interface AlgorithmFields {
  problemNumber: string
  solveTime: string
  link: string
}

export interface GeneralFields {
  notes: string
}

export type ActivitySpecificFields =
  | { type: 'exercise'; data: ExerciseFields }
  | { type: 'algorithm'; data: AlgorithmFields }
  | { type: 'general'; data: GeneralFields }

export interface Ticket {
  id: string
  /** 표시용 고정 번호 (T12). 생성 시 부여되며 삭제돼도 다른 티켓 번호가 밀리지 않는다. */
  seq?: number
  title: string
  description: string
  why: string
  activityId: string
  status: KanbanStatus
  activityFields: ActivitySpecificFields
  order: number
  createdAt: string
  updatedAt: string
}

export function emptyActivityFields(): ActivitySpecificFields {
  return { type: 'general', data: { notes: '' } }
}

/** 세부 폼 종류로 빈 필드 만들기. 종류는 활동의 프리셋에서 온다 (lib/activityCatalog.ts fieldsKindOf). */
export function emptyFieldsOfKind(kind: ActivitySpecificFields['type']): ActivitySpecificFields {
  if (kind === 'exercise') return { type: 'exercise', data: { exerciseType: '', km: '', minutes: '' } }
  if (kind === 'algorithm') return { type: 'algorithm', data: { problemNumber: '', solveTime: '', link: '' } }
  return { type: 'general', data: { notes: '' } }
}
