const { spawnSync, spawn } = require('child_process')
const path = require('path')
const fs = require('fs')
const electron = require('electron')

const root = path.join(__dirname, '..')
const env = { ...process.env }
delete env.ELECTRON_RUN_AS_NODE

function run(label, cmd, args) {
  console.log(`\n> [${label}] ${cmd} ${args.join(' ')}`)
  const result = spawnSync(cmd, args, { cwd: root, stdio: 'inherit', env, shell: true })
  if (result.error) {
    console.error(`[${label}] spawn error:`, result.error)
    process.exit(1)
  }
  return result.status ?? 0
}

// Clean previous build output so vite always writes fresh chunks.
// (Windows/Git-Bash + vite 6 sometimes skips chunk writing when stale output exists.)
// Use OS `rmdir /s /q` to avoid a Node `fs.rmSync` quirk that aborts the process on MINGW.
function rmDir(p) {
  if (!fs.existsSync(p)) return
  const r = spawnSync('cmd', ['/c', 'rmdir', '/s', '/q', p], { stdio: 'inherit' })
  if (r.status !== 0) console.warn(`[dev] rmDir(${p}) exited ${r.status}`)
}
rmDir(path.join(root, 'dist'))

run('vite build', 'npx', ['vite', 'build'])

const distIndex = path.join(root, 'dist', 'index.html')
if (!fs.existsSync(distIndex)) {
  console.error(`[dev] vite build did not produce ${distIndex}`)
  process.exit(1)
}

run('electron main build', 'node', ['scripts/build-electron.js'])

const mainJs = path.join(root, 'dist-electron', 'main.js')
if (!fs.existsSync(mainJs)) {
  console.error(`[dev] missing ${mainJs}`)
  process.exit(1)
}

console.log('\n> [electron] launching…')
const child = spawn(electron, [root], {
  stdio: 'ignore',
  env,
  detached: true,
  windowsHide: false,
})
child.on('error', (err) => {
  console.error('[dev] electron spawn error:', err)
  process.exit(1)
})
child.unref()
console.log(`[dev] electron pid=${child.pid}`)
setTimeout(() => process.exit(0), 200)
