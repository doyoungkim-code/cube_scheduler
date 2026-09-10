import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import type { Activity, DayData, Routine, SlotRecord, TimeSlot } from '../types/schedule'
import { ERASER_ACTIVITY } from '../types/schedule'
import HourDetail from './HourDetail'
import SlotGroupCard from './SlotGroupCard'
import SlotRecordModal from './SlotRecordModal'
import { TOTAL_MIN, fmtMin, groupAllSlots, buildRoutineMap, type TaskGroup } from '../lib/slots'
import { useNowMinute } from '../hooks/useNow'
import { getTicketDrag } from '../lib/dragState'

interface TimeTableProps {
  day: DayData
  rawSlots: Record<number, TimeSlot>
  routines: Routine[]
  selectedActivity: Activity | null
  activities: Activity[]
  onSlotChange: (min: number, slot: TimeSlot | null) => void
  onSlotRangeChange: (startMin: number, endMin: number, slot: TimeSlot | null) => void
  onRecordChange: (startMin: number, endMin: number, record: SlotRecord) => void
  onTicketDrop?: (ticketId: string, slotMin: number) => void
  onDeselectActivity?: () => void
}

const SLOT_COUNT = 144
const HOURS = Array.from({ length: 24 }, (_, i) => i)
const ZOOM_SLOTS = 18

function fmtH(h: number): string {
  return String(h).padStart(2, '0')
}

function clampMin(m: number): number {
  return Math.max(0, Math.min(1430, m))
}

