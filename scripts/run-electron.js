const { spawn } = require('child_process')
const electron = require('electron')
const path = require('path')

const env = { ...process.env }
delete env.ELECTRON_RUN_AS_NODE

const appRoot = path.join(__dirname, '..')

const child = spawn(electron, [appRoot], {
  stdio: 'ignore',
  env,
  detached: true,
  windowsHide: false,
})

child.on('error', (err) => {
  console.error('[run-electron] failed to spawn electron:', err)
  process.exit(1)
})

child.unref()
console.log('[run-electron] electron launched (pid:', child.pid, ')')
process.exit(0)
