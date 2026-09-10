import { useCallback, useMemo } from 'react'
import type { Ticket, KanbanStatus } from '../types/kanban'
import { useDoc, useDocStore, writeDoc } from '../store'

const KEY = 'tickets'
const EMPTY: Ticket[] = []

function currentTickets(): Ticket[] {
  return (useDocStore.getState().docs[KEY] as Ticket[] | null | undefined) ?? EMPTY
}

export function useKanbanData() {
  const doc = useDoc<Ticket[]>(KEY)
  const tickets = doc ?? EMPTY

  const addTicket = useCallback((ticket: Ticket) => {
    writeDoc(KEY, [...currentTickets(), ticket], { undo: true })
  }, [])

  const updateTicket = useCallback((id: string, partial: Partial<Ticket>) => {
    writeDoc(KEY, currentTickets().map(t =>
      t.id === id ? { ...t, ...partial, updatedAt: new Date().toISOString() } : t,
    ), { undo: true })
  }, [])

  const deleteTicket = useCallback((id: string) => {
    writeDoc(KEY, currentTickets().filter(t => t.id !== id), { undo: true })
  }, [])

  const moveTicket = useCallback((id: string, toStatus: KanbanStatus, toOrder: number) => {
    const prev = currentTickets()
    const ticket = prev.find(t => t.id === id)
    if (!ticket) return
    const without = prev.filter(t => t.id !== id)
    const column = without
      .filter(t => t.status === toStatus)
      .sort((a, b) => a.order - b.order)
    const at = Math.max(0, Math.min(toOrder, column.length))
    column.splice(at, 0, { ...ticket, status: toStatus, updatedAt: new Date().toISOString() })
    // 원본 객체를 변이하지 않고 새 객체로 재번호
    const reindexed = column.map((t, i) => (t.order === i ? t : { ...t, order: i }))
    const others = without.filter(t => t.status !== toStatus)
    writeDoc(KEY, [...others, ...reindexed], { undo: true })
  }, [])

  const byStatus = useMemo(() => {
    const map: Record<KanbanStatus, Ticket[]> = { todo: [], progress: [], done: [] }
    for (const t of tickets) (map[t.status] ?? map.todo).push(t)
    for (const k of Object.keys(map) as KanbanStatus[]) map[k].sort((a, b) => a.order - b.order)
    return map
  }, [tickets])

  const getTicketsByStatus = useCallback((status: KanbanStatus) => byStatus[status], [byStatus])

  const getTicket = useCallback((id: string) => tickets.find(t => t.id === id) ?? null, [tickets])

  return {
    tickets,
    loaded: doc !== undefined,
    addTicket,
    updateTicket,
    deleteTicket,
    moveTicket,
    getTicketsByStatus,
    getTicket,
  }
}
