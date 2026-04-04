import { app, BrowserWindow, ipcMain, Menu, Notification, clipboard } from 'electron'
import path from 'path'
import { Store } from './store'

let mainWindow: BrowserWindow | null = null
let store: Store

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#56423f',
      symbolColor: '#f0e6e0',
      height: 40,
    },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
    backgroundColor: '#56423f',
  })

  Menu.setApplicationMenu(null)

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  // 개발 모드: Vite 서버 / 프로덕션: 빌드된 파일
  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// IPC 핸들러 등록
function setupIPC() {
  // 데이터 로드
  ipcMain.handle('store:load', async (_event, key: string) => {
    return store.load(key)
  })

  // 데이터 저장
  ipcMain.handle('store:save', async (_event, key: string, data: unknown) => {
    return store.save(key, data)
  })

  // 키 목록 조회
  ipcMain.handle('store:listKeys', async (_event, prefix: string) => {
    return store.listKeys(prefix)
  })

  // 창 크기 토글
  ipcMain.handle('window:toggle-collapse', async (_event, collapsed: boolean) => {
    if (!mainWindow) return
    const [, h] = mainWindow.getSize()
    if (collapsed) {
      mainWindow.setMinimumSize(200, 300)
      mainWindow.setSize(380, h, true)
    } else {
      mainWindow.setSize(1400, h, true)
      mainWindow.setMinimumSize(800, 300)
    }
  })

  // 알림 보내기
  ipcMain.handle('notification:show', async (_event, title: string, body: string) => {
    if (Notification.isSupported()) {
      new Notification({ title, body }).show()
    }
  })

  // HTML 클립보드 복사
  ipcMain.handle('clipboard:writeHtml', async (_event, html: string, plainText: string) => {
    clipboard.write({
      html: html,
      text: plainText,
    })
    return true
  })
}

app.whenReady().then(() => {
  store = new Store(app.getPath('userData'))
  setupIPC()
  createWindow()
})

app.on('window-all-closed', () => {
  app.quit()
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})
