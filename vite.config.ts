import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages 는 https://<user>.github.io/<repo>/ 에 배포되므로 base 를 저장소 이름으로 맞춥니다.
export default defineConfig({
  plugins: [react()],
  base: '/cube_scheduler/',
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
