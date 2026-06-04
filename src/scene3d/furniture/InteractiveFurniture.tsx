import { useRef, type ReactNode } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import type { Group } from 'three'
import { useFocusStore } from '../interaction/useFocusStore'
import type { FeatureId } from '../config/furnitureRegistry'

interface Props {
  id: FeatureId
  children: ReactNode
  /** Kept for API compatibility — now ignored, hover is cursor+tooltip only. */
  hoverLift?: number
}

export default function InteractiveFurniture({ id, children }: Props) {
  const groupRef = useRef<Group>(null)
  const hoverRef = useRef(false)

  const setHovered = useFocusStore((s) => s.setHovered)
  const focus = useFocusStore((s) => s.focus)

  // No-op animation: we intentionally do not move/scale the group on hover.
  // Visual feedback is provided by the cursor change and the tooltip.
  useFrame(() => {
    if (!groupRef.current) return
    if (groupRef.current.position.y !== 0) groupRef.current.position.y = 0
    if (groupRef.current.scale.x !== 1) groupRef.current.scale.setScalar(1)
  })

  const onPointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    if (useFocusStore.getState().focusedId !== null) return
    hoverRef.current = true
    setHovered(id)
    document.body.style.cursor = 'pointer'
  }
  const onPointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    hoverRef.current = false
    setHovered(null)
    document.body.style.cursor = 'auto'
  }
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    if (useFocusStore.getState().focusedId !== null) return
    hoverRef.current = false
    setHovered(null)
    focus(id)
    document.body.style.cursor = 'auto'
  }

  return (
    <group
      ref={groupRef}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      onClick={onClick}
    >
      {children}
    </group>
  )
}
