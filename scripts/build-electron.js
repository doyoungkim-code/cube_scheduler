const esbuild = require('esbuild')
const path = require('path')

async function build() {
  // Build main process
  await esbuild.build({
    entryPoints: [path.join(__dirname, '../electron/main.ts')],
    bundle: true,
    platform: 'node',
    outfile: path.join(__dirname, '../dist-electron/main.js'),
    external: ['electron'],
    format: 'cjs',
    target: 'node18',
  })

  // Build preload script
  await esbuild.build({
    entryPoints: [path.join(__dirname, '../electron/preload.ts')],
    bundle: true,
    platform: 'node',
    outfile: path.join(__dirname, '../dist-electron/preload.js'),
    external: ['electron'],
    format: 'cjs',
    target: 'node18',
  })

  console.log('Electron build complete!')
}

build().catch((err) => {
  console.error(err)
  process.exit(1)
})
