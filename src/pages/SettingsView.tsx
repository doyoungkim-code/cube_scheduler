import ViewShell from '../components/ViewShell'

export default function SettingsView({ onGoHome }: { onGoHome: () => void }) {
  return (
    <ViewShell title="환경설정" onGoHome={onGoHome}>
      <div className="placeholder-page">
        <span className="placeholder-icon">⚙️</span>
        <h2>환경설정</h2>
        <p>활동 팔레트, 루틴, 테마, 데이터 관리</p>
        <span className="placeholder-badge">Coming Soon</span>
      </div>
    </ViewShell>
  )
}
