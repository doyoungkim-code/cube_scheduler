import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User,
} from 'firebase/auth'
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore'
import { getDb, getFirebaseAuth, isFirebaseEnabled } from '../lib/firebase'
import { ADMIN_EMAIL } from '../lib/firebaseConfig'
import { FirestoreBackend, LocalStorageBackend, setStorageBackend } from '../lib/storage'

export type MemberStatus = 'pending' | 'approved'

export interface MemberDoc {
  email: string
  displayName: string
  photoURL?: string
  status: MemberStatus
  requestedAt?: unknown
  approvedAt?: unknown
}

export type AuthStatus =
  | 'local'       // Firebase 미설정: 로그인 없이 localStorage 사용
  | 'loading'
  | 'signed-out'
  | 'pending'     // 로그인은 했지만 관리자 승인 대기
  | 'approved'

interface AuthState {
  status: AuthStatus
  user: User | null
  isAdmin: boolean
  error: string | null
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthCtx = createContext<AuthState | null>(null)

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && email.toLowerCase() === ADMIN_EMAIL.toLowerCase()
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(isFirebaseEnabled ? 'loading' : 'local')
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState<string | null>(null)

  // 1) 로그인 상태 구독
  useEffect(() => {
    if (!isFirebaseEnabled) return
    return onAuthStateChanged(getFirebaseAuth(), u => {
      setUser(u)
      setStatus(u ? 'loading' : 'signed-out')
      if (!u) setStorageBackend(new LocalStorageBackend())
    })
  }, [])

  // 2) 로그인한 사용자의 members/{uid} 문서 구독 → 승인 여부 결정
  useEffect(() => {
    if (!isFirebaseEnabled || !user) return
    const uid = user.uid
    const admin = isAdminEmail(user.email)
    const ref = doc(getDb(), 'members', uid)
    let backend: FirestoreBackend | null = null
    let requested = false

    const unsub = onSnapshot(ref, snap => {
      const data = snap.data() as MemberDoc | undefined
      const approved = admin || data?.status === 'approved'

      if (!snap.exists() && !requested) {
        // 첫 로그인: 가입 요청 문서 생성 (관리자는 바로 승인 상태로)
        requested = true
        const req: MemberDoc = {
          email: user.email ?? '',
          displayName: user.displayName ?? '',
          status: admin ? 'approved' : 'pending',
          requestedAt: serverTimestamp(),
        }
        if (user.photoURL) req.photoURL = user.photoURL
        if (admin) req.approvedAt = serverTimestamp()
        setDoc(ref, req).catch(err => {
          console.error('[auth] member request failed', err)
          setError('가입 요청을 저장하지 못했습니다. Firestore 규칙을 확인하세요.')
        })
      }

      if (approved) {
        if (!backend) {
          backend = new FirestoreBackend(uid)
          setStorageBackend(backend)
        }
        setStatus('approved')
      } else {
        setStatus('pending')
      }
    }, err => {
      console.error('[auth] member snapshot error', err)
      setError('권한 정보를 읽지 못했습니다. Firestore 규칙을 확인하세요.')
      setStatus('pending')
    })

    return () => {
      unsub()
      if (backend) setStorageBackend(new LocalStorageBackend())
    }
  }, [user])

  const value: AuthState = {
    status,
    user,
    isAdmin: isAdminEmail(user?.email),
    error,
    signIn: async () => {
      setError(null)
      try {
        const provider = new GoogleAuthProvider()
        provider.setCustomParameters({ prompt: 'select_account' })
        await signInWithPopup(getFirebaseAuth(), provider)
      } catch (err) {
        const code = (err as { code?: string }).code ?? ''
        if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return
        console.error('[auth] sign-in failed', err)
        setError(
          code === 'auth/unauthorized-domain'
            ? '이 도메인이 Firebase 승인된 도메인에 없습니다. (Authentication > Settings > Authorized domains)'
            : `로그인 실패: ${code || String(err)}`,
        )
      }
    },
    signOut: async () => {
      await signOut(getFirebaseAuth())
    },
  }

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
