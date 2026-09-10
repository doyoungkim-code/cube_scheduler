export type ViewId =
  | 'scheduler'
  | 'pattern-analysis'
  | 'habit-tracker'
  | 'quick-memo'
  | 'settings'

export const VIEW_IDS: readonly ViewId[] = ['scheduler', 'pattern-analysis', 'habit-tracker', 'quick-memo', 'settings']

export function isViewId(v: string | null | undefined): v is ViewId {
  return !!v && (VIEW_IDS as readonly string[]).includes(v)
}

/** 주소의 ?view= 로 시작 화면을 고른다 (없거나 모르면 스케줄) */
export function initialViewFromLocation(): ViewId {
  try {
    const v = new URLSearchParams(window.location.search).get('view')
    return isViewId(v) ? v : 'scheduler'
  } catch {
    return 'scheduler'
  }
}
