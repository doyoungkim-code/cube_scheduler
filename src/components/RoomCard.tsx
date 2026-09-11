import { useState } from 'react'
import { useNow } from '../hooks/useNow'
import { pad2 } from '../lib/slots'
import { inkOn } from '../lib/color'
import { DEFAULT_ROOM_IMAGE, roomImagePath } from '../lib/activityCatalog'

interface Props {
  /** 방 이미지 키 (rooms/<키>.png). null 이면 기본 방 */
  imageKey: string | null
  currentLabel: string
  currentColor?: string
}

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']

/**
 * 현재 활동에 따라 바뀌는 방 이미지 + 시계 카드. 초 단위 시계는 이 컴포넌트만 리렌더한다.
 * 이미지 파일이 아직 없는 프리셋은 기본 방 위에 "준비 중" 배지를 띄운다.
 */
export default function RoomCard({ imageKey, currentLabel, currentColor }: Props) {
  const now = useNow(1000)
  const [missing, setMissing] = useState<Set<string>>(() => new Set())
  const hasImage = !!imageKey && !missing.has(imageKey)
  const src = hasImage ? roomImagePath(imageKey) : DEFAULT_ROOM_IMAGE
  const pending = !!imageKey && !hasImage

  return (
    <section className="room-card">
      <div className="room-card-img-wrap">
        <img
          className="room-card-img"
          src={src}
          alt=""
          onError={() => { if (imageKey) setMissing(prev => prev.has(imageKey) ? prev : new Set(prev).add(imageKey)) }}
        />
        {pending && <span className="room-card-pending">방 준비 중</span>}
      </div>
      <div className="room-card-info">
        <div className="room-card-clock">
          {pad2(now.getHours())}:{pad2(now.getMinutes())}
          <span className="room-card-sec">:{pad2(now.getSeconds())}</span>
        </div>
        <div className="room-card-date">
          {now.getFullYear()}.{pad2(now.getMonth() + 1)}.{pad2(now.getDate())} {DAY_NAMES[now.getDay()]}
        </div>
        <div className="room-card-activity">
          {currentLabel
            ? <span className="room-card-pill" style={{ background: currentColor, color: currentColor ? inkOn(currentColor) : undefined }}>{currentLabel}</span>
            : <span className="room-card-pill room-card-pill--empty">지금 하는 일이 없어요</span>}
        </div>
      </div>
    </section>
  )
}
