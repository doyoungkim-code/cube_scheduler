const path = require('path')
const fs = require('fs')
const { rcedit } = require('rcedit')

const exe = path.join(__dirname, '../release/win-unpacked/Scheduler.exe')
const ico = path.join(__dirname, '../public/icon.ico')

if (!fs.existsSync(exe)) {
  console.log('Scheduler.exe not found, skipping icon apply')
  process.exit(0)
}

rcedit(exe, {
  icon: ico,
  'requested-execution-level': 'asInvoker'
})
  .then(() => console.log('Icon + manifest applied to Scheduler.exe'))
  .catch(err => { console.error('Failed to apply icon:', err); process.exit(1) })
