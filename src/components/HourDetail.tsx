import { useState } from 'react'
import type { Activity, DayData, TimeSlot } from '../types/schedule'
import type { Ticket } from '../types/kanban'

interface HourDetailProps {
  hour: number
  day: DayData
  rawSlots: Record<number, TimeSlot>
  selectedActivity: Activity | null
  tickets: Ticket[]
  onSlotChange: (min: number, slot: TimeSlot | null) => void
  onSlotRangeChange: (startMin: number, endMin: number, slot: TimeSlot | null) => void
  onClose: () => void
}

const MINS = [0, 10, 20, 30, 40, 50]

function fmtTime(hour: number, min: number): string {
  return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

function fmtDuration(mins: number): string {
  return mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60 ? `${mins % 60}m` : ''}` : `${mins}m`
}

interface SlotGroup {
  label: string
  color: string
  detail: string
  ticketId: string | undefined
  startMin: number
  endMin: number
  isRoutine: boolean
}

function groupAllDaySlots(day: DayData, rawSlots: Record<number, TimeSlot>): SlotGroup[] {
  const groups: SlotGroup[] = []
  let current: SlotGroup | null = null

  for (let m = 0; m < 1440; m += 10) {
    const slot = day.slots[m]
    if (!slot) {
      if (current) { groups.push(current); current = null }
      continue
    }
    const raw = rawSlots[m]
    const isRoutine = !raw

    if (current && current.label === slot.label && current.color === slot.color && current.isRoutine === isRoutine) {
      current.endMin = m + 10
      if (slot.detail && !current.detail) current.detail = slot.detail
      if (slot.ticketId && !current.ticketId) current.ticketId = slot.ticketId
    } else {
      if (current) groups.push(current)
      current = {
        label: slot.label,
        color: slot.color,
        detail: slot.detail ?? '',
        ticketId: slot.ticketId,
        startMin: m,
        endMin: m + 10,
        isRoutine,
      }
    }
  }
  if (current) groups.push(current)
  return groups
}

function getTicketSummary(t: Ticket): string | null {
  const f = t.activityFields
  if (f.type === 'exercise') {
    const p: string[] = []
    if (f.data.exerciseType) p.push(f.data.exerciseType)
    if (f.data.km) p.push(`${f.data.km}km`)
    if (f.data.minutes) p.push(`${f.data.minutes}min`)
    return p.length ? p.join(' / ') : null
  }
  if (f.type === 'algorithm') {
    const p: string[] = []
    if (f.data.problemNumber) p.push(`#${f.data.problemNumber}`)
    if (f.data.solveTime) p.push(f.data.solveTime)
    return p.length ? p.join(' / ') : null
  }
  return null
}

