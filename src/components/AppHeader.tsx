import type { ViewId } from '../types/navigation'
import { useAuth } from '../auth/AuthContext'
import Icon, { type IconName } from './Icon'
import { useNow } from '../hooks/useNow'
import { useSaveStatus } from '../hooks/useSaveStatus'
import { pad2 } from '../lib/slots'

interface NavItem { id: ViewId; icon: IconName; label: string }

export const NAV_ITEMS: NavItem[] = [
  { id: 'scheduler', icon: 'calendar', label: '스케줄' },
  { id: 'pattern-analysis', icon: 'chart', label: '대시보드' },
  { id: 'habit-tracker', icon: 'check', label: '습관' },
  { id: 'quick-memo', icon: 'note', label: '메모' },
  { id: 'settings', icon: 'gear', label: '설정' },
]

interface Props {
  currentView: ViewId
  onNavigate: (v: ViewId) => void
}

/** 상단 헤더(로고 + 탭 + 계정) 와 모바일용 하단 탭바 */
export default function AppHeader({ currentView, onNavigate }: Props) {
  const { user, status } = useAuth()
  const now = useNow(15000)
  const save = useSaveStatus()
  const saveLabel = !save.online ? { cls: 'offline', text: '오프라인' }
    : save.failed ? { cls: 'error', text: '저장 실패 · 재시도 중' }
    : save.pending > 0 ? { cls: 'saving', text: '저장 중' }
    : null
  const clock = `${pad2(now.getHours())}:${pad2(now.getMinutes())}`
  const initial = (user?.displayName || user?.email || '?').slice(0, 1).toUpperCase()

  return (
    <>
      <header className="topbar">
        <button className="topbar-brand" onClick={() => onNavigate('scheduler')}>
          <img className="topbar-brand-icon" src="./icon.ico" alt="" />
          <span className="topbar-brand-name">Cube Scheduler</span>
        </button>

        <nav className="topbar-nav" aria-label="주 메뉴">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`topbar-tab ${currentView === item.id ? 'topbar-tab--active' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              <Icon name={item.icon} size={16} className="topbar-tab-icon" />
              <span className="topbar-tab-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="topbar-right">
          {saveLabel && <span className={`save-status save-status--${saveLabel.cls}`} title={saveLabel.text}>{saveLabel.text}</span>}
          <span className="topbar-clock">{clock}</span>
          <button
            className="topbar-avatar"
            title={status === 'local' ? '로컬 모드' : user?.email ?? ''}
            onClick={() => onNavigate('settings')}
          >
            {user?.photoURL
              ? <img src={user.photoURL} alt="" referrerPolicy="no-referrer" />
              : status === 'local' ? <Icon name="home" size={16} /> : <span>{initial}</span>}
          </button>
        </div>
      </header>

      <nav className="tabbar" aria-label="주 메뉴">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            className={`tabbar-item ${currentView === item.id ? 'tabbar-item--active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <Icon name={item.icon} size={22} className="tabbar-icon" />
            <span className="tabbar-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  )
}
