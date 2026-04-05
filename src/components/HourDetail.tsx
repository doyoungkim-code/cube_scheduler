import { useState } from 'react'
import type { Activity, DayData, TimeSlot, SlotRecord } from '../types/schedule'
import type { Ticket } from '../types/kanban'
import { activityFieldsForName } from '../types/kanban'
import TicketModal from './TicketModal'

interface HourDetailProps {
  hour: number
  day: DayData
  rawSlots: Record<number, TimeSlot>
  selectedActivity: Activity | null
  activities: Activity[]
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
  record: SlotRecord | undefined
  startMin: number
  endMin: number
  isRoutine: boolean
}

function groupAllDaySlots(day: DayData, rawSlots: Record<number, TimeSlot>): SlotGroup[] {
  const groups: SlotGroup[] = []
  let current: SlotGroup | null = null
  for (let m = 0; m < 1440; m += 10) {
    const slot = day.slots[m]
    if (!slot) { if (current) { groups.push(current); current = null }; continue }
    const raw = rawSlots[m]
    const isRoutine = !raw
    if (current && current.label === slot.label && current.color === slot.color && current.isRoutine === isRoutine) {
      current.endMin = m + 10
      if (slot.detail && !current.detail) current.detail = slot.detail
      if (slot.ticketId && !current.ticketId) current.ticketId = slot.ticketId
      if (slot.record && !current.record) current.record = slot.record
    } else {
      if (current) groups.push(current)
      current = { label: slot.label, color: slot.color, detail: slot.detail ?? '', ticketId: slot.ticketId, record: slot.record, startMin: m, endMin: m + 10, isRoutine }
    }
  }
  if (current) groups.push(current)
  return groups
}

function HourDetail({ hour, day, rawSlots, selectedActivity, activities, onSlotChange, onSlotRangeChange, onClose }: HourDetailProps) {
  const baseMin = hour * 60
  const allGroups = groupAllDaySlots(day, rawSlots)
  const groups = allGroups.filter(g => !g.isRoutine && g.startMin < baseMin + 60 && g.endMin > baseMin)

  const [modalGroup, setModalGroup] = useState<SlotGroup | null>(null)
  const [modalTicket, setModalTicket] = useState<Ticket | null>(null)

  const handleEdit = (g: SlotGroup) => {
    const act = activities.find(a => a.name === g.label)
    const rec = g.record
    setModalTicket({
      id: '',
      title: rec?.title ?? '',
      description: rec?.description ?? g.detail,
      why: '',
      activityId: act?.id ?? '',
      status: 'progress',
      activityFields: rec?.activityFields ?? (act ? activityFieldsForName(act.name) : { type: 'general', data: { notes: '' } }),
      order: 0,
      createdAt: '',
      updatedAt: '',
    })
    setModalGroup(g)
  }

  const handleModalSave = (ticket: Ticket) => {
    if (modalGroup) {
      const record = {
        title: ticket.title,
        description: ticket.description,
        activityFields: ticket.activityFields,
      }
      for (let m = modalGroup.startMin; m < modalGroup.endMin; m += 10) {
        const slot = day.slots[m]
        if (slot) onSlotChange(m, { ...slot, detail: ticket.description, record })
      }
    }
    setModalGroup(null)
    setModalTicket(null)
  }

  const handleDelete = (g: SlotGroup) => {
    onSlotRangeChange(g.startMin, g.endMin, null)
  }

  const handleEmptySlotClick = (slotMin: number) => {
    if (!selectedActivity || selectedActivity.id === 'eraser') return
    onSlotChange(slotMin, { label: selectedActivity.name, color: selectedActivity.color })
  }

  return (
    <div className="hour-detail">
      <div className="hour-detail-header">
        <strong>{String(hour).padStart(2, '0')}:00 ~ {String(hour + 1).padStart(2, '0')}:00</strong>
        <div className="hour-detail-actions">
          <button className="btn-sm btn-cancel" onClick={() => onSlotRangeChange(baseMin, baseMin + 60, null)}>전체 삭제</button>
          <button className="slot-editor-close" onClick={onClose}>&times;</button>
        </div>
      </div>

      {groups.length === 0 && !selectedActivity ? (
        <div className="tt-current-empty">등록된 일정 없음</div>
      ) : (
        <div className="tt-current-groups">
          {groups.map((g, i) => {
            const displayTitle = g.record?.title || g.label
            const displayDesc = g.record?.description || g.detail

            return (
              <div key={i} className="tt-ticket" onClick={() => handleEdit(g)}>
                <div className="tt-ticket-stripe" style={{ background: g.color }} />
                <div className="tt-ticket-body">
                  <div className="tt-ticket-header">
                    <span className="tt-ticket-type" style={{ background: g.color }}>{g.label}</span>
                    <span className="tt-ticket-time">
                      {fmtTime(Math.floor(g.startMin / 60), g.startMin % 60)}~{fmtTime(Math.floor(g.endMin / 60), g.endMin % 60)}
                    </span>
                    <span className="tt-ticket-duration">{fmtDuration(g.endMin - g.startMin)}</span>
                    <button className="tt-ticket-delete" onClick={e => { e.stopPropagation(); handleDelete(g) }}>✕</button>
                  </div>
                  <div className="tt-ticket-title">{displayTitle}</div>
                  {displayDesc && <div className="tt-ticket-desc">{displayDesc}</div>}
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
            if (day.slots[slotMin]) return null
            return (
              <div key={m} className="hour-slot hour-slot--add" onClick={() => handleEmptySlotClick(slotMin)}>
                <span className="hour-slot-time">{fmtTime(hour, m)}</span>
                <span className="hour-slot-empty">+ {selectedActivity.name}</span>
              </div>
            )
          })}
        </div>
      )}

      {modalGroup && (
        <TicketModal
          ticket={modalTicket}
          defaultStatus="progress"
          activities={activities}
          hideStatus
          hideWhy
          onSave={handleModalSave}
          onDelete={() => {
            if (modalGroup) {
              onSlotRangeChange(modalGroup.startMin, modalGroup.endMin, null)
            }
            setModalGroup(null); setModalTicket(null)
          }}
          onClose={() => { setModalGroup(null); setModalTicket(null) }}
        />
      )}
    </div>
  )
}

export default HourDetail
