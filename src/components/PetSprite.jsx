import { useMemo } from 'react'
import { PixelIcon } from './icons/PixelIcon'

// round blob body — charcoal outline, sage fill, a little moss shading.
// built from an ellipse so it stays round at weird sizes
function buildBodyGrid(size, { chewing = false, mouthOpen = false } = {}) {
  const center = (size - 1) / 2
  const radius = size / 2 - 0.5
  const shadeFrom = size - Math.max(2, Math.round(size * 0.28))
  const eyeRow = Math.round(center) - 1
  const eyeOffset = Math.max(1, Math.round(radius * 0.34))
  const cheekRow = eyeRow + 1
  const cheekOffset = Math.max(2, Math.round(radius * 0.55))
  const mouthRow = cheekRow + 1

  const dist = (x, y) => Math.hypot(x - center, y - center)

  const rows = []
  for (let y = 0; y < size; y++) {
    let row = ''
    for (let x = 0; x < size; x++) {
      if (dist(x, y) > radius) {
        row += '.'
        continue
      }
      const isEdge =
        dist(x - 1, y) > radius || dist(x + 1, y) > radius || dist(x, y - 1) > radius || dist(x, y + 1) > radius
      if (isEdge) {
        row += 'c'
      } else {
        const nx = Math.abs(x - center) / radius
        const sideShade = nx > 0.52 && y >= center * 0.55
        const bottomShade = y >= shadeFrom
        row += sideShade || bottomShade ? 'm' : 's'
      }
    }
    rows.push(row)
  }

  const setCell = (x, y, ch) => {
    if (y < 0 || y >= rows.length) return
    const row = rows[y]
    if (x < 0 || x >= row.length) return
    if (row[x] === '.') return
    rows[y] = row.slice(0, x) + ch + row.slice(x + 1)
  }

  setCell(Math.round(center - eyeOffset), eyeRow, 'c')
  setCell(Math.round(center + eyeOffset), eyeRow, 'c')
  setCell(Math.round(center - cheekOffset), cheekRow, 'b')
  setCell(Math.round(center + cheekOffset), cheekRow, 'b')

  const mx = Math.round(center)
  if (chewing) {
    setCell(mx - 1, mouthRow, 'c')
    setCell(mx, mouthRow, 'c')
    setCell(mx + 1, mouthRow, 'c')
    if (mouthOpen) setCell(mx, mouthRow + 1, 'c')
  } else {
    setCell(mx, mouthRow, 'c')
  }

  return rows
}

// soft curved leaf — flip with scaleX for the other side
const CURVED_LEAF = [
  '....cc...',
  '...cssc..',
  '..cssmsc.',
  '..cssssc.',
  '.csssssc.',
  '.cs.ssc..',
  '..c.sc...',
  '....c....',
]

// a bit fuller for later stages
const CURVED_LEAF_FULL = [
  '.....cc....',
  '....cssc...',
  '...cssmsc..',
  '..csssssc..',
  '.cssssssc..',
  '.css.sssc..',
  '..cs.ssc...',
  '...c.sc....',
  '....c......',
]

// little bloom for stages 3–4
const BLOOM_FLOWER = [
  '..c.c.c..',
  '.cbbgbbc.',
  'cbbgggbbc',
  '.cbbgbbc.',
  '..ccccc..',
]

// soil mounds get wider as it grows
const SOIL_BY_STAGE = {
  1: [
    '....ccccc....',
    '...cwwwwwc...',
    '..cwwrwwwwc..',
    '.cwwwwwwwwwc.',
    '.ccccccccccc.',
  ],
  2: [
    '.....cccccc.....',
    '....cwwwwwwc....',
    '...cwwrwwwwwc...',
    '..cwwwwwwwwwwc..',
    '.cwwwwwwwwwwwwc.',
    '.cccccccccccccc.',
  ],
  3: [
    '......ccccccc......',
    '.....cwwwwwwwc.....',
    '....cwwrwwwwwwc....',
    '...cwwwwwwwwwwwc...',
    '..cwwwwwwwwwwwwwc..',
    '.cwwwwwwwwwwwwwwwc.',
    '.ccccccccccccccccc.',
  ],
  4: [
    '.......cccccccc.......',
    '......cwwwwwwwwc......',
    '.....cwwrwwwwwwwc.....',
    '....cwwwwwwwwwwwwc....',
    '...cwwwwwwwwwwwwwwc...',
    '..cwwwwwwwwwwwwwwwwc..',
    '.cwwwwwwwwwwwwwwwwwwc.',
    '.cccccccccccccccccccc.',
  ],
}

const STAGE_LAYOUT = {
  1: { bodyCells: 15, bodyScale: 0.78, soilScale: 0.92, leafScale: 0.38 },
  2: { bodyCells: 16, bodyScale: 0.82, soilScale: 0.96, leafScale: 0.34 },
  3: { bodyCells: 17, bodyScale: 0.86, soilScale: 1.0, leafScale: 0.3, flowerScale: 0.42 },
  4: { bodyCells: 18, bodyScale: 0.9, soilScale: 1.05, leafScale: 0.32, flowerScale: 0.48 },
}

function BodyLayer({ size, pixelSize, chewing, mouthOpen }) {
  const grid = useMemo(() => buildBodyGrid(size, { chewing, mouthOpen }), [size, chewing, mouthOpen])
  return <PixelIcon grid={grid} size={pixelSize} />
}

