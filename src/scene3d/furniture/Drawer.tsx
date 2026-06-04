import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import InteractiveFurniture from './InteractiveFurniture'
import { useFocusStore } from '../interaction/useFocusStore'

// Desk top panel bottom face is at y ~= 0.7 (desk top thickness 0.05, top at 0.75).
// Drawer height 0.22 → drawer top at y=0.69 (just under desk underside), center y=0.58.
const X = 0.75
const Y = 0.58
const Z = -0.55
const W = 0.5
const H = 0.22
const DEPTH = 0.34

const WOOD = '#5a3218'
const HANDLE = '#c9b280'

export default function Drawer() {
  const drawerRef = useRef<Group>(null)
  const focusedId = useFocusStore((s) => s.focusedId)

  useFrame((_, delta) => {
    if (!drawerRef.current) return
    const targetZ = focusedId === 'settings' ? 0.22 : 0
    const cur = drawerRef.current.position.z
    const next = cur + (targetZ - cur) * Math.min(1, delta * 5)
    drawerRef.current.position.z = next
  })

  return (
    <InteractiveFurniture id="settings" hoverLift={0}>
      <group position={[X, Y, Z]}>
        {/* drawer body — slides out toward viewer */}
        <group ref={drawerRef}>
          {/* body */}
          <mesh castShadow receiveShadow position={[0, 0, -DEPTH / 2]}>
            <boxGeometry args={[W, H, DEPTH]} />
            <meshStandardMaterial color={WOOD} roughness={0.55} />
          </mesh>
          {/* front face trim */}
          <mesh castShadow position={[0, 0, 0.008]}>
            <boxGeometry args={[W + 0.02, H + 0.02, 0.02]} />
            <meshStandardMaterial color="#6c3c1f" roughness={0.5} />
          </mesh>
          {/* handle bar */}
          <mesh castShadow position={[0, 0, 0.035]}>
            <boxGeometry args={[0.18, 0.022, 0.03]} />
            <meshStandardMaterial color={HANDLE} roughness={0.3} metalness={0.7} />
          </mesh>
          {/* handle supports */}
          {[-0.07, 0.07].map((x, i) => (
            <mesh key={i} castShadow position={[x, 0, 0.025]}>
              <boxGeometry args={[0.014, 0.014, 0.02]} />
              <meshStandardMaterial color={HANDLE} roughness={0.3} metalness={0.7} />
            </mesh>
          ))}
        </group>
      </group>
    </InteractiveFurniture>
  )
}