function HourDetail({ hour, day, rawSlots, selectedActivity, tickets, onSlotChange, onSlotRangeChange, onClose }: HourDetailProps) {
  const baseMin = hour * 60
  const allGroups = groupAllDaySlots(day, rawSlots)
  // 루틴 제외
  const groups = allGroups.filter(g => !g.isRoutine && g.startMin < baseMin + 60 && g.endMin > baseMin)
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)
  const [editing, setEditing] = useState(false)
  const [editDetail, setEditDetail] = useState('')

  const clearAll = () => {
    onSlotRangeChange(baseMin, baseMin + 60, null)
  }

  const handleExpand = (idx: number) => {
    if (expandedIdx === idx) {
      setExpandedIdx(null)
      setEditing(false)
    } else {
      setExpandedIdx(idx)
      setEditing(false)
      setEditDetail(groups[idx].detail)
    }
  }

  const handleDelete = (g: SlotGroup) => {
    onSlotRangeChange(g.startMin, g.endMin, null)
    setExpandedIdx(null)
    setEditing(false)
  }

  const handleSaveDetail = (g: SlotGroup) => {
    for (let m = g.startMin; m < g.endMin; m += 10) {
      const slot = day.slots[m]
      if (slot) onSlotChange(m, { ...slot, detail: editDetail })
    }
    setEditing(false)
  }

  const handleEmptySlotClick = (slotMin: number) => {
    if (!selectedActivity || selectedActivity.id === 'eraser') return
    onSlotChange(slotMin, {
      label: selectedActivity.name,
      color: selectedActivity.color,
    })
  }

  return (
    <div className="hour-detail">
      <div className="hour-detail-header">
        <strong>{String(hour).padStart(2, '0')}:00 ~ {String(hour + 1).padStart(2, '0')}:00</strong>
        <div className="hour-detail-actions">
          <button className="btn-sm btn-cancel" onClick={clearAll}>전체 삭제</button>
          <button className="slot-editor-close" onClick={onClose}>&times;</button>
        </div>
      </div>

      {groups.length === 0 && !selectedActivity ? (
        <div className="tt-current-empty">등록된 일정 없음</div>
      ) : (
        <div className="tt-current-groups">
          {groups.map((g, i) => {
            const linkedTicket = g.ticketId ? tickets.find(t => t.id === g.ticketId) : null
            const displayTitle = linkedTicket ? linkedTicket.title : g.label
            const displayDesc = linkedTicket ? linkedTicket.description : g.detail
            const ticketDetail = linkedTicket ? getTicketSummary(linkedTicket) : null

            return (
              <div
                key={i}
                className="tt-ticket"
                onClick={() => handleExpand(i)}
              >
                <div className="tt-ticket-stripe" style={{ background: g.color }} />
                <div className="tt-ticket-body">
                  <div className="tt-ticket-header">
                    <span className="tt-ticket-type" style={{ background: g.color }}>{g.label}</span>
                    <span className="tt-ticket-time">
                      {fmtTime(Math.floor(g.startMin / 60), g.startMin % 60)}~{fmtTime(Math.floor(g.endMin / 60), g.endMin % 60)}
                    </span>
                    <span className="tt-ticket-duration">{fmtDuration(g.endMin - g.startMin)}</span>
                    <button
                      className="tt-ticket-delete"
                      onClick={e => { e.stopPropagation(); handleDelete(g) }}
                      title="삭제"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="tt-ticket-title">{displayTitle}</div>

                  {displayDesc && (
                    <div className="tt-ticket-desc">{displayDesc}</div>
                  )}
                  {ticketDetail && (
                    <div className="tt-ticket-detail-line">{ticketDetail}</div>
                  )}
                  {linkedTicket?.why && (
                    <div className="tt-ticket-why">WHY: {linkedTicket.why}</div>
                  )}

                  {expandedIdx === i && !linkedTicket ? (
                    editing ? (
                      <div className="tt-ticket-edit" onClick={e => e.stopPropagation()}>
                        <textarea
                          className="tt-group-textarea"
                          value={editDetail}
                          onChange={e => setEditDetail(e.target.value)}
                          placeholder="상세 내용..."
                          autoFocus
                        />
                        <div className="tt-group-edit-actions">
                          <button className="btn-sm btn-save" onClick={() => handleSaveDetail(g)}>저장</button>
                          <button className="btn-sm btn-cancel" onClick={() => setEditing(false)}>취소</button>
                        </div>
                      </div>
                    ) : (
                      <div className="tt-ticket-detail-area">
                        <p className={g.detail ? 'tt-ticket-detail' : 'tt-ticket-detail-empty'}>
                          {g.detail || '상세 내용 없음'}
                        </p>
                        <button className="btn-sm btn-save" onClick={e => { e.stopPropagation(); setEditing(true); setEditDetail(g.detail) }}>수정</button>
                      </div>
                    )
                  ) : null}

                  {linkedTicket && (
                    <div className="tt-ticket-linked">#{tickets.sort((a, b) => a.createdAt.localeCompare(b.createdAt)).findIndex(t => t.id === linkedTicket.id) + 1} 티켓 연결됨</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {selectedActivity && selectedActivity.id !== 'eraser' && (
        <div className="hour-detail-empty-slots">
          {MINS.map(m => {
            const slotMin = baseMin + m
            const slot = day.slots[slotMin]
            if (slot) return null
            return (
              <div
                key={m}
                className="hour-slot hour-slot--add"
                onClick={() => handleEmptySlotClick(slotMin)}
              >
                <span className="hour-slot-time">{fmtTime(hour, m)}</span>
                <span className="hour-slot-empty">+ {selectedActivity.name}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default HourDetail
