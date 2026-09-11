import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { Activity } from '../types/schedule'
import { CATEGORIES, PRESETS, activityFromPreset, presetOf, type ActivityPreset } from '../lib/activityCatalog'
import { inkOn } from '../lib/color'

interface Props {
  /** 현재 팔레트 (보이는 것). 이미 담긴 프리셋은 체크 표시로 비활성 */
  activities: Activity[]
  /** 처음 열 때 미리 체크해 둘 프리셋 (첫 사용자 추천 세트) */
  preselect?: string[]
  onAdd: (activities: Activity[]) => void
  /** "여기 없어요? 직접 만들기" */
  onCustom: () => void
  onClose: () => void
}

/**
 * 활동 고르기 모달. 카테고리 탭 + 프리셋 그리드에서 여러 개를 체크해 한 번에 담는다.
 * 프리셋으로 만든 활동은 id 가 프리셋 id 라 방 이미지·세부 폼이 자동으로 붙는다.
 */
export default function ActivityPickerModal({ activities, preselect, onAdd, onCustom, onClose }: Props) {
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const [category, setCategory] = useState<string>('all')
  const [query, setQuery] = useState('')
  const [picked, setPicked] = useState<Set<string>>(() => new Set(preselect ?? []))

  const inPalette = useMemo(() => {
    const s = new Set<string>()
    for (const a of activities) { const p = presetOf(a); if (p) s.add(p.id) }
    return s
  }, [activities])

  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => { window.removeEventListener('keydown', handler); prevFocus?.focus?.() }
  }, [onClose])

  const q = query.trim()
  const shown = useMemo(() => PRESETS.filter(p =>
    (category === 'all' || p.category === category) && (!q || p.name.includes(q)),
  ), [category, q])

  const toggle = (p: ActivityPreset) => {
    if (inPalette.has(p.id)) return
    setPicked(prev => {
      const next = new Set(prev)
      if (next.has(p.id)) next.delete(p.id); else next.add(p.id)
      return next
    })
  }

  const confirm = () => {
    if (picked.size === 0) { onClose(); return }
    let order = activities.length
    const added = PRESETS.filter(p => picked.has(p.id) && !inPalette.has(p.id)).map(p => activityFromPreset(p, order++))
    onAdd(added)
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Tab' || !dialogRef.current) return
    const f = dialogRef.current.querySelectorAll<HTMLElement>('button, input, [tabindex]:not([tabindex="-1"])')
    if (f.length === 0) return
    const first = f[0], last = f[f.length - 1]
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        ref={dialogRef}
        className="modal modal--wide picker"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="modal-header">
          <h2 id={titleId}>활동 고르기</h2>
          <button className="slot-editor-close" onClick={onClose} aria-label="닫기">&times;</button>
        </div>
        <div className="modal-body picker-body">
          <input
            className="picker-search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="검색 (예: 운동, 독서)"
            aria-label="활동 검색"
            autoFocus
          />
          <div className="picker-tabs" role="tablist" aria-label="카테고리">
            <button role="tab" aria-selected={category === 'all'} className={`picker-tab ${category === 'all' ? 'picker-tab--active' : ''}`} onClick={() => setCategory('all')}>전체</button>
            {CATEGORIES.map(c => (
              <button
                key={c.id} role="tab" aria-selected={category === c.id}
                className={`picker-tab ${category === c.id ? 'picker-tab--active' : ''}`}
                style={{ '--cat': c.color } as React.CSSProperties}
                onClick={() => setCategory(c.id)}
              >
                <span className="picker-tab-dot" />{c.name}
              </button>
            ))}
          </div>

          {category === 'all' && !q ? (
            CATEGORIES.map(c => (
              <section key={c.id} className="picker-section">
                <h3 className="picker-section-title">{c.name}</h3>
                <PresetGrid presets={PRESETS.filter(p => p.category === c.id)} picked={picked} inPalette={inPalette} onToggle={toggle} />
              </section>
            ))
          ) : (
            <PresetGrid presets={shown} picked={picked} inPalette={inPalette} onToggle={toggle} />
          )}
          {shown.length === 0 && <p className="widget-empty">"{q}" 에 맞는 활동이 없어요. 아래에서 직접 만들 수 있어요.</p>}

          <div className="picker-footer">
            <button className="picker-custom" onClick={() => { onClose(); onCustom() }}>여기 없어요? 직접 만들기</button>
            <span style={{ flex: 1 }} />
            <button className="btn-sm btn-cancel" onClick={onClose}>취소</button>
            <button className="btn-sm btn-save" onClick={confirm} aria-disabled={picked.size === 0}>
              {picked.size > 0 ? `${picked.size}개 담기` : '담기'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function PresetGrid({ presets, picked, inPalette, onToggle }: {
  presets: ActivityPreset[]
  picked: Set<string>
  inPalette: Set<string>
  onToggle: (p: ActivityPreset) => void
}) {
  return (
    <div className="picker-grid">
      {presets.map(p => {
        const has = inPalette.has(p.id)
        const on = picked.has(p.id)
        return (
          <button
            key={p.id}
            type="button"
            className={`picker-item ${on ? 'picker-item--on' : ''} ${has ? 'picker-item--has' : ''}`}
            style={{ '--chip': p.color, '--chip-ink': inkOn(p.color) } as React.CSSProperties}
            aria-pressed={on}
            aria-disabled={has}
            title={has ? '이미 팔레트에 있어요' : undefined}
            onClick={() => onToggle(p)}
          >
            <span className="picker-item-dot" />
            <span className="picker-item-name">{p.name}</span>
            {(has || on) && <span className="picker-item-check" aria-hidden="true">✓</span>}
          </button>
        )
      })}
    </div>
  )
}
