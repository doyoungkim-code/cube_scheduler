import { Suspense, useEffect, useMemo, Component, type ReactNode } from 'react'
import { useGLTF, useAnimations } from '@react-three/drei'
import { Box3, Vector3 } from 'three'
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import type { Group, AnimationClip } from 'three'

interface ModelEntry {
  key: string
  url: string
  position: [number, number, number]
  rotation?: [number, number, number]
  maxSize?: number
  scale?: number | [number, number, number]
  snapToFloor?: boolean
  castShadow?: boolean
  receiveShadow?: boolean
  animated?: boolean
  animation?: string
}

/**
 * Drop CC0 / free GLB files into public/models/, then register them here.
 * Free sources:
 *   https://poly.pizza/        (search: cat, character, book)
 *   https://quaternius.com/    (animal/character packs)
 *   https://kenney.nl/assets   (furniture & character packs)
 *   https://sketchfab.com/     (filter by CC0)
 */
const MODELS: ModelEntry[] = [
  {
    key: 'cat',
    url: './models/cat.glb',
    position: [0.7, 0, 0.35],
    rotation: [0, -Math.PI / 4, 0],
    maxSize: 0.35,
    snapToFloor: true,
  },
]

// Simple error boundary so one failing model does not take down the others.
class ModelErrorBoundary extends Component<
  { name: string; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(err: unknown) {
    // eslint-disable-next-line no-console
    console.error(`[Characters] failed to render "${this.props.name}":`, err)
  }
  render() {
    if (this.state.hasError) return null
    return this.props.children
  }
}

function StaticModel({ entry }: { entry: ModelEntry }) {
  const gltf = useGLTF(entry.url) as unknown as { scene: Group }

  const { scene, finalY } = useMemo(() => {
    const cloned = gltf.scene.clone(true)
    cloned.traverse((o: any) => {
      if (o.isMesh) {
        o.castShadow = entry.castShadow ?? true
        o.receiveShadow = entry.receiveShadow ?? true
      }
    })

    if (entry.maxSize !== undefined) {
      const box = new Box3().setFromObject(cloned)
      const size = box.getSize(new Vector3())
      const maxDim = Math.max(size.x, size.y, size.z) || 1
      cloned.scale.setScalar(entry.maxSize / maxDim)
    } else if (entry.scale !== undefined) {
      if (typeof entry.scale === 'number') cloned.scale.setScalar(entry.scale)
      else cloned.scale.set(entry.scale[0], entry.scale[1], entry.scale[2])
    }

    let yOffset = 0
    if (entry.snapToFloor !== false) {
      const box = new Box3().setFromObject(cloned)
      yOffset = -box.min.y
    }
    return { scene: cloned, finalY: entry.position[1] + yOffset }
  }, [gltf.scene, entry])

  return (
    <primitive
      object={scene}
      position={[entry.position[0], finalY, entry.position[2]]}
      rotation={entry.rotation ?? [0, 0, 0]}
    />
  )
}

function AnimatedModel({ entry }: { entry: ModelEntry }) {
  const gltf = useGLTF(entry.url) as unknown as { scene: Group; animations: AnimationClip[] }

  // Use SkeletonUtils.clone to properly duplicate skinned meshes + skeleton.
  // Without this, scaling and animating the cached shared scene can cause
  // repeated compounding scale resets on remount.
  const { scene, finalY } = useMemo(() => {
    const cloned = skeletonClone(gltf.scene) as Group
    cloned.traverse((o: any) => {
      if (o.isMesh) {
        o.castShadow = entry.castShadow ?? true
        o.receiveShadow = entry.receiveShadow ?? true
        o.frustumCulled = false // skinned-mesh bounds do not cover animated pose
      }
    })

    if (entry.maxSize !== undefined) {
      const box = new Box3().setFromObject(cloned)
      const size = box.getSize(new Vector3())
      const maxDim = Math.max(size.x, size.y, size.z) || 1
      cloned.scale.setScalar(entry.maxSize / maxDim)
    } else if (entry.scale !== undefined) {
      if (typeof entry.scale === 'number') cloned.scale.setScalar(entry.scale)
      else cloned.scale.set(entry.scale[0], entry.scale[1], entry.scale[2])
    }

    let yOff = 0
    if (entry.snapToFloor !== false) {
      const box = new Box3().setFromObject(cloned)
      yOff = -box.min.y
    }
    return { scene: cloned, finalY: entry.position[1] + yOff }
  }, [gltf.scene, entry])

  const { actions, names } = useAnimations(gltf.animations, scene)

  useEffect(() => {
    const name = entry.animation ?? names[0]
    if (!name) return
    const action = actions[name]
    if (!action) return
    action.reset().fadeIn(0.4).play()
    return () => {
      action.fadeOut(0.2)
    }
  }, [actions, names, entry.animation])

  return (
    <primitive
      object={scene}
      position={[entry.position[0], finalY, entry.position[2]]}
      rotation={entry.rotation ?? [0, 0, 0]}
    />
  )
}

export default function Characters() {
  if (MODELS.length === 0) return null
  return (
    <>
      {MODELS.map((m) => (
        <ModelErrorBoundary key={m.key} name={m.key}>
          <Suspense fallback={null}>
            {m.animated ? <AnimatedModel entry={m} /> : <StaticModel entry={m} />}
          </Suspense>
        </ModelErrorBoundary>
      ))}
    </>
  )
}

// Preload registered models
MODELS.forEach((m) => {
  try {
    useGLTF.preload(m.url)
  } catch {
    /* non-fatal */
  }
})
