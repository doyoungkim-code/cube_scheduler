import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // 데이터 저장/로드
  loadData: (key: string) => ipcRenderer.invoke('store:load', key),
  saveData: (key: string, data: unknown) => ipcRenderer.invoke('store:save', key, data),
  listDayKeys: () => ipcRenderer.invoke('store:listKeys', 'day-'),

  // 창 크기 토글
  toggleCollapse: (collapsed: boolean) =>
    ipcRenderer.invoke('window:toggle-collapse', collapsed),

  // 알림
  showNotification: (title: string, body: string) =>
    ipcRenderer.invoke('notification:show', title, body),

  // 클립보드에 HTML 복사
  copyHtmlToClipboard: (html: string, plainText: string) =>
    ipcRenderer.invoke('clipboard:writeHtml', html, plainText),
})
