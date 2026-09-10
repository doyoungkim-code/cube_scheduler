import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useHabits, useHabitChecks, useHabitStreaks, todayHabitKey, type Habit } from '../hooks/useHabits'
import { toastUndo } from '../store/ui'

const COLORS = ['#4a9eff', '#34c759', '#ff9500', '#ff3b30', '#af52de', '#5ac8fa', '#ffcc00', '#30b0c7']

export default function HabitChecklist() {
  const today = todayHabitKey()
  const [habits, saveHabits] = useHabits()
  const [todayChecks, saveTodayChecks] = useHabitChecks(today)
  const streaks = useHabitStreaks(habits, today)
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')

  const toggleCheck = (id: string) => {
    saveTodayChecks(
      todayChecks.includes(id) ? todayChecks.filter(x => x !== id) : [...todayChecks, id],
    )
  }

  const addHabit = () => {
    const name = newName.trim()
    if (!name) return
    const h: Habit = {
      id: uuidv4(), name,
      color: COLORS[habits.length % COLORS.length],
      order: habits.length,
      createdAt: new Date().toISOString(),
    }
    saveHabits([...habits, h])
    setNewName('')
    setAdding(false)
  }

  const deleteHabit = (id: string) => {
    const name = habits.find(h => h.id === id)?.name ?? '습관'
    saveHabits(habits.filter(h => h.id !== id))
    toastUndo(`"${name}" 습관을 지웠어요`)
  }

  return (
    <div className="habits">
      <div className="habits-header">
        <span className="habits-title">오늘의 습관</span>
        <span className="habits-date">{today}</span>
      </div>

      {habits.length === 0 && !adding && (
        <div className="habits-empty">아직 습관이 없어요. 아래에서 하나 추가해 보세요.</div>
      )}

      <div className="habits-list">
        {habits.map(h => {
          const checked = todayChecks.includes(h.id)
          const streak = streaks[h.id] ?? 0
          return (
            <div key={h.id} className={`habits-item ${checked ? 'habits-item--checked' : ''}`}>
              <button
                className="habits-check"
                onClick={() => toggleCheck(h.id)}
                aria-pressed={checked}
                aria-label={`${h.name} 체크`}
                style={{ borderColor: h.color, background: checked ? h.color : 'transparent' }}
              >
                {checked && '✓'}
              </button>
              <span className="habits-name">{h.name}</span>
              {streak > 0 && <span className="habits-streak">🔥 {streak}</span>}
              <button className="habits-delete" onClick={() => deleteHabit(h.id)} title="삭제" aria-label={`${h.name} 삭제`}>✕</button>
            </div>
          )
        })}
      </div>

      {adding ? (
        <div className="habits-add">
          <input
            className="habits-add-input"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addHabit() }}
            placeholder="습관 이름 (예: 물 8잔)"
            autoFocus
          />
          <button className="btn-sm btn-save" onClick={addHabit}>추가</button>
          <button className="btn-sm btn-cancel" onClick={() => { setAdding(false); setNewName('') }}>취소</button>
        </div>
      ) : (
        <button className="habits-add-btn" onClick={() => setAdding(true)}>+ 습관 추가</button>
      )}
    </div>
  )
}
