import { useState } from 'react'
import { useGame } from '../context/GameContext'
import { PixelIcon } from './icons/PixelIcon'
import { DEFAULT_FOCUS_LABELS } from '../data/focusLabels'

export function SettingsModal({ onClose }) {
  const { state, updateSettings, resetGame } = useGame()
  const [confirmingReset, setConfirmingReset] = useState(false)
  const focusLabels = state.settings.focusLabels ?? DEFAULT_FOCUS_LABELS

  const updateLabelAt = (index, value) => {
    const next = [...focusLabels]
    next[index] = value
    updateSettings({ focusLabels: next })
  }

  const removeLabelAt = (index) => {
    updateSettings({ focusLabels: focusLabels.filter((_, i) => i !== index) })
  }

  const addLabel = () => {
    if (focusLabels.length >= 12) return
    updateSettings({ focusLabels: [...focusLabels, ''] })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-sprout-charcoal/40 px-4">
      <div className="panel-paper w-full max-w-sm p-6 bg-sprout-cream space-y-5 animate-settleIn">
        <div className="flex items-center justify-between">
          <h2 className="pixel-text text-lg text-sprout-moss">Settings</h2>
          <button
            onClick={onClose}
            aria-label="Close settings"
            className="p-1 opacity-50 hover:opacity-80 transition-opacity duration-300"
          >
            <PixelIcon name="close" size={12} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-bold">Sound</span>
          <button
            type="button"
            onClick={() => updateSettings({ soundOn: !state.settings.soundOn })}
            className={`btn-pixel pressable flex items-center gap-1.5 px-3 py-1 text-xs font-bold ${
              state.settings.soundOn ? 'bg-sprout-sage' : 'bg-sprout-charcoal/10'
            }`}
          >
            <PixelIcon name={state.settings.soundOn ? 'soundOn' : 'soundOff'} size={12} />
            {state.settings.soundOn ? 'On' : 'Off'}
          </button>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-bold">Default session</span>
          <select
            value={state.settings.defaultSessionLength}
            onChange={(e) => updateSettings({ defaultSessionLength: Number(e.target.value) })}
            className="rounded-xl border-2 border-sprout-charcoal/30 px-2 py-1 text-sm bg-white"
          >
            {[15, 25, 45, 60].map((m) => (
              <option key={m} value={m}>
                {m} min
              </option>
            ))}
          </select>
        </div>

        <hr className="border-sprout-charcoal/10" />

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold">Focus labels</span>
            <button
              type="button"
              onClick={addLabel}
              disabled={focusLabels.length >= 12}
              className="text-xs font-bold text-sprout-moss underline disabled:opacity-40 disabled:no-underline"
            >
              + Add
            </button>
          </div>
          <p className="text-[11px] text-sprout-charcoal/45 mb-2.5">
            Quick-select options shown on the focus session screen. Make them your own.
          </p>
          {focusLabels.length === 0 ? (
            <p className="text-xs text-sprout-charcoal/40 italic py-1">No quick labels — add one below.</p>
          ) : (
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {focusLabels.map((focusLabel, index) => (
                <div key={index} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={focusLabel}
                    onChange={(e) => updateLabelAt(index, e.target.value)}
                    maxLength={40}
                    placeholder="Label"
                    className="font-body flex-1 rounded-lg border-2 border-sprout-charcoal/15 px-2 py-1 text-xs bg-white focus:outline-none focus:border-sprout-moss/50 transition-colors duration-300"
                  />
                  <button
                    type="button"
                    onClick={() => removeLabelAt(index)}
                    aria-label="Remove label"
                    className="p-1 opacity-40 hover:opacity-80 transition-opacity duration-300"
                  >
                    <PixelIcon name="close" size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <hr className="border-sprout-charcoal/10" />

        {confirmingReset ? (
          <div className="space-y-2">
            <p className="text-xs text-sprout-charcoal/70">
              This will erase your pet, SP, streak, and history. Are you sure?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  resetGame()
                  setConfirmingReset(false)
                  onClose()
                }}
                className="btn-pixel pressable flex-1 py-1.5 text-xs font-bold bg-sprout-blushSoft"
              >
                Yes, reset
              </button>
              <button
                onClick={() => setConfirmingReset(false)}
                className="btn-pixel pressable flex-1 py-1.5 text-xs font-bold bg-sprout-charcoal/10"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmingReset(true)}
            className="text-xs font-bold text-sprout-charcoal/40 underline"
          >
            Reset all data
          </button>
        )}
      </div>
    </div>
  )
}
