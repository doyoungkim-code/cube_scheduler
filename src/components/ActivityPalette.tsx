import { useState, useRef, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { Activity } from '../types/schedule'
import { SLEEP_ACTIVITY, ERASER_ACTIVITY } from '../types/schedule'
import { inkOn } from '../lib/color'
import { toastUndo } from '../store/ui'

const PALETTE_COLORS = [
  '#4a9eff', '#34c759', '#ff9500', '#ff3b30',
  '#af52de', '#ff2d55', '#5ac8fa', '#ffcc00',
  '#8e8e93', '#30b0c7', '#a2845e', '#00c7be',
]

interface ActivityPaletteProps {
  activities: Activity[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onChange: (activities: Activity[]) => void
}

function ActivityPalette({ activities, selectedId, onSelect, onChange }: ActivityPaletteProps) {
  const [adding, setAdding] = useState(false)
  const [addName, setAddName] = useState('')
  const [addColor, setAddColor] = useState(PALETTE_COLORS[0])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  const addInputRef = useRef<HTMLInputElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (adding) addInputRef.current?.focus() }, [adding])
  useEffect(() => { if (editingId) editInputRef.current?.focus() }, [editingId])

  const handleAdd = () => {
    if (!addName.trim()) return
    const newAct: Activity = {
      id: uuidv4(),
      name: addName.trim(),
      color: addColor,
      order: activities.length,
    }
    onChange([...activities, newAct])
    setAddName('')
    setAdding(false)
  }

  const handleDelete = (id: string) => {
    const name = activities.find(a => a.id === id)?.name ?? '활동'
    onChange(activities.filter(a => a.id !== id))
    if (selectedId === id) onSelect(null)
    setEditingId(null)
    toastUndo(`"${name}" 을 팔레트에서 뺐어요 (과거 기록은 그대로)`)
  }

  const startEdit = (a: Activity) => {
    setEditingId(a.id)
    setEditName(a.name)
    setEditColor(a.color)
  }

  const handleEditSave = () => {
    if (!editingId || !editName.trim()) return
    onChange(activities.map(a =>
      a.id === editingId ? { ...a, name: editName.trim(), color: editColor } : a
    ))
    setEditingId(null)
  }

  const handleContextMenu = (e: React.MouseEvent, a: Activity) => {
    e.preventDefault()
    startEdit(a)
  }

  return (
    <section className="palette">
      <div className="palette-chips">
        {/* 수면 */}
        <button
          className={`palette-chip palette-chip--sleep ${selectedId === SLEEP_ACTIVITY.id ? 'palette-chip--selected' : ''}`}
          style={{ '--chip': SLEEP_ACTIVITY.color, '--chip-ink': inkOn(SLEEP_ACTIVITY.color) } as React.CSSProperties}
          aria-pressed={selectedId === SLEEP_ACTIVITY.id}
          onClick={() => onSelect(selectedId === SLEEP_ACTIVITY.id ? null : SLEEP_ACTIVITY.id)}
          title="수면: 드래그로 수면 시간 칠하기"
        >
          {SLEEP_ACTIVITY.name}
        </button>

        {/* 활동 칩들 */}
        {activities.map(a => {
          if (editingId === a.id) {
            return (
              <div key={a.id} className="palette-chip-edit">
                <input
                  ref={editInputRef}
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleEditSave()
                    if (e.key === 'Escape') setEditingId(null)
                  }}
                  className="palette-edit-input"
                />
                <div className="palette-edit-colors">
                  {PALETTE_COLORS.map(c => (
                    <button
                      key={c}
                      className={`color-dot ${editColor === c ? 'color-dot--active' : ''}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setEditColor(c)}
                    />
                  ))}
                </div>
                <div className="palette-edit-actions">
                  <button className="btn-sm btn-save" onClick={handleEditSave}>확인</button>
                  <button className="btn-sm btn-delete" onClick={() => handleDelete(a.id)}>삭제</button>
                  <button className="btn-sm btn-cancel" onClick={() => setEditingId(null)}>취소</button>
                </div>
              </div>
            )
          }

          return (
            <button
              key={a.id}
              className={`palette-chip ${selectedId === a.id ? 'palette-chip--selected' : ''}`}
              style={{ '--chip': a.color, '--chip-ink': inkOn(a.color) } as React.CSSProperties}
              aria-pressed={selectedId === a.id}
              onClick={() => onSelect(selectedId === a.id ? null : a.id)}
              onContextMenu={e => handleContextMenu(e, a)}
              title={`${a.name} (우클릭: 편집)`}
            >
              {a.name}
            </button>
          )
        })}

        {/* 추가 */}
        {adding ? (
          <div className="palette-chip-edit">
            <input
              ref={addInputRef}
              value={addName}
              onChange={e => setAddName(e.target.value)}
              placeholder="활동 이름"
              className="palette-edit-input"
              onKeyDown={e => {
                if (e.key === 'Enter') handleAdd()
                if (e.key === 'Escape') { setAdding(false); setAddName('') }
              }}
            />
            <div className="palette-edit-colors">
              {PALETTE_COLORS.map(c => (
                <button
                  key={c}
                  className={`color-dot ${addColor === c ? 'color-dot--active' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setAddColor(c)}
                />
              ))}
            </div>
            <div className="palette-edit-actions">
              <button className="btn-sm btn-save" onClick={handleAdd}>추가</button>
              <button className="btn-sm btn-cancel" onClick={() => { setAdding(false); setAddName('') }}>취소</button>
            </div>
          </div>
        ) : (
          <button className="palette-chip palette-chip--add" onClick={() => setAdding(true)} aria-label="활동 추가" title="활동 추가">
            +
          </button>
        )}

        {/* 지우개 — 오른쪽 끝 */}
        <div className="palette-spacer" />
        <button
          className={`palette-chip palette-chip--eraser ${selectedId === ERASER_ACTIVITY.id ? 'palette-chip--selected' : ''}`}
          onClick={() => onSelect(selectedId === ERASER_ACTIVITY.id ? null : ERASER_ACTIVITY.id)}
          aria-pressed={selectedId === ERASER_ACTIVITY.id}
          aria-label="지우개"
          title="지우개: 선택 후 타임테이블 드래그로 삭제"
        >
          ✕
        </button>
      </div>

      {selectedId && (
        <div className="palette-hint">
          {selectedId === ERASER_ACTIVITY.id
            ? '지우개 모드: 타임테이블을 드래그하여 삭제'
            : selectedId === SLEEP_ACTIVITY.id
            ? '"수면" 선택됨 — 타임테이블을 드래그하여 채우기'
            : `"${activities.find(a => a.id === selectedId)?.name}" 선택됨 — 타임테이블을 드래그하여 채우기`
          }
          <button className="palette-hint-cancel" onClick={() => onSelect(null)}>선택 해제</button>
        </div>
      )}
    </section>
  )
}

export default ActivityPalette
