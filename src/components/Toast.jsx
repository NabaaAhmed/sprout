import { useEffect, useState } from 'react'

const VISIBLE_MS = 2800
const FADE_MS = 400

/**
 * Soft, solid feedback toast — charcoal text on a creamy panel so it
 * stays readable on every screen background. Stays fully visible for
 * ~2.8s, then fades out smoothly.
 */
export function Toast({ message, onDone }) {
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    if (!message) return undefined
    setLeaving(false)
    const fadeTimer = setTimeout(() => setLeaving(true), VISIBLE_MS)
    const doneTimer = setTimeout(() => onDone?.(), VISIBLE_MS + FADE_MS)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(doneTimer)
    }
  }, [message, onDone])

  if (!message) return null

  return (
    <div
      className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-40 panel-paper px-4 py-2.5 bg-sprout-cream text-sprout-charcoal text-sm font-bold shadow-pixel-sm max-w-[90vw] text-center transition-opacity ease-out ${
        leaving ? 'opacity-0' : 'opacity-100 animate-fadeIn'
      }`}
      style={{ transitionDuration: `${FADE_MS}ms` }}
      role="status"
    >
      {message}
    </div>
  )
}
