import { useEffect, useRef, useState } from 'react'
import { unlockAudio, startAmbient, setSoundEnabled } from '../audio/sound'

/**
 * Starts the ambient loop on the first user interaction anywhere in the
 * app (browsers block audio before a real gesture), then keeps it in
 * sync with the Settings "Sound" toggle. Returns whether audio has been
 * unlocked yet, so the UI can show a small "tap to enable sound" prompt
 * until it has.
 */
export function useAmbientSound(enabled) {
  const [unlocked, setUnlocked] = useState(false)
  const enabledRef = useRef(enabled)
  enabledRef.current = enabled

  useEffect(() => {
    setSoundEnabled(enabled)
  }, [enabled])

  useEffect(() => {
    if (unlocked) return undefined

    let cancelled = false
    const handleFirstInteraction = () => {
      unlockAudio().then(() => {
        if (cancelled) return
        setSoundEnabled(enabledRef.current)
        if (enabledRef.current) startAmbient()
        setUnlocked(true)
      })
    }

    const events = ['pointerdown', 'keydown']
    events.forEach((event) => window.addEventListener(event, handleFirstInteraction, { once: true, passive: true }))

    return () => {
      cancelled = true
      events.forEach((event) => window.removeEventListener(event, handleFirstInteraction))
    }
  }, [unlocked])

  const enableNow = () => {
    unlockAudio().then(() => {
      setSoundEnabled(enabledRef.current)
      if (enabledRef.current) startAmbient()
      setUnlocked(true)
    })
  }

  return { unlocked, enableNow }
}