function TimeTable({ day, rawSlots, routines, selectedActivity, activities, onSlotChange, onSlotRangeChange, onRecordChange, onTicketDrop, onDeselectActivity }: TimeTableProps) {
  const [selectedHour, setSelectedHour] = useState<number | null>(null)
  const blocksRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // 좁은 화면(가로 스크롤)에서는 처음에 현재 시각이 보이도록
  useEffect(() => {
    const el = scrollRef.current
    if (!el || el.scrollWidth <= el.clientWidth) return
    const d = new Date()
    const ratio = (d.getHours() * 60 + d.getMinutes()) / TOTAL_MIN
    el.scrollLeft = Math.max(0, ratio * el.scrollWidth - el.clientWidth / 2)
  }, [])
  const [ticketDragOver, setTicketDragOver] = useState<{ min: number; label: string } | null>(null)

  // 페인트 드래그 상태
  const [paintDrag, setPaintDrag] = useState<{ startMin: number; currentMin: number } | null>(null)

  const nowMin = useNowMinute()

  const minFromMouse = useCallback((clientX: number): number => {
    if (!blocksRef.current) return 0
    const rect = blocksRef.current.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    return Math.min(1430, Math.floor((ratio * TOTAL_MIN) / 10) * 10)
  }, [])

  // 타임테이블 위 mouseDown → 페인트 시작
  // Shift+드래그: 기존 슬롯의 활동으로 연장
  const [shiftExtend, setShiftExtend] = useState<{ label: string; color: string } | null>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; min: number } | null>(null)

  const justPainted = useRef(false)

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    const m = minFromMouse(e.clientX)

    if (e.shiftKey) {
      // Shift: 인접 슬롯의 활동 복사하여 연장
      const slot = day.slots[m] || day.slots[m - 10] || day.slots[m + 10]
      if (slot) {
        setShiftExtend({ label: slot.label, color: slot.color })
        setPaintDrag({ startMin: m, currentMin: m })
        return
      }
    }

    if (!selectedActivity) return
    e.preventDefault()
    setShiftExtend(null)
    setPaintDrag({ startMin: m, currentMin: m })
  }, [selectedActivity, minFromMouse, day.slots])

  // pointermove / pointerup 글로벌 이벤트
  useEffect(() => {
    if (!paintDrag) return

    const onMove = (e: PointerEvent) => {
      setPaintDrag(prev => prev ? { ...prev, currentMin: minFromMouse(e.clientX) } : null)
    }

    const onUp = () => {
      if (paintDrag) {
        // 드래그 직후 발생하는 click 으로 시간 상세가 열리는 것 방지
        justPainted.current = true
        setTimeout(() => { justPainted.current = false }, 150)
        const start = Math.min(paintDrag.startMin, paintDrag.currentMin)
        const end = Math.max(paintDrag.startMin, paintDrag.currentMin) + 10

        if (shiftExtend) {
          // Shift+드래그: 해당 활동으로 구간 채움
          onSlotRangeChange(start, end, { label: shiftExtend.label, color: shiftExtend.color })
          setShiftExtend(null)
        } else if (selectedActivity) {
          if (selectedActivity.id === ERASER_ACTIVITY.id) {
            onSlotRangeChange(start, end, null)
          } else {
            onSlotRangeChange(start, end, { label: selectedActivity.name, color: selectedActivity.color })
          }
          onDeselectActivity?.()
        }
      }
      setPaintDrag(null)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [paintDrag, selectedActivity, shiftExtend, minFromMouse, onSlotRangeChange, onDeselectActivity])

  // 비드래그 상태 블록 클릭
  const handleBlockClick = (slotMin: number) => {
    if (selectedActivity || paintDrag || justPainted.current) return
    const hour = Math.floor(slotMin / 60)
    setSelectedHour(selectedHour === hour ? null : hour)
  }

  // 범위 계산
  const dragStart = paintDrag ? Math.min(paintDrag.startMin, paintDrag.currentMin) : -1
  const dragEnd = paintDrag ? Math.max(paintDrag.startMin, paintDrag.currentMin) + 10 : -1

  // 슬롯별 루틴 매핑 (표시용)
  const routineMap = useMemo(() => buildRoutineMap(routines), [routines])

  const nowPct = (nowMin / TOTAL_MIN) * 100
  const isPaintMode = !!selectedActivity || !!shiftExtend

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
        {isPaintMode && (
          <span className="timetable-hint">
            <span className="timetable-hint-dot" style={{ background: shiftExtend?.color ?? selectedActivity?.color }} />
            {shiftExtend ? `${shiftExtend.label} 연장` : selectedActivity?.id === ERASER_ACTIVITY.id ? '지울 구간을 드래그' : `${selectedActivity?.name} 칠할 구간을 드래그`}
          </span>
        )}
      </div>

      <div className="tt-scroll" ref={scrollRef}>
      <div className="tt-scroll-inner">
      <div className="tt-hour-labels">
        {HOURS.map(h => (
          <div key={h} className="tt-hour-label">{fmtH(h)}</div>
        ))}
      </div>

      <div
        className={`tt-track ${isPaintMode ? 'tt-track--paint' : ''} ${ticketDragOver !== null ? 'tt-track--ticket-drop' : ''}`}
        onPointerDown={handlePointerDown}
        onDragOver={e => {
          if (!e.dataTransfer.types.includes('ticket-id')) return
          e.preventDefault()
          e.dataTransfer.dropEffect = 'move'
          const m = minFromMouse(e.clientX)
          // dragover 중엔 getData 가 비어 있으므로 드래그 시작 시 저장한 공유 상태에서 읽는다
          const label = getTicketDrag()?.activityName ?? ''
          setTicketDragOver(prev => (prev && prev.min === m && prev.label === label) ? prev : { min: m, label })
        }}
        onDragLeave={e => {
          // 자식 블록 사이를 지날 때 발생하는 leave 는 무시 (깜빡임 방지)
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setTicketDragOver(null)
        }}
        onDrop={e => {
          const ticketId = e.dataTransfer.getData('ticket-id')
          if (!ticketId) { setTicketDragOver(null); return }
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
            // 티켓 드롭: 같은 활동 슬롯만 하이라이트
            const isDraggingTicket = ticketDragOver !== null
            const slotMatchesTicket = isDraggingTicket && slot && ticketDragOver.label && slot.label === ticketDragOver.label
            const isTicketDropTarget = isDraggingTicket && m === ticketDragOver.min

            let blockStyle: React.CSSProperties | undefined
            if (isTicketDropTarget && slotMatchesTicket) {
              blockStyle = { backgroundColor: '#1a73e8', opacity: 0.6 }
            } else if (isTicketDropTarget && !slotMatchesTicket) {
              blockStyle = rawSlot ? { backgroundColor: rawSlot.color, opacity: 0.3 } : { backgroundColor: '#ff3b30', opacity: 0.2 }
            } else if (isDraggingTicket && slotMatchesTicket) {
              // 같은 활동 슬롯 전체를 살짝 강조
              blockStyle = { backgroundColor: slot!.color, boxShadow: 'inset 0 0 0 1px rgba(26,115,232,0.4)' }
            } else if (inDragRange && shiftExtend) {
              blockStyle = { backgroundColor: shiftExtend.color, opacity: 0.75 }
            } else if (inDragRange && selectedActivity) {
              if (selectedActivity.id === ERASER_ACTIVITY.id) {
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
                onContextMenu={e => {
                  if (!rawSlot) return
                  e.preventDefault()
                  setContextMenu({ x: e.clientX, y: e.clientY, min: m })
                }}
                title={isRoutineOnly ? `루틴: ${routine.name}` : undefined}
              />
            )
          })}
        </div>
      </div>
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
                if (selectedActivity.id === ERASER_ACTIVITY.id) {
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

      {selectedHour !== null ? (
        <HourDetail
          hour={selectedHour}
          day={day}
          rawSlots={rawSlots}
          routines={routines}
          selectedActivity={selectedActivity}
          activities={activities}
          onSlotChange={onSlotChange}
          onSlotRangeChange={onSlotRangeChange}
          onRecordChange={onRecordChange}
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
          onRecordChange={onRecordChange}
        />
      )}

      {/* 우클릭 컨텍스트 메뉴 */}
      {contextMenu && (() => {
        const slot = rawSlots[contextMenu.min]
        if (!slot) return null
        // 연속 구간 찾기 — 직접 칠한 슬롯(rawSlots) 기준. 루틴 유령 슬롯은 삭제 대상이 아니므로 제외.
        let gStart = contextMenu.min
        while (gStart > 0 && rawSlots[gStart - 10]?.label === slot.label) gStart -= 10
        let gEnd = contextMenu.min + 10
        while (gEnd < TOTAL_MIN && rawSlots[gEnd]?.label === slot.label) gEnd += 10

        return (
          <>
            <div className="ctx-backdrop" onClick={() => setContextMenu(null)} />
            <div className="ctx-menu" style={{ left: contextMenu.x, top: contextMenu.y }}>
              <div className="ctx-header">{slot.label} ({fmtMin(gStart)}~{fmtMin(gEnd)})</div>
              <button className="ctx-item" onClick={() => {
                onSlotRangeChange(gStart, gEnd, null)
                setContextMenu(null)
              }}>이 구간 삭제</button>
              <button className="ctx-item" onClick={() => {
                // 이 시간 블록 상세 열기
                setSelectedHour(Math.floor(contextMenu.min / 60))
                setContextMenu(null)
              }}>시간 상세 보기</button>
            </div>
          </>
        )
      })()}
    </section>
  )
}

interface CurrentTasksProps {
  day: DayData
  rawSlots: Record<number, TimeSlot>
  routineMap: Record<number, Routine>
  nowMin: number
  nowSlotMin: number
  activities: Activity[]
  onSlotRangeChange: (startMin: number, endMin: number, slot: TimeSlot | null) => void
  onRecordChange: (startMin: number, endMin: number, record: SlotRecord) => void
}

/** 지금 시각이 속한 한 시간의 기록 목록 */
function CurrentTasks({ day, rawSlots, routineMap, nowMin, nowSlotMin, activities, onSlotRangeChange, onRecordChange }: CurrentTasksProps) {
  const [modalGroup, setModalGroup] = useState<TaskGroup | null>(null)

  const hourStart = Math.floor(nowMin / 60) * 60
  const hourEnd = hourStart + 60
  const groups = useMemo(
    () => groupAllSlots(day, rawSlots, routineMap, nowSlotMin).filter(g => !g.isRoutine && g.startMin < hourEnd && g.endMin > hourStart),
    [day, rawSlots, routineMap, nowSlotMin, hourStart, hourEnd],
  )

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
          {groups.map(g => (
            <SlotGroupCard
              key={g.startMin}
              group={g}
              highlightNow
              onClick={() => setModalGroup(g)}
              onDelete={() => onSlotRangeChange(g.startMin, g.endMin, null)}
            />
          ))}
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

export default TimeTable
