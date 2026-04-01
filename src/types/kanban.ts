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

export function activityFieldsForName(name: string): ActivitySpecificFields {
  if (name === '운동') {
    return { type: 'exercise', data: { exerciseType: '', km: '', minutes: '' } }
  }
  if (name === '알고리즘') {
    return { type: 'algorithm', data: { problemNumber: '', solveTime: '', link: '' } }
  }
  return { type: 'general', data: { notes: '' } }
}
