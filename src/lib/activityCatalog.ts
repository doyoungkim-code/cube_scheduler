/**
 * 활동 프리셋 카탈로그 (코드에 고정).
 *
 * 사용자는 여기서 골라 팔레트에 담고, 없을 때만 직접 만든다. 프리셋으로 만든 활동은 id 가 프리셋 id 와 같아서
 * 사용자 간에도 같은 id 를 갖는다. 방 이미지·활동별 세부 폼은 이름이 아니라 프리셋 id 로 결정된다.
 *
 * 이미지 규약: public/rooms/<imageKey>.png. 파일이 없으면 화면에 "준비 중" 으로 뜬다 (RoomCard).
 * 이미지 키는 프리셋 id 에서 'preset:' 을 뗀 것. 예) preset:algorithm → rooms/algorithm.png
 */
import type { Activity } from '../types/schedule'
import { SLEEP_ACTIVITY } from '../types/schedule'
import type { ActivitySpecificFields } from '../types/kanban'

export type FieldsKind = ActivitySpecificFields['type']

export interface ActivityCategory {
  id: string
  name: string
  /** 카테고리 기본 색조 (활동 색이 없을 때·피커 탭 표시용) */
  color: string
}

export interface ActivityPreset {
  id: string
  name: string
  category: string
  color: string
  fields: FieldsKind
  /** 처음 시작하는 사용자에게 미리 체크해 주는 추천 세트 */
  recommended?: boolean
}

export const CATEGORIES: ActivityCategory[] = [
  { id: 'life', name: '생활', color: '#8e8378' },
  { id: 'study', name: '공부', color: '#4a9eff' },
  { id: 'work', name: '일', color: '#af52de' },
  { id: 'fitness', name: '운동', color: '#34c759' },
  { id: 'hobby', name: '취미', color: '#ff9500' },
  { id: 'journal', name: '기록', color: '#e0b300' },
  { id: 'people', name: '사람', color: '#ff5f8f' },
]

const P = (id: string, name: string, category: string, color: string, extra: Partial<ActivityPreset> = {}): ActivityPreset =>
  ({ id: `preset:${id}`, name, category, color, fields: 'general', ...extra })

export const PRESETS: ActivityPreset[] = [
  // 생활
  { id: SLEEP_ACTIVITY.id, name: SLEEP_ACTIVITY.name, category: 'life', color: SLEEP_ACTIVITY.color, fields: 'general', recommended: true },
  P('meal', '식사', 'life', '#ff9500', { recommended: true }),
  P('shower', '샤워', 'life', '#7fb3c9'),
  P('nap', '낮잠', 'life', '#5b5b73'),
  P('chores', '집안일', 'life', '#a08c7a'),
  P('commute', '이동', 'life', '#8e8e93'),
  P('errands', '장보기·외출', 'life', '#b39b7c'),
  // 공부
  P('algorithm', '알고리즘', 'study', '#4a9eff', { fields: 'algorithm', recommended: true }),
  P('english', '영어 공부', 'study', '#5ac8fa'),
  P('reading', '독서', 'study', '#3b7dd8', { recommended: true }),
  P('lecture', '강의·수업', 'study', '#2f6fbf'),
  P('exam', '자격증·시험', 'study', '#6c8fd6'),
  P('research', '논문·리서치', 'study', '#4b6fa8'),
  // 일
  P('project', '프로젝트', 'work', '#af52de', { recommended: true }),
  P('job', '업무', 'work', '#8e5bd1'),
  P('meeting', '회의', 'work', '#c47ae8'),
  P('writing', '블로그·글쓰기', 'work', '#9b6bd4'),
  P('jobhunt', '취업 준비', 'work', '#7a4fc2'),
  // 운동
  P('exercise', '운동', 'fitness', '#34c759', { fields: 'exercise', recommended: true }),
  P('running', '러닝', 'fitness', '#2fb36a', { fields: 'exercise' }),
  P('walk', '산책', 'fitness', '#6fcf8a'),
  P('stretch', '스트레칭·요가', 'fitness', '#4fb884'),
  P('health', '병원·건강', 'fitness', '#3aa88f'),
  // 취미
  P('coffee', '커피', 'hobby', '#a2845e', { recommended: true }),
  P('music', '음악', 'hobby', '#d98a3c'),
  P('game', '게임', 'hobby', '#ff7a45'),
  P('video', '영상·유튜브', 'hobby', '#ff6b6b'),
  P('movie', '영화·드라마', 'hobby', '#e0553f'),
  P('instrument', '악기', 'hobby', '#c9863a'),
  P('drawing', '그림', 'hobby', '#f0a35e'),
  // 기록
  P('journal', '기록', 'journal', '#e0b300', { recommended: true }),
  P('planning', '계획·회고', 'journal', '#d9a441'),
  P('meditation', '명상', 'journal', '#c8b560'),
  // 사람
  P('friends', '친구·약속', 'people', '#ff5f8f'),
  P('family', '가족', 'people', '#f27ba3'),
  P('date', '데이트', 'people', '#ff4d7d'),
  P('call', '통화·메신저', 'people', '#e88fb0'),
]

