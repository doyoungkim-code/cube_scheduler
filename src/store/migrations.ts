/**
 * 저장 형식 마이그레이션 (v1 → v2).
 *
 * v1: day-* 가 10분 슬롯 맵(label/color 문자열), 루틴이 name/color 문자열.
 * v2: day-* 가 구간 리스트 + activityId, 루틴이 activityId. (plan.md A1/A3)
 *
 * 활동 팔레트가 로드된 뒤 한 번만 실행된다. 이름이 팔레트에 없는 활동은 그 이름·색으로 새로 만들어
 * (archived 로) 팔레트 문서에 추가하므로 과거 기록의 참조가 끊기지 않는다.
 * 순차 실행이라 같은 이름이 두 번 만들어지지 않는다.
 */
import { v4 as uuidv4 } from 'uuid'
import type { Activity, DayData, LegacyRoutine, WeeklyRoutines } from '../types/schedule'
import { SLEEP_ACTIVITY, WEEKLY_KEYS } from '../types/schedule'
import { isLegacyDay, migrateLegacyDay, migrateWeekly, weeklyNeedsMigration, type ActivityIdByName } from '../lib/day'
import { presetByName, activityFromPreset } from '../lib/activityCatalog'
import { storage } from '../lib/storage'
import { useDocStore } from './index'

let doneGeneration = -1
let running = false

function currentActivities(): Activity[] {
  return (useDocStore.getState().docs['activities'] as Activity[] | null | undefined) ?? []
}

/** 이름으로 활동 id 를 찾고, 없으면 만들어서 팔레트 문서에 즉시 반영. 프리셋 이름이면 프리셋 id 로 만든다. */
const idByName: ActivityIdByName = (name, color) => {
  if (name === SLEEP_ACTIVITY.name) return SLEEP_ACTIVITY.id
  const acts = currentActivities()
  const hit = acts.find(a => a.name === name)
  if (hit) return hit.id
  const preset = presetByName(name)
  if (preset) {
    const existing = acts.find(a => a.id === preset.id || a.presetId === preset.id)
    if (existing) return existing.id
    const created: Activity = { ...activityFromPreset(preset, acts.length), archived: true }
    useDocStore.getState().write('activities', [...acts, created])
    return created.id
  }
  const created: Activity = { id: uuidv4(), name, color: color || '#8e8e93', order: acts.length, archived: true }
  useDocStore.getState().write('activities', [...acts, created])
  return created.id
}

/**
 * 프리셋 연결: 이름이 카탈로그와 같은 활동에 presetId 를 붙인다 (LEGACY_NAME_MAP 에 있으면 이름도 바꾼다).
 * day 문서는 건드리지 않는다 (id 그대로). 바뀐 활동 수를 돌려준다.
 */
function linkPresets(): number {
  let acts = currentActivities()
  if (acts.length === 0) return 0
  // 수면은 예전엔 팔레트 밖의 특수 칩이었다. 이제 일반 프리셋이므로 문서에 없으면 맨 앞에 넣어 준다.
  if (!acts.some(a => a.id === SLEEP_ACTIVITY.id)) {
    const sleep = presetByName(SLEEP_ACTIVITY.name)!
    acts = [{ ...activityFromPreset(sleep, -1) }, ...acts]
    useDocStore.getState().write('activities', acts)
  }
  const taken = new Set(acts.map(a => a.presetId).filter(Boolean))
  let changed = 0
  const next = acts.map(a => {
    if (a.presetId) return a
    const p = presetByName(a.name)
    if (!p || taken.has(p.id)) return a
    taken.add(p.id)
    changed++
    if (p.name !== a.name) console.info(`[migration] 활동 이름 변경: "${a.name}" → "${p.name}"`)
    return { ...a, presetId: p.id, name: p.name }
  })
  if (changed) useDocStore.getState().write('activities', next)
  return changed
}

async function migrateDays(): Promise<number> {
  const keys = await storage.listKeys('day-')
  let count = 0
  for (const key of keys) {
    const st = useDocStore.getState()
    const doc = key in st.docs ? st.docs[key] : await storage.loadData(key)
    if (!isLegacyDay(doc)) continue
    st.write(key, migrateLegacyDay({ ...doc, date: doc.date || key.slice('day-'.length) }, idByName))
    count++
  }
  return count
}

async function migrateRoutines(): Promise<boolean> {
  const st = useDocStore.getState()
  let weekly = ('routines-weekly' in st.docs ? st.docs['routines-weekly'] : await storage.loadData('routines-weekly')) as WeeklyRoutines | null

  if (!weekly) {
    // v0: 단일 routines.json → 모든 요일에 복사
    const legacy = await storage.loadData('routines') as LegacyRoutine[] | null
    if (!legacy || legacy.length === 0) return false
    weekly = {} as WeeklyRoutines
    for (const k of WEEKLY_KEYS) weekly[k] = legacy as never
  }
  if (!weeklyNeedsMigration(weekly)) return false
  useDocStore.getState().write('routines-weekly', migrateWeekly(weekly, idByName))
  return true
}

/**
 * 쓰기 직전에 v1 문서를 만나면 그 자리에서 v2 로 바꿔 돌려준다 (일괄 변환이 아직 안 돌았을 때의 안전장치).
 * v2 거나 없으면 null.
 */
export function migrateDayDocNow(doc: unknown, dateKey: string): DayData | null {
  if (!isLegacyDay(doc)) return null
  return migrateLegacyDay({ ...doc, date: doc.date || dateKey }, idByName)
}

/** 가져오기 등으로 v1 문서가 새로 들어왔을 때: 다음 ensureMigrated 에서 다시 돌게 한다 */
export function rerunMigrations(): void {
  doneGeneration = -1
  ensureMigrated()
}

/**
 * 활동 팔레트가 로드됐을 때 호출. 백엔드(generation)마다 한 번만 실제로 돈다.
 * 훅에서 매 렌더 불러도 안전하다.
 */
export function ensureMigrated(): void {
  const st = useDocStore.getState()
  if (doneGeneration === st.generation || running) return
  if (st.docs['activities'] === undefined) return   // 팔레트가 아직 안 왔으면 다음 기회에
  doneGeneration = st.generation
  running = true
  ;(async () => {
    try {
      const days = await migrateDays()
      const routines = await migrateRoutines()
      const linked = linkPresets()
      if (days || routines || linked) {
        console.info(`[migration] v1 → v2: day ${days}건, routines ${routines ? '변환' : '유지'}, 프리셋 연결 ${linked}건`)
        await storage.flush()
      }
    } catch (err) {
      console.error('[migration] failed', err)
      doneGeneration = -1   // 다음 기회에 재시도
    } finally {
      running = false
    }
  })()
}
