import InteractiveFurniture from './InteractiveFurniture'

const X = 0.75
const Y = 0.756
const Z = -0.95
const W = 0.44
const D = 0.32

const COVER = '#5a2018'
const PAGE = '#f5ecd7'

export default function Notebook() {
  return (
    <InteractiveFurniture id="quick-memo" hoverLift={0.002}>
      <group position={[X, Y, Z]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[W, 0.012, D]} />
          <meshStandardMaterial color={COVER} roughness={0.65} />
        </mesh>
        <mesh position={[0, 0.008, 0]}>
          <planeGeometry args={[W - 0.02, D - 0.02]} />
          <meshStandardMaterial color={PAGE} roughness={0.95} />
        </mesh>
        <mesh position={[0, 0.007, 0]}>
          <boxGeometry args={[0.005, 0.001, D - 0.02]} />
          <meshStandardMaterial color="#2a1410" roughness={0.8} />
        </mesh>
      </group>
    </InteractiveFurniture>
  )
}
