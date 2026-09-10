import { useEffect, useRef, useState } from 'react'
import { storage } from '../lib/storage'
import { parseDateKey } from '../lib/slots'

export interface MemoDoc { text: string; updatedAt: string }

interface Props {
  dateKey: string
  /** 페이지용: 더 큰 편집 영역 */
  large?: boolean
}

/** 날짜별 빠른 메모. 입력 후 500ms 뒤 자동 저장. */
export default function QuickMemo({ dateKey, large }: Props) {
  const [text, setText] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [state, setState] = useState<'idle' | 'dirty' | 'saved'>('idle')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latest = useRef('')

  useEffect(() => {
    let cancelled = false
    setLoaded(false)
    setState('idle')
    storage.loadData(`memo-${dateKey}`).then(v => {
      if (cancelled) return
      const t = (v as MemoDoc | null)?.text ?? ''
      setText(t); latest.current = t; setLoaded(true)
    })
    return () => {
      cancelled = true
      if (timer.current) clearTimeout(timer.current)
    }
  }, [dateKey])

  const save = (key: string, value: string) => {
    storage.saveData(`memo-${key}`, { text: value, updatedAt: new Date().toISOString() } satisfies MemoDoc)
    setState('saved')
  }

  const handleChange = (v: string) => {
    setText(v); latest.current = v; setState('dirty')
    if (timer.current) clearTimeout(timer.current)
    const key = dateKey
    timer.current = setTimeout(() => save(key, latest.current), 500)
  }

  const d = parseDateKey(dateKey)

  return (
    <section className={`widget quick-memo ${large ? 'quick-memo--large' : ''}`}>
      <div className="widget-head">
        <span className="widget-title">메모 · {d.getMonth() + 1}월 {d.getDate()}일</span>
        <span className="widget-meta">{state === 'dirty' ? '저장 중…' : state === 'saved' ? '저장됨' : ''}</span>
      </div>
      <textarea
        className="quick-memo-input"
        placeholder={loaded ? '오늘 떠오른 생각, 해야 할 일, 한 줄 일기…' : '불러오는 중…'}
        value={text}
        disabled={!loaded}
        onChange={e => handleChange(e.target.value)}
        onBlur={() => { if (state === 'dirty') { if (timer.current) clearTimeout(timer.current); save(dateKey, latest.current) } }}
        rows={large ? 14 : 4}
      />
    </section>
  )
}
