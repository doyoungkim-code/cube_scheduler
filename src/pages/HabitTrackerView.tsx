import ViewShell from '../components/ViewShell'

export default function HabitTrackerView({ onGoHome }: { onGoHome: () => void }) {
  return (
    <ViewShell title="습관 트래커" onGoHome={onGoHome}>
      <div className="placeholder-page">
        <span className="placeholder-icon">✅</span>
        <h2>습관 트래커</h2>
        <p>매일 체크할 습관 목록과 연속 달성 스트릭</p>
        <span className="placeholder-badge">Coming Soon</span>
      </div>
    </ViewShell>
  )
}