function Canopy({ stage, pixelSize, leafScale, flowerScale }) {
  const leafPx = Math.round(pixelSize * leafScale)
  const flowerPx = flowerScale ? Math.round(pixelSize * flowerScale) : 0

  if (stage === 1) {
    return (
      <div style={{ width: leafPx, transformOrigin: '50% 100%' }}>
        <PixelIcon grid={CURVED_LEAF} size={leafPx} />
      </div>
    )
  }

  if (stage === 2) {
    const pairW = leafPx * 1.85
    return (
      <div className="relative" style={{ width: pairW, height: leafPx * 0.95 }}>
        <div
          className="absolute bottom-0 left-1/2"
          style={{
            width: leafPx,
            transform: 'translateX(-92%) rotate(-28deg)',
            transformOrigin: '90% 100%',
          }}
        >
          <div style={{ transform: 'scaleX(-1)' }}>
            <PixelIcon grid={CURVED_LEAF} size={leafPx} />
          </div>
        </div>
        <div
          className="absolute bottom-0 left-1/2"
          style={{
            width: leafPx,
            transform: 'translateX(-8%) rotate(28deg)',
            transformOrigin: '10% 100%',
          }}
        >
          <PixelIcon grid={CURVED_LEAF} size={leafPx} />
        </div>
      </div>
    )
  }

  // stages 3–4: bloom on top, leaves framing it
  const frameW = Math.max(flowerPx * 1.35, leafPx * 2.1)
  const sideLeaf = Math.round(leafPx * (stage === 4 ? 1.05 : 0.95))
  const leafGrid = stage === 4 ? CURVED_LEAF_FULL : CURVED_LEAF

  return (
    <div className="relative flex flex-col items-center" style={{ width: frameW }}>
      <div className="relative z-10" style={{ width: flowerPx, marginBottom: -flowerPx * 0.12 }}>
        <PixelIcon grid={BLOOM_FLOWER} size={flowerPx} />
      </div>
      <div className="relative" style={{ width: frameW, height: sideLeaf * 0.55 }}>
        <div
          className="absolute bottom-0 left-1/2"
          style={{
            width: sideLeaf,
            transform: 'translateX(-95%) rotate(-34deg)',
            transformOrigin: '90% 100%',
          }}
        >
          <div style={{ transform: 'scaleX(-1)' }}>
            <PixelIcon grid={leafGrid} size={sideLeaf} />
          </div>
        </div>
        <div
          className="absolute bottom-0 left-1/2"
          style={{
            width: sideLeaf,
            transform: 'translateX(-5%) rotate(34deg)',
            transformOrigin: '10% 100%',
          }}
        >
          <PixelIcon grid={leafGrid} size={sideLeaf} />
        </div>
      </div>
    </div>
  )
}

// grounded little sprout: soil + canopy + blob body
// idle = leaf/flower sway, body settles on the soil (took a while to feel right)
export function PetSprite({ stage = 1, pixelSize = 96, className = '', chewing = false, mouthOpen = false }) {
  const s = Math.min(4, Math.max(1, Math.round(stage)))
  const layout = STAGE_LAYOUT[s]
  const compact = pixelSize < 70
  const bodyPx = Math.round(pixelSize * layout.bodyScale)
  // keep a soil "lip" under the body — matters more at tiny evolution-row sizes
  const soilPx = Math.round(pixelSize * (compact ? Math.max(layout.soilScale, 1.05) : layout.soilScale))
  const soilTuck = Math.round(bodyPx * (compact ? 0.1 : s >= 3 ? 0.22 : 0.18))
  const canopyTuck = Math.round(pixelSize * (s === 1 ? 0.1 : s === 2 ? 0.12 : 0.08))

  return (
    <div className={`relative inline-flex flex-col items-center ${className}`} style={{ width: Math.max(pixelSize, soilPx) }}>
      {s >= 4 && (
        <div
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(236,214,161,0.5) 0%, rgba(236,214,161,0) 68%)',
            filter: 'blur(2px)',
            transform: 'scale(1.15)',
          }}
          aria-hidden="true"
        />
      )}

      {/* Canopy sways; soil + body stay planted */}
      <div
        className="relative z-10 animate-leafIdle"
        style={{
          marginBottom: -canopyTuck,
          transformOrigin: '50% 100%',
        }}
      >
        <Canopy
          stage={s}
          pixelSize={pixelSize}
          leafScale={layout.leafScale}
          flowerScale={layout.flowerScale}
        />
      </div>

      <div
        className={`relative z-[5] ${chewing ? '' : 'animate-breatheSettle'}`}
        style={{ transformOrigin: '50% 100%', width: bodyPx }}
      >
        <BodyLayer size={layout.bodyCells} pixelSize={bodyPx} chewing={chewing} mouthOpen={mouthOpen} />
      </div>

      <div className="relative z-0" style={{ width: soilPx, marginTop: -soilTuck }}>
        <PixelIcon grid={SOIL_BY_STAGE[s]} size={soilPx} />
      </div>

      {s >= 4 && pixelSize >= 64 && (
        <>
          <span
            className="absolute top-[18%] right-[8%] h-1.5 w-1.5 rounded-full bg-sprout-goldSoft animate-sparkle"
            aria-hidden="true"
          />
          <span
            className="absolute bottom-[28%] left-[6%] h-1.5 w-1.5 rounded-full bg-sprout-goldSoft animate-sparkle"
            style={{ animationDelay: '1s' }}
            aria-hidden="true"
          />
        </>
      )}
    </div>
  )
}
