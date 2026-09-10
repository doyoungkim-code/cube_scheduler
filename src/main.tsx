import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { AuthProvider, useAuth } from './auth/AuthContext'
import AuthGate from './auth/AuthGate'
import ErrorBoundary from './components/ErrorBoundary'
import './styles/global.css'

// 계정이 바뀌면 App 을 처음부터 다시 마운트해 이전 사용자의 상태가 남지 않게 함
function Root() {
  const { user } = useAuth()
  return <App key={user?.uid ?? 'local'} />
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <AuthGate>
          <Root />
        </AuthGate>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
