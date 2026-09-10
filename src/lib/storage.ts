/**
 * 앱 데이터 저장소 추상화.
 *
 * 예전 Electron 버전의 electronAPI.loadData / saveData / listDayKeys 와 같은 키-값 JSON 인터페이스입니다.
 * - LocalStorageBackend: 로그인 전 / Firebase 미설정 시. 이 브라우저에만 저장됩니다.
 * - FirestoreBackend: 로그인 + 승인 후. users/{uid}/store/{key} 문서에 저장되어 모든 기기에서 동기화됩니다.
 */
import {
  collection, doc, onSnapshot, setDoc, serverTimestamp, type Unsubscribe,
} from 'firebase/firestore'
import { getDb } from './firebase'

export interface StorageBackend {
  loadData(key: string): Promise<unknown>
  saveData(key: string, data: unknown): Promise<boolean>
  listKeys(prefix: string): Promise<string[]>
  /** 아직 서버에 쓰지 않은 변경을 즉시 반영 */
  flush(): Promise<void>
  dispose(): void
}

/** day-* 키 중 실제 슬롯 데이터가 있는 것만 남김 (Electron Store.listKeys 와 동일한 동작) */
function hasSlots(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false
  const slots = (data as { slots?: Record<string, unknown> }).slots
  return !!slots && Object.keys(slots).length > 0
}

// ---------------------------------------------------------------- localStorage

const LOCAL_PREFIX = 'scheduler:'

export class LocalStorageBackend implements StorageBackend {
  async loadData(key: string): Promise<unknown> {
    try {
      const raw = localStorage.getItem(LOCAL_PREFIX + key)
      return raw === null ? null : JSON.parse(raw)
    } catch {
      return null
    }
  }

  async saveData(key: string, data: unknown): Promise<boolean> {
    try {
      localStorage.setItem(LOCAL_PREFIX + key, JSON.stringify(data))
      return true
    } catch {
      return false
    }
  }

  async listKeys(prefix: string): Promise<string[]> {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (!k || !k.startsWith(LOCAL_PREFIX + prefix)) continue
      const key = k.slice(LOCAL_PREFIX.length)
      if (prefix === 'day-' && !hasSlots(await this.loadData(key))) continue
      keys.push(key)
    }
    return keys.sort()
  }

  async flush(): Promise<void> { /* 동기 저장이라 할 일 없음 */ }
  dispose(): void { /* noop */ }
}

// ---------------------------------------------------------------- Firestore

const SAVE_DEBOUNCE_MS = 600

interface StoreDoc {
  json: string
  updatedAt: unknown
}

export class FirestoreBackend implements StorageBackend {
  private cache = new Map<string, unknown>()
  private ready: Promise<void>
  private resolveReady!: () => void
  private unsubscribe: Unsubscribe
  private pending = new Map<string, unknown>()
  private timers = new Map<string, ReturnType<typeof setTimeout>>()
  private onHidden = () => { void this.flush() }
  private onVisibility = () => {
    if (document.visibilityState === 'hidden') this.onHidden()
  }

  constructor(private uid: string) {
    this.ready = new Promise(res => { this.resolveReady = res })
    // 사용자의 store 컬렉션 전체를 실시간 구독 → 메모리 캐시.
    // 다른 기기에서 수정한 내용도 이 캐시에 즉시 반영됩니다.
    const col = collection(getDb(), 'users', uid, 'store')
    this.unsubscribe = onSnapshot(col, snap => {
      for (const change of snap.docChanges()) {
        const key = change.doc.id
        if (change.type === 'removed') {
          this.cache.delete(key)
          continue
        }
        // 내가 방금 쓴(아직 서버 미반영) 값이 있으면 서버 스냅샷으로 덮어쓰지 않음
        if (this.pending.has(key)) continue
        const d = change.doc.data() as StoreDoc
        try { this.cache.set(key, JSON.parse(d.json)) } catch { /* 손상된 문서 무시 */ }
      }
      this.resolveReady()
    }, err => {
      console.error('[storage] snapshot error', err)
      this.resolveReady()
    })
    document.addEventListener('visibilitychange', this.onVisibility)
    window.addEventListener('pagehide', this.onHidden)
  }

  async loadData(key: string): Promise<unknown> {
    await this.ready
    return this.cache.has(key) ? this.cache.get(key) : null
  }

  async saveData(key: string, data: unknown): Promise<boolean> {
    this.cache.set(key, data)
    this.pending.set(key, data)
    const t = this.timers.get(key)
    if (t) clearTimeout(t)
    this.timers.set(key, setTimeout(() => { void this.write(key) }, SAVE_DEBOUNCE_MS))
    return true
  }

  async listKeys(prefix: string): Promise<string[]> {
    await this.ready
    const keys: string[] = []
    for (const [k, v] of this.cache) {
      if (!k.startsWith(prefix)) continue
      if (prefix === 'day-' && !hasSlots(v)) continue
      keys.push(k)
    }
    return keys.sort()
  }

  private async write(key: string): Promise<void> {
    this.timers.delete(key)
    if (!this.pending.has(key)) return
    const data = this.pending.get(key)
    this.pending.delete(key)
    const payload: StoreDoc = { json: JSON.stringify(data ?? null), updatedAt: serverTimestamp() }
    try {
      await setDoc(doc(getDb(), 'users', this.uid, 'store', key), payload)
    } catch (err) {
      console.error('[storage] save failed', key, err)
      // 실패 시 다시 대기열에 넣어 다음 flush 에서 재시도
      if (!this.pending.has(key)) this.pending.set(key, data)
    }
  }

  async flush(): Promise<void> {
    const keys = [...this.pending.keys()]
    for (const t of this.timers.values()) clearTimeout(t)
    this.timers.clear()
    await Promise.all(keys.map(k => this.write(k)))
  }

  dispose(): void {
    void this.flush()
    this.unsubscribe()
    document.removeEventListener('visibilitychange', this.onVisibility)
    window.removeEventListener('pagehide', this.onHidden)
  }
}

// ---------------------------------------------------------------- 현재 백엔드

let current: StorageBackend = new LocalStorageBackend()

export function setStorageBackend(backend: StorageBackend): void {
  if (current !== backend) current.dispose()
  current = backend
}

export function getStorageBackend(): StorageBackend {
  return current
}

/** 앱 전역에서 쓰는 저장소. 항상 현재 백엔드로 위임합니다. */
export const storage = {
  loadData: (key: string) => current.loadData(key),
  saveData: (key: string, data: unknown) => current.saveData(key, data),
  listKeys: (prefix: string) => current.listKeys(prefix),
  listDayKeys: () => current.listKeys('day-'),
  flush: () => current.flush(),
}
