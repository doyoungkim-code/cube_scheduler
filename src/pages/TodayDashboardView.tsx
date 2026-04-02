import { useState, useEffect } from 'react'
import ViewShell from '../components/ViewShell'
import { useDayData, todayKey } from '../hooks/useDayData'
import { useKanbanData } from '../hooks/useKanbanData'

interface ActivityStat {
  label: string
  color: string
  minutes: number
}

export default function TodayDashboardView({ onGoHome }: { onGoHome: () => void }) {
  const today = todayKey()
  const data = useDayData(today)
  const kanban = useKanbanData()
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(t)
  }, [])

  // 활동별 시간 집계
  const activityMap = new Map<string, ActivityStat>()
  for (let m = 0; m < 1440; m += 10) {
    const slot = data.day.slots[m]
    if (!slot) continue
    const existing = activityMap.get(slot.label)
    if (existing) {
      existing.minutes += 10
    } else {
      activityMap.set(slot.label, { label: slot.label, color: slot.color, minutes: 10 })
    }
  }
  const activityStats = [...activityMap.values()].sort((a, b) => b.minutes - a.minutes)
  const totalFilled = activityStats.reduce((sum, a) => sum + a.minutes, 0)

  // 칸반 카운트
  const todoCount = kanban.tickets.filter(t => t.status === 'todo').length
  const progressCount = kanban.tickets.filter(t => t.status === 'progress').length
  const doneCount = kanban.tickets.filter(t => t.status === 'done').length

  // 완료율
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const totalSlots = Math.floor(nowMin / 10) + 1
  let filled = 0
  for (let i = 0; i < totalSlots; i++) {
    if (data.day.slots[i * 10]) filled++
  }
  const pct = totalSlots > 0 ? Math.round((filled / totalSlots) * 100) : 0

  return (
    <ViewShell title="오늘의 대시보드" onGoHome={onGoHome}>
      <div className="today-dash">
        {/* 상단 요약 카드 */}
        <div className="today-dash-summary">
          <div className="today-dash-card">
            <span className="today-dash-card-value">{Math.round(totalFilled / 60 * 10) / 10}h</span>
            <span className="today-dash-card-label">기록된 시간</span>
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

        {/* 활동별 시간 분포 */}
        <div className="today-dash-section">
          <h3 className="today-dash-section-title">활동별 시간</h3>
          {activityStats.length === 0 ? (
            <p className="today-dash-empty">아직 기록된 활동이 없습니다</p>
          ) : (
            <div className="today-dash-activities">
              {activityStats.map(a => (
                <div key={a.label} className="today-dash-activity">
                  <span className="today-dash-activity-color" style={{ background: a.color }} />
                  <span className="today-dash-activity-label">{a.label}</span>
                  <div className="today-dash-activity-bar-bg">
                    <div
                      className="today-dash-activity-bar"
                      style={{
                        width: `${(a.minutes / totalFilled) * 100}%`,
                        background: a.color,
                      }}
                    />
                  </div>
                  <span className="today-dash-activity-time">
                    {a.minutes >= 60 ? `${Math.floor(a.minutes / 60)}h ${a.minutes % 60}m` : `${a.minutes}m`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ViewShell>
  )
}
