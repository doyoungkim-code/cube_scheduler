import { defineConfig } from 'vitest/config'

// lib/ 순수 함수 테스트가 대상이라 DOM 환경은 두지 않는다.
// 컴포넌트 테스트가 필요해지면 environment 를 'jsdom' 으로 바꾸고 jsdom 을 추가한다.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
