import { useState, useRef, useCallback, useEffect } from 'react'
import type { Activity, DayData, Routine, TimeSlot } from '../types/schedule'
import HourDetail from './HourDetail'

interface TimeTableProps {
  day: DayData
  rawSlots: Record<number, TimeSlot>
  routines: Routine[]
  selectedActivity: Activity | null
  onSlotChange: (min: number, slot: TimeSlot | null) => void
  onSlotRangeChange: (startMin: number, endMin: number, slot: TimeSlot | null) => void
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

function TimeTable({ day, rawSlots, routines, selectedActivity, onSlotChange, onSlotRangeChange }: TimeTableProps) {
  const [selectedHour, setSelectedHour] = useState<number | null>(null)
  const blocksRef = useRef<HTMLDivElement>(null)

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
        className={`tt-track ${isPaintMode ? 'tt-track--paint' : ''}`}
        onMouseDown={handleMouseDown}
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

            let blockStyle: React.CSSProperties | undefined
            if (inDragRange && selectedActivity) {
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
                className={`tt-block ${slot ? 'tt-block--filled' : ''} ${isRoutineOnly ? 'tt-block--routine' : ''} ${isHourStart ? 'tt-block--hour-start' : ''} ${isSelectedHour ? 'tt-block--selected-hour' : ''} ${inDragRange ? 'tt-block--drag-range' : ''}`}
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
    } else {
      if (current) groups.push(current)
      current = {
        label: slot.label,
        color: slot.color,
        detail: slot.detail ?? '',
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

function CurrentTasks({ day, rawSlots, routineMap, nowMin, nowSlotMin, onSlotRangeChange, onSlotChange }: CurrentTasksProps) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)
  const [editing, setEditing] = useState(false)
  const [editDetail, setEditDetail] = useState('')

  const hourStart = Math.floor(nowMin / 60) * 60
  const hourEnd = hourStart + 60
  const allGroups = groupAllSlots(day, rawSlots, routineMap, nowSlotMin)
  const groups = allGroups.filter(g => g.startMin < hourEnd && g.endMin > hourStart)

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

  const handleDelete = (g: TaskGroup) => {
    onSlotRangeChange(g.startMin, g.endMin, null)
    setExpandedIdx(null)
    setEditing(false)
  }

  const handleStartEdit = (g: TaskGroup) => {
    setEditing(true)
    setEditDetail(g.detail)
  }

  const handleSaveDetail = (g: TaskGroup) => {
    for (let m = g.startMin; m < g.endMin; m += 10) {
      const slot = day.slots[m]
      if (slot) {
        onSlotChange(m, { ...slot, detail: editDetail })
      }
    }
    setEditing(false)
  }

  return (
    <div className="tt-current-tasks">
      <div className="tt-current-header">
        <span className="tt-current-title">현재 시간대</span>
        <span className="tt-current-time">
          {fmtMin(hourStart)} ~ {fmtMin(hourStart + 60)}
        </span>
      </div>
      {groups.length === 0 ? (
        <div className="tt-current-empty">등록된 일정 없음</div>
      ) : (
        <div className="tt-current-groups">
          {groups.map((g, i) => (
            <div key={i} className={`tt-group ${g.containsNow ? 'tt-group--now' : ''}`}>
              <div className="tt-group-row" onClick={() => handleExpand(i)}>
                <span className="tt-group-color" style={{ backgroundColor: g.color }} />
                <span className="tt-group-label">{g.label}</span>
                <span className="tt-group-time">{fmtMin(g.startMin)}~{fmtMin(g.endMin)}</span>
                <span className="tt-group-duration">
                  {(g.endMin - g.startMin) / 10 * 10}분
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
    </div>
  )
}

export default TimeTable
