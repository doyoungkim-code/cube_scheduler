import { create } from 'zustand'
import type { FeatureId } from '../config/furnitureRegistry'

interface FocusState {
  hoveredId: FeatureId | null
  focusedId: FeatureId | null
  setHovered: (id: FeatureId | null) => void
  focus: (id: FeatureId) => void
  unfocus: () => void
}

export const useFocusStore = create<FocusState>((set) => ({
  hoveredId: null,
  focusedId: null,
  setHovered: (id) => set({ hoveredId: id }),
  focus: (id) => set({ focusedId: id, hoveredId: null }),
  unfocus: () => set({ focusedId: null }),
}))
