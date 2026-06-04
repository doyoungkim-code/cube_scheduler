import { Html } from '@react-three/drei'
import { FURNITURE } from '../config/furnitureRegistry'
import { useFocusStore } from './useFocusStore'

export default function HoverTooltip() {
  const hoveredId = useFocusStore((s) => s.hoveredId)
  const focusedId = useFocusStore((s) => s.focusedId)

  if (!hoveredId || focusedId) return null
  const meta = FURNITURE[hoveredId]
  const [px, py, pz] = meta.focusPose.target

  return (
    <Html
      position={[px, py + 0.35, pz]}
      center
      distanceFactor={6}
      zIndexRange={[100, 0]}
      style={{ pointerEvents: 'none' }}
    >
      <div
        style={{
          background: 'rgba(20, 14, 8, 0.88)',
          color: '#f3e5c9',
          padding: '6px 12px',
          borderRadius: 8,
          border: '1px solid rgba(240, 210, 150, 0.35)',
          fontFamily: 'system-ui, sans-serif',
          fontSize: 13,
          whiteSpace: 'nowrap',
          boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
          textAlign: 'center',
          lineHeight: 1.3,
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 2 }}>{meta.label}</div>
        <div style={{ opacity: 0.7, fontSize: 11 }}>{meta.tooltip}</div>
      </div>
    </Html>
  )
}
