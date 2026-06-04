import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3 } from 'three'
import { FURNITURE, IDLE_POSE } from './config/furnitureRegistry'
import { useFocusStore } from './interaction/useFocusStore'

export default function CameraRig() {
  const focusedId = useFocusStore((s) => s.focusedId)
  const unfocus = useFocusStore((s) => s.unfocus)

  const goalPos = useMemo(() => new Vector3(), [])
  const goalLook = useMemo(() => new Vector3(), [])
  const currentLook = useMemo(
    () => new Vector3(IDLE_POSE.target[0], IDLE_POSE.target[1], IDLE_POSE.target[2]),
    [],
  )

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') unfocus()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [unfocus])

  useFrame(({ camera }, delta) => {
    const pose = focusedId ? FURNITURE[focusedId].focusPose : IDLE_POSE
    goalPos.set(pose.position[0], pose.position[1], pose.position[2])
    goalLook.set(pose.target[0], pose.target[1], pose.target[2])
    const speed = focusedId ? 5.5 : 4.0
    const t = 1 - Math.exp(-speed * delta)
    camera.position.lerp(goalPos, t)
    currentLook.lerp(goalLook, t)
    camera.lookAt(currentLook)
  })

  return null
}
