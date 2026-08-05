import { useMemo } from 'react'
import { PixelIcon } from './icons/PixelIcon'

/**
 * Procedurally builds a round "blob" body grid (charcoal outline, sage
 * fill, moss shading along the bottom, charcoal eyes + soft blush
 * cheeks). Building it from an ellipse formula — rather than hand-typing
 * every row — guarantees every row comes out the same width and keeps
 * the silhouette perfectly round (no pointed tip) at any size.
 */
function buildBodyGrid(size, { chewing = false, mouthOpen = false } = {}) {
  const center = (size - 1) / 2
  const radius = size / 2 - 0.5
  const shadeFrom = size - Math.max(2, Math.round(size * 0.22))
  // Eyes + cheeks sit right around the vertical middle of the body, well
  // clear of the top (where the leaf/flower accessory sits) and the
  // shaded bottom edge.
  const eyeRow = Math.round(center)
  const eyeOffset = Math.max(1, Math.round(radius * 0.36))
  const cheekRow = eyeRow + 1
  const cheekOffset = Math.max(2, Math.round(radius * 0.58))
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
      } else if (y >= shadeFrom) {
        row += 'm'
      } else {
        row += 's'
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

  // Mouth only appears during the feeding chew sequence so idle pets keep
  // their original face. Closed = tiny dash; open = a slightly taller oval.
  if (chewing) {
    const mx = Math.round(center)
    setCell(mx - 1, mouthRow, 'c')
    setCell(mx, mouthRow, 'c')
    setCell(mx + 1, mouthRow, 'c')
    if (mouthOpen) setCell(mx, mouthRow + 1, 'c')
  }

  return rows
}

/**
 * A small, clearly leaf-shaped silhouette: pointed at both tips, widest
 * in the middle, with a center vein — entirely self-contained within its
 * own tiny grid, so the vein can never bleed into whatever sits below it.
 */
function buildLeafGrid() {
  const height = 9
  const maxHalfWidth = 3
  const width = maxHalfWidth * 2 + 1

  const rows = []
  for (let y = 0; y < height; y++) {
    const t = y / (height - 1)
    const halfWidth = Math.round(maxHalfWidth * Math.sin(Math.PI * t))
    let row = ''
    for (let x = 0; x < width; x++) {
      const dx = x - maxHalfWidth
      if (Math.abs(dx) > halfWidth) row += '.'
      else if (Math.abs(dx) === halfWidth) row += 'c'
      else if (dx === 0) row += 'm'
      else row += 's'
    }
    rows.push(row)
  }
  return rows
}

const LEAF = buildLeafGrid()
const LEAF_ASPECT = 9 / 7
const FLOWER = ['..c.c..', '.cbbbc.', 'cbbgbbc', '.cbbbc.', '..ccc..']

function BodyLayer({ size, pixelSize, chewing, mouthOpen }) {
  const grid = useMemo(() => buildBodyGrid(size, { chewing, mouthOpen }), [size, chewing, mouthOpen])
  return <PixelIcon grid={grid} size={pixelSize} />
}

/**
 * The pet itself — a simple round pixel creature in the sage/moss palette.
 * The body is always a plain circular blob; leaves/flower are small,
 * distinct accessories stacked on top with just enough overlap (a few
 * pixels, via negative margin) for the leaf's stem tip to visually "plug
 * into" the head — never enough to merge into one pointed silhouette.
 */
export function PetSprite({ stage = 1, pixelSize = 96, className = '', chewing = false, mouthOpen = false }) {
  const bodySize = 15
  const leafWidth = pixelSize * 0.3
  const leafHeight = leafWidth * LEAF_ASPECT
  // Sink most of the leaf's tapered tip into the head so it reads as a
  // snug little leaf on top of the head, not a balloon floating on a stick.
  const leafOverlap = pixelSize * 0.16
  const flowerWidth = pixelSize * 0.4
  const flowerOverlap = pixelSize * 0.1

  return (
    <div className={`relative inline-flex flex-col items-center ${className}`} style={{ width: pixelSize }}>
      {stage === 1 && (
        <div style={{ width: leafWidth, marginBottom: -leafOverlap }} className="relative z-10">
          <PixelIcon grid={LEAF} size={leafWidth} />
        </div>
      )}

      {stage === 2 && (
        <div
          className="relative"
          style={{ width: leafWidth * 1.3, height: leafHeight, marginBottom: -leafOverlap }}
        >
          <div
            className="absolute bottom-0 left-1/2"
            style={{ width: leafWidth, transform: 'translateX(-100%) rotate(-32deg)', transformOrigin: '100% 100%' }}
          >
            <PixelIcon grid={LEAF} size={leafWidth} />
          </div>
          <div
            className="absolute bottom-0 left-1/2"
            style={{ width: leafWidth, transform: 'rotate(32deg)', transformOrigin: '0% 100%' }}
          >
            <PixelIcon grid={LEAF} size={leafWidth} />
          </div>
        </div>
      )}

      {stage >= 3 && (
        <div style={{ width: flowerWidth, marginBottom: -flowerOverlap }} className="relative z-10">
          <PixelIcon grid={FLOWER} size={flowerWidth} />
        </div>
      )}

      {stage >= 4 && (
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(236,214,161,0.55) 0%, rgba(236,214,161,0) 70%)',
            filter: 'blur(2px)',
          }}
          aria-hidden="true"
        />
      )}

      <BodyLayer size={bodySize} pixelSize={pixelSize} chewing={chewing} mouthOpen={mouthOpen} />

      {stage >= 4 && (
        <>
          <span
            className="absolute top-6 -right-1 h-1.5 w-1.5 rounded-full bg-sprout-goldSoft animate-sparkle"
            aria-hidden="true"
          />
          <span
            className="absolute bottom-4 -left-2 h-1.5 w-1.5 rounded-full bg-sprout-goldSoft animate-sparkle"
            style={{ animationDelay: '1s' }}
            aria-hidden="true"
          />
        </>
      )}
    </div>
  )
}
