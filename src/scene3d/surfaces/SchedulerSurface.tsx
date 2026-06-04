import { useCallback, useEffect, useState } from 'react'
import ActivityPalette from '../../components/ActivityPalette'
import TimeTable from '../../components/TimeTable'
import KanbanBoard from '../../components/KanbanBoard'
import Calendar from '../../components/Calendar'
import { useDayData } from '../../hooks/useDayData'
import { useKanbanData } from '../../hooks/useKanbanData'
import { SLEEP_ACTIVITY } from '../../types/schedule'

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']

export default function SchedulerSurface() {
  const [now, setNow] = useState(new Date())
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const [selectedDate, setSelectedDate] = useState(today)
  const data = useDayData(selectedDate)
  const kanban = useKanbanData()
  const [showCalendar, setShowCalendar] = useState(false)
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null)

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault()
        data.undo()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [data.undo])

  const isToday = selectedDate === today

  const selectedActivity = selectedActivityId === '__sleep__'
    ? SLEEP_ACTIVITY
    : selectedActivityId === 'eraser'
    ? { id: 'eraser', name: '지우개', color: '#ff3b30', order: -1 }
    : data.activities.find(a => a.id === selectedActivityId) ?? null

  const handleTicketDropOnSlot = useCallback((ticketId: string, slotMin: number) => {
    const ticket = kanban.getTicket(ticketId)
    if (!ticket) return
    const activity = data.activities.find(a => a.id === ticket.activityId)
    if (!activity) return
    const existingSlot = data.day.slots[slotMin]
    if (!existingSlot || existingSlot.label !== activity.name) return
    let start = slotMin
    while (start > 0 && data.day.slots[start - 10]?.label === activity.name) start -= 10
    let end = slotMin + 10
    while (end < 1440 && data.day.slots[end]?.label === activity.name) end += 10
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

  return (
    <div className="app scheduler-surface">
      <div className="app-layout">
        <div className="app-right" style={{ flex: 1 }}>
          <div className="app-right-upper">
            <div className="app-right-dateline">
              <span className="app-left-clock" style={{ marginRight: 12 }}>
                {now.getFullYear()}.{String(now.getMonth() + 1).padStart(2, '0')}.{String(now.getDate()).padStart(2, '0')} {hours}:{minutes}:{seconds}
              </span>
              <span className="app-date-label">{m}월 {d}일 {dayName}요일</span>
              {!isToday && (
                <button className="btn-today" onClick={() => setSelectedDate(today)}>오늘로</button>
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
      </div>

      {showCalendar && (
        <div className="modal-backdrop" onClick={() => setShowCalendar(false)}>
          <div className="calendar-modal" onClick={e => e.stopPropagation()}>
            <Calendar
              selectedDate={selectedDate}
              onSelectDate={(date) => { setSelectedDate(date); setShowCalendar(false) }}
              todayKey={today}
            />
          </div>
        </div>
      )}
    </div>
  )
}
