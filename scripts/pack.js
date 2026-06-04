const { spawnSync } = require('child_process')
const path = require('path')
const fs = require('fs')

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

// Clean previous output so vite always writes fresh chunks.
function rmDir(p) {
  if (!fs.existsSync(p)) return
  const r = spawnSync('cmd', ['/c', 'rmdir', '/s', '/q', p], { stdio: 'inherit' })
  if (r.status !== 0) console.warn(`[pack] rmDir(${p}) exited ${r.status}`)
}
rmDir(path.join(root, 'dist'))

run('vite build', 'npx', ['vite', 'build'])
if (!fs.existsSync(path.join(root, 'dist', 'index.html'))) {
  console.error('[pack] vite build failed (dist/index.html missing)')
  process.exit(1)
}

run('electron main build', 'node', ['scripts/build-electron.js'])
if (!fs.existsSync(path.join(root, 'dist-electron', 'main.js'))) {
  console.error('[pack] electron main build failed')
  process.exit(1)
}

run('electron-builder', 'npx', ['electron-builder'])
const exe = path.join(root, 'release', 'win-unpacked', 'Scheduler.exe')
if (!fs.existsSync(exe)) {
  console.error(`[pack] packaging did not produce ${exe}`)
  process.exit(1)
}

if (fs.existsSync(path.join(root, 'scripts', 'apply-icon.js'))) {
  run('apply icon', 'node', ['scripts/apply-icon.js'])
}

console.log(`\n✓ packaged: ${exe}`)
