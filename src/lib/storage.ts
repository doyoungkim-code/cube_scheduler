/**
 * 앱 데이터 저장소 추상화.
 *
 * 예전 Electron 버전의 electronAPI.loadData / saveData / listDayKeys 와 같은 키-값 JSON 인터페이스입니다.
 * - LocalStorageBackend: 로그인 전 / Firebase 미설정 시. 이 브라우저에만 저장됩니다.
 * - FirestoreBackend: 로그인 + 승인 후. users/{uid}/store/{key} 문서에 저장되어 모든 기기에서 동기화됩니다.
 *
 * 화면 상태는 src/store 의 Zustand 스토어가 들고 있고, 이 모듈은
 * (1) 로드/저장의 실제 I/O 와 (2) 바깥(다른 기기·탭)에서 바뀐 값을 subscribe 로 알리는 일만 한다.
 */
import {
  collection, doc, onSnapshot, setDoc, serverTimestamp, type Unsubscribe,
} from 'firebase/firestore'
import { getDb } from './firebase'

/** 바깥에서 값이 바뀌었을 때 호출. value 가 null 이면 삭제됨. */
export type StorageListener = (key: string, value: unknown) => void

export interface StorageBackend {
  loadData(key: string): Promise<unknown>
  saveData(key: string, data: unknown): Promise<boolean>
  listKeys(prefix: string): Promise<string[]>
  /** 아직 서버에 쓰지 않은 변경을 즉시 반영 */
  flush(): Promise<void>
  /** 다른 기기/탭에서 바뀐 값 알림 (자기 자신의 saveData 는 알리지 않음) */
  subscribe(listener: StorageListener): () => void
  /** 남은 쓰기를 flush 한 뒤 구독 해제 */
  dispose(): Promise<void>
}

/** day-* 키 중 실제 슬롯 데이터가 있는 것만 남김 (Electron Store.listKeys 와 동일한 동작) */
export function hasSlots(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false
  const slots = (data as { slots?: Record<string, unknown> }).slots
  return !!slots && Object.keys(slots).length > 0
}

class ListenerSet {
  private set = new Set<StorageListener>()
  add(l: StorageListener): () => void {
    this.set.add(l)
    return () => { this.set.delete(l) }
  }
  emit(key: string, value: unknown): void {
    for (const l of this.set) {
      try { l(key, value) } catch (err) { console.error('[storage] listener error', err) }
    }
  }
}

// ---------------------------------------------------------------- localStorage

const LOCAL_PREFIX = 'scheduler:'

export class LocalStorageBackend implements StorageBackend {
  private listeners = new ListenerSet()
  private onStorage = (e: StorageEvent) => {
    // 같은 origin 의 다른 탭이 localStorage 를 바꾸면 발생 (자기 탭은 발생하지 않음)
    if (!e.key || !e.key.startsWith(LOCAL_PREFIX)) return
    const key = e.key.slice(LOCAL_PREFIX.length)
    let value: unknown = null
    if (e.newValue !== null) {
      try { value = JSON.parse(e.newValue) } catch { return }
    }
    this.listeners.emit(key, value)
  }

  constructor() {
    if (typeof window !== 'undefined') window.addEventListener('storage', this.onStorage)
  }

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

  subscribe(listener: StorageListener): () => void {
    return this.listeners.add(listener)
  }

  async dispose(): Promise<void> {
    if (typeof window !== 'undefined') window.removeEventListener('storage', this.onStorage)
  }
}

// ---------------------------------------------------------------- Firestore

const SAVE_DEBOUNCE_MS = 600
const RETRY_MS = 5000

interface StoreDoc {
  json: string
  updatedAt: unknown
}

interface CacheEntry { json: string; value: unknown }

export class FirestoreBackend implements StorageBackend {
  private cache = new Map<string, CacheEntry>()
  private ready: Promise<void>
  private resolveReady!: () => void
  private unsubscribe: Unsubscribe
  private listeners = new ListenerSet()
  /** 아직 서버 반영이 끝나지 않은 값 (디바운스 대기 중이거나 setDoc 진행 중) */
  private pending = new Map<string, { json: string; version: number }>()
  private versions = new Map<string, number>()
  private timers = new Map<string, ReturnType<typeof setTimeout>>()
  private retryTimer: ReturnType<typeof setTimeout> | null = null
  private disposed = false
  private onHidden = () => { void this.flush() }
  private onVisibility = () => {
    if (document.visibilityState === 'hidden') this.onHidden()
  }