const byId = new Map(PRESETS.map(p => [p.id, p]))
const byName = new Map(PRESETS.map(p => [p.name, p]))

/**
 * 예전 이름 → 프리셋 id. 이름이 바뀐 활동은 여기에 적는다 (마이그레이션이 이름도 프리셋 이름으로 바꾼다).
 * 프리셋 이름과 같은 활동은 자동으로 연결되므로 여기 없어도 된다.
 */
export const LEGACY_NAME_MAP: Record<string, string> = {
  '커피, 음악, 독서': 'preset:coffee',
}

export function presetById(id: string | undefined | null): ActivityPreset | undefined {
  return id ? byId.get(id) : undefined
}

/** 이름으로 프리셋 찾기 (정확히 같은 이름 또는 LEGACY_NAME_MAP) */
export function presetByName(name: string): ActivityPreset | undefined {
  return byName.get(name) ?? presetById(LEGACY_NAME_MAP[name])
}

export function presetsInCategory(categoryId: string): ActivityPreset[] {
  return PRESETS.filter(p => p.category === categoryId)
}

export function categoryOf(preset: ActivityPreset): ActivityCategory {
  return CATEGORIES.find(c => c.id === preset.category) ?? CATEGORIES[0]
}

/** 프리셋에서 Activity 를 만든다. id = 프리셋 id. */
export function activityFromPreset(preset: ActivityPreset, order: number): Activity {
  return { id: preset.id, presetId: preset.id, name: preset.name, color: preset.color, order }
}

/** 활동에 연결된 프리셋 (presetId 우선, 없으면 id 가 프리셋 id 인 경우) */
export function presetOf(activity: Pick<Activity, 'id' | 'presetId'> | null | undefined): ActivityPreset | undefined {
  if (!activity) return undefined
  return presetById(activity.presetId) ?? presetById(activity.id)
}

/** 활동별 세부 폼 종류. 프리셋이 아니면 general. */
export function fieldsKindOf(activity: Pick<Activity, 'id' | 'presetId'> | null | undefined): FieldsKind {
  return presetOf(activity)?.fields ?? 'general'
}

/** 프리셋의 이미지 키 (파일명). preset:algorithm → algorithm, __sleep__ → sleep */
export function imageKeyOfPreset(preset: Pick<ActivityPreset, 'id'>): string {
  return preset.id === SLEEP_ACTIVITY.id ? 'sleep' : preset.id.replace(/^preset:/, '')
}

/** 이미지 키로 프리셋 찾기 (방 이미지 피커 라벨용) */
export function presetByImageKey(key: string): ActivityPreset | undefined {
  return presetById(key === 'sleep' ? SLEEP_ACTIVITY.id : `preset:${key}`)
}

/** 방 이미지 키. roomImage(사용자 선택) > 프리셋 이미지. 없으면 null. */
export function imageKeyOf(activity: Pick<Activity, 'id' | 'presetId' | 'roomImage'> | null | undefined): string | null {
  if (!activity) return null
  if (activity.roomImage) return activity.roomImage
  const p = presetOf(activity)
  return p ? imageKeyOfPreset(p) : null
}

export function roomImagePath(imageKey: string): string {
  return `./rooms/${imageKey}.png`
}

export const DEFAULT_ROOM_IMAGE = './room.png'

/**
 * 이미지가 실제로 있는 프리셋 키. public/rooms/ 에 파일을 넣으면 여기에도 추가한다
 * (방 이미지 피커의 후보 목록. 방 카드 자체는 onError 로 판별하므로 여기 없어도 표시는 된다).
 */
export const ROOM_IMAGE_KEYS: string[] = [
  'sleep', 'meal', 'shower', 'algorithm', 'english', 'project', 'exercise', 'coffee', 'journal',
]
