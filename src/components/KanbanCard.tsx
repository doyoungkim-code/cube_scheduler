import { useState, useRef, useEffect, useCallback } from 'react'
import type { Ticket } from '../types/kanban'
import type { Activity } from '../types/schedule'

const STATUS_LABEL: Record<string, string> = {
  todo: 'TO DO',
  progress: 'IN PROGRESS',
  done: 'COMPLETE',
}

const TEAR_THRESHOLD = 50

interface Props {
  ticket: Ticket
  ticketNumber: number
  activities: Activity[]
  onClick: () => void
  onDragStart: (ticketId: string) => void
  onDragEnd: () => void
  onTearOff?: (ticketId: string) => void
}

function getActivityDetail(ticket: Ticket): string | null {
  const f = ticket.activityFields
  if (f.type === 'exercise') {
    const parts: string[] = []
    if (f.data.exerciseType) parts.push(f.data.exerciseType)
    if (f.data.km) parts.push(`${f.data.km}km`)
    if (f.data.minutes) parts.push(`${f.data.minutes}min`)
    return parts.length ? parts.join(' / ') : null
  }
  if (f.type === 'algorithm') {
    const parts: string[] = []
    if (f.data.problemNumber) parts.push(`#${f.data.problemNumber}`)
    if (f.data.solveTime) parts.push(f.data.solveTime)
    return parts.length ? parts.join(' / ') : null
  }
  return null
}

export default function KanbanCard({ ticket, ticketNumber, activities, onClick, onDragStart, onDragEnd, onTearOff }: Props) {
  const activity = activities.find(a => a.id === ticket.activityId)
  const accentColor = activity?.color ?? '#8e8e93'
  const created = new Date(ticket.createdAt)
  const dateStr = created.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })
  const timeStr = created.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
  const detail = getActivityDetail(ticket)

  const isProgress = ticket.status === 'progress'
  const [tearDrag, setTearDrag] = useState<{ startX: number; currentX: number } | null>(null)
  const [tornOff, setTornOff] = useState(false)
  const tearingRef = useRef(false)

  const dragDist = tearDrag ? Math.max(0, tearDrag.currentX - tearDrag.startX) : 0
  const tearProgress = Math.min(1, dragDist / TEAR_THRESHOLD)

  const handleStubMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isProgress || tornOff) return
    e.stopPropagation()
    e.preventDefault()
    tearingRef.current = true
    setTearDrag({ startX: e.clientX, currentX: e.clientX })
  }, [isProgress, tornOff])

  useEffect(() => {
    if (!tearDrag) return
    const onMove = (e: MouseEvent) => {
      setTearDrag(prev => prev ? { ...prev, currentX: e.clientX } : null)
    }
    const onUp = () => {
      if (tearDrag) {
        const dist = Math.max(0, tearDrag.currentX - tearDrag.startX)
        if (dist >= TEAR_THRESHOLD) {
          setTornOff(true)
          setTimeout(() => onTearOff?.(ticket.id), 700)
        }
      }
      setTearDrag(null)
      tearingRef.current = false
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [tearDrag, ticket.id, onTearOff])

  const stubDragStyle: React.CSSProperties | undefined =
    tornOff ? undefined
    : tearDrag ? {
        transform: `translateX(${dragDist}px) rotate(${tearProgress * 5}deg)`,
        animation: 'none',
        transition: 'none',
        opacity: 1 - tearProgress * 0.2,
      }
    : undefined

  const perfDragStyle: React.CSSProperties | undefined =
    tearDrag && !tornOff
      ? { width: `${2 + tearProgress * 8}px`, animation: 'none', transition: 'none' }
      : undefined

  return (
    <div
      className={`cinema-ticket cinema-ticket--${ticket.status} ${tornOff ? 'cinema-ticket--ripping' : ''} ${tearDrag ? 'cinema-ticket--tearing' : ''}`}
      draggable={!tearingRef.current && !tornOff}
      onDragStart={e => {
        if (tearingRef.current) { e.preventDefault(); return }
        e.dataTransfer.setData('ticket-id', ticket.id)
        e.dataTransfer.setData('ticket-status', ticket.status)
        e.dataTransfer.effectAllowed = 'move'
        onDragStart(ticket.id)
      }}
      onDragEnd={onDragEnd}
      onClick={tornOff ? undefined : onClick}
    >
      {/* 왼쪽 메인 바디 */}
      <div className="cinema-ticket-body">
        {/* 상단 컬러 헤더 */}
        <div className="cinema-ticket-topbar" style={{ background: accentColor }}>
          <span className="cinema-ticket-topbar-title">{activity?.name ?? 'TICKET'}</span>
          <div className="cinema-ticket-topbar-right">
            <span>DATE</span>
            <strong>{dateStr}</strong>
          </div>
          <div className="cinema-ticket-topbar-right">
            <span>TIME</span>
            <strong>{timeStr}</strong>
          </div>
        </div>

        {/* 본문 */}
        <div className="cinema-ticket-content">
          <div className="cinema-ticket-title">{ticket.title}</div>
          {ticket.description && (
            <div className="cinema-ticket-desc">{ticket.description}</div>
          )}
          {detail && (
            <div className="cinema-ticket-detail">{detail}</div>
          )}
        </div>

        {/* 하단 바코드 + 번호 */}
        <div className="cinema-ticket-footer">
          <span className="cinema-ticket-barcode-text">T{ticketNumber} {ticket.id.slice(0, 8).toUpperCase()}</span>
          <span className="cinema-ticket-footer-class">{STATUS_LABEL[ticket.status]}</span>
        </div>
      </div>

      {/* 세로 절취선 */}
      <div className="cinema-ticket-perforation" style={perfDragStyle}>
        <div className="cinema-ticket-perf-notch cinema-ticket-perf-notch--top" />
        <div className="cinema-ticket-perf-dots" />
        <div className="cinema-ticket-perf-notch cinema-ticket-perf-notch--bottom" />
      </div>

      {/* 오른쪽 스텁 */}
      <div
        className={`cinema-ticket-stub ${isProgress && !tornOff ? 'cinema-ticket-stub--tearable' : ''}`}
        style={{ ...stubDragStyle, backgroundColor: accentColor }}
        onMouseDown={handleStubMouseDown}
      >
        <div className="cinema-ticket-stub-label">#{ticketNumber}</div>
        <div className="cinema-ticket-stub-activity">{activity?.name ?? ''}</div>
        <div className="cinema-ticket-stub-status">{STATUS_LABEL[ticket.status]}</div>
        {/* 톱니 가장자리 */}
        <div className="cinema-ticket-zigzag" />
      </div>
    </div>
  )
}
