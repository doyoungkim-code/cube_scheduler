import type { Ticket, KanbanStatus } from '../types/kanban'
import type { Activity } from '../types/schedule'
import KanbanCard from './KanbanCard'

const COLUMN_LABELS: Record<KanbanStatus, string> = {
  todo: 'To Do',
  progress: 'Progress',
  done: 'Done',
}

interface Props {
  status: KanbanStatus
  tickets: Ticket[]
  allTickets: Ticket[]
  activities: Activity[]
  dragOverIndex: number | null
  onTicketClick: (ticket: Ticket) => void
  onDragStart: (ticketId: string) => void
  onDragEnd: () => void
  onDragOver: (e: React.DragEvent, status: KanbanStatus, index: number) => void
  onDrop: (e: React.DragEvent, status: KanbanStatus) => void
  onTearOff?: (ticketId: string) => void
}

function getTicketNumber(ticket: Ticket, allTickets: Ticket[]): number {
  const sorted = [...allTickets].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  return sorted.findIndex(t => t.id === ticket.id) + 1
}

export default function KanbanColumn({
  status, tickets, allTickets, activities, dragOverIndex,
  onTicketClick, onDragStart, onDragEnd, onDragOver, onDrop, onTearOff,
}: Props) {
  return (
    <div
      className="kanban-column"
      onDragOver={e => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        const cards = e.currentTarget.querySelectorAll('.cinema-ticket')
        let idx = cards.length
        for (let i = 0; i < cards.length; i++) {
          const rect = cards[i].getBoundingClientRect()
          if (e.clientY < rect.top + rect.height / 2) {
            idx = i
            break
          }
        }
        onDragOver(e, status, idx)
      }}
      onDrop={e => {
        e.preventDefault()
        onDrop(e, status)
      }}
      onDragLeave={e => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          onDragOver(e, status, -1)
        }
      }}
    >
      <div className="kanban-column-header">
        <span className="kanban-column-title">{COLUMN_LABELS[status]}</span>
        <span className="kanban-column-count">{tickets.length}</span>
      </div>
      <div className="kanban-column-body">
        {tickets.map((ticket, i) => (
          <div key={ticket.id}>
            {dragOverIndex === i && <div className="kanban-drop-indicator" />}
            <KanbanCard
              ticket={ticket}
              ticketNumber={getTicketNumber(ticket, allTickets)}
              activities={activities}
              onClick={() => onTicketClick(ticket)}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onTearOff={onTearOff}
            />
          </div>
        ))}
        {dragOverIndex === tickets.length && <div className="kanban-drop-indicator" />}
      </div>
    </div>
  )
}
