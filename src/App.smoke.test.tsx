// @vitest-environment jsdom
/**
 * 렌더 스모크 테스트: 로컬 모드로 앱 전체를 띄우고, 예전(v1) 데이터가 자동 변환되며
 * 다섯 뷰가 모두 크래시 없이 그려지는지 확인한다. 세부 동작 검증은 lib/store 유닛 테스트에 있다.
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'

vi.mock('./lib/firebase', () => ({
  isFirebaseEnabled: false,
  getDb: () => { throw new Error('firebase disabled in test') },
  getFirebaseAuth: () => { throw new Error('firebase disabled in test') },
}))

import { setStorageBackend } from './lib/storage'
import { useDocStore } from './store'
import { FakeBackend } from './store/fakeBackend.test-util'
import { dateKeyOf } from './lib/slots'
import type { DayData, Activity, WeeklyRoutines } from './types/schedule'
import type { Ticket } from './types/kanban'
import App from './App'
import { AuthProvider } from './auth/AuthContext'
import AuthGate from './auth/AuthGate'

beforeAll(() => {
  // jsdom 에 없는 브라우저 API
  window.matchMedia = ((query: string) => ({
    matches: false, media: query, onchange: null,
    addEventListener: () => {}, removeEventListener: () => {},
    addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
  window.scrollTo = (() => {}) as typeof window.scrollTo
  Element.prototype.scrollTo = (() => {}) as typeof Element.prototype.scrollTo
})

function seedLegacy(backend: FakeBackend, today: string) {
  const acts: Activity[] = [{ id: 'run', name: '운동', color: '#34c759', order: 0 }]
  backend.data.set('activities', acts)
  backend.data.set(`day-${today}`, {
    date: today, goal: '',
    slots: {
      540: { label: '운동', color: '#34c759' }, 550: { label: '운동', color: '#34c759' },
      600: { label: '독서', color: '#af52de', record: { title: '3장', description: '' } },
    },
  })
  backend.data.set('routines-weekly', {
    weekday: [], weekend: [], mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [],
    ...Object.fromEntries(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map(d => [d, [{ id: 'r', name: '운동', color: '#34c759', startMin: 420, endMin: 480 }]])),
  })
  const tickets: Ticket[] = [{
    id: 't1', title: '달리기', description: '', why: '', activityId: 'run', status: 'progress',
    activityFields: { type: 'exercise', data: { exerciseType: '', km: '', minutes: '' } },
    order: 0, createdAt: '2026-09-01T00:00:00Z', updatedAt: '',
  }]
  backend.data.set('tickets', tickets)
  backend.data.set('habits', [{ id: 'h1', name: '물', color: '#4a9eff', order: 0, createdAt: '' }])
  backend.data.set(`memo-${today}`, { text: '메모', updatedAt: '' })
}

describe('앱 스모크', () => {
  it('v1 데이터로 시작해 모든 뷰가 그려지고 데이터가 v2 로 바뀐다', async () => {
    const today = dateKeyOf(new Date())
    const backend = new FakeBackend()
    seedLegacy(backend, today)
    setStorageBackend(backend)
    useDocStore.getState().reset()

    const errors: unknown[] = []
    const origError = console.error
    console.error = (...args: unknown[]) => { errors.push(args); origError(...args) }

    render(
      <React.StrictMode>
        <AuthProvider><AuthGate><App /></AuthGate></AuthProvider>
      </React.StrictMode>,
    )

    // 홈: 타임테이블 144블록 + 마이그레이션된 기록 카드
    await waitFor(() => expect(document.querySelectorAll('.tt-block')).toHaveLength(144))
    await waitFor(() => expect((backend.data.get(`day-${today}`) as DayData).v).toBe(2))
    const day = backend.data.get(`day-${today}`) as DayData
    expect(day.segments).toHaveLength(2)
    expect(day.segments[1].record?.title).toBe('3장')
    // '독서' 는 팔레트에 없었으므로 보관 활동으로 생성
    const acts = backend.data.get('activities') as Activity[]
    expect(acts.find(a => a.name === '독서')?.archived).toBe(true)
    // 루틴도 activityId 로
    const weekly = backend.data.get('routines-weekly') as WeeklyRoutines
    expect(weekly.mon[0]).toMatchObject({ activityId: 'run' })
    // 티켓에 seq 부여
    await waitFor(() => expect((backend.data.get('tickets') as Ticket[])[0].seq).toBe(1))
    // 화면에 활동 이름이 보인다 (팔레트 칩)
    expect(screen.getAllByText('운동').length).toBeGreaterThan(0)

    // 나머지 뷰 순회
    for (const label of ['대시보드', '습관', '메모', '설정', '스케줄']) {
      const btn = screen.getAllByRole('button', { name: new RegExp(label) })[0]
      await act(async () => { fireEvent.click(btn) })
      await act(async () => { await new Promise(r => setTimeout(r, 0)) })
    }
    expect(document.querySelectorAll('.tt-block')).toHaveLength(144)

    console.error = origError
    const real = errors.filter(e => !String(e[0]).includes('Not implemented'))
    expect(real).toEqual([])
  })
})
