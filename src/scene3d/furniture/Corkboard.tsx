import InteractiveFurniture from './InteractiveFurniture'

const W = 1.0
const H = 1.2
const X = 3.45
const Y = 1.8
const Z = -0.6
const FRAME = 0.04

const WOOD_FRAME = '#3d2718'
const CORK = '#c8995c'
const PAPER = '#f5ecd8'

export default function Corkboard() {
  return (
    <InteractiveFurniture id="habit-tracker">
      <group position={[X, Y, Z]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh castShadow receiveShadow position={[0, 0, -0.01]}>
          <boxGeometry args={[W + FRAME * 2, H + FRAME * 2, 0.04]} />
          <meshStandardMaterial color={WOOD_FRAME} roughness={0.7} />
        </mesh>

        <mesh position={[0, 0, 0.012]}>
          <planeGeometry args={[W, H]} />
          <meshStandardMaterial color={CORK} roughness={1} />
        </mesh>

        {[
          { x: -0.2, y: 0.3, r: 0.02 },
          { x: 0.15, y: 0.35, r: -0.04 },
          { x: -0.05, y: -0.1, r: 0.015 },
        ].map((p, i) => (
          <group key={i} position={[p.x, p.y, 0.013]} rotation={[0, 0, p.r]}>
            <mesh>
              <planeGeometry args={[0.28, 0.34]} />
              <meshStandardMaterial color={PAPER} roughness={0.9} />
            </mesh>
            <mesh position={[0.1, 0.14, 0.01]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.011, 0.011, 0.022, 14]} />
              <meshStandardMaterial color="#c23b2f" roughness={0.3} metalness={0.45} />
            </mesh>
            <mesh position={[0.1, 0.14, 0.022]}>
              <sphereGeometry args={[0.016, 16, 12]} />
              <meshStandardMaterial color="#e24a3e" roughness={0.25} metalness={0.5} />
            </mesh>
          </group>
        ))}
      </group>
    </InteractiveFurniture>
  )
}
