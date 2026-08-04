import { useEffect } from 'react'
import { playClick } from '../audio/sound'

// Matches every interactive control in the app (buttons, toggles, nav
// tabs, combobox options, etc). Using one delegated listener means new
// buttons automatically get the click sound too, with nothing to wire
// up per-component.
const INTERACTIVE_SELECTOR = 'button, [role="button"]'

/**
 * Plays a soft, short tick on every interactive element in the app.
 * Native `disabled` buttons never dispatch click events, so those are
 * silent automatically — no extra check needed.
 */
export function useUiClickSound() {
  useEffect(() => {
    const handleClick = (event) => {
      if (event.target instanceof Element && event.target.closest(INTERACTIVE_SELECTOR)) {
        playClick()
      }
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])
}
