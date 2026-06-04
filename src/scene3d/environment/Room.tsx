const ROOM = {
  width: 7,
  depth: 6,
  height: 3.2,
}

const COLORS = {
  floor: '#8a6742',
  wall: '#d9cdb8',
  wallBack: '#cfc2ac',
  ceiling: '#ede6d8',
  trim: '#3e2a18',
}

export default function Room() {
  const { width, depth, height } = ROOM
  const halfW = width / 2
  const halfD = depth / 2

  return (
    <group>
      <mesh receiveShadow position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color={COLORS.floor} roughness={0.85} />
      </mesh>

      <mesh receiveShadow position={[0, height, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color={COLORS.ceiling} roughness={0.95} />
      </mesh>

      <mesh receiveShadow position={[0, height / 2, -halfD]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color={COLORS.wallBack} roughness={0.92} />
      </mesh>

      <mesh receiveShadow position={[-halfW, height / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[depth, height]} />
        <meshStandardMaterial color={COLORS.wall} roughness={0.92} />
      </mesh>

      <mesh receiveShadow position={[halfW, height / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[depth, height]} />
        <meshStandardMaterial color={COLORS.wall} roughness={0.92} />
      </mesh>

      <mesh position={[0, 0.05, -halfD + 0.02]} castShadow>
        <boxGeometry args={[width, 0.1, 0.04]} />
        <meshStandardMaterial color={COLORS.trim} roughness={0.7} />
      </mesh>
      <mesh position={[-halfW + 0.02, 0.05, 0]} castShadow>
        <boxGeometry args={[0.04, 0.1, depth]} />
        <meshStandardMaterial color={COLORS.trim} roughness={0.7} />
      </mesh>
      <mesh position={[halfW - 0.02, 0.05, 0]} castShadow>
        <boxGeometry args={[0.04, 0.1, depth]} />
        <meshStandardMaterial color={COLORS.trim} roughness={0.7} />
      </mesh>
    </group>
  )
}

export { ROOM }
