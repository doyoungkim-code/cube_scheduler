import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  PRESETS, CATEGORIES, LEGACY_NAME_MAP, ROOM_IMAGE_KEYS,
  presetById, presetByName, activityFromPreset, presetOf, fieldsKindOf, imageKeyOf, presetByImageKey,
} from './activityCatalog'
import { SLEEP_ACTIVITY } from '../types/schedule'

describe('activityCatalog', () => {
  it('id 와 이름이 유일하다', () => {
    const ids = PRESETS.map(p => p.id)
    const names = PRESETS.map(p => p.name)
    expect(new Set(ids).size).toBe(ids.length)
    expect(new Set(names).size).toBe(names.length)
  })

  it('모든 프리셋이 존재하는 카테고리를 가리키고, 카테고리마다 활동이 있다', () => {
    const cats = new Set(CATEGORIES.map(c => c.id))
    for (const p of PRESETS) expect(cats.has(p.category), p.id).toBe(true)
    for (const c of CATEGORIES) expect(PRESETS.some(p => p.category === c.id), c.id).toBe(true)
  })

  it('예전 기본 활동 이름이 전부 카탈로그에 있다 (마이그레이션 자동 연결 전제)', () => {
    for (const name of ['수면', '식사', '샤워', '알고리즘', '영어 공부', '프로젝트', '운동', '기록']) {
      expect(presetByName(name), name).toBeDefined()
    }
    expect(presetByName('커피, 음악, 독서')?.id).toBe('preset:coffee')
  })

  it('수면은 예전 특수 id 를 그대로 쓴다', () => {
    expect(presetById(SLEEP_ACTIVITY.id)?.name).toBe('수면')
    expect(presetByName('수면')?.id).toBe(SLEEP_ACTIVITY.id)
  })

  it('LEGACY_NAME_MAP 의 대상은 실제 프리셋이다', () => {
    for (const id of Object.values(LEGACY_NAME_MAP)) expect(presetById(id), id).toBeDefined()
  })

  it('세부 폼 종류: 운동·러닝은 exercise, 알고리즘은 algorithm, 나머지·커스텀은 general', () => {
    expect(fieldsKindOf({ id: 'preset:exercise' })).toBe('exercise')
    expect(fieldsKindOf({ id: 'preset:running' })).toBe('exercise')
    expect(fieldsKindOf({ id: 'preset:algorithm' })).toBe('algorithm')
    expect(fieldsKindOf({ id: 'preset:coffee' })).toBe('general')
    expect(fieldsKindOf({ id: 'uuid-1234', presetId: 'preset:algorithm' })).toBe('algorithm')   // 연결된 기존 활동
    expect(fieldsKindOf({ id: 'uuid-1234' })).toBe('general')
    expect(fieldsKindOf(null)).toBe('general')
  })

  it('이미지 키: roomImage > 프리셋 > 없음', () => {
    expect(imageKeyOf({ id: 'preset:algorithm' })).toBe('algorithm')
    expect(imageKeyOf({ id: SLEEP_ACTIVITY.id })).toBe('sleep')
    expect(imageKeyOf({ id: 'uuid', presetId: 'preset:meal' })).toBe('meal')
    expect(imageKeyOf({ id: 'uuid', roomImage: 'coffee' })).toBe('coffee')
    expect(imageKeyOf({ id: 'uuid' })).toBeNull()
    expect(imageKeyOf(null)).toBeNull()
  })

  it('activityFromPreset 은 id = presetId', () => {
    const a = activityFromPreset(presetById('preset:meal')!, 3)
    expect(a).toEqual({ id: 'preset:meal', presetId: 'preset:meal', name: '식사', color: presetById('preset:meal')!.color, order: 3 })
    expect(presetOf(a)?.id).toBe('preset:meal')
  })

  it('ROOM_IMAGE_KEYS 의 파일이 public/rooms 에 실제로 있고, 각 키가 프리셋에 대응한다', () => {
    for (const k of ROOM_IMAGE_KEYS) {
      expect(existsSync(resolve(__dirname, '../../public/rooms', `${k}.png`)), k).toBe(true)
      expect(presetByImageKey(k), k).toBeDefined()
    }
  })
})
