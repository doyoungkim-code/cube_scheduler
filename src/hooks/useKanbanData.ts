import { useState, useEffect, useCallback, useRef } from 'react'
import type { Ticket, KanbanStatus } from '../types/kanban'

export function useKanbanData() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loaded, setLoaded] = useState(false)
  const dirty = useRef(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (window.electronAPI) {
        try {
          const saved = await window.electronAPI.loadData('tickets') as Ticket[] | null
          if (!cancelled && saved) setTickets(saved)
        } catch { /* ignore */ }
      }
      if (!cancelled) setLoaded(true)
    }
    load()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!loaded || !dirty.current) return
    if (window.electronAPI) window.electronAPI.saveData('tickets', tickets)
  }, [tickets, loaded])

  const addTicket = useCallback((ticket: Ticket) => {
    dirty.current = true
    setTickets(prev => [...prev, ticket])
  }, [])

  const updateTicket = useCallback((id: string, partial: Partial<Ticket>) => {
    dirty.current = true
    setTickets(prev => prev.map(t => t.id === id ? { ...t, ...partial, updatedAt: new Date().toISOString() } : t))
  }, [])

  const deleteTicket = useCallback((id: string) => {
    dirty.current = true
    setTickets(prev => prev.filter(t => t.id !== id))
  }, [])

  const moveTicket = useCallback((id: string, toStatus: KanbanStatus, toOrder: number) => {
    dirty.current = true
    setTickets(prev => {
      const ticket = prev.find(t => t.id === id)
      if (!ticket) return prev

      // Remove from current position
      const without = prev.filter(t => t.id !== id)

      // Get tickets in target column, sorted by order
      const columnTickets = without
        .filter(t => t.status === toStatus)
        .sort((a, b) => a.order - b.order)

      // Insert at position
      const clampedOrder = Math.max(0, Math.min(toOrder, columnTickets.length))
      columnTickets.splice(clampedOrder, 0, {
        ...ticket,
        status: toStatus,
        updatedAt: new Date().toISOString(),
      })

      // Reindex orders in target column
      columnTickets.forEach((t, i) => { t.order = i })

      // Rebuild full list
      const otherTickets = without.filter(t => t.status !== toStatus)
      return [...otherTickets, ...columnTickets]
    })
  }, [])

  const getTicketsByStatus = useCallback((status: KanbanStatus) => {
    return tickets.filter(t => t.status === status).sort((a, b) => a.order - b.order)
  }, [tickets])

  const getTicket = useCallback((id: string) => {
    return tickets.find(t => t.id === id) ?? null
  }, [tickets])

  return {
    tickets,
    addTicket,
    updateTicket,
    deleteTicket,
    moveTicket,
    getTicketsByStatus,
    getTicket,
  }
}
