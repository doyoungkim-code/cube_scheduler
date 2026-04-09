import { useState, useRef, useCallback, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { Activity, Routine } from '../types/schedule'

interface Props {
  routines: Routine[]
  selectedActivity: Activity | null
  onChange: (routines: Routine[]) => void
}

const TOTAL_MIN = 1440
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

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!selectedActivity) return
    e.preventDefault()
    const m = minFromMouse(e.clientX)
    setPaintDrag({ startMin: m, currentMin: m })
  }, [selectedActivity, minFromMouse])

  useEffect(() => {
    if (!paintDrag) return
    const onMove = (e: MouseEvent) => {
      setPaintDrag(prev => prev ? { ...prev, currentMin: minFromMouse(e.clientX) } : null)
    }
    const onUp = () => {
      if (paintDrag && selectedActivity) {
        const start = Math.min(paintDrag.startMin, paintDrag.currentMin)
        const end = Math.max(paintDrag.startMin, paintDrag.currentMin) + 10

        const updated: Routine[] = []
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
        if (selectedActivity.id !== 'eraser') {
          updated.push({
            id: uuidv4(),
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
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [paintDrag, selectedActivity, routines, onChange, minFromMouse])

  // 슬롯별 루틴 매핑
  const slotMap: Record<number, Routine> = {}
  for (const r of routines) {
    for (let m = r.startMin; m < r.endMin; m += 10) {
      slotMap[m] = r
    }
  }

  const dragStart = paintDrag ? Math.min(paintDrag.startMin, paintDrag.currentMin) : -1
  const dragEnd = paintDrag ? Math.max(paintDrag.startMin, paintDrag.currentMin) + 10 : -1
  const isPaintMode = !!selectedActivity

  return (
    <div
      className={`mini-rt-track ${isPaintMode ? 'mini-rt-track--paint' : ''}`}
      onMouseDown={handleMouseDown}
    >
      <div className="mini-rt-blocks" ref={blocksRef}>
        {Array.from({ length: SLOT_COUNT }, (_, i) => {
          const m = i * 10
          const routine = slotMap[m]
          const isHourStart = m % 60 === 0
          const inDragRange = paintDrag && m >= dragStart && m < dragEnd

          let blockStyle: React.CSSProperties | undefined
          if (inDragRange && selectedActivity) {
            if (selectedActivity.id === 'eraser') {
              blockStyle = { backgroundColor: '#ff3b30', opacity: 0.4 }
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
