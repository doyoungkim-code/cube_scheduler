import InteractiveFurniture from './InteractiveFurniture'

const W = 1.1
const H = 0.72
const X = 1.5
const Y = 1.85
const Z = -2.96
const FRAME = 0.035

const FRAME_COLOR = '#1d140c'
const MAT = '#e8dcc2'

// Title band occupies ~ top 0.14 of mat.
// Plot area: baseline to top of bars bounded within remaining space.
const TITLE_BAND_H = 0.14
const PLOT_TOP = H / 2 - TITLE_BAND_H            // y = 0.22
const PLOT_BOTTOM_MARGIN = 0.06                  // space below baseline for axis
const BASE_Y = -H / 2 + PLOT_BOTTOM_MARGIN       // y = -0.30
const PLOT_H = PLOT_TOP - BASE_Y                 // 0.52 usable

const BARS = [
  { frac: 0.42, color: '#c06b5a' },
  { frac: 0.62, color: '#c4a24b' },
  { frac: 0.78, color: '#6ea76b' },
  { frac: 0.48, color: '#5a82b7' },
  { frac: 0.7,  color: '#a87ac2' },
]

export default function WallChart() {
  const chartW = W - 0.18
  const slotW = chartW / BARS.length

  return (
    <InteractiveFurniture id="pattern-analysis">
      <group position={[X, Y, Z]}>
        {/* frame */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[W + FRAME * 2, H + FRAME * 2, 0.05]} />
          <meshStandardMaterial color={FRAME_COLOR} roughness={0.55} metalness={0.1} />
        </mesh>
        {/* mat */}
        <mesh position={[0, 0, 0.026]}>
          <planeGeometry args={[W, H]} />
          <meshStandardMaterial color={MAT} roughness={0.85} />
        </mesh>

        {/* title band background */}
        <mesh position={[0, H / 2 - TITLE_BAND_H / 2, 0.027]}>
          <planeGeometry args={[W - 0.04, TITLE_BAND_H - 0.02]} />
          <meshStandardMaterial color="#d8c9a8" roughness={0.9} />
        </mesh>
        {/* title text placeholder strips */}
        <mesh position={[-W / 2 + 0.16, H / 2 - TITLE_BAND_H / 2, 0.028]}>
          <planeGeometry args={[0.22, 0.022]} />
          <meshStandardMaterial color="#3a2a18" roughness={0.8} />
        </mesh>
        <mesh position={[-W / 2 + 0.22, H / 2 - TITLE_BAND_H / 2 - 0.03, 0.028]}>
          <planeGeometry args={[0.32, 0.012]} />
          <meshStandardMaterial color="#6d533c" roughness={0.85} />
        </mesh>
        {/* divider under title */}
        <mesh position={[0, H / 2 - TITLE_BAND_H + 0.005, 0.028]}>
          <boxGeometry args={[W - 0.08, 0.002, 0.001]} />
          <meshStandardMaterial color="#6d533c" roughness={0.7} />
        </mesh>

        {/* baseline */}
        <mesh position={[0, BASE_Y, 0.029]}>
          <boxGeometry args={[chartW + 0.02, 0.004, 0.002]} />
          <meshStandardMaterial color="#6d533c" roughness={0.7} />
        </mesh>

        {/* horizontal gridlines (at 25/50/75/100% of plot height) */}
        {[0.25, 0.5, 0.75, 1.0].map((g, i) => (
          <mesh key={i} position={[0, BASE_Y + PLOT_H * g, 0.028]}>
            <boxGeometry args={[chartW, 0.0015, 0.001]} />
            <meshStandardMaterial color="#b8a989" roughness={0.9} />
          </mesh>
        ))}

        {/* bars */}
        {BARS.map((b, i) => {
          const x = -chartW / 2 + slotW * (i + 0.5)
          const barH = PLOT_H * b.frac
          return (
            <mesh key={i} castShadow position={[x, BASE_Y + barH / 2, 0.033]}>
              <boxGeometry args={[slotW * 0.55, barH, 0.012]} />
              <meshStandardMaterial
                color={b.color}
                roughness={0.55}
                emissive={b.color}
                emissiveIntensity={0.12}
              />
            </mesh>
          )
        })}

        {/* axis tick marks */}
        {BARS.map((_, i) => {
          const x = -chartW / 2 + slotW * (i + 0.5)
          return (
            <mesh key={i} position={[x, BASE_Y - 0.018, 0.029]}>
              <boxGeometry args={[0.025, 0.004, 0.001]} />
              <meshStandardMaterial color="#3a2a18" roughness={0.9} />
            </mesh>
          )
        })}
      </group>
    </InteractiveFurniture>
  )
}
