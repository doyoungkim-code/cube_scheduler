interface DayInfoProps {
  dateKey: string
  goal: string
  onGoalChange: (v: string) => void
  onOpenRoutine: () => void
  onToggleCalendar: () => void
}

function DayInfo({ goal, onGoalChange, onOpenRoutine, onToggleCalendar }: DayInfoProps) {
  return (
    <div className="day-info">
      <div className="day-info-goal">
        <input
          type="text"
          value={goal}
          onChange={e => onGoalChange(e.target.value)}
          placeholder="오늘의 목표"
        />
      </div>
      <div className="day-info-actions">
        <button className="btn-action" onClick={onOpenRoutine}>루틴 설정</button>
        <button className="btn-action" onClick={onToggleCalendar}>달력</button>
      </div>
    </div>
  )
}

export default DayInfo
