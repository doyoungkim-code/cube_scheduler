import ViewShell from '../components/ViewShell'

export default function QuickMemoView({ onGoHome }: { onGoHome: () => void }) {
  return (
    <ViewShell title="퀵 메모 / 오늘 일기" onGoHome={onGoHome}>
      <div className="placeholder-page">
        <span className="placeholder-icon">📝</span>
        <h2>퀵 메모 / 오늘 일기</h2>
        <p>간단한 메모와 하루를 돌아보는 일기장</p>
        <span className="placeholder-badge">Coming Soon</span>
      </div>
    </ViewShell>
  )
}
