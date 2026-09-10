/**
 * 로컬 모드용 스텁. `npm run dev:local` 이 vite alias 로 firebaseConfig.ts 대신 이 파일을 쓴다.
 * 로그인 없이 localStorage 에만 저장하므로 UI 작업·스크린샷·운영 DB 를 건드리지 않는 테스트에 쓴다.
 */
import type { FirebaseWebConfig } from './firebaseConfig'

export type { FirebaseWebConfig }
export const firebaseConfig: FirebaseWebConfig | null = null
export const ADMIN_EMAIL = ''
