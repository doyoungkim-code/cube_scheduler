import { useState, useRef, useCallback, useEffect } from 'react'
import type { Activity, DayData, Routine, TimeSlot, SlotRecord } from '../types/schedule'
import type { Ticket } from '../types/kanban'
import { activityFieldsForName } from '../types/kanban'
import TicketModal from './TicketModal'
import HourDetail from './HourDetail'

interface TimeTableProps {
  day: DayData
  rawSlots: Record<number, TimeSlot>
  routines: Routine[]
  selectedActivity: Activity | null
  tickets: Ticket[]
  activities: Activity[]
  onSlotChange: (min: number, slot: TimeSlot | null) => void
  onSlotRangeChange: (startMin: number, endMin: number, slot: TimeSlot | null) => void
  onTicketDrop?: (ticketId: string, slotMin: number) => void
  onDeselectActivity?: () => void
}

const TOTAL_MIN = 1440
const SLOT_COUNT = 144
const HOURS = Array.from({ length: 24 }, (_, i) => i)
const ZOOM_SLOTS = 18

function fmtH(h: number): string {
  return String(h).padStart(2, '0')
}

function fmtMin(m: number): string {
  const h = Math.floor(m / 60)
  const mm = m % 60
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

function clampMin(m: number): number {
  return Math.max(0, Math.min(1430, m))
}

function TimeTable({ day, rawSlots, routines, selectedActivity, tickets, activities, onSlotChange, onSlotRangeChange, onTicketDrop, onDeselectActivity }: TimeTableProps) {
  const [selectedHour, setSelectedHour] = useState<number | null>(null)
  const blocksRef = useRef<HTMLDivElement>(null)
  const [ticketDragOver, setTicketDragOver] = useState<number | null>(null)

  // 페인트 드래그 상태
  const [paintDrag, setPaintDrag] = useState<{ startMin: number; currentMin: number } | null>(null)

  // 현재 시각
  const [nowMin, setNowMin] = useState(() => {
    const d = new Date()
    return d.getHours() * 60 + d.getMinutes()
  })

  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date()
      setNowMin(d.getHours() * 60 + d.getMinutes())
    }, 30000)
    return () => clearInterval(timer)
  }, [])

  const minFromMouse = useCallback((clientX: number): number => {
    if (!blocksRef.current) return 0
    const rect = blocksRef.current.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    return Math.min(1430, Math.floor((ratio * TOTAL_MIN) / 10) * 10)
  }, [])

  // 타임테이블 위 mouseDown → 페인트 시작
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!selectedActivity) return
    e.preventDefault()
    const m = minFromMouse(e.clientX)
    setPaintDrag({ startMin: m, currentMin: m })
  }, [selectedActivity, minFromMouse])

  // mousemove / mouseup 글로벌 이벤트
  useEffect(() => {
    if (!paintDrag) return

    const onMove = (e: MouseEvent) => {
      setPaintDrag(prev => prev ? { ...prev, currentMin: minFromMouse(e.clientX) } : null)
    }

    const onUp = () => {
      if (paintDrag && selectedActivity) {
        const start = Math.min(paintDrag.startMin, paintDrag.currentMin)
        const end = Math.max(paintDrag.startMin, paintDrag.currentMin) + 10
        if (selectedActivity.id === 'eraser') {
          onSlotRangeChange(start, end, null)
        } else {
          onSlotRangeChange(start, end, {
            label: selectedActivity.name,
            color: selectedActivity.color,
          })
        }
        // 드래그 완료 후 활동 선택 해제
        onDeselectActivity?.()
      }
      setPaintDrag(null)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [paintDrag, selectedActivity, minFromMouse, onSlotRangeChange])

  // 비드래그 상태 블록 클릭
  const handleBlockClick = (slotMin: number) => {
    if (selectedActivity || paintDrag) return
    const hour = Math.floor(slotMin / 60)
    setSelectedHour(selectedHour === hour ? null : hour)
  }

  // 범위 계산
  const dragStart = paintDrag ? Math.min(paintDrag.startMin, paintDrag.currentMin) : -1
  const dragEnd = paintDrag ? Math.max(paintDrag.startMin, paintDrag.currentMin) + 10 : -1

  // 슬롯별 루틴 매핑 (표시용)
  const routineMap: Record<number, Routine> = {}
  for (const r of routines) {
    for (let m = r.startMin; m < r.endMin; m += 10) {
      routineMap[m] = r
    }
  }

  const nowPct = (nowMin / TOTAL_MIN) * 100
  const isPaintMode = !!selectedActivity

  // 줌 뷰 중심
  const zoomCenter = paintDrag ? paintDrag.currentMin : null
  let zoomStart = 0
  let zoomEnd = ZOOM_SLOTS * 10
  if (zoomCenter !== null) {
    zoomStart = clampMin(zoomCenter - Math.floor(ZOOM_SLOTS / 2) * 10)
    zoomEnd = zoomStart + ZOOM_SLOTS * 10
    if (zoomEnd > TOTAL_MIN) { zoomEnd = TOTAL_MIN; zoomStart = zoomEnd - ZOOM_SLOTS * 10 }
  }

  // 현재 활동 (nowMin 기준 10분 슬롯)
  const nowSlotMin = Math.floor(nowMin / 10) * 10
  const currentSlot = day.slots[nowSlotMin]
  const currentRoutine = !rawSlots[nowSlotMin] && routineMap[nowSlotMin] ? routineMap[nowSlotMin] : null

  return (
    <section className="timetable">
      <div className="timetable-header">
        <div className="timetable-now-wrap">
          {(currentSlot || currentRoutine) && (
            <span
              className="timetable-current-activity"
              style={{ backgroundColor: currentSlot?.color ?? currentRoutine?.color }}
            >
              {currentSlot?.label ?? currentRoutine?.name}
            </span>
          )}
          <span className="timetable-now">{fmtMin(nowMin)}</span>
        </div>
      </div>

      <div className="tt-hour-labels">
        {HOURS.map(h => (
          <div key={h} className="tt-hour-label">{fmtH(h)}</div>
        ))}
      </div>

      <div
        className={`tt-track ${isPaintMode ? 'tt-track--paint' : ''} ${ticketDragOver !== null ? 'tt-track--ticket-drop' : ''}`}
        onMouseDown={handleMouseDown}
        onDragOver={e => {
          const ticketId = e.dataTransfer.types.includes('ticket-id')
          if (!ticketId) return
          e.preventDefault()
          e.dataTransfer.dropEffect = 'move'
          const m = minFromMouse(e.clientX)
          setTicketDragOver(m)
        }}
        onDragLeave={() => setTicketDragOver(null)}
        onDrop={e => {
          const ticketId = e.dataTransfer.getData('ticket-id')
          const ticketStatus = e.dataTransfer.getData('ticket-status')
          if (!ticketId || ticketStatus !== 'progress') {
            setTicketDragOver(null)
            return
          }
          e.preventDefault()
          const m = minFromMouse(e.clientX)
          onTicketDrop?.(ticketId, m)
          setTicketDragOver(null)
        }}
      >
        <div className="tt-now-line" style={{ left: `${nowPct}%` }}>
          <div className="tt-now-dot" />
        </div>

        <div className="tt-blocks" ref={blocksRef}>
          {Array.from({ length: SLOT_COUNT }, (_, i) => {
            const m = i * 10
            const slot = day.slots[m]
            const rawSlot = rawSlots[m]
            const routine = routineMap[m]
            const isRoutineOnly = !rawSlot && !!routine
            const isHourStart = m % 60 === 0
            const hour = Math.floor(m / 60)
            const isSelectedHour = selectedHour === hour
            const inDragRange = paintDrag && m >= dragStart && m < dragEnd
            const isTicketDropTarget = ticketDragOver !== null && m === ticketDragOver

            let blockStyle: React.CSSProperties | undefined
            if (isTicketDropTarget) {
              blockStyle = { backgroundColor: '#1a73e8', opacity: 0.6 }
            } else if (inDragRange && selectedActivity) {
              if (selectedActivity.id === 'eraser') {
                blockStyle = { backgroundColor: '#ff3b30', opacity: 0.4 }
              } else {
                blockStyle = { backgroundColor: selectedActivity.color, opacity: 0.75 }
              }
            } else if (rawSlot) {
              blockStyle = { backgroundColor: rawSlot.color }
            } else if (isRoutineOnly) {
              blockStyle = { backgroundColor: routine.color, opacity: 0.4 }
            }

            return (
              <div
                key={m}
                className={`tt-block ${slot ? 'tt-block--filled' : ''} ${isRoutineOnly ? 'tt-block--routine' : ''} ${isHourStart ? 'tt-block--hour-start' : ''} ${isSelectedHour ? 'tt-block--selected-hour' : ''} ${inDragRange ? 'tt-block--drag-range' : ''} ${isTicketDropTarget ? 'tt-block--ticket-drop' : ''}`}
                style={blockStyle}
                onClick={() => handleBlockClick(m)}
                title={isRoutineOnly ? `루틴: ${routine.name}` : undefined}
              />
            )
          })}
        </div>
      </div>

      {/* 줌 뷰 */}
      {paintDrag && selectedActivity && zoomCenter !== null && (
        <div className="tt-zoom">
          <div className="tt-zoom-header">
            <span className="tt-zoom-range">
              {fmtMin(dragStart)} ~ {fmtMin(dragEnd)}
              <span className="tt-zoom-duration">
                ({Math.round((dragEnd - dragStart) / 60 * 10) / 10}시간)
              </span>
            </span>
          </div>
          <div className="tt-zoom-blocks">
            {Array.from({ length: ZOOM_SLOTS }, (_, i) => {
              const m = zoomStart + i * 10
              if (m >= TOTAL_MIN) return null
              const slot = day.slots[m]
              const isHourStart = m % 60 === 0
              const inDragRange = paintDrag && m >= dragStart && m < dragEnd

              let blockStyle: React.CSSProperties | undefined
              if (inDragRange && selectedActivity) {
                if (selectedActivity.id === 'eraser') {
                  blockStyle = { backgroundColor: '#ff3b30', opacity: 0.5 }
                } else {
                  blockStyle = { backgroundColor: selectedActivity.color, opacity: 0.8 }
                }
              } else if (slot) {
                blockStyle = { backgroundColor: slot.color }
              }

              return (
                <div key={m} className="tt-zoom-slot-wrap">
                  <div
                    className={`tt-zoom-slot ${slot && !inDragRange ? 'tt-zoom-slot--filled' : ''} ${isHourStart ? 'tt-zoom-slot--hour-start' : ''} ${inDragRange ? 'tt-zoom-slot--drag' : ''}`}
                    style={blockStyle}
                  />
                  <span className={`tt-zoom-time ${isHourStart ? 'tt-zoom-time--hour' : ''}`}>
                    {fmtMin(m)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {selectedHour !== null && !isPaintMode ? (
        <HourDetail
          hour={selectedHour}
          day={day}
          rawSlots={rawSlots}
          selectedActivity={selectedActivity}
          activities={activities}
          onSlotChange={onSlotChange}
          onSlotRangeChange={onSlotRangeChange}
          onClose={() => setSelectedHour(null)}
        />
      ) : !isPaintMode && (
        <CurrentTasks
          day={day}
          rawSlots={rawSlots}
          routineMap={routineMap}
          nowMin={nowMin}
          nowSlotMin={nowSlotMin}
          activities={activities}
          onSlotRangeChange={onSlotRangeChange}
          onSlotChange={onSlotChange}
        />
      )}
    </section>
  )
}

interface TaskGroup {
  label: string
  color: string
  detail: string
  ticketId: string | undefined
  record: SlotRecord | undefined
  startMin: number
  endMin: number
  isRoutine: boolean
  containsNow: boolean
}

interface CurrentTasksProps {
  day: DayData
  rawSlots: Record<number, TimeSlot>
  routineMap: Record<number, Routine>
  nowMin: number
  nowSlotMin: number
  activities: Activity[]
  onSlotRangeChange: (startMin: number, endMin: number, slot: TimeSlot | null) => void
  onSlotChange: (min: number, slot: TimeSlot | null) => void
}

function groupAllSlots(day: DayData, rawSlots: Record<number, TimeSlot>, routineMap: Record<number, Routine>, nowSlotMin: number): TaskGroup[] {
  const groups: TaskGroup[] = []
  let current: TaskGroup | null = null

  for (let m = 0; m < 1440; m += 10) {
    const slot = day.slots[m]
    if (!slot) {
      if (current) { groups.push(current); current = null }
      continue
    }
    const raw = rawSlots[m]
    const isRoutine = !raw && !!routineMap[m]

    if (current && current.label === slot.label && current.color === slot.color && current.isRoutine === isRoutine) {
      current.endMin = m + 10
      if (m === nowSlotMin) current.containsNow = true
      if (slot.detail && !current.detail) current.detail = slot.detail
      if (slot.ticketId && !current.ticketId) current.ticketId = slot.ticketId
      if (slot.record && !current.record) current.record = slot.record
    } else {
      if (current) groups.push(current)
      current = {
        label: slot.label,
        color: slot.color,
        detail: slot.detail ?? '',
        ticketId: slot.ticketId,
        record: slot.record,
        startMin: m,
        endMin: m + 10,
        isRoutine,
        containsNow: m === nowSlotMin,
      }
    }
  }
  if (current) groups.push(current)
  return groups
}

function CurrentTasks({ day, rawSlots, routineMap, nowMin, nowSlotMin, activities, onSlotRangeChange, onSlotChange }: CurrentTasksProps) {
  const [modalGroup, setModalGroup] = useState<TaskGroup | null>(null)
  const [modalTicket, setModalTicket] = useState<Ticket | null>(null)

  const hourStart = Math.floor(nowMin / 60) * 60
  const hourEnd = hourStart + 60
  const allGroups = groupAllSlots(day, rawSlots, routineMap, nowSlotMin)
  const groups = allGroups.filter(g => !g.isRoutine && g.startMin < hourEnd && g.endMin > hourStart)

  const handleEdit = (g: TaskGroup) => {
    const act = activities.find(a => a.name === g.label)
    // record가 있으면 저장된 데이터로 복원, 없으면 기본값
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
    // 타임라인 기록은 칸반과 별개 — 슬롯 record에 저장
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

  const handleDelete = (g: TaskGroup) => {
    onSlotRangeChange(g.startMin, g.endMin, null)
  }

  const duration = (g: TaskGroup) => {
    const mins = g.endMin - g.startMin
    return mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60 ? `${mins % 60}m` : ''}` : `${mins}m`
  }

  return (
    <div className="tt-current-tasks">
      <div className="tt-current-header">
        <span className="tt-current-title">현재 시간대</span>
        <span className="tt-current-time">{fmtMin(hourStart)} ~ {fmtMin(hourEnd)}</span>
      </div>
      {groups.length === 0 ? (
        <div className="tt-current-empty">등록된 일정 없음</div>
      ) : (
        <div className="tt-current-groups">
          {groups.map((g, i) => {
            const displayTitle = g.record?.title || g.label
            const displayDesc = g.record?.description || g.detail

            return (
              <div
                key={i}
                className={`tt-ticket ${g.containsNow ? 'tt-ticket--now' : ''}`}
                onClick={() => handleEdit(g)}
              >
                <div className="tt-ticket-stripe" style={{ background: g.color }} />
                <div className="tt-ticket-body">
                  <div className="tt-ticket-header">
                    <span className="tt-ticket-type" style={{ background: g.color }}>{g.label}</span>
                    <span className="tt-ticket-time">{fmtMin(g.startMin)}~{fmtMin(g.endMin)}</span>
                    <span className="tt-ticket-duration">{duration(g)}</span>
                    <button
                      className="tt-ticket-delete"
                      onClick={e => { e.stopPropagation(); handleDelete(g) }}
                    >✕</button>
                  </div>
                  <div className="tt-ticket-title">{displayTitle}</div>
                  {displayDesc && <div className="tt-ticket-desc">{displayDesc}</div>}
                </div>
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
            setModalGroup(null)
            setModalTicket(null)
          }}
          onClose={() => { setModalGroup(null); setModalTicket(null) }}
        />
      )}
    </div>
  )
}

export default TimeTable
