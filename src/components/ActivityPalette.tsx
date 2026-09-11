import { useState, useRef, useEffect, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { Activity } from '../types/schedule'
import { ERASER_ACTIVITY } from '../types/schedule'
import { inkOn } from '../lib/color'
import { toastUndo, showToast } from '../store/ui'
import { PRESETS, presetOf, presetByImageKey, ROOM_IMAGE_KEYS, roomImagePath, imageKeyOfPreset } from '../lib/activityCatalog'
import ActivityPickerModal from './ActivityPickerModal'

const PALETTE_COLORS = [
  '#4a9eff', '#34c759', '#ff9500', '#ff3b30',
  '#af52de', '#ff2d55', '#5ac8fa', '#ffcc00',
  '#8e8e93', '#30b0c7', '#a2845e', '#00c7be',
]

const LONG_PRESS_MS = 450

interface ActivityPaletteProps {
  activities: Activity[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onChange: (activities: Activity[]) => void
  /** 활동이 하나도 없을 때 (첫 사용자) 고르기 모달을 자동으로 연다 */
  autoOpenWhenEmpty?: boolean
}

function ActivityPalette({ activities, selectedId, onSelect, onChange, autoOpenWhenEmpty }: ActivityPaletteProps) {
  const [picking, setPicking] = useState(false)
  const [adding, setAdding] = useState(false)
  const [addName, setAddName] = useState('')
  const [addColor, setAddColor] = useState(PALETTE_COLORS[0])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  const [editImage, setEditImage] = useState<string | undefined>(undefined)
  const addInputRef = useRef<HTMLInputElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)
  const autoOpened = useRef(false)

  useEffect(() => { if (adding) addInputRef.current?.focus() }, [adding])
  useEffect(() => { if (editingId) editInputRef.current?.focus() }, [editingId])

  // 첫 사용자: 팔레트가 비어 있으면 고르기 모달을 한 번 자동으로 연다
  useEffect(() => {
    if (autoOpenWhenEmpty && activities.length === 0 && !autoOpened.current) {
      autoOpened.current = true
      setPicking(true)
    }
  }, [autoOpenWhenEmpty, activities.length])

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

  const handleAddPresets = (added: Activity[]) => {
    if (added.length === 0) return
    onChange([...activities, ...added])
    showToast(`${added.length}개 활동을 담았어요`)
  }

  const handleDelete = (id: string) => {
    const name = activities.find(a => a.id === id)?.name ?? '활동'
    onChange(activities.filter(a => a.id !== id))
    if (selectedId === id) onSelect(null)
    setEditingId(null)
    toastUndo(`"${name}" 을 팔레트에서 뺐어요 (과거 기록은 그대로)`)
  }

  const startEdit = useCallback((a: Activity) => {
    setEditingId(a.id)
    setEditName(a.name)
    setEditColor(a.color)
    setEditImage(a.roomImage)
  }, [])

  const handleEditSave = () => {
    if (!editingId || !editName.trim()) return
    onChange(activities.map(a => {
      if (a.id !== editingId) return a
      const next: Activity = { ...a, name: editName.trim(), color: editColor }
      if (editImage) next.roomImage = editImage; else delete next.roomImage
      return next
    }))
    setEditingId(null)
  }

  // 길게 누르기(터치)로도 편집 진입
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pressedLong = useRef(false)
  const onPressStart = (a: Activity) => (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') return
    pressedLong.current = false
    pressTimer.current = setTimeout(() => { pressedLong.current = true; startEdit(a) }, LONG_PRESS_MS)
  }
  const onPressEnd = () => { if (pressTimer.current) { clearTimeout(pressTimer.current); pressTimer.current = null } }
  useEffect(() => () => { if (pressTimer.current) clearTimeout(pressTimer.current) }, [])

  const editing = editingId ? activities.find(a => a.id === editingId) : null
  const editingPreset = presetOf(editing)

  return (
    <section className="palette">
      {activities.length === 0 && !adding && (
        <div className="palette-empty">
          <span>아직 활동이 없어요. 자주 하는 활동을 골라 팔레트에 담아 보세요.</span>
          <button className="btn-action btn-action--primary" onClick={() => setPicking(true)}>활동 고르기</button>
        </div>
      )}
      <div className="palette-chips">
        {activities.map(a => {
          if (editingId === a.id) {
            const preset = editingPreset
            return (
              <div key={a.id} className="palette-chip-edit">
                <div className="palette-edit-row">
                  <input
                    ref={editInputRef}
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleEditSave()
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                    className="palette-edit-input"
                    aria-label="활동 이름"
                  />
                  {preset && <span className="palette-edit-preset">프리셋 · {preset.name}</span>}
                </div>
                <div className="palette-edit-colors" role="group" aria-label="색">
                  {PALETTE_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      className={`color-dot ${editColor === c ? 'color-dot--active' : ''}`}
                      style={{ backgroundColor: c }}
                      aria-label={c}
                      aria-pressed={editColor === c}
                      onClick={() => setEditColor(c)}
                    />
                  ))}
                </div>
                <RoomImagePicker value={editImage} fallbackKey={preset ? imageKeyOfPreset(preset) : null} onChange={setEditImage} />
                <div className="palette-edit-actions">
                  <button className="btn-sm btn-save" onClick={handleEditSave}>확인</button>
                  <button className="btn-sm btn-delete" onClick={() => handleDelete(a.id)}>팔레트에서 빼기</button>
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
              onClick={() => { if (pressedLong.current) { pressedLong.current = false; return } onSelect(selectedId === a.id ? null : a.id) }}
              onContextMenu={e => { e.preventDefault(); startEdit(a) }}
              onPointerDown={onPressStart(a)}
              onPointerUp={onPressEnd}
              onPointerLeave={onPressEnd}
              onPointerCancel={onPressEnd}
              title={`${a.name} (우클릭 / 길게 눌러 편집)`}
            >
              {a.name}
            </button>
          )
        })}

        {/* 직접 만들기 폼 */}
        {adding && (
          <div className="palette-chip-edit">
            <input
              ref={addInputRef}
              value={addName}
              onChange={e => setAddName(e.target.value)}
              placeholder="활동 이름"
              className="palette-edit-input"
              aria-label="새 활동 이름"
              onKeyDown={e => {
                if (e.key === 'Enter') handleAdd()
                if (e.key === 'Escape') { setAdding(false); setAddName('') }
              }}
            />
            <div className="palette-edit-colors" role="group" aria-label="색">
              {PALETTE_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  className={`color-dot ${addColor === c ? 'color-dot--active' : ''}`}
                  style={{ backgroundColor: c }}
                  aria-label={c}
                  aria-pressed={addColor === c}
                  onClick={() => setAddColor(c)}
                />
              ))}
            </div>
            <div className="palette-edit-actions">
              <button className="btn-sm btn-save" onClick={handleAdd}>추가</button>
              <button className="btn-sm btn-cancel" onClick={() => { setAdding(false); setAddName('') }}>취소</button>
            </div>
          </div>
        )}
        {!adding && (
          <button className="palette-chip palette-chip--add" onClick={() => setPicking(true)} aria-label="활동 고르기" title="활동 고르기">
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
            : `"${activities.find(a => a.id === selectedId)?.name}" 선택됨 — 타임테이블을 드래그하여 채우기`
          }
          <button className="palette-hint-cancel" onClick={() => onSelect(null)}>선택 해제</button>
        </div>
      )}

      {picking && (
        <ActivityPickerModal
          activities={activities}
          preselect={activities.length === 0 ? PRESETS.filter(p => p.recommended).map(p => p.id) : undefined}
          onAdd={handleAddPresets}
          onCustom={() => setAdding(true)}
          onClose={() => setPicking(false)}
        />
      )}
    </section>
  )
}

