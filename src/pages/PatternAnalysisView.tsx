import ViewShell from '../components/ViewShell'

export default function PatternAnalysisView({ onGoHome }: { onGoHome: () => void }) {
  return (
    <ViewShell title="주간/월간 패턴 분석" onGoHome={onGoHome}>
      <div className="placeholder-page">
        <span className="placeholder-icon">📈</span>
        <h2>주간/월간 패턴 분석</h2>
        <p>활동 트렌드, 히트맵, 수면/운동 통계 등</p>
        <span className="placeholder-badge">Coming Soon</span>
      </div>
    </ViewShell>
  )
}
