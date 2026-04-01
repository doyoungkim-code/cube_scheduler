import { useState } from 'react'
import type { Ticket, KanbanStatus } from '../types/kanban'
import type { Activity } from '../types/schedule'
import KanbanColumn from './KanbanColumn'
import TicketModal from './TicketModal'

const STATUSES: KanbanStatus[] = ['todo', 'progress', 'done']

interface Props {
  tickets: Ticket[]
  activities: Activity[]
  addTicket: (ticket: Ticket) => void
  updateTicket: (id: string, partial: Partial<Ticket>) => void
  deleteTicket: (id: string) => void
  moveTicket: (id: string, toStatus: KanbanStatus, toOrder: number) => void
  getTicketsByStatus: (status: KanbanStatus) => Ticket[]
}

export default function KanbanBoard({
  tickets, activities, addTicket, updateTicket, deleteTicket, moveTicket, getTicketsByStatus,
}: Props) {
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [newTicketStatus, setNewTicketStatus] = useState<KanbanStatus>('todo')
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<{ status: KanbanStatus; index: number } | null>(null)

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
    if (editingTicket) {
      updateTicket(ticket.id, ticket)
    } else {
      addTicket(ticket)
    }
    setShowModal(false)
    setEditingTicket(null)
  }

  const handleDelete = (id: string) => {
    deleteTicket(id)
    setShowModal(false)
    setEditingTicket(null)
  }

  const handleDragOver = (_e: React.DragEvent, status: KanbanStatus, index: number) => {
    if (index === -1) {
      setDropTarget(null)
    } else {
      setDropTarget({ status, index })
    }
  }

  const handleDrop = (e: React.DragEvent, status: KanbanStatus) => {
    const ticketId = e.dataTransfer.getData('ticket-id')
    if (!ticketId) return
    const targetIndex = dropTarget?.status === status ? dropTarget.index : getTicketsByStatus(status).length
    moveTicket(ticketId, status, targetIndex)
    setDraggingId(null)
    setDropTarget(null)
  }

  return (
    <div className="kanban">
      <div className="kanban-header">
        <span className="kanban-title">Board</span>
        <button className="btn-action" onClick={() => handleAdd('todo')}>+ 티켓 추가</button>
      </div>
      <div className="kanban-columns">
        {STATUSES.map(status => (
          <KanbanColumn
            key={status}
            status={status}
            tickets={getTicketsByStatus(status)}
            allTickets={tickets}
            activities={activities}
            dragOverIndex={dropTarget?.status === status ? dropTarget.index : null}
            onTicketClick={handleTicketClick}
            onDragStart={setDraggingId}
            onDragEnd={() => { setDraggingId(null); setDropTarget(null) }}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onTearOff={(id) => moveTicket(id, 'done', getTicketsByStatus('done').length)}
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
