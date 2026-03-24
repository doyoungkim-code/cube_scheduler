import { useState, useRef, useCallback, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { Activity, Routine } from '../types/schedule'
import { SLEEP_ACTIVITY } from '../types/schedule'

interface RoutineEditorProps {
  routines: Routine[]
  activities: Activity[]
  onChange: (routines: Routine[]) => void
  onClose: () => void
}

const TOTAL_MIN = 1440
const SLOT_COUNT = 144
const HOURS = Array.from({ length: 24 }, (_, i) => i)

function fmtH(h: number): string {
  return String(h).padStart(2, '0')
}

function fmtMin(m: number): string {
  const h = Math.floor(m / 60)
  const mm = m % 60
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

function RoutineEditor({ routines, activities, onChange, onClose }: RoutineEditorProps) {
  const blocksRef = useRef<HTMLDivElement>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [paintDrag, setPaintDrag] = useState<{ startMin: number; currentMin: number } | null>(null)

  // 선택된 활동 (sleep, eraser, 또는 커스텀)
  const selectedActivity = selectedId === '__sleep__'
    ? SLEEP_ACTIVITY
    : selectedId === 'eraser'
    ? { id: 'eraser', name: '지우개', color: '#ff3b30', order: -1 }
    : activities.find(a => a.id === selectedId) ?? null

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

        if (selectedActivity.id === 'eraser') {
          // 범위 내 루틴 제거/조정
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
          onChange(updated)
        } else {
          // 겹치는 기존 루틴 제거/조정 후 새 루틴 추가
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
          updated.push({
            id: uuidv4(),
            name: selectedActivity.name,
            color: selectedActivity.color,
            startMin: start,
            endMin: end,
          })
          onChange(updated)
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
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal--wide" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>루틴 설정</h2>
          <button className="slot-editor-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          {/* 팔레트 */}
          <div className="routine-palette">
            <button
              className={`palette-chip palette-chip--sleep ${selectedId === '__sleep__' ? 'palette-chip--selected' : ''}`}
              style={{ backgroundColor: SLEEP_ACTIVITY.color }}
              onClick={() => setSelectedId(selectedId === '__sleep__' ? null : '__sleep__')}
            >
              {SLEEP_ACTIVITY.name}
            </button>
            {activities.map(a => (
              <button
                key={a.id}
                className={`palette-chip ${selectedId === a.id ? 'palette-chip--selected' : ''}`}
                style={{ backgroundColor: a.color }}
                onClick={() => setSelectedId(selectedId === a.id ? null : a.id)}
              >
                {a.name}
              </button>
            ))}
            <div className="palette-spacer" />
            <button
              className={`palette-chip palette-chip--eraser ${selectedId === 'eraser' ? 'palette-chip--selected' : ''}`}
              onClick={() => setSelectedId(selectedId === 'eraser' ? null : 'eraser')}
            >
              ✕
            </button>
          </div>

          {selectedActivity && (
            <div className="routine-paint-hint">
              {selectedActivity.id === 'eraser'
                ? '지우개 모드: 아래 타임테이블을 드래그하여 삭제'
                : `"${selectedActivity.name}" 선택됨 — 아래 타임테이블을 드래그하여 루틴 설정`}
            </div>
          )}

          {/* 미니 타임테이블 */}
          <div className="routine-tt">
            <div className="tt-hour-labels">
              {HOURS.map(h => (
                <div key={h} className="tt-hour-label">{fmtH(h)}</div>
              ))}
            </div>
            <div
              className={`tt-track ${isPaintMode ? 'tt-track--paint' : ''}`}
              onMouseDown={handleMouseDown}
            >
              <div className="tt-blocks" ref={blocksRef}>
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
                      className={`tt-block ${routine ? 'tt-block--filled' : ''} ${isHourStart ? 'tt-block--hour-start' : ''} ${inDragRange ? 'tt-block--drag-range' : ''}`}
                      style={blockStyle}
                      title={routine ? `${fmtMin(m)} ${routine.name}` : fmtMin(m)}
                    />
                  )
                })}
              </div>
            </div>
          </div>

          {/* 드래그 범위 표시 */}
          {paintDrag && selectedActivity && (
            <div className="routine-drag-info">
              {fmtMin(dragStart)} ~ {fmtMin(dragEnd)}
              ({Math.round((dragEnd - dragStart) / 60 * 10) / 10}시간)
            </div>
          )}

          {/* 루틴 목록 */}
          {routines.length > 0 && (
            <div className="routine-list">
              {routines
                .slice()
                .sort((a, b) => a.startMin - b.startMin)
                .map(r => (
                  <div key={r.id} className="routine-item">
                    <span className="routine-item-color" style={{ backgroundColor: r.color }} />
                    <span className="routine-name">{r.name}</span>
                    <span className="routine-time">{fmtMin(r.startMin)} ~ {fmtMin(r.endMin)}</span>
                    <button className="routine-remove" onClick={() => onChange(routines.filter(x => x.id !== r.id))}>&times;</button>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RoutineEditor
