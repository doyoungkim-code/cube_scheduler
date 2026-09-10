import { useEffect, useState } from 'react'

/** CSS 미디어 쿼리 매칭 여부를 React 상태로 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  )
  useEffect(() => {
    const mql = window.matchMedia(query)
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    setMatches(mql.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [query])
  return matches
}

export const MQ_MOBILE = '(max-width: 719px)'
export const MQ_WIDE = '(min-width: 1280px)'
