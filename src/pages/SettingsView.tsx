import { useRef, useState } from 'react'
import ViewShell from '../components/ViewShell'
import { useAuth } from '../auth/AuthContext'
import AdminPanel from '../auth/AdminPanel'
import { storage } from '../lib/storage'
import { writeDoc } from '../store'

const EXPORT_MARKER = '__scheduler_export__'
const KEY_PREFIXES = ['day-', 'routines', 'activities', 'habits', 'habit-checks-', 'tickets', 'memo-']

async function collectAll(): Promise<Record<string, unknown>> {
  const out: Record<string, unknown> = {}
  const seen = new Set<string>()
  for (const p of KEY_PREFIXES) {
    for (const k of await storage.listKeys(p)) {
      if (seen.has(k)) continue
      seen.add(k)
      out[k] = await storage.loadData(k)
    }
  }
  // listKeys('day-')는 슬롯이 있는 날만 반환하므로 goal만 있는 날은 빠질 수 있음. 허용.
  return out
}

export default function SettingsView() {
  const { status, user, isAdmin, signOut } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')

  const handleExport = async () => {
    setMsg('내보내는 중...')
    const data = await collectAll()
    const payload = { [EXPORT_MARKER]: 1, exportedAt: new Date().toISOString(), data }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `scheduler-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMsg(`${Object.keys(data).length}개 항목을 내보냈습니다.`)
  }

  const handleImport = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setMsg('가져오는 중...')
    let count = 0
    let skipped = 0
    for (const file of Array.from(files)) {
      if (!file.name.endsWith('.json')) { skipped++; continue }
      let parsed: unknown
      try { parsed = JSON.parse(await file.text()) } catch { skipped++; continue }

      // 1) 이 앱의 백업 파일
      if (parsed && typeof parsed === 'object' && EXPORT_MARKER in (parsed as object)) {
        const data = (parsed as { data: Record<string, unknown> }).data ?? {}
        for (const [k, v] of Object.entries(data)) {
          writeDoc(k, v)   // 스토어 + 저장소에 동시에 반영 → 화면 즉시 갱신
          count++
        }
        continue
      }
      // 2) 예전 Electron 버전의 개별 파일 (예: day-2026-03-23.json, tickets.json)
      const key = file.name.replace(/\.json$/, '')
      if (!KEY_PREFIXES.some(p => key.startsWith(p))) { skipped++; continue }
      writeDoc(key, parsed)
      count++
    }
    await storage.flush()
    setMsg(`${count}개 항목을 가져왔습니다.${skipped ? ` (${skipped}개 파일 건너뜀)` : ''}`)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <ViewShell title="환경설정">
      <div className="settings-page">

        <section className="settings-section">
          <h2 className="settings-title">계정</h2>
          {status === 'local' ? (
            <p className="settings-muted">
              로컬 모드입니다. 데이터는 이 브라우저에만 저장됩니다.
              다른 기기와 동기화하려면 Firebase 설정을 추가하세요. (README 참고)
            </p>
          ) : (
            <div className="settings-account">
              {user?.photoURL && <img className="settings-avatar" src={user.photoURL} alt="" referrerPolicy="no-referrer" />}
              <div className="settings-account-info">
                <span className="member-name">{user?.displayName}</span>
                <span className="member-email">{user?.email}{isAdmin && ' · 관리자'}</span>
              </div>
              <button className="btn-action" onClick={() => void signOut()}>로그아웃</button>
            </div>
          )}
        </section>

        {isAdmin && (
          <section className="settings-section">
            <h2 className="settings-title">사용자 승인</h2>
            <p className="settings-muted">
              새 사용자가 Google 계정으로 로그인하면 아래 목록에 나타납니다. 승인한 사용자만 앱을 사용할 수 있습니다.
            </p>
            <AdminPanel />
          </section>
        )}

        <section className="settings-section">
          <h2 className="settings-title">데이터</h2>
          <p className="settings-muted">
            백업 파일로 내보내거나, 백업 파일 / 예전 데스크톱 버전의 JSON 파일들을 가져올 수 있습니다.
            데스크톱 버전 데이터 위치: <code>%APPDATA%\scheduler\scheduler-data\</code>
          </p>
          <div className="settings-actions">
            <button className="btn-action" onClick={() => void handleExport()}>백업 내보내기</button>
            <button className="btn-action" onClick={() => fileRef.current?.click()}>가져오기 (JSON)</button>
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              multiple
              hidden
              onChange={e => void handleImport(e.target.files)}
            />
          </div>
          {msg && <p className="settings-msg">{msg}</p>}
        </section>

      </div>
    </ViewShell>
  )
}
