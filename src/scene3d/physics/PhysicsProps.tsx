import { useRef } from 'react'
import { RigidBody, CuboidCollider, type RapierRigidBody } from '@react-three/rapier'
import type { ThreeEvent } from '@react-three/fiber'

const DICE_COLOR = '#f0e4cc'

function Dice({ position, color }: { position: [number, number, number]; color: string }) {
  const bodyRef = useRef<RapierRigidBody>(null)

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    const body = bodyRef.current
    if (!body) return
    body.applyImpulse({ x: (Math.random() - 0.5) * 0.15, y: 0.12, z: (Math.random() - 0.5) * 0.15 }, true)
    body.applyTorqueImpulse(
      { x: (Math.random() - 0.5) * 0.008, y: (Math.random() - 0.5) * 0.008, z: (Math.random() - 0.5) * 0.008 },
      true,
    )
  }

  return (
    <RigidBody
      ref={bodyRef}
      position={position}
      colliders="cuboid"
      restitution={0.35}
      friction={0.7}
      mass={0.12}
      linearDamping={0.25}
      angularDamping={0.35}
    >
      <mesh castShadow receiveShadow onClick={onClick}>
        <boxGeometry args={[0.06, 0.06, 0.06]} />
        <meshStandardMaterial color={color} roughness={0.55} />
      </mesh>
    </RigidBody>
  )
}

export default function PhysicsProps() {
  return (
    <>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[3.5, 0.02, 3]} position={[0, 0, 0]} />
        <CuboidCollider args={[1.0, 0.03, 0.45]} position={[0, 0.735, -1.0]} />
        <CuboidCollider args={[3.5, 1.6, 0.05]} position={[0, 1.6, -3.0]} />
        <CuboidCollider args={[0.05, 1.6, 3]} position={[-3.5, 1.6, 0]} />
        <CuboidCollider args={[0.05, 1.6, 3]} position={[3.5, 1.6, 0]} />
      </RigidBody>

      <Dice position={[-0.25, 0.9, -0.75]} color={DICE_COLOR} />
      <Dice position={[-0.18, 1.05, -0.72]} color="#e6a860" />
    </>
  )
}
