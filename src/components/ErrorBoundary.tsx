import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { error: Error | null }

/**
 * 렌더링 중 예외가 나면 흰 화면 대신 안내 + 새로고침 버튼을 보여 준다.
 * 저장된 데이터는 건드리지 않으므로 새로고침으로 대부분 복구된다.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[app] render error', error, info.componentStack)
  }

  render(): ReactNode {
    const { error } = this.state
    if (!error) return this.props.children
    return (
      <div className="auth-screen" role="alert">
        <div className="auth-card">
          <span className="auth-icon">⚠️</span>
          <h1 className="auth-title">화면을 그리지 못했습니다</h1>
          <p className="auth-muted">
            저장된 데이터는 안전합니다. 새로고침하면 대부분 복구됩니다.<br />
            같은 문제가 반복되면 설정 → 백업 내보내기로 데이터를 받아 두세요.
          </p>
          <pre className="auth-error error-boundary-detail">{error.message}</pre>
          <button className="auth-btn-primary" onClick={() => window.location.reload()}>새로고침</button>
        </div>
      </div>
    )
  }
}
