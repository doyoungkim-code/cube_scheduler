import { Physics } from '@react-three/rapier'
import Room from './environment/Room'
import Window from './environment/Window'
import Decor from './environment/Decor'
import Desk from './furniture/Desk'
import Chair from './furniture/Chair'
import Monitor from './furniture/Monitor'
import Corkboard from './furniture/Corkboard'
import WallChart from './furniture/WallChart'
import Notebook from './furniture/Notebook'
import Drawer from './furniture/Drawer'
import HoverTooltip from './interaction/HoverTooltip'
import LightingRig from './lighting/LightingRig'
import PhysicsProps from './physics/PhysicsProps'
import Characters from './characters/Characters'

export default function Stage() {
  return (
    <>
      <LightingRig />
      <Room />
      <Window />
      <Decor />
      <Desk />
      <Chair />

      <Monitor />
      <Corkboard />
      <WallChart />
      <Notebook />
      <Drawer />

      <Characters />

      {import.meta.env.VITE_ENABLE_PHYSICS !== '0' && (
        <Physics gravity={[0, -9.81, 0]}>
          <PhysicsProps />
        </Physics>
      )}

      <HoverTooltip />
    </>
  )
}