/** 방 이미지 고르기: 이미지가 있는 프리셋 썸네일. "자동" = 프리셋 이미지(없으면 기본 방) */
function RoomImagePicker({ value, fallbackKey, onChange }: {
  value: string | undefined
  fallbackKey: string | null
  onChange: (v: string | undefined) => void
}) {
  return (
    <div className="room-picker" role="group" aria-label="방 이미지">
      <button
        type="button"
        className={`room-picker-item ${!value ? 'room-picker-item--on' : ''}`}
        onClick={() => onChange(undefined)}
        aria-pressed={!value}
        title={fallbackKey ? '프리셋 이미지' : '기본 방'}
      >
        <img src={fallbackKey ? roomImagePath(fallbackKey) : './room.png'} alt="" />
        <span>자동</span>
      </button>
      {ROOM_IMAGE_KEYS.map(k => {
        const name = presetByImageKey(k)?.name ?? k
        return (
          <button
            key={k}
            type="button"
            className={`room-picker-item ${value === k ? 'room-picker-item--on' : ''}`}
            onClick={() => onChange(k)}
            aria-pressed={value === k}
            title={name}
          >
            <img src={roomImagePath(k)} alt="" />
            <span>{name}</span>
          </button>
        )
      })}
    </div>
  )
}

export default ActivityPalette
