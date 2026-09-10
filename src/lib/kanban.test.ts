import { describe, it, expect } from 'vitest'
import type { Ticket, KanbanStatus } from '../types/kanban'
import { moveTicketIn, nextSeq, reindex, ticketsByStatus } from './kanban'

function t(id: string, status: KanbanStatus, order: number, seq?: number): Ticket {
  return {
    id, seq, title: id, description: '', why: '', activityId: '', status,
    activityFields: { type: 'general', data: { notes: '' } },
    order, createdAt: `2026-01-01T00:00:0${order}Z`, updatedAt: '',
  }
}

const ids = (list: Ticket[], status: KanbanStatus) =>
  list.filter(x => x.status === status).sort((a, b) => a.order - b.order).map(x => x.id)

describe('moveTicketIn — 같은 컬럼', () => {
  const base = [t('a', 'todo', 0), t('b', 'todo', 1), t('c', 'todo', 2), t('d', 'todo', 3)]

  it('아래로 옮길 때 인디케이터 인덱스를 하나 당긴다 (오프바이원)', () => {
    // a 를 c 아래(인디케이터 인덱스 3, 자기 포함 기준)로
    const next = moveTicketIn(base, 'a', 'todo', 3)
    expect(ids(next, 'todo')).toEqual(['b', 'c', 'a', 'd'])
  })

  it('맨 끝으로', () => {
    const next = moveTicketIn(base, 'a', 'todo', 4)
    expect(ids(next, 'todo')).toEqual(['b', 'c', 'd', 'a'])
  })

  it('위로 옮길 때는 그대로', () => {
    const next = moveTicketIn(base, 'd', 'todo', 1)
    expect(ids(next, 'todo')).toEqual(['a', 'd', 'b', 'c'])
  })

  it('제자리면 원본 참조를 돌려준다', () => {
    expect(moveTicketIn(base, 'b', 'todo', 1)).toBe(base)
    expect(moveTicketIn(base, 'b', 'todo', 2)).toBe(base)   // 바로 아래 인디케이터도 제자리
  })

  it('order 가 0..n-1 로 재번호된다', () => {
    const next = moveTicketIn(base, 'a', 'todo', 3)
    expect(next.filter(x => x.status === 'todo').sort((a, b) => a.order - b.order).map(x => x.order)).toEqual([0, 1, 2, 3])
  })
})

describe('moveTicketIn — 다른 컬럼', () => {
  const base = [t('a', 'todo', 0), t('b', 'todo', 1), t('c', 'todo', 2), t('x', 'progress', 0), t('y', 'progress', 1)]

  it('목적 컬럼 중간에 끼워 넣는다', () => {
    const next = moveTicketIn(base, 'b', 'progress', 1)
    expect(ids(next, 'progress')).toEqual(['x', 'b', 'y'])
    expect(next.find(x => x.id === 'b')?.status).toBe('progress')
  })

  it('출발 컬럼의 order 도 빈틈 없이 재번호된다', () => {
    const next = moveTicketIn(base, 'b', 'progress', 0)
    const todo = next.filter(x => x.status === 'todo').sort((a, b) => a.order - b.order)
    expect(todo.map(x => x.id)).toEqual(['a', 'c'])
    expect(todo.map(x => x.order)).toEqual([0, 1])
  })

  it('원본 객체를 변이하지 않는다', () => {
    const snapshot = JSON.stringify(base)
    moveTicketIn(base, 'a', 'done', 0)
    expect(JSON.stringify(base)).toBe(snapshot)
  })

  it('없는 id 면 원본 그대로', () => {
    expect(moveTicketIn(base, 'zzz', 'done', 0)).toBe(base)
  })

  it('범위를 벗어난 인덱스는 끝으로 clamp', () => {
    const next = moveTicketIn(base, 'a', 'progress', 99)
    expect(ids(next, 'progress')).toEqual(['x', 'y', 'a'])
  })
})

describe('nextSeq / reindex / ticketsByStatus', () => {
  it('seq 는 최대값 + 1, 없으면 1', () => {
    expect(nextSeq([])).toBe(1)
    expect(nextSeq([t('a', 'todo', 0, 3), t('b', 'todo', 1)])).toBe(4)
  })

  it('reindex 는 바뀐 항목만 새 객체', () => {
    const list = [t('a', 'todo', 0), t('b', 'todo', 5)]
    const out = reindex(list)
    expect(out[0]).toBe(list[0])
    expect(out[1]).not.toBe(list[1])
    expect(out[1].order).toBe(1)
  })

  it('ticketsByStatus 는 order 순 정렬', () => {
    const m = ticketsByStatus([t('b', 'todo', 1), t('a', 'todo', 0), t('x', 'done', 0)])
    expect(m.todo.map(x => x.id)).toEqual(['a', 'b'])
    expect(m.done.map(x => x.id)).toEqual(['x'])
    expect(m.progress).toEqual([])
  })
})
