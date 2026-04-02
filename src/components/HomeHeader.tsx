import { useState, useEffect } from 'react'
import type { TimeSlot } from '../types/schedule'
import type { Ticket } from '../types/kanban'
import { ROOM_MAP } from '../pages/SchedulerView'

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']

interface Props {
  todaySlots: Record<number, TimeSlot>
  tickets: Ticket[]
}

export default function HomeHeader({ todaySlots, tickets }: Props) {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')

  const y = now.getFullYear()
  const m = now.getMonth() + 1
  const d = now.getDate()
  const dayName = DAY_NAMES[now.getDay()]

  // 현재 방 이미지
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const nowSlotMin = Math.floor(nowMin / 10) * 10
  const currentSlot = todaySlots[nowSlotMin]
  const currentLabel = currentSlot?.label ?? ''
  const roomImg = ROOM_MAP[currentLabel] ?? './room.png'

  // 칸반 카운트
  const todoCount = tickets.filter(t => t.status === 'todo').length
  const progressCount = tickets.filter(t => t.status === 'progress').length
  const doneCount = tickets.filter(t => t.status === 'done').length

  return (
    <div className="home-header">
      <div className="home-header-room">
        <img src={roomImg} alt="" className="home-header-room-img" />
        {currentLabel && (
          <span className="home-header-room-label">{currentLabel}</span>
        )}
      </div>
      <div className="home-header-info">
        <div className="home-header-clock">{hours}:{minutes}:{seconds}</div>
        <div className="home-header-date">{y}년 {m}월 {d}일 {dayName}요일</div>
        <div className="home-header-stats">
          <span className="home-header-stat">
            할 일 <strong>{todoCount}</strong>
          </span>
          <span className="home-header-stat">
            진행중 <strong>{progressCount}</strong>
          </span>
          <span className="home-header-stat">
            완료 <strong>{doneCount}</strong>
          </span>
        </div>
      </div>
    </div>
  )
}
