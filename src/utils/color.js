function hexToRgb(hex) {
  const clean = hex.replace('#', '')
  const bigint = parseInt(clean, 16)
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 }
}

function rgbToHex({ r, g, b }) {
  const toHex = (n) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/** Linearly blends two hex colors. `t` is clamped to [0, 1]. */
export function blendHex(hexA, hexB, t) {
  const clamped = Math.min(1, Math.max(0, t))
  const a = hexToRgb(hexA)
  const b = hexToRgb(hexB)
  return rgbToHex({
    r: a.r + (b.r - a.r) * clamped,
    g: a.g + (b.g - a.g) * clamped,
    b: a.b + (b.b - a.b) * clamped,
  })
}

/**
 * Blends smoothly across a sequence of hex colors as `progress` moves
 * from 0 to 1, with no discrete jumps between stops.
 */
export function blendAcrossStops(stops, progress) {
  const clamped = Math.min(1, Math.max(0, progress))
  const segments = stops.length - 1
  const segment = Math.min(segments - 1, Math.floor(clamped * segments))
  const localT = clamped * segments - segment
  return blendHex(stops[segment], stops[segment + 1], localT)
}
