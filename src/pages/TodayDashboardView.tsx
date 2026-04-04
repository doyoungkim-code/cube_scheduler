import { useState, useEffect } from 'react'
import ViewShell from '../components/ViewShell'
import { useDayData, todayKey } from '../hooks/useDayData'
import { useKanbanData } from '../hooks/useKanbanData'
import type { DayData, TimeSlot } from '../types/schedule'

interface ActivityStat {
  label: string
  color: string
  minutes: number
}

function collectStats(day: DayData, rawSlots: Record<number, TimeSlot>): ActivityStat[] {
  const map = new Map<string, ActivityStat>()
  for (let m = 0; m < 1440; m += 10) {
    const slot = day.slots[m]
    const raw = rawSlots[m]
    if (!raw) continue // 루틴 제외 — rawSlots에 없으면 루틴
    if (!slot) continue
    const existing = map.get(slot.label)
    if (existing) { existing.minutes += 10 }
    else { map.set(slot.label, { label: slot.label, color: slot.color, minutes: 10 }) }
  }
  return [...map.values()].sort((a, b) => b.minutes - a.minutes)
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function DayStats({ stats, totalMinutes }: { stats: ActivityStat[]; totalMinutes: number }) {
  if (stats.length === 0) return <p className="today-dash-empty">기록된 활동이 없습니다</p>
  return (
    <div className="today-dash-activities">
      {stats.map(a => (
        <div key={a.label} className="today-dash-activity">
          <span className="today-dash-activity-color" style={{ background: a.color }} />
          <span className="today-dash-activity-label">{a.label}</span>
          <div className="today-dash-activity-bar-bg">
            <div
              className="today-dash-activity-bar"
              style={{ width: `${totalMinutes > 0 ? (a.minutes / totalMinutes) * 100 : 0}%`, background: a.color }}
            />
          </div>
          <span className="today-dash-activity-time">
            {a.minutes >= 60 ? `${Math.floor(a.minutes / 60)}h ${a.minutes % 60 ? `${a.minutes % 60}m` : ''}` : `${a.minutes}m`}
          </span>
        </div>
      ))}
    </div>
  )
}

function WeekView() {
  const [weekData, setWeekData] = useState<{ date: string; stats: ActivityStat[]; total: number }[]>([])
  const now = new Date()
  const dayOfWeek = now.getDay() // 0=일
  // 이번 주 월요일부터
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7))

  const days: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    days.push(dateKey(d))
  }

  // 각 날짜 데이터 로드
  useEffect(() => {
    async function load() {
      if (!window.electronAPI) return
      const results: { date: string; stats: ActivityStat[]; total: number }[] = []
      for (const dk of days) {
        const saved = await window.electronAPI.loadData(`day-${dk}`) as DayData | null
        if (saved && saved.slots) {
          // rawSlots = saved.slots 그대로 (루틴 병합 전이므로 전부 수동 입력)
          const stats = collectStats({ ...saved, slots: saved.slots }, saved.slots)
          const total = stats.reduce((s, a) => s + a.minutes, 0)
          results.push({ date: dk, stats, total })
        } else {
          results.push({ date: dk, stats: [], total: 0 })
        }
      }
      setWeekData(results)
    }
    load()
  }, [])

  const DAY_NAMES = ['월', '화', '수', '목', '금', '토', '일']
  const todayStr = todayKey()

  // 주간 합산
  const weekMap = new Map<string, ActivityStat>()
  let weekTotal = 0
  for (const d of weekData) {
    for (const s of d.stats) {
      const existing = weekMap.get(s.label)
      if (existing) { existing.minutes += s.minutes }
      else { weekMap.set(s.label, { ...s }) }
    }
    weekTotal += d.total
  }
  const weekStats = [...weekMap.values()].sort((a, b) => b.minutes - a.minutes)

  return (
    <div className="week-view">
      {/* 일별 미니 카드 */}
      <div className="week-days">
        {days.map((dk, i) => {
          const d = weekData.find(w => w.date === dk)
          const isToday = dk === todayStr
          return (
            <div key={dk} className={`week-day-card ${isToday ? 'week-day-card--today' : ''}`}>
              <span className="week-day-name">{DAY_NAMES[i]}</span>
              <span className="week-day-date">{dk.slice(5)}</span>
              <span className="week-day-hours">{d ? `${Math.round(d.total / 60 * 10) / 10}h` : '-'}</span>
              {/* 미니 활동 바 */}
              {d && d.total > 0 && (
                <div className="week-day-bar">
                  {d.stats.map((s, j) => (
                    <div key={j} className="week-day-bar-seg" style={{ flex: s.minutes, background: s.color }} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 주간 합산 */}
      <div className="today-dash-section">
        <h3 className="today-dash-section-title">주간 합산 ({Math.round(weekTotal / 60 * 10) / 10}h)</h3>
        <DayStats stats={weekStats} totalMinutes={weekTotal} />
      </div>
    </div>
  )
}

export default function TodayDashboardView({ onGoHome }: { onGoHome: () => void }) {
  const [tab, setTab] = useState<'day' | 'week'>('day')
  const today = todayKey()
  const data = useDayData(today)
  const kanban = useKanbanData()

  const todayStats = collectStats(data.day, data.rawDay.slots)
  const totalFilled = todayStats.reduce((sum, a) => sum + a.minutes, 0)

  const todoCount = kanban.tickets.filter(t => t.status === 'todo').length
  const progressCount = kanban.tickets.filter(t => t.status === 'progress').length
  const doneCount = kanban.tickets.filter(t => t.status === 'done').length

  return (
    <ViewShell title="대시보드" onGoHome={onGoHome}>
      <div className="today-dash">
        {/* 탭 */}
        <div className="dash-tabs">
          <button className={`dash-tab ${tab === 'day' ? 'dash-tab--active' : ''}`} onClick={() => setTab('day')}>오늘</button>
          <button className={`dash-tab ${tab === 'week' ? 'dash-tab--active' : ''}`} onClick={() => setTab('week')}>이번 주</button>
        </div>

        {tab === 'day' ? (
          <>
            <div className="today-dash-summary">
              <div className="today-dash-card">
                <span className="today-dash-card-value">{Math.round(totalFilled / 60 * 10) / 10}h</span>
                <span className="today-dash-card-label">기록 시간</span>
              </div>
              <div className="today-dash-card">
                <span className="today-dash-card-value">{todayStats.length}</span>
                <span className="today-dash-card-label">활동 수</span>
              </div>
              <div className="today-dash-card">
                <span className="today-dash-card-value">{todoCount}</span>
                <span className="today-dash-card-label">할 일</span>
              </div>
              <div className="today-dash-card">
                <span className="today-dash-card-value">{progressCount}</span>
                <span className="today-dash-card-label">진행중</span>
              </div>
              <div className="today-dash-card">
                <span className="today-dash-card-value">{doneCount}</span>
                <span className="today-dash-card-label">완료</span>
              </div>
            </div>

            <div className="today-dash-section">
              <h3 className="today-dash-section-title">활동별 시간 (루틴 제외)</h3>
              <DayStats stats={todayStats} totalMinutes={totalFilled} />
            </div>
          </>
        ) : (
          <WeekView />
        )}
      </div>
    </ViewShell>
  )
}
