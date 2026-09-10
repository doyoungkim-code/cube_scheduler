import { useState } from 'react'
import type { Ticket, KanbanStatus } from '../types/kanban'
import type { Activity } from '../types/schedule'
import KanbanColumn from './KanbanColumn'
import TicketModal from './TicketModal'

const STATUSES: KanbanStatus[] = ['todo', 'progress', 'done']
const STATUS_LABELS: Record<KanbanStatus, string> = { todo: 'To Do', progress: 'Progress', done: 'Done' }

/** columns: 가로 3열 / stack: 세로 3단(넓은 화면 오른쪽 열) / tabs: 탭으로 한 컬럼씩(모바일) */
export type KanbanVariant = 'columns' | 'stack' | 'tabs'

interface Props {
  tickets: Ticket[]
  activities: Activity[]
  variant?: KanbanVariant
  addTicket: (ticket: Ticket) => void
  updateTicket: (id: string, partial: Partial<Ticket>) => void
  deleteTicket: (id: string) => void
  moveTicket: (id: string, toStatus: KanbanStatus, toOrder: number) => void
  getTicketsByStatus: (status: KanbanStatus) => Ticket[]
}

export default function KanbanBoard({
  tickets, activities, variant = 'columns', addTicket, updateTicket, deleteTicket, moveTicket, getTicketsByStatus,
}: Props) {
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [newTicketStatus, setNewTicketStatus] = useState<KanbanStatus>('todo')
  const [, setDraggingId] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<{ status: KanbanStatus; index: number } | null>(null)
  const [tab, setTab] = useState<KanbanStatus>('todo')

  const handleAdd = (status: KanbanStatus) => {
    setNewTicketStatus(status)
    setEditingTicket(null)
    setShowModal(true)
  }

  const handleTicketClick = (ticket: Ticket) => {
    setEditingTicket(ticket)
    setShowModal(true)
  }

  const handleSave = (ticket: Ticket) => {
    if (editingTicket) updateTicket(ticket.id, ticket)
    else addTicket(ticket)
    setShowModal(false)
    setEditingTicket(null)
  }

  const handleDelete = (id: string) => {
    deleteTicket(id)
    setShowModal(false)
    setEditingTicket(null)
  }

  const handleDragOver = (_e: React.DragEvent, status: KanbanStatus, index: number) => {
    setDropTarget(index === -1 ? null : { status, index })
  }

  const handleDrop = (e: React.DragEvent, status: KanbanStatus) => {
    const ticketId = e.dataTransfer.getData('ticket-id')
    if (!ticketId) return
    const targetIndex = dropTarget?.status === status ? dropTarget.index : getTicketsByStatus(status).length
    moveTicket(ticketId, status, targetIndex)
    setDraggingId(null)
    setDropTarget(null)
  }

  const moveToEnd = (id: string, status: KanbanStatus) => moveTicket(id, status, getTicketsByStatus(status).length)

  const visibleStatuses = variant === 'tabs' ? [tab] : STATUSES

  return (
    <div className={`kanban kanban--${variant}`}>
      <div className="kanban-header">
        <span className="kanban-title">Board</span>
        <button className="btn-action" onClick={() => handleAdd(variant === 'tabs' ? tab : 'todo')}>+ 티켓 추가</button>
      </div>

      {variant === 'tabs' && (
        <div className="dash-tabs kanban-tabs">
          {STATUSES.map(s => (
            <button key={s} className={`dash-tab ${tab === s ? 'dash-tab--active' : ''}`} onClick={() => setTab(s)}>
              {STATUS_LABELS[s]} <span className="kanban-tab-count">{getTicketsByStatus(s).length}</span>
            </button>
          ))}
        </div>
      )}

      <div className={`kanban-columns kanban-columns--${variant}`}>
        {visibleStatuses.map(status => (
          <KanbanColumn
            key={status}
            status={status}
            tickets={getTicketsByStatus(status)}
            allTickets={tickets}
            activities={activities}
            dragOverIndex={dropTarget?.status === status ? dropTarget.index : null}
            showHeader={variant !== 'tabs'}
            showMoveButtons={variant === 'tabs'}
            onTicketClick={handleTicketClick}
            onDragStart={setDraggingId}
            onDragEnd={() => { setDraggingId(null); setDropTarget(null) }}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onMove={moveToEnd}
            onTearOff={(id) => moveToEnd(id, 'done')}
          />
        ))}
      </div>

      {showModal && (
        <TicketModal
          ticket={editingTicket}
          defaultStatus={newTicketStatus}
          activities={activities}
          onSave={handleSave}
          onDelete={editingTicket ? handleDelete : undefined}
          onClose={() => { setShowModal(false); setEditingTicket(null) }}
        />
      )}
    </div>
  )
}
