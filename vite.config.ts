import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

// CUBE_LOCAL=1 이면 Firebase 설정을 스텁으로 바꿔 로그인 없는 로컬 모드로 띄운다 (npm run dev:local).
// UI 작업·스크린샷처럼 운영 DB 를 건드리면 안 되는 상황용.
const localMode = process.env.CUBE_LOCAL === '1'

// GitHub Pages 는 https://<user>.github.io/<repo>/ 에 배포되므로 base 를 저장소 이름으로 맞춥니다.
export default defineConfig({
  plugins: [react()],
  base: '/cube_scheduler/',
  resolve: {
    alias: localMode
      ? [{ find: /^(.*)\/firebaseConfig$/, replacement: fileURLToPath(new URL('./src/lib/firebaseConfig.local.ts', import.meta.url)) }]
      : [],
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
        },
      },
    },
  },
})
