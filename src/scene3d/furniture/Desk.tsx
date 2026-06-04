const W = 2.0
const D = 0.9
const H = 0.75
const TOP_THICKNESS = 0.05
const LEG = 0.07

const WOOD = '#5e3a20'
const WOOD_DARK = '#3a2010'

export default function Desk() {
  const cx = 0
  const cz = -1.0
  const topY = H - TOP_THICKNESS / 2

  return (
    <group>
      <mesh castShadow receiveShadow position={[cx, topY, cz]}>
        <boxGeometry args={[W, TOP_THICKNESS, D]} />
        <meshStandardMaterial color={WOOD} roughness={0.55} metalness={0.05} />
      </mesh>

      {[
        [-W / 2 + LEG / 2, cz - D / 2 + LEG / 2],
        [W / 2 - LEG / 2, cz - D / 2 + LEG / 2],
        [-W / 2 + LEG / 2, cz + D / 2 - LEG / 2],
        [W / 2 - LEG / 2, cz + D / 2 - LEG / 2],
      ].map(([x, z], i) => (
        <mesh key={i} castShadow position={[x, (H - TOP_THICKNESS) / 2, z]}>
          <boxGeometry args={[LEG, H - TOP_THICKNESS, LEG]} />
          <meshStandardMaterial color={WOOD_DARK} roughness={0.6} />
        </mesh>
      ))}

      <mesh castShadow receiveShadow position={[cx, H - 0.15, cz - D / 2 + 0.02]}>
        <boxGeometry args={[W - LEG * 2, 0.12, 0.03]} />
        <meshStandardMaterial color={WOOD_DARK} roughness={0.7} />
      </mesh>
    </group>
  )
}

export const DESK_META = {
  center: [0, 0, -1.0] as [number, number, number],
  width: W,
  depth: D,
  height: H,
}
