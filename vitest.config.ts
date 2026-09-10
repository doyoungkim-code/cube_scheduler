import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// 기본은 node (lib/store 순수 함수). 렌더 스모크 테스트만 파일 상단 주석으로 jsdom 을 켠다.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    css: false,
  },
})
