import { useState, useEffect } from 'react'

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']

function CurrentTime() {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const date = String(now.getDate()).padStart(2, '0')
  const day = DAY_NAMES[now.getDay()]
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')

  return (
    <div className="current-time">
      <span className="current-date">{year}.{month}.{date} ({day})</span>
      <span className="current-clock">{hours}:{minutes}:{seconds}</span>
    </div>
  )
}

export default CurrentTime
