import { useSyncExternalStore } from 'react'

/** CSS 미디어 쿼리 매칭 여부를 React 상태로 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    onChange => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

export const MQ_MOBILE = '(max-width: 719px)'
export const MQ_WIDE = '(min-width: 1280px)'
