import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Loader, Preload } from '@react-three/drei'
import { ACESFilmicToneMapping, PCFSoftShadowMap } from 'three'
import Stage from './Stage'
import CameraRig from './CameraRig'
import Effects from './postprocessing/Effects'
import FocusOverlay from './interaction/FocusOverlay'
import { IDLE_POSE } from './config/furnitureRegistry'

export default function SceneRoot() {
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: '#050302' }}>
        <Canvas
          shadows={{ type: PCFSoftShadowMap }}
          dpr={[1, 1.5]}
          camera={{ position: IDLE_POSE.position, fov: 52, near: 0.1, far: 100 }}
          gl={{
            antialias: true,
            toneMapping: ACESFilmicToneMapping,
            toneMappingExposure: 1.05,
            powerPreference: 'high-performance',
          }}
          performance={{ min: 0.5 }}
        >
          <Suspense fallback={null}>
            <Stage />
            <Preload all />
          </Suspense>
          <CameraRig />
          <Effects />
        </Canvas>
        <Loader />
      </div>
      {/* Invisible top bar that Electron treats as a draggable region */}
      <div className="window-drag-bar" />
      <FocusOverlay />
    </>
  )
}
