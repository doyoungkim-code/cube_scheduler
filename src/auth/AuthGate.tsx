import type { ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { ADMIN_EMAIL } from '../lib/firebaseConfig'

/** 로그인 + 승인 상태일 때만 children(앱 본체)을 렌더링 */
export default function AuthGate({ children }: { children: ReactNode }) {
  const { status, user, error, signIn, signOut } = useAuth()

  if (status === 'local' || status === 'approved') return <>{children}</>

  if (status === 'loading') {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <div className="auth-spinner" />
          <p className="auth-muted">불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (status === 'signed-out') {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <img className="auth-logo" src="./room.png" alt="" />
          <h1 className="auth-title">Scheduler</h1>
          <p className="auth-muted">Google 계정으로 로그인하면 어느 기기에서든 같은 스케줄을 볼 수 있습니다.</p>
          <button className="auth-btn-primary" onClick={() => void signIn()}>
            Google 계정으로 로그인
          </button>
          {error && <p className="auth-error">{error}</p>}
          <p className="auth-footnote">처음 로그인하면 관리자 승인 후 사용할 수 있습니다.</p>
        </div>
      </div>
    )
  }

  // pending
  return (
    <div className="auth-screen">
      <div className="auth-card">
        <span className="auth-icon">⏳</span>
        <h1 className="auth-title">승인 대기 중</h1>
        <p className="auth-muted">
          <strong>{user?.email}</strong> 계정의 사용 요청이 접수되었습니다.<br />
          관리자({ADMIN_EMAIL})가 승인하면 바로 사용할 수 있습니다.
        </p>
        <p className="auth-footnote">승인되면 이 화면이 자동으로 넘어갑니다. 새로고침하지 않아도 됩니다.</p>
        {error && <p className="auth-error">{error}</p>}
        <button className="auth-btn-secondary" onClick={() => void signOut()}>다른 계정으로 로그인</button>
      </div>
    </div>
  )
}
