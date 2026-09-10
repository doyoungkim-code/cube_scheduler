import { useEffect, useState } from 'react'
import {
  collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc, Timestamp,
} from 'firebase/firestore'
import { getDb } from '../lib/firebase'
import type { MemberDoc } from './AuthContext'

interface MemberRow extends MemberDoc { uid: string }

function fmt(ts: unknown): string {
  if (ts instanceof Timestamp) {
    const d = ts.toDate()
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
  }
  return '-'
}

/** 관리자 전용: 가입 요청 승인 / 해제 */
export default function AdminPanel() {
  const [members, setMembers] = useState<MemberRow[]>([])
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    const q = query(collection(getDb(), 'members'), orderBy('requestedAt', 'desc'))
    return onSnapshot(q, snap => {
      setMembers(snap.docs.map(d => ({ uid: d.id, ...(d.data() as MemberDoc) })))
      setErr(null)
    }, e => setErr(`목록을 불러오지 못했습니다: ${e.message}`))
  }, [])

  const approve = (uid: string) =>
    updateDoc(doc(getDb(), 'members', uid), { status: 'approved', approvedAt: serverTimestamp() })
  const revoke = (uid: string) =>
    updateDoc(doc(getDb(), 'members', uid), { status: 'pending' })
  const remove = (uid: string) => {
    if (!confirm('이 사용자의 가입 요청을 삭제할까요? (저장된 스케줄 데이터는 남습니다)')) return
    return deleteDoc(doc(getDb(), 'members', uid))
  }

  const pending = members.filter(m => m.status === 'pending')
  const approved = members.filter(m => m.status === 'approved')

  return (
    <div className="admin-panel">
      {err && <p className="auth-error">{err}</p>}

      <h3 className="settings-subtitle">승인 대기 ({pending.length})</h3>
      {pending.length === 0 && <p className="settings-muted">대기 중인 요청이 없습니다.</p>}
      {pending.map(m => (
        <div key={m.uid} className="member-row">
          <div className="member-info">
            <span className="member-name">{m.displayName || '(이름 없음)'}</span>
            <span className="member-email">{m.email}</span>
            <span className="member-date">요청 {fmt(m.requestedAt)}</span>
          </div>
          <div className="member-actions">
            <button className="btn-action btn-approve" onClick={() => void approve(m.uid)}>승인</button>
            <button className="btn-action btn-danger" onClick={() => void remove(m.uid)}>거절</button>
          </div>
        </div>
      ))}

      <h3 className="settings-subtitle">승인된 사용자 ({approved.length})</h3>
      {approved.map(m => (
        <div key={m.uid} className="member-row">
          <div className="member-info">
            <span className="member-name">{m.displayName || '(이름 없음)'}</span>
            <span className="member-email">{m.email}</span>
            <span className="member-date">승인 {fmt(m.approvedAt)}</span>
          </div>
          <div className="member-actions">
            <button className="btn-action" onClick={() => void revoke(m.uid)}>승인 해제</button>
          </div>
        </div>
      ))}
    </div>
  )
}
