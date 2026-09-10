import { useState, useEffect, useCallback } from 'react'
import ActivityPalette from './components/ActivityPalette'
import TimeTable from './components/TimeTable'
import Calendar from './components/Calendar'
import KanbanBoard from './components/KanbanBoard'
import AppHeader from './components/AppHeader'
import RoomCard from './components/RoomCard'
import TimelineVertical from './components/TimelineVertical'
import TodaySummary from './components/TodaySummary'
import WeekStrip from './components/WeekStrip'
import QuickMemo from './components/QuickMemo'
import HabitChecklist from './components/HabitChecklist'
import { useDayData, dayDocKey } from './hooks/useDayData'
import { useKanbanData } from './hooks/useKanbanData'
import { useMediaQuery, MQ_MOBILE, MQ_WIDE } from './hooks/useMediaQuery'
import { useNowMinute } from './hooks/useNow'
import { useDoc, undoLast } from './store'
import { dateKeyOf, shiftDateKey, parseDateKey } from './lib/slots'
import { SLEEP_ACTIVITY, ERASER_ACTIVITY, type DayData } from './types/schedule'
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

/** Ctrl+Z 가 동작하는 뷰 (편집 화면만) */
const UNDO_VIEWS: ReadonlySet<ViewId> = new Set<ViewId>(['scheduler', 'habit-tracker'])

function App() {
  const [currentView, setCurrentView] = useState<ViewId>('scheduler')
  const nowMin = useNowMinute()                 // 분 단위로만 리렌더
  const today = dateKeyOf(new Date())
  const [selectedDate, setSelectedDate] = useState(today)
  const data = useDayData(selectedDate)
  const todayDoc = useDoc<DayData>(dayDocKey(today))   // 방 카드용 "지금 하는 일" (선택 날짜와 무관)
  const kanban = useKanbanData()
  const [showCalendar, setShowCalendar] = useState(false)
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null)
  const isMobile = useMediaQuery(MQ_MOBILE)
  const isWide = useMediaQuery(MQ_WIDE)

  // 글로벌 키보드: Escape(달력닫기), Ctrl+Z(실행취소 — 편집 뷰에서만)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowCalendar(false)
      if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        if (!UNDO_VIEWS.has(currentView)) return
        const tag = (e.target as HTMLElement | null)?.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA') return
        e.preventDefault()
        undoLast()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [currentView])

  // 뷰 전환 시 스크롤 맨 위로
  useEffect(() => { window.scrollTo({ top: 0 }) }, [currentView])

  const isToday = selectedDate === today

  const selectedActivity = selectedActivityId === SLEEP_ACTIVITY.id
    ? SLEEP_ACTIVITY
    : selectedActivityId === ERASER_ACTIVITY.id
    ? ERASER_ACTIVITY
    : data.activities.find(a => a.id === selectedActivityId) ?? null

  const handleSelectDate = (date: string) => {
    setSelectedDate(date)
    setShowCalendar(false)
  }

  const deselectActivity = useCallback(() => setSelectedActivityId(null), [])

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
    // 티켓 내용을 슬롯 record에 복사 (칸반에는 영향 없음). undo 1단계.
    const record = {
      title: ticket.title,
      description: ticket.description,
      activityFields: ticket.activityFields,
    }
    data.updateSlots(slots => {
      for (let m = start; m < end; m += 10) {
        const s = slots[m]
        if (s) slots[m] = { ...s, detail: ticket.description, record }
      }
      return slots
    })
  }, [kanban, data])

  const dateObj = parseDateKey(selectedDate)
  const dayName = DAY_NAMES[dateObj.getDay()]

  const nowSlotMin = Math.floor(nowMin / 10) * 10
  const todaySlots = isToday ? data.day.slots : (todayDoc?.slots ?? {})
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
      {
        const datebar = (
          <div className="datebar">
            <button className="datebar-nav" aria-label="이전 날" onClick={() => setSelectedDate(shiftDateKey(selectedDate, -1))}>‹</button>
            <button className="datebar-date" onClick={() => setShowCalendar(true)}>
              <span className="datebar-date-main">{dateObj.getMonth() + 1}월 {dateObj.getDate()}일</span>
              <span className="datebar-date-sub">{dayName}요일{isToday ? ' · 오늘' : ''}</span>
            </button>
            <button className="datebar-nav" aria-label="다음 날" onClick={() => setSelectedDate(shiftDateKey(selectedDate, 1))}>›</button>
            <span className="datebar-spacer" />
            {!isToday && (
              <button className="btn-today" onClick={() => setSelectedDate(today)}>오늘로</button>
            )}
            <button className="btn-action" onClick={() => setShowCalendar(true)}>달력</button>
          </div>
        )
        const weekStrip = (
          <WeekStrip
            selectedDate={selectedDate}
            todayKey={today}
            currentSlots={data.rawDay.slots}
            onSelectDate={setSelectedDate}
          />
        )
        const palette = (
          <ActivityPalette
            activities={data.activities}
            selectedId={selectedActivityId}
            onSelect={setSelectedActivityId}
            onChange={data.setActivities}
          />
        )
        const timeline = isMobile ? (
          <TimelineVertical
            day={data.day}
            rawSlots={data.rawDay.slots}
            routines={data.routines}
            selectedActivity={selectedActivity}
            activities={data.activities}
            onSlotRangeChange={data.setSlotRange}
            onRecordChange={data.setRecordRange}
            onDeselectActivity={deselectActivity}
          />
        ) : (
          <TimeTable
            day={data.day}
            rawSlots={data.rawDay.slots}
            routines={data.routines}
            selectedActivity={selectedActivity}
            activities={data.activities}
            onSlotChange={data.setSlot}
            onSlotRangeChange={data.setSlotRange}
            onRecordChange={data.setRecordRange}
            onTicketDrop={handleTicketDropOnSlot}
            onDeselectActivity={deselectActivity}
          />
        )
        const board = (
          <KanbanBoard
            variant={isMobile ? 'tabs' : isWide ? 'stack' : 'columns'}
            activities={data.activities}
            addTicket={kanban.addTicket}
            updateTicket={kanban.updateTicket}
            deleteTicket={kanban.deleteTicket}
            moveTicket={kanban.moveTicket}
            getTicketsByStatus={kanban.getTicketsByStatus}
          />
        )
        const roomCard = (
          <RoomCard roomImg={roomImg} currentLabel={currentLabel} currentColor={currentSlot?.color} />
        )
        const memo = <QuickMemo key={selectedDate} dateKey={selectedDate} />

        page = isMobile ? (
          <div className="sched sched--mobile">
            {roomCard}
            {datebar}
            {weekStrip}
            {palette}
            {timeline}
            {board}
            <HabitChecklist />
            {memo}
          </div>
        ) : (
          <div className={`sched ${isWide ? 'sched--wide' : ''}`}>
            <aside className="sched-left">
              {roomCard}
              <TodaySummary slots={data.rawDay.slots} isToday={isToday} />
              <HabitChecklist />
            </aside>
            <div className="sched-center">
              {datebar}
              {weekStrip}
              {palette}
              {timeline}
              {!isWide && board}
              {memo}
            </div>
            {isWide && <aside className="sched-right">{board}</aside>}
          </div>
        )
      }
  }

  return (
    <div className="app">
      <AppHeader currentView={currentView} onNavigate={setCurrentView} />
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
