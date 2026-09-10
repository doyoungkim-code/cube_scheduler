import { useSyncExternalStore } from 'react'
import { storage, type SaveStatus } from '../lib/storage'

export interface SaveIndicator extends SaveStatus { online: boolean }

const subscribeOnline = (cb: () => void) => {
  window.addEventListener('online', cb)
  window.addEventListener('offline', cb)
  return () => { window.removeEventListener('online', cb); window.removeEventListener('offline', cb) }
}

/** 헤더 저장 표시용: 서버에 안 올라간 키 수, 실패 여부, 온라인 여부 */
export function useSaveStatus(): SaveIndicator {
  const status = useSyncExternalStore(storage.onSaveStatus, storage.getSaveStatus, storage.getSaveStatus)
  const online = useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true)
  return { ...status, online }
}
