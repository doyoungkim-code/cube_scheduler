import { useState, useEffect, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'

interface Habit {
  id: string
  name: string
  color: string
  order: number
  createdAt: string
}

interface HabitCheck {
  habitIds: string[]
}

const COLORS = ['#4a9eff', '#34c759', '#ff9500', '#ff3b30', '#af52de', '#5ac8fa', '#ffcc00', '#30b0c7']

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function HabitChecklist() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [todayChecks, setTodayChecks] = useState<string[]>([])
  const [streaks, setStreaks] = useState<Record<string, number>>({})
  const [loaded, setLoaded] = useState(false)
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')

  const today = dateKey(new Date())

  // 초기 로드
  useEffect(() => {
    async function load() {
      if (!window.electronAPI) return
      const savedHabits = await window.electronAPI.loadData('habits') as Habit[] | null
      if (savedHabits) setHabits(savedHabits)
      const todayCheck = await window.electronAPI.loadData(`habit-checks-${today}`) as HabitCheck | null
      if (todayCheck) setTodayChecks(todayCheck.habitIds)
      setLoaded(true)
    }
    load()
  }, [today])

  // 스트릭 계산
  useEffect(() => {
    if (!loaded || !window.electronAPI) return
    async function compute() {
      const result: Record<string, number> = {}
      for (const h of habits) {
        let count = 0
        for (let i = 0; i < 365; i++) {
          const d = new Date()
          d.setDate(d.getDate() - i)
          const dk = dateKey(d)
          const check = await window.electronAPI!.loadData(`habit-checks-${dk}`) as HabitCheck | null
          if (check?.habitIds?.includes(h.id)) {
            count++
          } else if (i === 0) {
            // 오늘은 체크 안 했어도 스트릭 0이 아니라 어제까지 계산
            continue
          } else {
            break
          }
        }
        result[h.id] = count
      }
      setStreaks(result)
    }
    compute()
  }, [habits, loaded, todayChecks])

  const saveHabits = useCallback((next: Habit[]) => {
    setHabits(next)
    window.electronAPI?.saveData('habits', next)
  }, [])

  const saveTodayChecks = useCallback((next: string[]) => {
    setTodayChecks(next)
    window.electronAPI?.saveData(`habit-checks-${today}`, { habitIds: next })
  }, [today])

  const toggleCheck = (id: string) => {
    saveTodayChecks(
      todayChecks.includes(id) ? todayChecks.filter(x => x !== id) : [...todayChecks, id]
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
    saveHabits(habits.filter(h => h.id !== id))
  }

  return (
    <div className="habits">
      <div className="habits-header">
        <span className="habits-title">오늘의 습관</span>
        <span className="habits-date">{today}</span>
      </div>

      {habits.length === 0 && !adding && (
        <div className="habits-empty">아직 등록된 습관이 없습니다</div>
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
                style={{ borderColor: h.color, background: checked ? h.color : 'transparent' }}
              >
                {checked && '✓'}
              </button>
              <span className="habits-name">{h.name}</span>
              {streak > 0 && <span className="habits-streak">🔥 {streak}</span>}
              <button className="habits-delete" onClick={() => deleteHabit(h.id)} title="삭제">✕</button>
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
