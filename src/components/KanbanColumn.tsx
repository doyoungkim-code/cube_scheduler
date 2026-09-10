import type { Ticket, KanbanStatus } from '../types/kanban'
import type { Activity } from '../types/schedule'
import KanbanCard from './KanbanCard'
import { STATUS_LABELS } from '../lib/kanban'

interface Props {
  status: KanbanStatus
  tickets: Ticket[]
  activities: Activity[]
  dragOverIndex: number | null
  showHeader?: boolean
  showMoveButtons?: boolean
  onTicketClick: (ticket: Ticket) => void
  onDragEnd: () => void
  onDragOver: (e: React.DragEvent, status: KanbanStatus, index: number) => void
  onDrop: (e: React.DragEvent, status: KanbanStatus) => void
  onMove?: (ticketId: string, status: KanbanStatus) => void
  onTearOff?: (ticketId: string) => void
}

export default function KanbanColumn({
  status, tickets, activities, dragOverIndex, showHeader = true, showMoveButtons = false,
  onTicketClick, onDragEnd, onDragOver, onDrop, onMove, onTearOff,
}: Props) {
  return (
    <div
      className="kanban-column"
      onDragOver={e => {
        if (!e.dataTransfer.types.includes('ticket-id')) return
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        const cards = e.currentTarget.querySelectorAll('.cinema-ticket')
        let idx = cards.length
        for (let i = 0; i < cards.length; i++) {
          const rect = cards[i].getBoundingClientRect()
          if (e.clientY < rect.top + rect.height / 2) { idx = i; break }
        }
        onDragOver(e, status, idx)
      }}
      onDrop={e => { e.preventDefault(); onDrop(e, status) }}
      onDragLeave={e => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) onDragOver(e, status, -1)
      }}
    >
      {showHeader && (
        <div className="kanban-column-header">
          <span className="kanban-column-title">{STATUS_LABELS[status]}</span>
          <span className="kanban-column-count">{tickets.length}</span>
        </div>
      )}
      <div className="kanban-column-body">
        {tickets.length === 0 && <div className="kanban-empty">티켓이 없어요</div>}
        {tickets.map((ticket, i) => (
          <div key={ticket.id}>
            {dragOverIndex === i && <div className="kanban-drop-indicator" />}
            <KanbanCard
              ticket={ticket}
              activities={activities}
              showMoveButtons={showMoveButtons}
              onClick={() => onTicketClick(ticket)}
              onDragEnd={onDragEnd}
              onMove={onMove ? (s) => onMove(ticket.id, s) : undefined}
              onTearOff={onTearOff}
            />
          </div>
        ))}
        {dragOverIndex === tickets.length && <div className="kanban-drop-indicator" />}
      </div>
    </div>
  )
}
