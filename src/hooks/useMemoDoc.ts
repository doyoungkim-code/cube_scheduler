import { useCallback } from 'react'
import { useDoc, writeDoc } from '../store'

export interface MemoDoc { text: string; updatedAt: string }

export function memoKey(dateKey: string): string {
  return `memo-${dateKey}`
}

/** 날짜별 메모. [문서(undefined=로딩), 저장] */
export function useMemoDoc(dateKey: string): [MemoDoc | null | undefined, (text: string) => void] {
  const key = memoKey(dateKey)
  const doc = useDoc<MemoDoc>(key)
  const save = useCallback((text: string) => {
    writeDoc(key, { text, updatedAt: new Date().toISOString() } satisfies MemoDoc)
  }, [key])
  return [doc, save]
}
