interface Props {
  title: string
  onGoHome: () => void
  children: React.ReactNode
}

export default function ViewShell({ title, onGoHome, children }: Props) {
  return (
    <div className="view-shell">
      <div className="view-shell-topbar">
        <button className="view-shell-btn-home" onClick={onGoHome}>
          ← 돌아가기
        </button>
        <span className="view-shell-title">{title}</span>
      </div>
      <div className="view-shell-content">
        {children}
      </div>
    </div>
  )
}
