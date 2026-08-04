import { useGame } from '../context/GameContext'
import { PixelIcon } from './icons/PixelIcon'

export function TopBar({ onOpenSettings }) {
  const { state } = useGame()

  return (
    <header className="flex items-center justify-between gap-3 px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="panel-paper flex h-9 items-center gap-1.5 px-3 leading-none">
          <PixelIcon name="coin" size={16} />
          <span className="display-text text-sm text-sprout-charcoal leading-none">{state.currency.sproutPoints}</span>
        </div>
        <div className="panel-paper flex h-9 items-center gap-1.5 px-3 leading-none">
          <PixelIcon name="flame" size={16} />
          <span className="display-text text-sm text-sprout-charcoal leading-none">{state.streak.current}</span>
        </div>
      </div>

      <div className="flex h-9 items-center gap-1.5 pixel-text text-lg sm:text-xl text-sprout-moss tracking-wide leading-none">
        <PixelIcon name="leaf" size={18} />
        <span>Sprout</span>
      </div>

      <button
        type="button"
        onClick={onOpenSettings}
        aria-label="Settings"
        className="btn-pixel pressable panel-paper !border-3 h-9 w-9 flex items-center justify-center bg-sprout-cream"
      >
        <PixelIcon name="settings" size={16} />
      </button>
    </header>
  )
}
