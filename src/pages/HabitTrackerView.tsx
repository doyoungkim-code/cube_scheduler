import { useState } from 'react'
import ViewShell from '../components/ViewShell'
import MiniRoutineTimeTable from '../components/MiniRoutineTimeTable'
import RoutineAdherence from '../components/RoutineAdherence'
import HabitChecklist from '../components/HabitChecklist'
import { useVisibleActivities, useWeeklyRoutines } from '../hooks/useDayData'
import { SLEEP_ACTIVITY, ERASER_ACTIVITY } from '../types/schedule'
import { inkOn } from '../lib/color'
import type { Activity, WeeklyRoutinesView, DayOfWeek, RoutineView } from '../types/schedule'

const HOURS = Array.from({ length: 24 }, (_, i) => i)

interface RoutineRowProps {
  title: string
  subtitle?: string
  routines: RoutineView[]
  selectedActivity: Activity | null
  onChange: (r: RoutineView[]) => void
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

export default function HabitTrackerView() {
  const [activities] = useVisibleActivities()
  const [weekly, setWeekly] = useWeeklyRoutines()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selectedActivity: Activity | null = selectedId === SLEEP_ACTIVITY.id
    ? SLEEP_ACTIVITY
    : selectedId === ERASER_ACTIVITY.id
    ? ERASER_ACTIVITY
    : activities.find(a => a.id === selectedId) ?? null

  const updateDay = (key: keyof WeeklyRoutinesView, routines: RoutineView[]) => {
    setWeekly({ ...weekly, [key]: routines })
  }

  const applyTemplate = (from: 'weekday' | 'weekend', to: DayOfWeek[], label: string) => {
    if (!confirm(`${label} 템플릿을 일괄 적용하시겠습니까?\n(기존 루틴은 덮어씌워집니다)`)) return
    const src = weekly[from]
    const next = { ...weekly }
    for (const d of to) next[d] = src.map(r => ({ ...r }))
    setWeekly(next)
  }
  const applyWeekday = () => applyTemplate('weekday', ['mon', 'tue', 'wed', 'thu', 'fri'], '평일(월~금)')
  const applyWeekend = () => applyTemplate('weekend', ['sat', 'sun'], '주말(토~일)')

  return (
    <ViewShell title="습관 트래커">
      <div className="habit-page">
        {/* 활동 팔레트 (공유) */}
        <div className="habit-palette">
          <button
            className={`palette-chip palette-chip--sleep ${selectedId === SLEEP_ACTIVITY.id ? 'palette-chip--selected' : ''}`}
            style={{ '--chip': SLEEP_ACTIVITY.color, '--chip-ink': inkOn(SLEEP_ACTIVITY.color) } as React.CSSProperties}
            aria-pressed={selectedId === SLEEP_ACTIVITY.id}
            onClick={() => setSelectedId(selectedId === SLEEP_ACTIVITY.id ? null : SLEEP_ACTIVITY.id)}
          >
            {SLEEP_ACTIVITY.name}
          </button>
          {activities.map(a => (
            <button
              key={a.id}
              className={`palette-chip ${selectedId === a.id ? 'palette-chip--selected' : ''}`}
              style={{ '--chip': a.color, '--chip-ink': inkOn(a.color) } as React.CSSProperties}
              onClick={() => setSelectedId(selectedId === a.id ? null : a.id)}
            >
              {a.name}
            </button>
          ))}
          <div className="palette-spacer" />
          <button
            className={`palette-chip palette-chip--eraser ${selectedId === ERASER_ACTIVITY.id ? 'palette-chip--selected' : ''}`}
            onClick={() => setSelectedId(selectedId === ERASER_ACTIVITY.id ? null : ERASER_ACTIVITY.id)}
            aria-pressed={selectedId === ERASER_ACTIVITY.id}
            aria-label="지우개"
          >
            ✕
          </button>
        </div>

        {/* 루틴 설정 섹션 */}
        <div className="habit-card">
        <div className="habit-card-head">
          <h3 className="habit-section-title">루틴 설정</h3>
          <span className="habit-card-hint">팔레트에서 활동을 고르고 시간대를 드래그해 칠하세요</span>
        </div>
        <div className="habit-scroll">
        <div className="habit-scroll-inner">
        {/* 시간 라벨 */}
        <div className="habit-hours">
          <div className="habit-hours-spacer" />
          {HOURS.map(h => (
            <div key={h} className="habit-hour">{String(h).padStart(2, '0')}</div>
          ))}
          <div className="habit-hours-action-spacer" />
        </div>

        <div className="habit-section">
          {/* 템플릿 2개 */}
          <RoutineRow
            title="평일" subtitle="템플릿"
            routines={weekly.weekday} selectedActivity={selectedActivity}
            onChange={(r) => updateDay('weekday', r)}
            actionLabel="월~금 적용" onAction={applyWeekday}
          />
          <RoutineRow
            title="주말" subtitle="템플릿"
            routines={weekly.weekend} selectedActivity={selectedActivity}
            onChange={(r) => updateDay('weekend', r)}
            actionLabel="토~일 적용" onAction={applyWeekend}
          />

          <div className="habit-divider" />

          {/* 개별 요일 7개 */}
          {DAY_LABELS.map(d => (
            <RoutineRow
              key={d.key}
              title={d.label}
              routines={weekly[d.key]}
              selectedActivity={selectedActivity}
              onChange={(r) => updateDay(d.key, r)}
            />
          ))}
        </div>
        </div>
        </div>
        </div>

        <div className="habit-bottom">
          {/* 루틴 이행률 */}
          <div className="habit-section">
            <h3 className="habit-section-title">루틴 이행률</h3>
            <RoutineAdherence weekly={weekly} />
          </div>

          {/* 체크리스트 습관 */}
          <div className="habit-section">
            <h3 className="habit-section-title">체크리스트 습관</h3>
            <HabitChecklist />
          </div>
        </div>
      </div>
    </ViewShell>
  )
}
