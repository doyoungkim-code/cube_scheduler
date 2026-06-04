import type { ViewId } from '../../types/navigation'

export type FeatureId = Exclude<ViewId, 'home'>

export interface FocusPose {
  position: [number, number, number]
  target: [number, number, number]
}

export interface OverlayTransform {
  position: [number, number, number]
  rotation: [number, number, number]
  pixelSize: [number, number]
  worldSize: [number, number]
}

export interface FurnitureMeta {
  id: FeatureId
  label: string
  tooltip: string
  focusPose: FocusPose
  overlay: OverlayTransform
}

export const FURNITURE: Record<FeatureId, FurnitureMeta> = {
  scheduler: {
    id: 'scheduler',
    label: '스케줄러',
    tooltip: '오늘의 타임테이블 · 칸반',
    focusPose: { position: [0, 1.18, -0.25], target: [0, 1.18, -1.12] },
    overlay: {
      position: [0, 1.18, -1.094],
      rotation: [0, 0, 0],
      pixelSize: [1100, 635],
      worldSize: [0.9, 0.52],
    },
  },
  'pattern-analysis': {
    id: 'pattern-analysis',
    label: '대시보드',
    tooltip: '시간 패턴 · 통계',
    focusPose: { position: [1.5, 1.85, -2.05], target: [1.5, 1.85, -2.97] },
    overlay: {
      position: [1.5, 1.85, -2.949],
      rotation: [0, 0, 0],
      pixelSize: [960, 620],
      worldSize: [1.05, 0.68],
    },
  },
  'habit-tracker': {
    id: 'habit-tracker',
    label: '습관 트래커',
    tooltip: '루틴 · 체크리스트',
    focusPose: { position: [2.35, 1.8, -0.6], target: [3.48, 1.8, -0.6] },
    overlay: {
      position: [3.449, 1.8, -0.6],
      rotation: [0, -Math.PI / 2, 0],
      pixelSize: [760, 900],
      worldSize: [0.95, 1.12],
    },
  },
  'quick-memo': {
    id: 'quick-memo',
    label: '메모',
    tooltip: '빠른 기록',
    focusPose: { position: [0.75, 1.45, -0.55], target: [0.75, 0.755, -0.95] },
    overlay: {
      position: [0.75, 0.766, -0.95],
      rotation: [-Math.PI / 2, 0, 0],
      pixelSize: [720, 520],
      worldSize: [0.42, 0.3],
    },
  },
  settings: {
    id: 'settings',
    label: '설정',
    tooltip: '앱 환경설정',
    focusPose: { position: [0.75, 0.42, -0.1], target: [0.75, 0.32, -0.55] },
    overlay: {
      position: [0.75, 0.32, -0.559],
      rotation: [0, 0, 0],
      pixelSize: [760, 480],
      worldSize: [0.42, 0.26],
    },
  },
  'today-dashboard': {
    id: 'today-dashboard',
    label: '오늘',
    tooltip: '오늘의 요약',
    focusPose: { position: [0, 1.3, -0.3], target: [0, 1.3, -1.3] },
    overlay: {
      position: [0, 1.3, -1.275],
      rotation: [0, 0, 0],
      pixelSize: [1100, 660],
      worldSize: [0.82, 0.49],
    },
  },
}

export const FURNITURE_IDS = Object.keys(FURNITURE) as FeatureId[]

export const IDLE_POSE: FocusPose = {
  position: [3.2, 2.3, 2.8],
  target: [0, 1.05, -1.1],
}
