/**
 * 칸반 티켓 목록에 대한 순수 연산. 훅(useKanbanData)이 스토어 값에 적용한다.
 */
import type { Ticket, KanbanStatus } from '../types/kanban'

export const KANBAN_STATUSES: KanbanStatus[] = ['todo', 'progress', 'done']

/** 컬럼 제목 / 탭 이름 */
export const STATUS_LABELS: Record<KanbanStatus, string> = { todo: '할 일', progress: '진행 중', done: '완료' }

/** 티켓 카드에 찍히는 스탬프 문구 */
export const STATUS_STAMPS: Record<KanbanStatus, string> = { todo: 'TO DO', progress: 'IN PROGRESS', done: 'COMPLETE' }

const byOrder = (a: Ticket, b: Ticket) => a.order - b.order

export function nextSeq(tickets: readonly Ticket[]): number {
  let max = 0
  for (const t of tickets) if (t.seq && t.seq > max) max = t.seq
  return max + 1
}

/** 컬럼 안 order 를 0..n-1 로 다시 매긴다 (변경된 것만 새 객체) */
export function reindex(column: Ticket[]): Ticket[] {
  return column.map((t, i) => (t.order === i ? t : { ...t, order: i }))
}

export function ticketsByStatus(tickets: readonly Ticket[]): Record<KanbanStatus, Ticket[]> {
  const map: Record<KanbanStatus, Ticket[]> = { todo: [], progress: [], done: [] }
  for (const t of tickets) (map[t.status] ?? map.todo).push(t)
  for (const k of KANBAN_STATUSES) map[k].sort(byOrder)
  return map
}

/**
 * 티켓을 toStatus 컬럼의 toOrder 위치로 옮긴 새 배열을 돌려준다.
 * toOrder 는 드롭 인디케이터 기준 인덱스(자기 자신이 포함된 목록 기준)다.
 * 같은 컬럼에서 아래로 옮길 때는 자기 자신이 빠지므로 하나 당긴다.
 * 제자리면 원본 배열을 그대로 돌려준다 (호출측이 === 로 무변경을 감지할 수 있게).
 */
export function moveTicketIn(prev: Ticket[], id: string, toStatus: KanbanStatus, toOrder: number, now = new Date().toISOString()): Ticket[] {
  const ticket = prev.find(t => t.id === id)
  if (!ticket) return prev
  const fromStatus = ticket.status

  const source = prev.filter(t => t.status === fromStatus).sort(byOrder)
  const fromIndex = source.findIndex(t => t.id === id)
  const sameColumn = fromStatus === toStatus
  const target = sameColumn
    ? source.filter(t => t.id !== id)
    : prev.filter(t => t.status === toStatus).sort(byOrder)

  let at = toOrder
  if (sameColumn && fromIndex < toOrder) at -= 1
  at = Math.max(0, Math.min(at, target.length))
  if (sameColumn && at === fromIndex) return prev

  const inserted = [...target]
  inserted.splice(at, 0, { ...ticket, status: toStatus, updatedAt: now })

  const untouched = prev.filter(t => t.status !== fromStatus && t.status !== toStatus)
  const sourceAfter = sameColumn ? [] : reindex(source.filter(t => t.id !== id))
  return [...untouched, ...sourceAfter, ...reindex(inserted)]
}
