import { useEffect, useState } from 'react'

/**
 * 현재 시각. intervalMs 마다 갱신한다.
 * 초 단위 시계처럼 자주 바뀌는 값은 그것을 그리는 컴포넌트 안에서만 쓸 것 (상위 트리 전체 리렌더 방지).
 */
export function useNow(intervalMs: number): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(t)
  }, [intervalMs])
  return now
}

/** 분 단위 현재 시각 (0~1439). 분이 바뀔 때만 리렌더. */
export function useNowMinute(): number {
  const [nowMin, setNowMin] = useState(() => minuteOf(new Date()))
  useEffect(() => {
    const tick = () => setNowMin(prev => { const m = minuteOf(new Date()); return m === prev ? prev : m })
    const t = setInterval(tick, 15000)
    return () => clearInterval(t)
  }, [])
  return nowMin
}

function minuteOf(d: Date): number {
  return d.getHours() * 60 + d.getMinutes()
}
