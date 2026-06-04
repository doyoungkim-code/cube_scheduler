import {
  EffectComposer,
  Bloom,
  Vignette,
  SMAA,
  SSAO,
  BrightnessContrast,
  HueSaturation,
} from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { useFocusStore } from '../interaction/useFocusStore'

export default function Effects() {
  const focusedId = useFocusStore((s) => s.focusedId)
  const focused = focusedId !== null

  return (
    <EffectComposer multisampling={0} enableNormalPass>
      <SMAA />
      <SSAO
        blendFunction={BlendFunction.MULTIPLY}
        samples={12}
        radius={0.05}
        intensity={15}
        luminanceInfluence={0.55}
        color="#000000"
        worldDistanceThreshold={1}
        worldDistanceFalloff={0.5}
        worldProximityThreshold={0.1}
        worldProximityFalloff={0.1}
      />
      <Bloom
        intensity={focused ? 0.42 : 0.32}
        luminanceThreshold={0.88}
        luminanceSmoothing={0.25}
        mipmapBlur
      />
      <BrightnessContrast brightness={0.01} contrast={0.08} />
      <HueSaturation hue={0} saturation={0.06} />
      <Vignette offset={0.3} darkness={0.5} />
    </EffectComposer>
  )
}
