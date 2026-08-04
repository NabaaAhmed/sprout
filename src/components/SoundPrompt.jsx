import { PixelIcon } from './icons/PixelIcon'

/**
 * A small, non-blocking pill that invites the player to enable ambient
 * sound. Any click anywhere in the app also unlocks audio, so this is
 * just a friendly hint rather than a hard gate.
 */
export function SoundPrompt({ onEnable }) {
  return (
    <button
      type="button"
      onClick={onEnable}
      className="btn-pixel pressable fixed bottom-24 left-1/2 z-40 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 bg-white text-xs font-bold text-sprout-charcoal/70 animate-fadeIn"
    >
      <PixelIcon name="soundOn" size={12} />
      Tap for ambient sound
    </button>
  )
}
