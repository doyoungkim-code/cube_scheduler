import { useState } from 'react'
import ViewShell from '../components/ViewShell'
import MiniRoutineTimeTable from '../components/MiniRoutineTimeTable'
import RoutineAdherence from '../components/RoutineAdherence'
import HabitChecklist from '../components/HabitChecklist'
import { useDayData, todayKey } from '../hooks/useDayData'
import { SLEEP_ACTIVITY } from '../types/schedule'
import type { Activity, WeeklyRoutines, DayOfWeek, Routine } from '../types/schedule'

const HOURS = Array.from({ length: 24 }, (_, i) => i)

interface RoutineRowProps {
  title: string
  subtitle?: string
  routines: Routine[]
  selectedActivity: Activity | null
  onChange: (r: Routine[]) => void
  actionLabel?: string
  onAction?: () => void
}

function RoutineRow({ title, subtitle, routines, selectedActivity, onChange, actionLabel, onAction }: RoutineRowProps) {
  return (
    <div className="habit-row">
      <div className="habit-row-label">
        <span className="habit-row-title">{title}</span>
        {subtitle && <span className="habit-row-sub">{subtitle}</span>}
      </div>
      <div className="habit-row-tt">
        <MiniRoutineTimeTable routines={routines} selectedActivity={selectedActivity} onChange={onChange} />
      </div>
      {actionLabel && onAction ? (
        <button className="habit-row-action" onClick={onAction}>{actionLabel}</button>
      ) : (
        <div className="habit-row-action-spacer" />
      )}
    </div>
  )
}

const DAY_LABELS: { key: DayOfWeek; label: string }[] = [
  { key: 'mon', label: '월' }, { key: 'tue', label: '화' }, { key: 'wed', label: '수' },
  { key: 'thu', label: '목' }, { key: 'fri', label: '금' }, { key: 'sat', label: '토' }, { key: 'sun', label: '일' },
]

export default function HabitTrackerView({ onGoHome }: { onGoHome: () => void }) {
  const today = todayKey()
  const data = useDayData(today)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selectedActivity: Activity | null = selectedId === '__sleep__'
    ? SLEEP_ACTIVITY
    : selectedId === 'eraser'
    ? { id: 'eraser', name: '지우개', color: '#ff3b30', order: -1 }
    : data.activities.find(a => a.id === selectedId) ?? null

  const updateDay = (key: keyof WeeklyRoutines, routines: Routine[]) => {
    data.setWeekly({ ...data.weekly, [key]: routines })
  }

  const applyWeekday = () => {
    if (!confirm('평일 템플릿을 월~금에 일괄 적용하시겠습니까?\n(기존 월~금 루틴은 덮어씌워집니다)')) return
    const src = data.weekly.weekday
    const copy = (): Routine[] => src.map(r => ({ ...r }))
    data.setWeekly({
      ...data.weekly,
      mon: copy(), tue: copy(), wed: copy(), thu: copy(), fri: copy(),
    })
  }

  const applyWeekend = () => {
    if (!confirm('주말 템플릿을 토~일에 일괄 적용하시겠습니까?\n(기존 토~일 루틴은 덮어씌워집니다)')) return
    const src = data.weekly.weekend
    const copy = (): Routine[] => src.map(r => ({ ...r }))
    data.setWeekly({
      ...data.weekly,
      sat: copy(), sun: copy(),
    })
  }

  return (
    <ViewShell title="습관 트래커" onGoHome={onGoHome}>
      <div className="habit-page">
        {/* 활동 팔레트 (공유) */}
        <div className="habit-palette">
          <button
            className={`palette-chip palette-chip--sleep ${selectedId === '__sleep__' ? 'palette-chip--selected' : ''}`}
            style={{ backgroundColor: SLEEP_ACTIVITY.color }}
            onClick={() => setSelectedId(selectedId === '__sleep__' ? null : '__sleep__')}
          >
            {SLEEP_ACTIVITY.name}
          </button>
          {data.activities.map(a => (
            <button
              key={a.id}
              className={`palette-chip ${selectedId === a.id ? 'palette-chip--selected' : ''}`}
              style={{ backgroundColor: a.color }}
              onClick={() => setSelectedId(selectedId === a.id ? null : a.id)}
            >
              {a.name}
            </button>
          ))}
          <div className="palette-spacer" />
          <button
            className={`palette-chip palette-chip--eraser ${selectedId === 'eraser' ? 'palette-chip--selected' : ''}`}
            onClick={() => setSelectedId(selectedId === 'eraser' ? null : 'eraser')}
          >
            ✕
          </button>
        </div>

        {/* 시간 라벨 */}
        <div className="habit-hours">
          <div className="habit-hours-spacer" />
          {HOURS.map(h => (
            <div key={h} className="habit-hour">{String(h).padStart(2, '0')}</div>
          ))}
          <div className="habit-hours-action-spacer" />
        </div>

        {/* 루틴 설정 섹션 */}
        <div className="habit-section">
          <h3 className="habit-section-title">루틴 설정</h3>

          {/* 템플릿 2개 */}
          <RoutineRow
            title="평일" subtitle="템플릿"
            routines={data.weekly.weekday} selectedActivity={selectedActivity}
            onChange={(r) => updateDay('weekday', r)}
            actionLabel="월~금 적용" onAction={applyWeekday}
          />
          <RoutineRow
            title="주말" subtitle="템플릿"
            routines={data.weekly.weekend} selectedActivity={selectedActivity}
            onChange={(r) => updateDay('weekend', r)}
            actionLabel="토~일 적용" onAction={applyWeekend}
          />

          <div className="habit-divider" />

          {/* 개별 요일 7개 */}
          {DAY_LABELS.map(d => (
            <RoutineRow
              key={d.key}
              title={d.label}
              routines={data.weekly[d.key]}
              selectedActivity={selectedActivity}
              onChange={(r) => updateDay(d.key, r)}
            />
          ))}
        </div>

        {/* 루틴 이행률 */}
        <div className="habit-section">
          <h3 className="habit-section-title">루틴 이행률</h3>
          <RoutineAdherence weekly={data.weekly} />
        </div>

        {/* 체크리스트 습관 */}
        <div className="habit-section">
          <h3 className="habit-section-title">체크리스트 습관</h3>
          <HabitChecklist />
        </div>
      </div>
    </ViewShell>
  )
}
