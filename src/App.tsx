import { useState, useEffect, useCallback } from 'react'
import ActivityPalette from './components/ActivityPalette'
import TimeTable from './components/TimeTable'
import Calendar from './components/Calendar'
import KanbanBoard from './components/KanbanBoard'
import { useDayData } from './hooks/useDayData'
import { useKanbanData } from './hooks/useKanbanData'
import { SLEEP_ACTIVITY } from './types/schedule'
import type { ViewId } from './types/navigation'
import PatternAnalysisView from './pages/PatternAnalysisView'
import HabitTrackerView from './pages/HabitTrackerView'
import QuickMemoView from './pages/QuickMemoView'
import SettingsView from './pages/SettingsView'
import './styles/global.css'

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']

const ROOM_MAP: Record<string, string> = {
  '알고리즘': './room_algo.png',
  '프로젝트': './room_coding.png',
  '커피, 음악, 독서': './room_coffee.png',
  '기록': './room_diary.png',
  '식사': './room_eat.png',
  '영어 공부': './room_english.png',
  '운동': './room_exercise.png',
  '샤워': './room_outside.png',
  '수면': './room_sleep.png',
}


const NAV_ICONS: { id: ViewId; icon: string; label: string }[] = [
  { id: 'pattern-analysis', icon: '📊', label: '대시보드' },
  { id: 'habit-tracker', icon: '✅', label: '습관' },
  { id: 'quick-memo', icon: '📝', label: '메모' },
  { id: 'settings', icon: '⚙️', label: '설정' },
]

function App() {
  const [currentView, setCurrentView] = useState<ViewId>('scheduler')
  const [now, setNow] = useState(new Date())
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const [selectedDate, setSelectedDate] = useState(today)
  const data = useDayData(selectedDate)
  const todayDataAux = useDayData(selectedDate === today ? '__unused__' : today)
  const kanban = useKanbanData()
  const [showCalendar, setShowCalendar] = useState(false)
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const isToday = selectedDate === today

  const selectedActivity = selectedActivityId === '__sleep__'
    ? SLEEP_ACTIVITY
    : selectedActivityId === 'eraser'
    ? { id: 'eraser', name: '지우개', color: '#ff3b30', order: -1 }
    : data.activities.find(a => a.id === selectedActivityId) ?? null

  const handleSelectDate = (date: string) => {
    setSelectedDate(date)
    setShowCalendar(false)
  }

  const toggleCollapse = useCallback(() => {
    const next = !collapsed
    setCollapsed(next)
    window.electronAPI?.toggleCollapse(next)
  }, [collapsed])

  const handleTicketDropOnSlot = useCallback((ticketId: string, slotMin: number) => {
    const ticket = kanban.getTicket(ticketId)
    if (!ticket) return
    const activity = data.activities.find(a => a.id === ticket.activityId)
    if (!activity) return
    // 같은 활동유형의 슬롯 위에 드롭한 경우에만 연결
    const existingSlot = data.day.slots[slotMin]
    if (!existingSlot || existingSlot.label !== activity.name) return
    // 같은 활동의 연속 구간 찾기
    let start = slotMin
    while (start > 0 && data.day.slots[start - 10]?.label === activity.name) start -= 10
    let end = slotMin + 10
    while (end < 1440 && data.day.slots[end]?.label === activity.name) end += 10
    // 티켓 내용을 슬롯 record에 복사 (칸반에는 영향 없음)
    const record = {
      title: ticket.title,
      description: ticket.description,
      activityFields: ticket.activityFields,
    }
    for (let m = start; m < end; m += 10) {
      const s = data.day.slots[m]
      if (s) data.setSlot(m, { ...s, detail: ticket.description, record })
    }
  }, [kanban, data])

  const [y, m, d] = selectedDate.split('-').map(Number)
  const dateObj = new Date(y, m - 1, d)
  const dayName = DAY_NAMES[dateObj.getDay()]

  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')

  const nowMin = now.getHours() * 60 + now.getMinutes()
  const nowSlotMin = Math.floor(nowMin / 10) * 10
  const todaySlots = isToday ? data.day.slots : todayDataAux.day.slots
  const currentSlot = todaySlots[nowSlotMin]
  const currentLabel = currentSlot?.label ?? ''
  const roomImg = ROOM_MAP[currentLabel] ?? './room.png'

  // 서브 뷰 렌더링
  if (currentView !== 'scheduler') {
    const goBack = () => setCurrentView('scheduler')
    switch (currentView) {
      case 'pattern-analysis': return <PatternAnalysisView onGoHome={goBack} />
      case 'habit-tracker': return <HabitTrackerView onGoHome={goBack} />
      case 'quick-memo': return <QuickMemoView onGoHome={goBack} />
      case 'settings': return <SettingsView onGoHome={goBack} />
      default: return <PatternAnalysisView onGoHome={goBack} />
    }
  }

  return (
    <div className={`app ${collapsed ? 'app--collapsed' : ''}`}>
      <div className="app-layout">
        <div className="app-left">
          <div className="app-left-clock">
            {now.getFullYear()}.{String(now.getMonth() + 1).padStart(2, '0')}.{String(now.getDate()).padStart(2, '0')} {hours}:{minutes}:{seconds}
          </div>
          <div className="avatar-area">
            <div className="avatar-box">
              <img className="avatar-room" src={roomImg} alt="" />
            </div>
          </div>
          {/* 아이콘 네비게이션 */}
          <div className="app-left-nav">
            {NAV_ICONS.map(nav => (
              <button
                key={nav.id}
                className="app-left-nav-btn"
                data-label={nav.label}
                onClick={() => setCurrentView(nav.id)}
              >
                {nav.icon}
              </button>
            ))}
          </div>
          <button className="btn-toggle" onClick={toggleCollapse}>
            {collapsed ? '▶' : '◀'}
          </button>
        </div>

        {!collapsed && (
          <div className="app-right">
            <div className="app-right-upper">
              <div className="app-right-dateline">
                <span className="app-date-label">{m}월 {d}일 {dayName}요일</span>
                {!isToday && (
                  <button className="btn-today" onClick={() => setSelectedDate(today)}>
                    오늘로
                  </button>
                )}
                <span className="app-dateline-spacer" />
                <button className="btn-action" onClick={() => setShowCalendar(!showCalendar)}>달력</button>
              </div>

              <ActivityPalette
                activities={data.activities}
                selectedId={selectedActivityId}
                onSelect={setSelectedActivityId}
                onChange={data.setActivities}
              />
              <TimeTable
                day={data.day}
                rawSlots={data.rawDay.slots}
                routines={data.routines}
                selectedActivity={selectedActivity}
                tickets={kanban.tickets}
                activities={data.activities}
                onSlotChange={data.setSlot}
                onSlotRangeChange={data.setSlotRange}
                onTicketDrop={handleTicketDropOnSlot}
                onDeselectActivity={() => setSelectedActivityId(null)}
              />
            </div>

            <div className="app-right-lower">
              <KanbanBoard
                tickets={kanban.tickets}
                activities={data.activities}
                addTicket={kanban.addTicket}
                updateTicket={kanban.updateTicket}
                deleteTicket={kanban.deleteTicket}
                moveTicket={kanban.moveTicket}
                getTicketsByStatus={kanban.getTicketsByStatus}
              />
            </div>
          </div>
        )}
      </div>

      {showCalendar && (
        <div className="modal-backdrop" onClick={() => setShowCalendar(false)}>
          <div className="calendar-modal" onClick={e => e.stopPropagation()}>
            <Calendar
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
              todayKey={today}
            />
          </div>
        </div>
      )}

    </div>
  )
}

export default App
