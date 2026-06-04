const WALL_X = -3.5
const CY = 1.75
const CZ = -0.7
const W = 1.9
const H = 1.4
const FRAME = 0.06

const FRAME_COLOR = '#2a1810'
const SKY = '#a9ceea'

export default function Window() {
  return (
    <group position={[WALL_X + 0.02, CY, CZ]} rotation={[0, Math.PI / 2, 0]}>
      <mesh receiveShadow>
        <planeGeometry args={[W, H]} />
        <meshStandardMaterial
          color={SKY}
          emissive={SKY}
          emissiveIntensity={0.65}
          roughness={0.1}
          metalness={0}
        />
      </mesh>

      <mesh position={[-W / 2 + FRAME / 2, 0, 0.005]}>
        <boxGeometry args={[FRAME, H + FRAME * 1.5, 0.04]} />
        <meshStandardMaterial color={FRAME_COLOR} roughness={0.7} />
      </mesh>
      <mesh position={[W / 2 - FRAME / 2, 0, 0.005]}>
        <boxGeometry args={[FRAME, H + FRAME * 1.5, 0.04]} />
        <meshStandardMaterial color={FRAME_COLOR} roughness={0.7} />
      </mesh>
      <mesh position={[0, -H / 2 + FRAME / 2, 0.005]}>
        <boxGeometry args={[W, FRAME, 0.04]} />
        <meshStandardMaterial color={FRAME_COLOR} roughness={0.7} />
      </mesh>
      <mesh position={[0, H / 2 - FRAME / 2, 0.005]}>
        <boxGeometry args={[W, FRAME, 0.04]} />
        <meshStandardMaterial color={FRAME_COLOR} roughness={0.7} />
      </mesh>

      <mesh position={[0, 0, 0.008]}>
        <boxGeometry args={[0.03, H - FRAME * 2, 0.02]} />
        <meshStandardMaterial color={FRAME_COLOR} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0, 0.008]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.03, W - FRAME * 2, 0.02]} />
        <meshStandardMaterial color={FRAME_COLOR} roughness={0.7} />
      </mesh>
    </group>
  )
}
