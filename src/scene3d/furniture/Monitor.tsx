import InteractiveFurniture from './InteractiveFurniture'
import { useFocusStore } from '../interaction/useFocusStore'

const SCREEN_W = 0.9
const SCREEN_H = 0.52
const BEZEL = 0.028
const BODY_D = 0.05

const BODY_Y = 1.18
const BODY_Z = -1.12

const BODY_W = SCREEN_W + BEZEL * 2
const BODY_H = SCREEN_H + BEZEL * 2
const BODY_BACK_Z = BODY_Z - BODY_D / 2
const SCREEN_Z = BODY_Z + BODY_D / 2 + 0.002

const DESK_TOP = 0.75

const BASE_Z = -1.17
const BASE_R = 0.12
const BASE_H = 0.018
const BASE_TOP_Y = DESK_TOP + BASE_H

const POLE_R = 0.022
const POLE_Y = (BASE_TOP_Y + BODY_Y) / 2
const POLE_H = BODY_Y - BASE_TOP_Y

const ARM_LEN = BODY_BACK_Z - BASE_Z
const ARM_Z = (BASE_Z + BODY_BACK_Z) / 2

const FRAME = '#111115'
const STAND = '#1e1e22'

export default function Monitor() {
  const focusedId = useFocusStore((s) => s.focusedId)
  const isFocused = focusedId === 'scheduler' || focusedId === 'today-dashboard'

  return (
    <InteractiveFurniture id="scheduler">
      <group>
        <mesh castShadow receiveShadow position={[0, DESK_TOP + BASE_H / 2, BASE_Z]}>
          <cylinderGeometry args={[BASE_R, BASE_R * 1.15, BASE_H, 28]} />
          <meshStandardMaterial color={STAND} roughness={0.4} metalness={0.55} />
        </mesh>

        <mesh castShadow position={[0, POLE_Y, BASE_Z]}>
          <cylinderGeometry args={[POLE_R, POLE_R * 1.15, POLE_H, 18]} />
          <meshStandardMaterial color={STAND} roughness={0.5} metalness={0.45} />
        </mesh>

        <mesh castShadow position={[0, BODY_Y, ARM_Z]}>
          <boxGeometry args={[0.06, 0.08, Math.max(0.04, ARM_LEN)]} />
          <meshStandardMaterial color={STAND} roughness={0.5} metalness={0.45} />
        </mesh>

        <mesh castShadow receiveShadow position={[0, BODY_Y, BODY_Z]}>
          <boxGeometry args={[BODY_W, BODY_H, BODY_D]} />
          <meshStandardMaterial color={FRAME} roughness={0.35} metalness={0.35} />
        </mesh>

        <mesh position={[0, BODY_Y, SCREEN_Z]}>
          <planeGeometry args={[SCREEN_W, SCREEN_H]} />
          <meshStandardMaterial
            color={isFocused ? '#0b2238' : '#111a26'}
            emissive="#3a78c0"
            emissiveIntensity={isFocused ? 0.95 : 0.55}
            roughness={0.22}
            metalness={0.1}
          />
        </mesh>
      </group>
    </InteractiveFurniture>
  )
}
