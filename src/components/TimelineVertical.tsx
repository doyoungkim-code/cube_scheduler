import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import type { Activity, RoutineView, SlotRecord, TimeSlot } from '../types/schedule'
import { ERASER_ACTIVITY } from '../types/schedule'
import type { DayView } from '../hooks/useDayData'
import SlotRecordModal from './SlotRecordModal'
import { TOTAL_MIN, fmtMin, fmtDuration, groupAllSlots, buildRoutineMap, type TaskGroup } from '../lib/slots'
import { useNowMinute } from '../hooks/useNow'
import { inkOn } from '../lib/color'

const PX_PER_10MIN = 10
const TRACK_H = (TOTAL_MIN / 10) * PX_PER_10MIN
const HOURS = Array.from({ length: 24 }, (_, i) => i)

interface Props {
  day: DayView
  rawSlots: Record<number, TimeSlot>
  routines: RoutineView[]
  selectedActivity: Activity | null
  activities: Activity[]
  onSlotRangeChange: (startMin: number, endMin: number, activityId: string | null) => void
  onRecordChange: (startMin: number, endMin: number, record: SlotRecord) => void
  onDeselectActivity?: () => void
}

/** 모바일용 세로 타임라인. 위→아래로 드래그해 칠하고, 구간을 탭해 기록을 편집한다. */
export default function TimelineVertical({
  day, rawSlots, routines, selectedActivity, activities, onSlotRangeChange, onRecordChange, onDeselectActivity,
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [paintDrag, setPaintDrag] = useState<{ startMin: number; currentMin: number } | null>(null)
  const [modalGroup, setModalGroup] = useState<TaskGroup | null>(null)
  const justPainted = useRef(false)
  const nowRef = useRef<HTMLDivElement>(null)
  const [nowVisible, setNowVisible] = useState(true)

  // 현재 시각 선이 화면 밖이면 "지금" 버튼 표시
  useEffect(() => {
    const el = nowRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([entry]) => setNowVisible(entry.isIntersecting), { rootMargin: '-80px 0px -80px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const nowMin = useNowMinute()

  const scrollToNow = useCallback((smooth = true) => {
    const el = trackRef.current
    if (!el) return
    const y = el.getBoundingClientRect().top + window.scrollY + (nowMin / 10) * PX_PER_10MIN - window.innerHeight / 2
    window.scrollTo({ top: Math.max(0, y), behavior: smooth ? 'smooth' : 'auto' })
  }, [nowMin])

  // 처음 열릴 때 현재 시각으로
  // (App 의 "뷰 전환 시 맨 위로" 효과보다 뒤에 실행되도록 한 틱 미룸)
  useEffect(() => {
    const t = setTimeout(() => scrollToNow(false), 0)
    return () => clearTimeout(t)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const minFromY = useCallback((clientY: number): number => {
    const el = trackRef.current
    if (!el) return 0
    const rect = el.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height))
    return Math.min(TOTAL_MIN - 10, Math.floor((ratio * TOTAL_MIN) / 10) * 10)
  }, [])

  const isPaintMode = !!selectedActivity

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!selectedActivity) return
    if (e.pointerType === 'mouse' && e.button !== 0) return
    e.preventDefault()
    const m = minFromY(e.clientY)
    setPaintDrag({ startMin: m, currentMin: m })
  }, [selectedActivity, minFromY])

  useEffect(() => {
    if (!paintDrag) return
    const onMove = (e: PointerEvent) => {
      setPaintDrag(prev => prev ? { ...prev, currentMin: minFromY(e.clientY) } : null)
    }
    const onUp = () => {
      if (paintDrag && selectedActivity) {
        justPainted.current = true
        setTimeout(() => { justPainted.current = false }, 200)
        const start = Math.min(paintDrag.startMin, paintDrag.currentMin)
        const end = Math.max(paintDrag.startMin, paintDrag.currentMin) + 10
        if (selectedActivity.id === ERASER_ACTIVITY.id) onSlotRangeChange(start, end, null)
        else onSlotRangeChange(start, end, selectedActivity.id)
        onDeselectActivity?.()
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
  }, [paintDrag, selectedActivity, minFromY, onSlotRangeChange, onDeselectActivity])

  const routineMap = useMemo(() => buildRoutineMap(routines), [routines])
  const nowSlotMin = Math.floor(nowMin / 10) * 10
  const groups = useMemo(() => groupAllSlots(day, rawSlots, routineMap, nowSlotMin), [day, rawSlots, routineMap, nowSlotMin])

  const dragStart = paintDrag ? Math.min(paintDrag.startMin, paintDrag.currentMin) : -1
  const dragEnd = paintDrag ? Math.max(paintDrag.startMin, paintDrag.currentMin) + 10 : -1

  // 구간 탭 → 기록 편집
  const openGroup = (g: TaskGroup) => {
    if (isPaintMode || justPainted.current || g.isRoutine) return
    setModalGroup(g)
  }

  return (
    <section className={`vtl ${isPaintMode ? 'vtl--paint' : ''}`}>
      <div className="vtl-head">
        <span className="vtl-title">타임라인</span>
        {isPaintMode ? (
          <span className="timetable-hint">
            <span className="timetable-hint-dot" style={{ background: selectedActivity?.color }} />
            {selectedActivity?.id === ERASER_ACTIVITY.id ? '지울 구간을 위아래로 드래그' : `${selectedActivity?.name} · 위아래로 드래그`}
          </span>
        ) : (
          <span className="vtl-sub">구간을 탭하면 기록을 적을 수 있어요</span>
        )}
      </div>

      {paintDrag && (
        <div className="vtl-drag-badge" style={{ background: selectedActivity?.color, color: inkOn(selectedActivity?.color ?? "") }}>
          {fmtMin(dragStart)} ~ {fmtMin(dragEnd)} · {fmtDuration(dragEnd - dragStart)}
        </div>
      )}

      <div className="vtl-body">
        <div className="vtl-gutter" style={{ height: TRACK_H }}>
          {HOURS.map(h => (
            <span key={h} className="vtl-hour" style={{ top: h * 6 * PX_PER_10MIN }}>{String(h).padStart(2, '0')}</span>
          ))}
        </div>

        <div
          ref={trackRef}
          className={`vtl-track ${isPaintMode ? 'vtl-track--paint' : ''}`}
          style={{ height: TRACK_H }}
          onPointerDown={handlePointerDown}
        >
          {HOURS.map(h => (
            <div key={h} className="vtl-hourline" style={{ top: h * 6 * PX_PER_10MIN }} />
          ))}

          {groups.map((g, i) => {
            const top = (g.startMin / 10) * PX_PER_10MIN
            const height = ((g.endMin - g.startMin) / 10) * PX_PER_10MIN
            const title = g.record?.title
            const showText = height >= 28
            const compact = !showText && height >= 18   // 20분 구간: 한 줄로
            return (
              <div
                key={i}
                className={`vtl-seg ${g.isRoutine ? 'vtl-seg--routine' : ''} ${g.containsNow ? 'vtl-seg--now' : ''}`}
                style={{ top, height, background: g.color, color: inkOn(g.color) }}
                onClick={() => openGroup(g)}
                title={g.isRoutine ? `루틴: ${g.label}` : `${g.label} ${fmtMin(g.startMin)}–${fmtMin(g.endMin)}`}
              >
                {compact && (
                  <div className="vtl-seg-compact">{g.label} · {fmtDuration(g.endMin - g.startMin)}</div>
                )}
                {showText && (
                  <div className="vtl-seg-text">
                    <span className="vtl-seg-label">{g.label}</span>
                    {title && height >= 44 && <span className="vtl-seg-title">{title}</span>}
                    <span className="vtl-seg-time">{fmtMin(g.startMin)}–{fmtMin(g.endMin)} · {fmtDuration(g.endMin - g.startMin)}</span>
                  </div>
                )}
              </div>
            )
          })}

          {paintDrag && (
            <div
              className="vtl-drag"
              style={{
                top: (dragStart / 10) * PX_PER_10MIN,
                height: ((dragEnd - dragStart) / 10) * PX_PER_10MIN,
                background: selectedActivity?.id === ERASER_ACTIVITY.id ? ERASER_ACTIVITY.color : selectedActivity?.color,
              }}
            />
          )}

          <div ref={nowRef} className="vtl-now" style={{ top: (nowMin / 10) * PX_PER_10MIN }}>
            <span className="vtl-now-label">{fmtMin(nowMin)}</span>
          </div>
        </div>
      </div>

      {!nowVisible && !paintDrag && (
        <button className="vtl-fab" onClick={() => scrollToNow()} aria-label="현재 시각으로 이동">지금</button>
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
    </section>
  )
}
