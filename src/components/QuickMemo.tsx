import { useEffect, useRef, useState } from 'react'
import { useMemoDoc } from '../hooks/useMemoDoc'
import { parseDateKey } from '../lib/slots'

export type { MemoDoc } from '../hooks/useMemoDoc'

interface Props {
  dateKey: string
  /** 페이지용: 더 큰 편집 영역 */
  large?: boolean
}

const SAVE_DELAY_MS = 500

/**
 * 날짜별 빠른 메모. 입력 후 500ms 뒤 자동 저장, 포커스를 잃거나 사라질 때 즉시 저장.
 * 다른 기기에서 바뀐 내용은 편집 중이 아닐 때 반영된다.
 */
export default function QuickMemo({ dateKey, large }: Props) {
  const [doc, save] = useMemoDoc(dateKey)
  const loaded = doc !== undefined
  const [draft, setDraft] = useState<string | null>(null)   // null = 편집 중 아님 → 저장된 값 표시
  const [state, setState] = useState<'idle' | 'dirty' | 'saved'>('idle')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pending = useRef<{ save: (t: string) => void; text: string } | null>(null)

  const commit = () => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null }
    const p = pending.current
    if (!p) return
    pending.current = null
    p.save(p.text)
    setDraft(null)
    setState('saved')
  }

  // 사라질 때(탭 이동, 날짜 변경으로 인한 remount) 아직 저장 안 된 입력을 즉시 저장
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
    const p = pending.current
    if (p) { pending.current = null; p.save(p.text) }
  }, [])

  const handleChange = (v: string) => {
    setDraft(v)
    setState('dirty')
    pending.current = { save, text: v }
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(commit, SAVE_DELAY_MS)
  }

  const text = draft ?? doc?.text ?? ''
  const d = parseDateKey(dateKey)

  return (
    <section className={`widget quick-memo ${large ? 'quick-memo--large' : ''}`}>
      <div className="widget-head">
        <span className="widget-title">메모 · {d.getMonth() + 1}월 {d.getDate()}일</span>
        <span className="widget-meta">{state === 'dirty' ? '입력 중…' : state === 'saved' ? '저장됨' : ''}</span>
      </div>
      <textarea
        className="quick-memo-input"
        placeholder={loaded ? '오늘 떠오른 생각, 해야 할 일, 한 줄 일기…' : '불러오는 중…'}
        value={text}
        disabled={!loaded}
        onChange={e => handleChange(e.target.value)}
        onBlur={commit}
        rows={large ? 14 : 4}
      />
    </section>
  )
}
