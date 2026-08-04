import { ICONS } from './iconGrids'

export const PALETTE = {
  c: 'var(--sprout-charcoal)',
  s: 'var(--sprout-sage)',
  m: 'var(--sprout-moss)',
  p: 'var(--sprout-peach-soft)',
  b: 'var(--sprout-blush-soft)',
  g: 'var(--sprout-gold-soft)',
  w: 'var(--sprout-brown)',
  k: 'var(--sprout-sky)',
  r: 'var(--sprout-cream)',
  h: '#ffffff',
}

/**
 * Renders a small grid of characters as chunky pixel-art rects.
 * Rows are padded/trimmed to a consistent width, so a stray typo in a
 * hand-authored grid degrades gracefully instead of throwing.
 */
export function PixelIcon({ name, grid: gridProp, size = 18, className = '', palette }) {
  const grid = gridProp ?? ICONS[name]
  if (!grid) return null

  const colors = palette ?? PALETTE
  const width = Math.max(...grid.map((row) => row.length))
  const height = grid.length

  const cells = []
  grid.forEach((row, y) => {
    for (let x = 0; x < width; x++) {
      const ch = row[x]
      if (!ch || ch === '.' || ch === ' ') continue
      const fill = colors[ch]
      if (!fill) continue
      cells.push(<rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={fill} />)
    }
  })

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={size}
      height={Math.round((size * height) / width)}
      shapeRendering="crispEdges"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {cells}
    </svg>
  )
}
