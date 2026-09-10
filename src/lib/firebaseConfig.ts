/**
 * Firebase 프로젝트 설정.
 *
 * Firebase 콘솔 > 프로젝트 설정 > 내 앱 > SDK 설정 및 구성 에서 복사한 값을 넣으세요.
 * 웹 앱의 Firebase 설정값은 비밀이 아니며(공개 저장소에 올라가도 됨),
 * 데이터 보호는 firestore.rules 의 보안 규칙이 담당합니다.
 *
 * null 로 두면 앱은 "로컬 모드"로 동작합니다 (로그인 없이 브라우저 localStorage 에만 저장).
 */
export interface FirebaseWebConfig {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket?: string
  messagingSenderId?: string
  appId: string
}

export const firebaseConfig: FirebaseWebConfig | null = {
  apiKey: 'AIzaSyA2Xap3bPmrOz0abd9NS8-4NQ_vgM2mHbY',
  authDomain: 'cube-scheduler-1f988.firebaseapp.com',
  projectId: 'cube-scheduler-1f988',
  storageBucket: 'cube-scheduler-1f988.firebasestorage.app',
  messagingSenderId: '438291488838',
  appId: '1:438291488838:web:2fd9f812fbfce8173a2a47',
}

/** 관리자(승인 권한자) Google 계정 이메일. firestore.rules 의 값과 동일해야 합니다. */
export const ADMIN_EMAIL = 'kwat09k@gmail.com'
