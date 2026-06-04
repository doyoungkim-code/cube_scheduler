const SEAT_W = 0.55
const SEAT_D = 0.52
const SEAT_H = 0.04
const SEAT_Y = 0.48
const LEG = 0.04

const FABRIC = '#2a1d14'
const METAL = '#1b1b1b'

export default function Chair() {
  const cx = 0
  const cz = -0.1

  return (
    <group>
      <mesh castShadow receiveShadow position={[cx, SEAT_Y, cz]}>
        <boxGeometry args={[SEAT_W, SEAT_H, SEAT_D]} />
        <meshStandardMaterial color={FABRIC} roughness={0.95} />
      </mesh>

      <mesh castShadow position={[cx, SEAT_Y + 0.38, cz + SEAT_D / 2 - 0.03]}>
        <boxGeometry args={[SEAT_W * 0.92, 0.7, 0.06]} />
        <meshStandardMaterial color={FABRIC} roughness={0.95} />
      </mesh>

      {[
        [-SEAT_W / 2 + LEG, cz - SEAT_D / 2 + LEG],
        [SEAT_W / 2 - LEG, cz - SEAT_D / 2 + LEG],
        [-SEAT_W / 2 + LEG, cz + SEAT_D / 2 - LEG],
        [SEAT_W / 2 - LEG, cz + SEAT_D / 2 - LEG],
      ].map(([x, z], i) => (
        <mesh key={i} castShadow position={[x, SEAT_Y / 2, z]}>
          <cylinderGeometry args={[LEG / 2, LEG / 2, SEAT_Y, 12]} />
          <meshStandardMaterial color={METAL} roughness={0.4} metalness={0.6} />
        </mesh>
      ))}
    </group>
  )
}
