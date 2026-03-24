import { useState } from 'react'
import type { Activity, DayData, TimeSlot } from '../types/schedule'

interface HourDetailProps {
  hour: number
  day: DayData
  rawSlots: Record<number, TimeSlot>
  selectedActivity: Activity | null
  onSlotChange: (min: number, slot: TimeSlot | null) => void
  onSlotRangeChange: (startMin: number, endMin: number, slot: TimeSlot | null) => void
  onClose: () => void
}

const MINS = [0, 10, 20, 30, 40, 50]

function fmtTime(hour: number, min: number): string {
  return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

interface SlotGroup {
  label: string
  color: string
  detail: string
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
    } else {
      if (current) groups.push(current)
      current = {
        label: slot.label,
        color: slot.color,
        detail: slot.detail ?? '',
        startMin: m,
        endMin: m + 10,
        isRoutine,
      }
    }
  }
  if (current) groups.push(current)
  return groups
}

function HourDetail({ hour, day, rawSlots, selectedActivity, onSlotChange, onSlotRangeChange, onClose }: HourDetailProps) {
  const baseMin = hour * 60
  const allGroups = groupAllDaySlots(day, rawSlots)
  const groups = allGroups.filter(g => g.startMin < baseMin + 60 && g.endMin > baseMin)
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

  const handleStartEdit = (g: SlotGroup) => {
    setEditing(true)
    setEditDetail(g.detail)
  }

  const handleSaveDetail = (g: SlotGroup) => {
    for (let m = g.startMin; m < g.endMin; m += 10) {
      const slot = day.slots[m]
      if (slot) {
        onSlotChange(m, { ...slot, detail: editDetail })
      }
    }
    setEditing(false)
  }

  // 빈 슬롯에 활동 채우기 (팔레트 선택 상태일 때)
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
          {groups.map((g, i) => (
            <div key={i} className="tt-group">
              <div className="tt-group-row" onClick={() => handleExpand(i)}>
                <span className="tt-group-color" style={{ backgroundColor: g.color }} />
                <span className="tt-group-label">{g.label}</span>
                <span className="tt-group-time">
                  {fmtTime(Math.floor(g.startMin / 60), g.startMin % 60)}~{fmtTime(Math.floor(g.endMin / 60), g.endMin % 60)}
                </span>
                <span className="tt-group-duration">
                  {g.endMin - g.startMin}분
                </span>
                {g.isRoutine && <span className="tt-group-badge">루틴</span>}
                {!g.isRoutine && (
                  <button
                    className="tt-group-delete"
                    onClick={e => { e.stopPropagation(); handleDelete(g) }}
                    title="삭제"
                  >
                    ✕
                  </button>
                )}
              </div>
              {expandedIdx === i && (
                <div className="tt-group-detail">
                  {editing ? (
                    <div className="tt-group-edit">
                      <textarea
                        className="tt-group-textarea"
                        value={editDetail}
                        onChange={e => setEditDetail(e.target.value)}
                        placeholder="세부사항 입력..."
                        autoFocus
                      />
                      <div className="tt-group-edit-actions">
                        <button className="btn-sm btn-save" onClick={() => handleSaveDetail(g)}>저장</button>
                        <button className="btn-sm btn-cancel" onClick={() => setEditing(false)}>취소</button>
                      </div>
                    </div>
                  ) : (
                    <div className="tt-group-view">
                      {g.detail ? (
                        <p className="tt-group-detail-text">{g.detail}</p>
                      ) : (
                        <p className="tt-group-detail-empty">세부사항 없음</p>
                      )}
                      {!g.isRoutine && (
                        <button className="btn-sm btn-save" onClick={() => handleStartEdit(g)}>수정</button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 빈 슬롯 채우기 (팔레트 활동 선택 시) */}
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
