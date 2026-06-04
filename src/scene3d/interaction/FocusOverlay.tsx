import { useEffect } from 'react'
import PatternAnalysisView from '../../pages/PatternAnalysisView'
import HabitTrackerView from '../../pages/HabitTrackerView'
import QuickMemoView from '../../pages/QuickMemoView'
import SettingsView from '../../pages/SettingsView'
import SchedulerSurface from '../surfaces/SchedulerSurface'
import { FURNITURE } from '../config/furnitureRegistry'
import { useFocusStore } from './useFocusStore'

export default function FocusOverlay() {
  const focusedId = useFocusStore((s) => s.focusedId)
  const unfocus = useFocusStore((s) => s.unfocus)

  useEffect(() => {
    if (!focusedId) return
    const t = setTimeout(() => {
      const el = document.querySelector<HTMLDivElement>('.focus-overlay-panel')
      el?.classList.add('focus-overlay-panel--visible')
    }, 320)
    return () => clearTimeout(t)
  }, [focusedId])

  if (!focusedId) return null
  const meta = FURNITURE[focusedId]

  const inner = (() => {
    switch (focusedId) {
      case 'scheduler':
      case 'today-dashboard':
        return <SchedulerSurface />
      case 'pattern-analysis':
        return <PatternAnalysisView onGoHome={unfocus} />
      case 'habit-tracker':
        return <HabitTrackerView onGoHome={unfocus} />
      case 'quick-memo':
        return <QuickMemoView onGoHome={unfocus} />
      case 'settings':
        return <SettingsView onGoHome={unfocus} />
      default:
        return null
    }
  })()

  const isScheduler = focusedId === 'scheduler' || focusedId === 'today-dashboard'

  return (
    <div className={`focus-overlay-root ${isScheduler ? 'focus-overlay-root--monitor' : ''}`}>
      <div
        className={`focus-overlay-backdrop ${isScheduler ? 'focus-overlay-backdrop--faded' : ''}`}
        onClick={unfocus}
        aria-hidden
      />
      <div
        className={`focus-overlay-panel ${isScheduler ? 'focus-overlay-panel--monitor' : ''}`}
        style={{
          maxWidth: isScheduler ? 'min(1400px, 92vw)' : 'min(1100px, 90vw)',
          maxHeight: isScheduler ? '90vh' : '88vh',
          aspectRatio: isScheduler ? '16 / 10' : undefined,
        }}
      >
        <button className="focus-overlay-close" onClick={unfocus} title="닫기 (ESC)">
          ×
        </button>
        <div className="focus-overlay-label">{meta.label}</div>
        <div className="focus-overlay-body">
          {inner}
        </div>
      </div>
    </div>
  )
}
