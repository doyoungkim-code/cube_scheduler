import { describe, it, expect, beforeEach } from 'vitest'
import { setStorageBackend } from '../lib/storage'
import { useDocStore } from './index'
import { FakeBackend, tick } from './fakeBackend.test-util'

let backend: FakeBackend

beforeEach(() => {
  backend = new FakeBackend()
  setStorageBackend(backend)   // onBackendChange → reset
  useDocStore.getState().reset()
})

describe('ensure / write', () => {
  it('없는 키는 null 로 로드된다', async () => {
    useDocStore.getState().ensure('a')
    await tick()
    expect(useDocStore.getState().docs.a).toBeNull()
    expect(useDocStore.getState().loading.a).toBeUndefined()
  })

  it('저장된 값을 로드한다', async () => {
    backend.data.set('a', { x: 1 })
    useDocStore.getState().ensure('a')
    await tick()
    expect(useDocStore.getState().docs.a).toEqual({ x: 1 })
  })

  it('같은 키를 여러 번 ensure 해도 로드는 한 번', async () => {
    let calls = 0
    const orig = backend.loadData.bind(backend)
    backend.loadData = (k) => { calls++; return orig(k) }
    const st = useDocStore.getState()
    st.ensure('a'); st.ensure('a'); st.ensure('a')
    await tick()
    expect(calls).toBe(1)
  })

  it('write 는 스토어와 저장소에 동시에 반영된다', () => {
    useDocStore.getState().write('a', 42)
    expect(useDocStore.getState().docs.a).toBe(42)
    expect(backend.saved).toEqual([['a', 42]])
  })

  it('로드가 끝나기 전에 write 하면 로드 결과가 편집을 덮지 않는다 (B-2)', async () => {
    backend.manual = true
    backend.data.set('a', 'old')
    useDocStore.getState().ensure('a')
    useDocStore.getState().write('a', 'new')
    backend.resolveLoad('a')
    await tick()
    expect(useDocStore.getState().docs.a).toBe('new')
  })
})

describe('undo', () => {
  it('키별 이전 값으로 되돌리고, 저장소에도 쓴다', () => {
    const st = useDocStore.getState()
    st.write('a', 1, { undo: true })
    st.write('a', 2, { undo: true })
    expect(useDocStore.getState().undo()).toBe(true)
    expect(useDocStore.getState().docs.a).toBe(1)
    expect(backend.data.get('a')).toBe(1)
    expect(useDocStore.getState().undo()).toBe(true)
    expect(useDocStore.getState().docs.a).toBeNull()
    expect(useDocStore.getState().undo()).toBe(false)
  })

  it('다른 키의 편집을 되돌려도 현재 키를 건드리지 않는다 (B-1)', () => {
    const st = useDocStore.getState()
    st.write('day-2026-09-10', 'A1', { undo: true })
    st.write('day-2026-09-11', 'B1', { undo: true })
    st.write('day-2026-09-10', 'A2', { undo: true })
    useDocStore.getState().undo()   // A2 → A1
    expect(useDocStore.getState().docs['day-2026-09-10']).toBe('A1')
    expect(useDocStore.getState().docs['day-2026-09-11']).toBe('B1')
  })

  it('undo 옵션 없는 write 는 스택에 쌓이지 않는다', () => {
    useDocStore.getState().write('a', 1)
    expect(useDocStore.getState().undoStack).toHaveLength(0)
  })
})

describe('외부 변경 / 백엔드 전환', () => {
  it('다른 기기의 변경이 스토어에 반영된다', async () => {
    useDocStore.getState().ensure('a')
    await tick()
    backend.emitExternal('a', 'remote')
    expect(useDocStore.getState().docs.a).toBe('remote')
  })

  it('백엔드가 바뀌면 캐시가 비고 generation 이 오른다', () => {
    useDocStore.getState().write('a', 1, { undo: true })
    const gen = useDocStore.getState().generation
    setStorageBackend(new FakeBackend())
    const st = useDocStore.getState()
    expect(st.docs).toEqual({})
    expect(st.undoStack).toEqual([])
    expect(st.generation).toBe(gen + 1)
  })

  it('전환 전에 시작된 로드 결과는 버린다', async () => {
    backend.manual = true
    backend.data.set('a', 'stale')
    useDocStore.getState().ensure('a')
    setStorageBackend(new FakeBackend())
    backend.resolveLoad('a')
    await tick()
    expect(useDocStore.getState().docs.a).toBeUndefined()
  })

  it('ensurePrefix 는 접두어 키를 모두 로드한다', async () => {
    backend.data.set('memo-2026-09-10', { text: 'x' })
    backend.data.set('memo-2026-09-11', { text: 'y' })
    backend.data.set('day-2026-09-11', { slots: {} })
    useDocStore.getState().ensurePrefix('memo-')
    await tick(); await tick()
    const docs = useDocStore.getState().docs
    expect(Object.keys(docs).sort()).toEqual(['memo-2026-09-10', 'memo-2026-09-11'])
  })
})
