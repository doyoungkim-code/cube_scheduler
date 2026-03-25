import fs from 'fs'
import path from 'path'

export class Store {
  private basePath: string

  constructor(userDataPath: string) {
    this.basePath = path.join(userDataPath, 'scheduler-data')
    // 데이터 디렉토리가 없으면 생성
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true })
    }
  }

  private getFilePath(key: string): string {
    return path.join(this.basePath, `${key}.json`)
  }

  load(key: string): unknown {
    const filePath = this.getFilePath(key)
    if (!fs.existsSync(filePath)) {
      return null
    }
    try {
      const raw = fs.readFileSync(filePath, 'utf-8')
      return JSON.parse(raw)
    } catch {
      return null
    }
  }

  save(key: string, data: unknown): boolean {
    const filePath = this.getFilePath(key)
    const tmpPath = filePath + '.tmp'
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8')
    fs.renameSync(tmpPath, filePath)
    return true
  }

  listKeys(prefix: string): string[] {
    const files = fs.readdirSync(this.basePath)
    return files
      .filter(f => f.startsWith(prefix) && f.endsWith('.json'))
      .filter(f => {
        // day- 파일은 실제 슬롯 데이터가 있는 것만 반환
        if (prefix === 'day-') {
          try {
            const raw = fs.readFileSync(path.join(this.basePath, f), 'utf-8')
            const data = JSON.parse(raw)
            return data && data.slots && Object.keys(data.slots).length > 0
          } catch { return false }
        }
        return true
      })
      .map(f => f.replace('.json', ''))
  }
}
