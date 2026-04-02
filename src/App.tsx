import { useState } from 'react'
import type { ViewId } from './types/navigation'
import HomeDashboard from './pages/HomeDashboard'
import SchedulerView from './pages/SchedulerView'
import TodayDashboardView from './pages/TodayDashboardView'
import PatternAnalysisView from './pages/PatternAnalysisView'
import HabitTrackerView from './pages/HabitTrackerView'
import QuickMemoView from './pages/QuickMemoView'
import SettingsView from './pages/SettingsView'
import './styles/global.css'

function App() {
  const [currentView, setCurrentView] = useState<ViewId>('home')
  const goHome = () => setCurrentView('home')

  switch (currentView) {
    case 'home':
      return <HomeDashboard onNavigate={setCurrentView} />
    case 'scheduler':
      return <SchedulerView onGoHome={goHome} />
    case 'today-dashboard':
      return <TodayDashboardView onGoHome={goHome} />
    case 'pattern-analysis':
      return <PatternAnalysisView onGoHome={goHome} />
    case 'habit-tracker':
      return <HabitTrackerView onGoHome={goHome} />
    case 'quick-memo':
      return <QuickMemoView onGoHome={goHome} />
    case 'settings':
      return <SettingsView onGoHome={goHome} />
    default:
      return <HomeDashboard onNavigate={setCurrentView} />
  }
}

export default App
