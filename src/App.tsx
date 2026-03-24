import { useState, useEffect, useCallback } from 'react'
import ActivityPalette from './components/ActivityPalette'
import TimeTable from './components/TimeTable'
import Calendar from './components/Calendar'
import RoutineEditor from './components/RoutineEditor'
import { useDayData, todayKey } from './hooks/useDayData'
import { SLEEP_ACTIVITY } from './types/schedule'
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

function App() {
  const today = todayKey()
  const [selectedDate, setSelectedDate] = useState(today)
  const data = useDayData(selectedDate)
  const todayDataAux = useDayData(today)
  const [showRoutineEditor, setShowRoutineEditor] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null)
  const [now, setNow] = useState(new Date())
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

  const [y, m, d] = selectedDate.split('-').map(Number)
  const dateObj = new Date(y, m - 1, d)
  const dayName = DAY_NAMES[dateObj.getDay()]

  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')

  // 현재 시간 슬롯의 활동에 따라 방 이미지 결정
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const nowSlotMin = Math.floor(nowMin / 10) * 10
  const todaySlots = isToday ? data.day.slots : todayDataAux.day.slots
  const currentSlot = todaySlots[nowSlotMin]
  const currentLabel = currentSlot?.label ?? ''
  const roomImg = ROOM_MAP[currentLabel] ?? './room.png'

  return (
    <div className={`app ${collapsed ? 'app--collapsed' : ''}`}>
      <div className="app-layout">
        {/* 왼쪽: 아바타 영역 */}
        <div className="app-left">
          <div className="app-left-clock">
            {now.getFullYear()}.{String(now.getMonth() + 1).padStart(2, '0')}.{String(now.getDate()).padStart(2, '0')} {hours}:{minutes}:{seconds}
          </div>
          <div className="avatar-area">
            <div className="avatar-box">
              <img className="avatar-room" src={roomImg} alt="" />
            </div>
          </div>
          <button className="btn-toggle" onClick={toggleCollapse}>
            {collapsed ? '▶' : '◀'}
          </button>
        </div>

        {/* 오른쪽: 타임테이블 영역 */}
        {!collapsed && (
          <div className="app-right">
            <div className="app-right-dateline">
              <span className="app-date-label">{m}월 {d}일 {dayName}요일</span>
              {!isToday && (
                <button className="btn-today" onClick={() => setSelectedDate(today)}>
                  오늘로
                </button>
              )}
              <span className="app-dateline-spacer" />
              <button className="btn-action" onClick={() => setShowRoutineEditor(true)}>루틴 설정</button>
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
              onSlotChange={data.setSlot}
              onSlotRangeChange={data.setSlotRange}
            />
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

      {showRoutineEditor && (
        <RoutineEditor
          routines={data.routines}
          activities={data.activities}
          onChange={data.setRoutines}
          onClose={() => setShowRoutineEditor(false)}
        />
      )}
    </div>
  )
}

export default App
