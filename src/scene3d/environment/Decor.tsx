import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'

const BOOK_COLORS = ['#8c3a2e', '#2f4e7a', '#3d6a47', '#6b4a7a', '#c48b36', '#2c3e4c', '#a04638', '#4b6f88']

function Bookshelf() {
  const books = useMemo(() => {
    const arr: { w: number; h: number; color: string; x: number }[] = []
    let x = -0.54
    let i = 0
    while (x < 0.54) {
      const w = 0.04 + Math.random() * 0.025
      const h = 0.24 + Math.random() * 0.1
      arr.push({ w, h, color: BOOK_COLORS[i % BOOK_COLORS.length], x: x + w / 2 })
      x += w + 0.004
      i++
    }
    return arr
  }, [])

  const cabW = 1.2
  const cabH = 2.1
  const cabD = 0.32
  const SIDE = 0.03
  const shelves = [0.04, 0.48, 0.92, 1.36, 1.80]
  const bookDepth = 0.2

  const WOOD = '#3a2412'
  const WOOD_TRIM = '#2a1808'

  return (
    <group position={[-2.6, 0, -2.84]}>
      {/* back panel */}
      <mesh castShadow receiveShadow position={[0, cabH / 2, -cabD / 2 + SIDE / 2]}>
        <boxGeometry args={[cabW, cabH, SIDE]} />
        <meshStandardMaterial color={WOOD_TRIM} roughness={0.8} />
      </mesh>
      {/* sides */}
      <mesh castShadow receiveShadow position={[-cabW / 2 + SIDE / 2, cabH / 2, 0]}>
        <boxGeometry args={[SIDE, cabH, cabD]} />
        <meshStandardMaterial color={WOOD} roughness={0.7} />
      </mesh>
      <mesh castShadow receiveShadow position={[cabW / 2 - SIDE / 2, cabH / 2, 0]}>
        <boxGeometry args={[SIDE, cabH, cabD]} />
        <meshStandardMaterial color={WOOD} roughness={0.7} />
      </mesh>
      {/* top cap */}
      <mesh castShadow position={[0, cabH - SIDE / 2, 0]}>
        <boxGeometry args={[cabW, SIDE, cabD]} />
        <meshStandardMaterial color={WOOD} roughness={0.7} />
      </mesh>

      {/* shelves + books */}
      {shelves.map((y, si) => (
        <group key={si}>
          <mesh castShadow receiveShadow position={[0, y, 0]}>
            <boxGeometry args={[cabW - SIDE * 2, SIDE, cabD - SIDE]} />
            <meshStandardMaterial color={WOOD} roughness={0.7} />
          </mesh>
          {si < shelves.length - 1 && (
            <group position={[0, y + SIDE / 2, cabD / 2 - bookDepth / 2 - 0.01]}>
              {books.map((b, bi) => (
                <mesh key={bi} castShadow position={[b.x, b.h / 2, 0]}>
                  <boxGeometry args={[b.w, b.h, bookDepth]} />
                  <meshStandardMaterial color={b.color} roughness={0.75} />
                </mesh>
              ))}
            </group>
          )}
        </group>
      ))}
    </group>
  )
}

function Plant() {
  return (
    <group position={[-2.9, 0, 0.8]}>
      <mesh castShadow receiveShadow position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.17, 0.13, 0.44, 24]} />
        <meshStandardMaterial color="#4a6a3b" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.44, 0]}>
        <cylinderGeometry args={[0.17, 0.17, 0.02, 24]} />
        <meshStandardMaterial color="#2d1a0a" roughness={1} />
      </mesh>
      <mesh castShadow position={[0, 0.85, 0]}>
        <sphereGeometry args={[0.34, 18, 14]} />
        <meshStandardMaterial color="#5a8a3c" roughness={0.95} />
      </mesh>
      <mesh castShadow position={[0.12, 0.68, 0.1]}>
        <sphereGeometry args={[0.22, 14, 12]} />
        <meshStandardMaterial color="#4c7a32" roughness={0.95} />
      </mesh>
      <mesh castShadow position={[-0.13, 0.7, -0.05]}>
        <sphereGeometry args={[0.2, 14, 12]} />
        <meshStandardMaterial color="#6a9c48" roughness={0.95} />
      </mesh>
    </group>
  )
}

function Rug() {
  return (
    <mesh receiveShadow position={[0, 0.005, 0.3]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[3.2, 2.2]} />
      <meshStandardMaterial color="#6d3a2a" roughness={1} />
    </mesh>
  )
}

