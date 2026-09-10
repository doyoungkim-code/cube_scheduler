import { useEffect, useState } from 'react'
import ViewShell from '../components/ViewShell'
import QuickMemo, { type MemoDoc } from '../components/QuickMemo'
import { storage } from '../lib/storage'
import { dateKeyOf, shiftDateKey, parseDateKey } from '../lib/slots'

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']

interface MemoItem { key: string; text: string; updatedAt: string }

export default function QuickMemoView() {
  const today = dateKeyOf(new Date())
  const [dateKey, setDateKey] = useState(today)
  const [items, setItems] = useState<MemoItem[]>([])

  // 최근 메모 목록 (편집 중인 날짜가 바뀌거나 저장될 때 갱신)
  useEffect(() => {
    let cancelled = false
    async function load() {
      const keys = (await storage.listKeys('memo-')).sort().reverse().slice(0, 30)
      const out: MemoItem[] = []
      for (const k of keys) {
        const doc = await storage.loadData(k) as MemoDoc | null
        if (doc?.text?.trim()) out.push({ key: k.replace('memo-', ''), text: doc.text, updatedAt: doc.updatedAt })
      }
      if (!cancelled) setItems(out)
    }
    load()
    const t = setInterval(load, 3000)
    return () => { cancelled = true; clearInterval(t) }
  }, [dateKey])

  const d = parseDateKey(dateKey)

  return (
    <ViewShell
      title="메모"
      description="날짜별로 짧은 메모나 한 줄 일기를 남깁니다. 홈 화면의 메모와 같은 내용입니다."
      actions={
        <>
          <button className="datebar-nav" aria-label="이전 날" onClick={() => setDateKey(shiftDateKey(dateKey, -1))}>‹</button>
          <span className="memo-date">{d.getMonth() + 1}월 {d.getDate()}일 {DAY_NAMES[d.getDay()]}</span>
          <button className="datebar-nav" aria-label="다음 날" onClick={() => setDateKey(shiftDateKey(dateKey, 1))}>›</button>
          {dateKey !== today && <button className="btn-today" onClick={() => setDateKey(today)}>오늘로</button>}
        </>
      }
    >
      <div className="memo-page">
        <QuickMemo key={dateKey} dateKey={dateKey} large />

        <section className="widget">
          <div className="widget-head">
            <span className="widget-title">최근 메모</span>
            <span className="widget-meta">{items.length}개</span>
          </div>
          {items.length === 0 ? (
            <p className="widget-empty">아직 메모가 없어요.</p>
          ) : (
            <ul className="memo-list">
              {items.map(it => {
                const dd = parseDateKey(it.key)
                return (
                  <li key={it.key}>
                    <button className={`memo-item ${it.key === dateKey ? 'memo-item--active' : ''}`} onClick={() => setDateKey(it.key)}>
                      <span className="memo-item-date">{dd.getMonth() + 1}.{String(dd.getDate()).padStart(2, '0')} {DAY_NAMES[dd.getDay()]}</span>
                      <span className="memo-item-text">{it.text}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </ViewShell>
  )
}