  constructor(private uid: string) {
    this.ready = new Promise(res => { this.resolveReady = res })
    // 사용자의 store 컬렉션 전체를 실시간 구독 → 메모리 캐시.
    // 다른 기기에서 수정한 내용도 이 캐시에 반영되고 listeners 로 화면에 알린다.
    const col = collection(getDb(), 'users', uid, 'store')
    this.unsubscribe = onSnapshot(col, snap => {
      for (const change of snap.docChanges()) {
        const key = change.doc.id
        if (change.type === 'removed') {
          if (this.pending.has(key)) continue
          if (this.cache.delete(key)) this.listeners.emit(key, null)
          continue
        }
        // 내가 쓰는 중인 키는 서버 스냅샷으로 덮어쓰지 않음 (setDoc 완료 후 pending 에서 빠짐)
        if (this.pending.has(key)) continue
        const d = change.doc.data() as StoreDoc
        if (typeof d.json !== 'string') continue
        const prev = this.cache.get(key)
        if (prev && prev.json === d.json) continue   // 내가 쓴 값의 서버 에코 → 변화 없음
        let value: unknown
        try { value = JSON.parse(d.json) } catch { continue /* 손상된 문서 무시 */ }
        this.cache.set(key, { json: d.json, value })
        this.listeners.emit(key, value)
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
    return this.cache.get(key)?.value ?? null
  }

  async saveData(key: string, data: unknown): Promise<boolean> {
    const json = JSON.stringify(data ?? null)
    const version = (this.versions.get(key) ?? 0) + 1
    this.versions.set(key, version)
    this.cache.set(key, { json, value: data })
    this.pending.set(key, { json, version })
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
      if (prefix === 'day-' && !hasSlots(v.value)) continue
      keys.push(k)
    }
    return keys.sort()
  }

  private async write(key: string): Promise<void> {
    this.timers.delete(key)
    const entry = this.pending.get(key)
    if (!entry) return
    const payload: StoreDoc = { json: entry.json, updatedAt: serverTimestamp() }
    try {
      await setDoc(doc(getDb(), 'users', this.uid, 'store', key), payload)
      // 쓰는 동안 새 saveData 가 오지 않았을 때만 pending 에서 제거
      if (this.pending.get(key)?.version === entry.version) this.pending.delete(key)
    } catch (err) {
      console.error('[storage] save failed', key, err)
      // pending 에 남겨 두고 잠시 뒤 재시도
      this.scheduleRetry()
    }
  }

  private scheduleRetry(): void {
    if (this.retryTimer || this.disposed) return
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null
      void this.flush()
    }, RETRY_MS)
  }

  async flush(): Promise<void> {
    for (const t of this.timers.values()) clearTimeout(t)
    this.timers.clear()
    const keys = [...this.pending.keys()]
    await Promise.all(keys.map(k => this.write(k)))
  }

  /** 서버에 아직 안 올라간 키 수 (저장 상태 표시용) */
  get pendingCount(): number { return this.pending.size }

  subscribe(listener: StorageListener): () => void {
    return this.listeners.add(listener)
  }

  async dispose(): Promise<void> {
    this.disposed = true
    if (this.retryTimer) { clearTimeout(this.retryTimer); this.retryTimer = null }
    document.removeEventListener('visibilitychange', this.onVisibility)
    window.removeEventListener('pagehide', this.onHidden)
    await this.flush()
    this.unsubscribe()
  }
}

// ---------------------------------------------------------------- 현재 백엔드

type BackendListener = () => void

let current: StorageBackend = new LocalStorageBackend()
const externalListeners = new ListenerSet()
const backendListeners = new Set<BackendListener>()
let detachCurrent: () => void = current.subscribe((k, v) => externalListeners.emit(k, v))

export function setStorageBackend(backend: StorageBackend): void {
  if (current === backend) return
  const old = current
  detachCurrent()
  void old.dispose()   // 남은 쓰기는 old 가 스스로 flush 한 뒤 구독을 끊는다
  current = backend
  detachCurrent = backend.subscribe((k, v) => externalListeners.emit(k, v))
  for (const l of backendListeners) l()
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
  /** 다른 기기/탭에서 값이 바뀌면 알림. 백엔드가 바뀌어도 구독은 유지된다. */
  subscribe: (listener: StorageListener) => externalListeners.add(listener),
  /** 백엔드(로컬 ↔ Firestore)가 바뀌면 알림. 화면 캐시를 비워야 한다. */
  onBackendChange: (listener: BackendListener) => {
    backendListeners.add(listener)
    return () => { backendListeners.delete(listener) }
  },
}
