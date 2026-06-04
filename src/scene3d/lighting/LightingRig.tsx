import { useEffect } from 'react'
import { Environment, SoftShadows, ContactShadows } from '@react-three/drei'
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js'

export default function LightingRig() {
  useEffect(() => {
    RectAreaLightUniformsLib.init()
  }, [])

  return (
    <>
      <Environment preset="apartment" background={false} environmentIntensity={0.5} />
      <SoftShadows size={18} samples={10} focus={0.9} />

      {/* subtle soft contact shadow across the whole floor */}
      <ContactShadows
        position={[0, 0.003, 0]}
        opacity={0.5}
        scale={10}
        blur={2.4}
        far={4}
        resolution={512}
        frames={1}
      />

      <ambientLight intensity={0.22} color="#fff2dc" />

      {/* warm sun through the window — tight shadow frustum fit to room */}
      <directionalLight
        position={[-5.2, 5.6, 1.8]}
        intensity={2.5}
        color="#fff0cf"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-3}
        shadow-camera-near={0.5}
        shadow-camera-far={18}
        shadow-bias={-0.00014}
        shadow-normalBias={0.02}
      />

      {/* ceiling softbox fill (warm white, wide, low intensity) */}
      <rectAreaLight
        position={[0, 3.15, -0.8]}
        width={2.6}
        height={1.8}
        intensity={1.8}
        color="#fff4dc"
        rotation={[-Math.PI / 2, 0, 0]}
      />

      {/* cool window bounce — simulates sky light coming in */}
      <pointLight position={[-3.3, 1.75, -0.7]} intensity={0.5} color="#b9d5f0" distance={3.8} decay={2} />

      {/* soft back-of-room fill so the back wall isn't pitch dark */}
      <pointLight position={[0, 2.8, 2.0]} intensity={0.25} color="#fff0d8" distance={5} decay={2} />
    </>
  )
}
