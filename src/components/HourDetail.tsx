import { useMemo, useState } from 'react'
import type { Activity, DayData, Routine, SlotRecord, TimeSlot } from '../types/schedule'
import { ERASER_ACTIVITY } from '../types/schedule'
import { groupAllSlots, buildRoutineMap, fmtMin, type TaskGroup } from '../lib/slots'
import SlotGroupCard from './SlotGroupCard'
import SlotRecordModal from './SlotRecordModal'

interface HourDetailProps {
  hour: number
  day: DayData
  rawSlots: Record<number, TimeSlot>
  routines: Routine[]
  selectedActivity: Activity | null
  activities: Activity[]
  onSlotChange: (min: number, slot: TimeSlot | null) => void
  onSlotRangeChange: (startMin: number, endMin: number, slot: TimeSlot | null) => void
  onRecordChange: (startMin: number, endMin: number, record: SlotRecord) => void
  onClose: () => void
}

const MINS = [0, 10, 20, 30, 40, 50]

/** 한 시간 구간의 기록 목록 + (팔레트 선택 시) 빈 10분 칸 채우기 */
function HourDetail({ hour, day, rawSlots, routines, selectedActivity, activities, onSlotChange, onSlotRangeChange, onRecordChange, onClose }: HourDetailProps) {
  const baseMin = hour * 60
  const routineMap = useMemo(() => buildRoutineMap(routines), [routines])
  const groups = useMemo(
    () => groupAllSlots(day, rawSlots, routineMap, -1).filter(g => !g.isRoutine && g.startMin < baseMin + 60 && g.endMin > baseMin),
    [day, rawSlots, routineMap, baseMin],
  )
  const [modalGroup, setModalGroup] = useState<TaskGroup | null>(null)

  const canAdd = !!selectedActivity && selectedActivity.id !== ERASER_ACTIVITY.id
  const handleEmptySlotClick = (slotMin: number) => {
    if (!canAdd || !selectedActivity) return
    onSlotChange(slotMin, { label: selectedActivity.name, color: selectedActivity.color })
  }

  const hasEmpty = MINS.some(m => !day.slots[baseMin + m])

  return (
    <div className="hour-detail">
      <div className="hour-detail-header">
        <strong>{fmtMin(baseMin)} ~ {fmtMin(baseMin + 60)}</strong>
        <div className="hour-detail-actions">
          {groups.length > 0 && (
            <button className="btn-sm btn-cancel" onClick={() => onSlotRangeChange(baseMin, baseMin + 60, null)}>전체 삭제</button>
          )}
          <button className="slot-editor-close" onClick={onClose} aria-label="닫기">&times;</button>
        </div>
      </div>

      {groups.length === 0 && !(canAdd && hasEmpty) ? (
        <div className="tt-current-empty">
          {selectedActivity?.id === ERASER_ACTIVITY.id ? '지울 기록이 없어요' : '등록된 일정 없음'}
        </div>
      ) : (
        <div className="tt-current-groups">
          {groups.map(g => (
            <SlotGroupCard
              key={g.startMin}
              group={g}
              onClick={() => setModalGroup(g)}
              onDelete={() => onSlotRangeChange(g.startMin, g.endMin, null)}
            />
          ))}
        </div>
      )}

      {canAdd && selectedActivity && (
        <div className="hour-detail-empty-slots">
          {MINS.map(m => {
            const slotMin = baseMin + m
            if (day.slots[slotMin]) return null
            return (
              <button key={m} type="button" className="hour-slot hour-slot--add" onClick={() => handleEmptySlotClick(slotMin)}>
                <span className="hour-slot-time">{fmtMin(slotMin)}</span>
                <span className="hour-slot-empty">+ {selectedActivity.name}</span>
              </button>
            )
          })}
        </div>
      )}

      {modalGroup && (
        <SlotRecordModal
          group={modalGroup}
          activities={activities}
          onSave={onRecordChange}
          onDelete={(s, e) => onSlotRangeChange(s, e, null)}
          onClose={() => setModalGroup(null)}
        />
      )}
    </div>
  )
}

export default HourDetail
