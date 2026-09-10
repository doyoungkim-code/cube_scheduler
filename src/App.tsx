import { useState, useEffect, useCallback } from 'react'
import ActivityPalette from './components/ActivityPalette'
import TimeTable from './components/TimeTable'
import Calendar from './components/Calendar'
import KanbanBoard from './components/KanbanBoard'
import AppHeader from './components/AppHeader'
import RoomCard from './components/RoomCard'
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

function todayKeyOf(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function shiftDate(key: string, days: number): string {
  const [y, m, d] = key.split('-').map(Number)
  const dt = new Date(y, m - 1, d + days)
  return todayKeyOf(dt)
}

function App() {
  const [currentView, setCurrentView] = useState<ViewId>('scheduler')
  const [now, setNow] = useState(new Date())
  const today = todayKeyOf(now)
  const [selectedDate, setSelectedDate] = useState(today)
  const data = useDayData(selectedDate)
  const todayDataAux = useDayData(selectedDate === today ? '__unused__' : today)
  const kanban = useKanbanData()
  const [showCalendar, setShowCalendar] = useState(false)
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null)

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // 글로벌 키보드: Escape(달력닫기), Ctrl+Z(실행취소)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowCalendar(false)
      if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        const tag = (e.target as HTMLElement | null)?.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA') return
        e.preventDefault()
        data.undo()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [data.undo])

  // 뷰 전환 시 스크롤 맨 위로
  useEffect(() => { window.scrollTo({ top: 0 }) }, [currentView])

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

  const nowMin = now.getHours() * 60 + now.getMinutes()
  const nowSlotMin = Math.floor(nowMin / 10) * 10
  const todaySlots = isToday ? data.day.slots : todayDataAux.day.slots
  const currentSlot = todaySlots[nowSlotMin]
  const currentLabel = currentSlot?.label ?? ''
  const roomImg = ROOM_MAP[currentLabel] ?? './room.png'

  let page: React.ReactNode
  switch (currentView) {
    case 'pattern-analysis': page = <PatternAnalysisView />; break
    case 'habit-tracker': page = <HabitTrackerView />; break
    case 'quick-memo': page = <QuickMemoView />; break
    case 'settings': page = <SettingsView />; break
    default:
      page = (
        <div className="sched">
          <aside className="sched-side">
            <RoomCard
              now={now}
              roomImg={roomImg}
              currentLabel={currentLabel}
              currentColor={currentSlot?.color}
            />
          </aside>

          <div className="sched-main">
            <div className="datebar">
              <button className="datebar-nav" aria-label="이전 날" onClick={() => setSelectedDate(shiftDate(selectedDate, -1))}>‹</button>
              <button className="datebar-date" onClick={() => setShowCalendar(true)}>
                <span className="datebar-date-main">{m}월 {d}일</span>
                <span className="datebar-date-sub">{dayName}요일{isToday ? ' · 오늘' : ''}</span>
              </button>
              <button className="datebar-nav" aria-label="다음 날" onClick={() => setSelectedDate(shiftDate(selectedDate, 1))}>›</button>
              <span className="datebar-spacer" />
              {!isToday && (
                <button className="btn-today" onClick={() => setSelectedDate(today)}>오늘로</button>
              )}
              <button className="btn-action" onClick={() => setShowCalendar(true)}>달력</button>
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
      )
  }

  return (
    <div className="app">
      <AppHeader currentView={currentView} onNavigate={setCurrentView} now={now} />
      <main className="app-content">{page}</main>

      {showCalendar && (
        <div className="modal-backdrop" onClick={() => setShowCalendar(false)}>
          <div className="modal-sheet calendar-modal" onClick={e => e.stopPropagation()}>
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
