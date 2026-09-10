import type { StorageBackend, StorageListener } from '../lib/storage'

/** 테스트용 백엔드: 로드를 수동으로 완료시킬 수 있고, 외부 변경을 흉내 낼 수 있다 */
export class FakeBackend implements StorageBackend {
  data = new Map<string, unknown>()
  saved: [string, unknown][] = []
  private waiters = new Map<string, ((v: unknown) => void)[]>()
  private listeners = new Set<StorageListener>()
  /** true 면 loadData 가 resolveLoad 호출 전까지 대기 */
  manual = false

  loadData(key: string): Promise<unknown> {
    if (!this.manual) return Promise.resolve(this.data.get(key) ?? null)
    return new Promise(res => {
      const list = this.waiters.get(key) ?? []
      list.push(res)
      this.waiters.set(key, list)
    })
  }
  resolveLoad(key: string): void {
    const list = this.waiters.get(key) ?? []
    this.waiters.delete(key)
    for (const res of list) res(this.data.get(key) ?? null)
  }
  async saveData(key: string, value: unknown): Promise<boolean> {
    this.data.set(key, value)
    this.saved.push([key, value])
    return true
  }
  async listKeys(prefix: string): Promise<string[]> {
    return [...this.data.keys()].filter(k => k.startsWith(prefix)).sort()
  }
  async flush(): Promise<void> {}
  subscribe(l: StorageListener): () => void {
    this.listeners.add(l)
    return () => { this.listeners.delete(l) }
  }
  emitExternal(key: string, value: unknown): void {
    this.data.set(key, value)
    for (const l of this.listeners) l(key, value)
  }
  async dispose(): Promise<void> {}
}

export const tick = () => new Promise<void>(res => setTimeout(res, 0))
