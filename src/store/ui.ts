/**
 * 화면 전용 상태 (저장되지 않음): 토스트.
 * 파괴적 동작은 확인 대화 대신 "실행 후 되돌리기 토스트" 로 처리한다 (plan.md C2).
 */
import { create } from 'zustand'
import { undoLast } from './index'

export interface Toast {
  id: number
  message: string
  actionLabel?: string
  onAction?: () => void
  tone?: 'default' | 'danger'
}

interface UiStore {
  toasts: Toast[]
  showToast(message: string, opts?: Omit<Toast, 'id' | 'message'> & { durationMs?: number }): number
  dismissToast(id: number): void
}

const DEFAULT_MS = 5000
const MAX_TOASTS = 3
let seq = 0

export const useUiStore = create<UiStore>((set, get) => ({
  toasts: [],
  showToast(message, opts) {
    const id = ++seq
    const { durationMs = DEFAULT_MS, ...rest } = opts ?? {}
    set(st => ({ toasts: [...st.toasts.slice(-(MAX_TOASTS - 1)), { id, message, ...rest }] }))
    setTimeout(() => get().dismissToast(id), durationMs)
    return id
  },
  dismissToast(id) {
    set(st => st.toasts.some(t => t.id === id) ? { toasts: st.toasts.filter(t => t.id !== id) } : st)
  },
}))

export function showToast(message: string, opts?: Parameters<UiStore['showToast']>[1]): number {
  return useUiStore.getState().showToast(message, opts)
}

/** 삭제·지우기 뒤에 띄우는 "되돌리기" 토스트 */
export function toastUndo(message: string): void {
  showToast(message, { actionLabel: '되돌리기', onAction: () => { undoLast() } })
}
