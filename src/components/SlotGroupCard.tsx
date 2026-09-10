import type { TaskGroup } from '../lib/slots'
import { fmtMin, fmtDuration } from '../lib/slots'
import { inkOn } from '../lib/color'

interface Props {
  group: TaskGroup
  highlightNow?: boolean
  onClick: () => void
  onDelete: () => void
}

/** 타임라인 구간 하나를 티켓 모양 카드로. 현재 시간대 목록과 시간 상세 패널이 함께 쓴다. */
export default function SlotGroupCard({ group: g, highlightNow, onClick, onDelete }: Props) {
  const displayTitle = g.record?.title || g.label
  const displayDesc = g.record?.description || g.detail
  return (
    <div
      className={`tt-ticket ${highlightNow && g.containsNow ? 'tt-ticket--now' : ''}`}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } }}
    >
      <div className="tt-ticket-stripe" style={{ background: g.color }} />
      <div className="tt-ticket-body">
        <div className="tt-ticket-header">
          <span className="tt-ticket-type" style={{ background: g.color, color: inkOn(g.color) }}>{g.label}</span>
          <span className="tt-ticket-time">{fmtMin(g.startMin)}~{fmtMin(g.endMin)}</span>
          <span className="tt-ticket-duration">{fmtDuration(g.endMin - g.startMin)}</span>
          <button
            className="tt-ticket-delete"
            aria-label={`${g.label} ${fmtMin(g.startMin)}~${fmtMin(g.endMin)} 삭제`}
            onClick={e => { e.stopPropagation(); onDelete() }}
          >✕</button>
        </div>
        <div className="tt-ticket-title">{displayTitle}</div>
        {displayDesc && <div className="tt-ticket-desc">{displayDesc}</div>}
      </div>
    </div>
  )
}
