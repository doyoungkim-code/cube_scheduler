import { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { Ticket, KanbanStatus, ActivitySpecificFields } from '../types/kanban'
import { emptyActivityFields, activityFieldsForName } from '../types/kanban'
import type { Activity } from '../types/schedule'
import TicketActivityFields from './TicketActivityFields'

interface Props {
  ticket: Ticket | null
  defaultStatus: KanbanStatus
  activities: Activity[]
  onSave: (ticket: Ticket) => void
  onDelete?: (id: string) => void
  onClose: () => void
  hideStatus?: boolean
  hideWhy?: boolean
}

export default function TicketModal({ ticket, defaultStatus, activities, onSave, onDelete, onClose, hideStatus, hideWhy }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const isEdit = !!ticket

  const [title, setTitle] = useState(ticket?.title ?? '')
  const [description, setDescription] = useState(ticket?.description ?? '')
  const [why, setWhy] = useState(ticket?.why ?? '')
  const [activityId, setActivityId] = useState(ticket?.activityId ?? '')
  const [status, setStatus] = useState<KanbanStatus>(ticket?.status ?? defaultStatus)
  const [activityFields, setActivityFields] = useState<ActivitySpecificFields>(
    ticket?.activityFields ?? emptyActivityFields()
  )

  const handleActivityChange = (newId: string) => {
    setActivityId(newId)
    const act = activities.find(a => a.id === newId)
    if (act) {
      const newFields = activityFieldsForName(act.name)
      if (newFields.type !== activityFields.type) {
        setActivityFields(newFields)
      }
    }
  }

  const handleSave = () => {
    if (!title.trim()) return
    const now = new Date().toISOString()
    onSave({
      id: ticket?.id ?? uuidv4(),
      title: title.trim(),
      description,
      why,
      activityId,
      status,
      activityFields,
      order: ticket?.order ?? 0,
      createdAt: ticket?.createdAt ?? now,
      updatedAt: now,
    })
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal--wide ticket-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? '티켓 편집' : '새 티켓'}</h2>
          <button className="slot-editor-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body ticket-form">
          <div className="ticket-field">
            <label className="ticket-field-label">제목</label>
            <input
              className="ticket-field-input"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="티켓 제목"
              autoFocus
            />
          </div>

          <div className="ticket-field">
            <label className="ticket-field-label">상세 내용</label>
            <textarea
              className="ticket-field-textarea"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="상세 내용을 입력하세요..."
              rows={3}
            />
          </div>

          <div className="ticket-row">
            {!hideStatus && (
              <div className="ticket-field">
                <label className="ticket-field-label">상태</label>
                <select
                  className="ticket-field-select"
                  value={status}
                  onChange={e => setStatus(e.target.value as KanbanStatus)}
                >
                  <option value="todo">To Do</option>
                  <option value="progress">Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
            )}
            <div className="ticket-field ticket-field--grow">
              <label className="ticket-field-label">활동 유형</label>
              <select
                className="ticket-field-select"
                value={activityId}
                onChange={e => handleActivityChange(e.target.value)}
              >
                <option value="">선택 안 함</option>
                {activities.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          </div>

          <TicketActivityFields value={activityFields} onChange={setActivityFields} />

          {!hideWhy && (
            <div className="ticket-field">
              <label className="ticket-field-label">Why - 왜 하는가?</label>
              <textarea
                className="ticket-field-textarea"
                value={why}
                onChange={e => setWhy(e.target.value)}
                placeholder="이 일을 하는 이유..."
                rows={2}
              />
            </div>
          )}

          <div className="ticket-actions">
            {isEdit && onDelete && (
              <button className="btn-sm btn-delete" onClick={() => onDelete(ticket!.id)}>삭제</button>
            )}
            <span style={{ flex: 1 }} />
            <button className="btn-sm btn-cancel" onClick={onClose}>취소</button>
            <button className="btn-sm btn-save" onClick={handleSave}>저장</button>
          </div>
        </div>
      </div>
    </div>
  )
}