function WallClock() {
  const hourRef = useRef<Group>(null)
  const minRef = useRef<Group>(null)
  const secRef = useRef<Group>(null)

  useFrame(() => {
    const now = new Date()
    const sec = now.getSeconds() + now.getMilliseconds() / 1000
    const min = now.getMinutes() + sec / 60
    const hr = (now.getHours() % 12) + min / 60
    if (secRef.current) secRef.current.rotation.z = -sec * (Math.PI / 30)
    if (minRef.current) minRef.current.rotation.z = -min * (Math.PI / 30)
    if (hourRef.current) hourRef.current.rotation.z = -hr * (Math.PI / 6)
  })

  return (
    <group position={[-1.35, 2.55, -2.96]}>
      {/* body disc (flat face pointing at +z) */}
      <mesh castShadow receiveShadow rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.035, 48]} />
        <meshStandardMaterial color="#f5ecd4" roughness={0.6} />
      </mesh>
      {/* rim ring */}
      <mesh position={[0, 0, 0.019]}>
        <ringGeometry args={[0.2, 0.22, 48]} />
        <meshStandardMaterial color="#2a1a0a" roughness={0.5} />
      </mesh>
      {/* 12 tick marks */}
      {Array.from({ length: 12 }, (_, i) => {
        const a = -(i * Math.PI) / 6 + Math.PI / 2
        const isCardinal = i % 3 === 0
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 0.17, Math.sin(a) * 0.17, 0.02]}
            rotation={[0, 0, -a + Math.PI / 2]}
          >
            <boxGeometry args={[isCardinal ? 0.018 : 0.01, isCardinal ? 0.038 : 0.022, 0.003]} />
            <meshStandardMaterial color="#2a1a0a" />
          </mesh>
        )
      })}
      {/* hour hand */}
      <group ref={hourRef} position={[0, 0, 0.023]}>
        <mesh position={[0, 0.05, 0]}>
          <boxGeometry args={[0.012, 0.1, 0.004]} />
          <meshStandardMaterial color="#1a0e05" />
        </mesh>
      </group>
      {/* minute hand */}
      <group ref={minRef} position={[0, 0, 0.025]}>
        <mesh position={[0, 0.075, 0]}>
          <boxGeometry args={[0.008, 0.15, 0.004]} />
          <meshStandardMaterial color="#1a0e05" />
        </mesh>
      </group>
      {/* second hand */}
      <group ref={secRef} position={[0, 0, 0.027]}>
        <mesh position={[0, 0.08, 0]}>
          <boxGeometry args={[0.004, 0.17, 0.002]} />
          <meshStandardMaterial color="#a0392a" emissive="#a0392a" emissiveIntensity={0.25} />
        </mesh>
      </group>
      {/* center cap */}
      <mesh position={[0, 0, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.012, 20]} />
        <meshStandardMaterial color="#1a0e05" />
      </mesh>
    </group>
  )
}

function DeskLamp() {
  return (
    <group position={[-0.75, 0.751, -1.2]}>
      {/* base disc — just above desk top */}
      <mesh castShadow receiveShadow position={[0, 0.012, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.024, 24]} />
        <meshStandardMaterial color="#2a1a0c" roughness={0.4} metalness={0.5} />
      </mesh>
      {/* post */}
      <mesh castShadow position={[0, 0.19, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.34, 12]} />
        <meshStandardMaterial color="#3a2410" roughness={0.5} metalness={0.4} />
      </mesh>
      {/* shade */}
      <mesh castShadow position={[0.11, 0.37, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <coneGeometry args={[0.09, 0.13, 24, 1, true]} />
        <meshStandardMaterial
          color="#e0b060"
          roughness={0.45}
          emissive="#ffa94a"
          emissiveIntensity={0.6}
          side={2}
        />
      </mesh>
      <pointLight position={[0.13, 0.33, 0]} intensity={0.55} color="#ffb070" distance={2.2} decay={2} />
    </group>
  )
}

function Mug() {
  // desk top at y=0.75; mug bottom sits on it
  return (
    <group position={[-0.5, 0.75, -0.9]}>
      {/* body */}
      <mesh castShadow receiveShadow position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.045, 0.04, 0.08, 24]} />
        <meshStandardMaterial color="#dcd5c4" roughness={0.5} />
      </mesh>
      {/* coffee surface */}
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.042, 0.042, 0.002, 24]} />
        <meshStandardMaterial color="#3b2414" roughness={0.7} />
      </mesh>
      {/* handle */}
      <mesh position={[0.058, 0.04, 0]} rotation={[Math.PI / 2, 0, -Math.PI / 2]}>
        <torusGeometry args={[0.024, 0.006, 10, 20, Math.PI]} />
        <meshStandardMaterial color="#dcd5c4" roughness={0.5} />
      </mesh>
    </group>
  )
}

export default function Decor() {
  return (
    <>
      <Rug />
      <Bookshelf />
      <Plant />
      <WallClock />
      <DeskLamp />
      <Mug />
    </>
  )
}
