export interface ElectronAPI {
  loadData: (key: string) => Promise<unknown>
  saveData: (key: string, data: unknown) => Promise<boolean>
  listDayKeys: () => Promise<string[]>
  toggleCollapse: (collapsed: boolean) => Promise<void>
  showNotification: (title: string, body: string) => Promise<void>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
