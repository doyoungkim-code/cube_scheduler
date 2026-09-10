import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { initializeFirestore, persistentLocalCache, type Firestore } from 'firebase/firestore'
import { firebaseConfig } from './firebaseConfig'

let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null

if (firebaseConfig) {
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  // 오프라인 캐시: 네트워크가 끊겨도 읽기/쓰기가 로컬에 쌓였다가 재접속 시 동기화됩니다.
  db = initializeFirestore(app, { localCache: persistentLocalCache() })
}

export const isFirebaseEnabled = firebaseConfig !== null

export function getFirebaseAuth(): Auth {
  if (!auth) throw new Error('Firebase가 설정되지 않았습니다.')
  return auth
}

export function getDb(): Firestore {
  if (!db) throw new Error('Firebase가 설정되지 않았습니다.')
  return db
}
