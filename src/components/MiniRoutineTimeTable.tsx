import { useState, useRef, useCallback, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { Activity, RoutineView } from '../types/schedule'
import { ERASER_ACTIVITY } from '../types/schedule'
import { TOTAL_MIN, buildRoutineMap } from '../lib/slots'

interface Props {
  routines: RoutineView[]
  selectedActivity: Activity | null
  onChange: (routines: RoutineView[]) => void
}

const SLOT_COUNT = 144

function MiniRoutineTimeTable({ routines, selectedActivity, onChange }: Props) {
  const blocksRef = useRef<HTMLDivElement>(null)
  const [paintDrag, setPaintDrag] = useState<{ startMin: number; currentMin: number } | null>(null)

  const minFromMouse = useCallback((clientX: number): number => {
    if (!blocksRef.current) return 0
    const rect = blocksRef.current.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    return Math.min(1430, Math.floor((ratio * TOTAL_MIN) / 10) * 10)
  }, [])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!selectedActivity) return
    if (e.pointerType === 'mouse' && e.button !== 0) return
    e.preventDefault()
    const m = minFromMouse(e.clientX)
    setPaintDrag({ startMin: m, currentMin: m })
  }, [selectedActivity, minFromMouse])

  useEffect(() => {
    if (!paintDrag) return
    const onMove = (e: PointerEvent) => {
      setPaintDrag(prev => prev ? { ...prev, currentMin: minFromMouse(e.clientX) } : null)
    }
    const onUp = () => {
      if (paintDrag && selectedActivity) {
        const start = Math.min(paintDrag.startMin, paintDrag.currentMin)
        const end = Math.max(paintDrag.startMin, paintDrag.currentMin) + 10

        const updated: RoutineView[] = []
        for (const r of routines) {
          if (r.endMin <= start || r.startMin >= end) {
            updated.push(r)
          } else if (r.startMin < start && r.endMin > end) {
            updated.push({ ...r, endMin: start })
            updated.push({ ...r, id: uuidv4(), startMin: end })
          } else if (r.startMin < start) {
            updated.push({ ...r, endMin: start })
          } else if (r.endMin > end) {
            updated.push({ ...r, startMin: end })
          }
        }
        if (selectedActivity.id !== ERASER_ACTIVITY.id) {
          updated.push({
            id: uuidv4(),
            activityId: selectedActivity.id,
            name: selectedActivity.name,
            color: selectedActivity.color,
            startMin: start,
            endMin: end,
          })
        }
        onChange(updated)
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
  }, [paintDrag, selectedActivity, routines, onChange, minFromMouse])

  // 슬롯별 루틴 매핑
  const slotMap = buildRoutineMap(routines)

  const dragStart = paintDrag ? Math.min(paintDrag.startMin, paintDrag.currentMin) : -1
  const dragEnd = paintDrag ? Math.max(paintDrag.startMin, paintDrag.currentMin) + 10 : -1
  const isPaintMode = !!selectedActivity

  return (
    <div
      className={`mini-rt-track ${isPaintMode ? 'mini-rt-track--paint' : ''}`}
      onPointerDown={handlePointerDown}
    >
      <div className="mini-rt-blocks" ref={blocksRef}>
        {Array.from({ length: SLOT_COUNT }, (_, i) => {
          const m = i * 10
          const routine = slotMap[m]
          const isHourStart = m % 60 === 0
          const inDragRange = paintDrag && m >= dragStart && m < dragEnd

          let blockStyle: React.CSSProperties | undefined
          if (inDragRange && selectedActivity) {
            if (selectedActivity.id === ERASER_ACTIVITY.id) {
              blockStyle = { backgroundColor: ERASER_ACTIVITY.color, opacity: 0.4 }
            } else {
              blockStyle = { backgroundColor: selectedActivity.color, opacity: 0.75 }
            }
          } else if (routine) {
            blockStyle = { backgroundColor: routine.color }
          }

          return (
            <div
              key={m}
              className={`mini-rt-block ${isHourStart ? 'mini-rt-block--hour-start' : ''}`}
              style={blockStyle}
              title={routine ? routine.name : undefined}
            />
          )
        })}
      </div>
    </div>
  )
}

export default MiniRoutineTimeTable
