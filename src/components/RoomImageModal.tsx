import { useEffect, useId, useRef, useState } from 'react'
import { DEFAULT_ROOM_IMAGE, ROOM_IMAGE_KEYS, presetByImageKey, roomImagePath } from '../lib/activityCatalog'

interface Props {
  /** 현재 값. undefined = 자동(프리셋 이미지 → 없으면 기본 방) */
  value: string | undefined
  /** "자동" 일 때 실제로 보일 이미지 키 (프리셋 이미지). 없으면 기본 방 */
  autoKey: string | null
  activityName: string
  onSave: (v: string | undefined) => void
  onClose: () => void
}

/** 방 이미지 고르기 모달. 큰 썸네일 그리드에서 하나를 고른다. */
export default function RoomImageModal({ value, autoKey, activityName, onSave, onClose }: Props) {
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const [picked, setPicked] = useState<string | undefined>(value)

  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => { window.removeEventListener('keydown', handler); prevFocus?.focus?.() }
  }, [onClose])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Tab' || !dialogRef.current) return
    const f = dialogRef.current.querySelectorAll<HTMLElement>('button, [tabindex]:not([tabindex="-1"])')
    if (f.length === 0) return
    const first = f[0], last = f[f.length - 1]
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
  }

  const autoLabel = autoKey ? `자동 · ${presetByImageKey(autoKey)?.name ?? autoKey}` : '자동 · 기본 방'

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        ref={dialogRef}
        className="modal modal--wide room-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="modal-header">
          <h2 id={titleId}>방 이미지 · {activityName}</h2>
          <button className="slot-editor-close" onClick={onClose} aria-label="닫기">&times;</button>
        </div>
        <div className="modal-body room-modal-body">
          <p className="room-modal-hint">이 활동을 하는 시간에 홈 화면 방 카드에 보일 그림이에요. 아직 그림이 없는 활동은 "자동"으로 두면 준비되는 대로 붙어요.</p>
          <div className="room-grid" role="radiogroup" aria-label="방 이미지">
            <button
              type="button"
              role="radio"
              aria-checked={picked === undefined}
              className={`room-grid-item ${picked === undefined ? 'room-grid-item--on' : ''}`}
              onClick={() => setPicked(undefined)}
            >
              <img src={autoKey ? roomImagePath(autoKey) : DEFAULT_ROOM_IMAGE} alt="" />
              <span className="room-grid-name">{autoLabel}</span>
            </button>
            {ROOM_IMAGE_KEYS.map(k => {
              const name = presetByImageKey(k)?.name ?? k
              return (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  aria-checked={picked === k}
                  className={`room-grid-item ${picked === k ? 'room-grid-item--on' : ''}`}
                  onClick={() => setPicked(k)}
                >
                  <img src={roomImagePath(k)} alt="" />
                  <span className="room-grid-name">{name}</span>
                </button>
              )
            })}
          </div>
          <div className="ticket-actions">
            <span style={{ flex: 1 }} />
            <button className="btn-sm btn-cancel" onClick={onClose}>취소</button>
            <button className="btn-sm btn-save" onClick={() => { onSave(picked); onClose() }}>이 방으로</button>
          </div>
        </div>
      </div>
    </div>
  )
}
