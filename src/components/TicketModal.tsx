import { useState, useEffect, useRef, useId } from 'react'
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
  /** 'record': 타임라인 구간 기록 편집 (제목·삭제 문구가 다르고 활동 유형은 구간에 고정) */
  mode?: 'ticket' | 'record'
}

export default function TicketModal({ ticket, defaultStatus, activities, onSave, onDelete, onClose, hideStatus, hideWhy, mode = 'ticket' }: Props) {
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)

  // Escape 로 닫기 + 닫힐 때 원래 포커스 복원
  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => {
      window.removeEventListener('keydown', handler)
      prevFocus?.focus?.()
    }
  }, [onClose])

  const isRecord = mode === 'record'
  const isEdit = !!ticket

  const [title, setTitle] = useState(ticket?.title ?? '')
  const [description, setDescription] = useState(ticket?.description ?? '')
  const [why, setWhy] = useState(ticket?.why ?? '')
  const [activityId, setActivityId] = useState(ticket?.activityId ?? '')
  const [status, setStatus] = useState<KanbanStatus>(ticket?.status ?? defaultStatus)
  const [activityFields, setActivityFields] = useState<ActivitySpecificFields>(
    ticket?.activityFields ?? emptyActivityFields(),
  )
  const [touched, setTouched] = useState(false)

  const titleEmpty = !title.trim()

  const handleActivityChange = (newId: string) => {
    setActivityId(newId)
    const act = activities.find(a => a.id === newId)
    const newFields = act ? activityFieldsForName(act.name) : emptyActivityFields()
    if (newFields.type !== activityFields.type) setActivityFields(newFields)
  }

  const handleSave = () => {
    setTouched(true)
    if (titleEmpty) return
    const now = new Date().toISOString()
    onSave({
      id: ticket?.id ?? uuidv4(),
      seq: ticket?.seq,
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

  // Tab 포커스를 모달 안에 가둔다
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Tab' || !dialogRef.current) return
    const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
      'button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    if (focusables.length === 0) return
    const first = focusables[0], last = focusables[focusables.length - 1]
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
  }

  const heading = isRecord ? '기록 편집' : isEdit ? '티켓 편집' : '새 티켓'

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        ref={dialogRef}
        className="modal modal--wide ticket-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="modal-header">
          <h2 id={titleId}>{heading}</h2>
          <button className="slot-editor-close" onClick={onClose} aria-label="닫기">&times;</button>
        </div>
        <div className="modal-body ticket-form">
          <div className="ticket-field">
            <label className="ticket-field-label">제목</label>
            <input
              className={`ticket-field-input ${touched && titleEmpty ? 'ticket-field-input--error' : ''}`}
              value={title}
              onChange={e => setTitle(e.target.value)}
              onBlur={() => setTouched(true)}
              onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
              placeholder={isRecord ? '무엇을 했나요?' : '티켓 제목'}
              aria-invalid={touched && titleEmpty}
              autoFocus
            />
            {touched && titleEmpty && <span className="ticket-field-error">제목을 입력하세요</span>}
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

          {(!hideStatus || !isRecord) && (
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
              {!isRecord && (
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
              )}
            </div>
          )}

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
              <button className="btn-sm btn-delete" onClick={() => onDelete(ticket!.id)}>
                {isRecord ? '구간 삭제' : '삭제'}
              </button>
            )}
            <span style={{ flex: 1 }} />
            <button className="btn-sm btn-cancel" onClick={onClose}>취소</button>
            <button className="btn-sm btn-save" onClick={handleSave} aria-disabled={titleEmpty}>저장</button>
          </div>
        </div>
      </div>
    </div>
  )
}
