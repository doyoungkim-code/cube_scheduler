import { useCallback, useEffect, useMemo } from 'react'
import type { Ticket, KanbanStatus } from '../types/kanban'
import { useDoc, useDocStore, writeDoc } from '../store'
import { moveTicketIn, nextSeq, ticketsByStatus } from '../lib/kanban'

const KEY = 'tickets'
const EMPTY: Ticket[] = []

function currentTickets(): Ticket[] {
  return (useDocStore.getState().docs[KEY] as Ticket[] | null | undefined) ?? EMPTY
}

let seqMigrationStarted = false

export function useKanbanData() {
  const doc = useDoc<Ticket[]>(KEY)
  const tickets = doc ?? EMPTY

  // 마이그레이션: seq 가 없는 예전 티켓에 생성 순서대로 번호 부여 (한 번만)
  useEffect(() => {
    if (!doc || seqMigrationStarted) return
    if (doc.every(t => typeof t.seq === 'number')) return
    seqMigrationStarted = true
    const byCreated = [...doc].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    let seq = nextSeq(doc)
    const assigned = new Map<string, number>()
    for (const t of byCreated) if (typeof t.seq !== 'number') assigned.set(t.id, seq++)
    writeDoc(KEY, doc.map(t => assigned.has(t.id) ? { ...t, seq: assigned.get(t.id) } : t))
  }, [doc])

  const addTicket = useCallback((ticket: Ticket) => {
    const prev = currentTickets()
    writeDoc(KEY, [...prev, { ...ticket, seq: ticket.seq ?? nextSeq(prev) }], { undo: true })
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
    const next = moveTicketIn(prev, id, toStatus, toOrder)
    if (next !== prev) writeDoc(KEY, next, { undo: true })
  }, [])

  const byStatus = useMemo(() => ticketsByStatus(tickets), [tickets])
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
