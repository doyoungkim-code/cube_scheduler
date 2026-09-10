import type { TimeSlot } from '../types/schedule'
import { summarizeByActivity, fmtDuration } from '../lib/slots'

interface Props {
  slots: Record<number, TimeSlot>
  isToday: boolean
}

/** 선택된 날짜의 활동별 누적 시간 막대 */
export default function TodaySummary({ slots, isToday }: Props) {
  const { items, total } = summarizeByActivity(slots)
  const max = items[0]?.minutes ?? 1

  return (
    <section className="widget">
      <div className="widget-head">
        <span className="widget-title">{isToday ? '오늘 요약' : '활동 요약'}</span>
        <span className="widget-meta">{total > 0 ? fmtDuration(total) : ''}</span>
      </div>
      {items.length === 0 ? (
        <p className="widget-empty">아직 기록이 없어요. 팔레트에서 활동을 골라 칠해 보세요.</p>
      ) : (
        <ul className="summary-list">
          {items.map(it => (
            <li key={it.label} className="summary-row">
              <span className="summary-dot" style={{ background: it.color }} />
              <span className="summary-label">{it.label}</span>
              <span className="summary-min">{fmtDuration(it.minutes)}</span>
              <span className="summary-bar"><span style={{ width: `${(it.minutes / max) * 100}%`, background: it.color }} /></span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
