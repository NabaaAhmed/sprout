import { useMemo, useRef, useState } from 'react'
import { useGame } from '../context/GameContext'
import { useTimer } from '../hooks/useTimer'
import { PetDisplay } from './PetDisplay'
import { Combobox } from './Combobox'
import { PixelIcon } from './icons/PixelIcon'
import { blendAcrossStops } from '../utils/color'
import { DEFAULT_FOCUS_LABELS } from '../data/focusLabels'

const PRESETS = [15, 25, 45, 60]

// A quiet, continuous sky → cream → dusk drift instead of jumping
// between discrete gradient classes.
const AMBIENT_STOPS = ['#c7e0ea', '#fff8ed', '#f0cba7']

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0')
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0')
  return `${m}:${s}`
}

export function FocusTimer({ onComplete, onExit }) {
  const { state, completeSession, logAbandonedSession, mood, stageInfo } = useGame()
  const [phase, setPhase] = useState('setup')
  const [duration, setDuration] = useState(state.settings.defaultSessionLength)
  const [customMinutes, setCustomMinutes] = useState('')
  const [label, setLabel] = useState('')
  const sessionMeta = useRef({ duration: 0, label: '' })

  const handleComplete = () => {
    const { duration: d, label: l } = sessionMeta.current
    const result = completeSession(d, l || null)
    onComplete(result, { durationMinutes: d, label: l })
  }

  const timer = useTimer({ onComplete: handleComplete })

  const activeMinutes = customMinutes ? Number(customMinutes) : duration

  const handleStart = () => {
    const minutes = Math.min(240, Math.max(1, Math.round(activeMinutes || 0)))
    sessionMeta.current = { duration: minutes, label: label.trim() }
    setPhase('active')
    timer.start(minutes * 60)
  }

  const handleGiveUp = () => {
    const elapsedMinutes = Math.round((sessionMeta.current.duration * 60 - timer.secondsLeft) / 60)
    if (elapsedMinutes > 0) logAbandonedSession(elapsedMinutes, sessionMeta.current.label || null)
    timer.reset()
    onExit()
  }

  const ambientColor = useMemo(() => blendAcrossStops(AMBIENT_STOPS, timer.progress), [timer.progress])

  // Falls back to the generic defaults if the player hasn't customized
  // their quick-select labels in Settings yet (or has an older save).
  const focusLabelOptions = useMemo(
    () => (state.settings.focusLabels ?? DEFAULT_FOCUS_LABELS).map((l) => l.trim()).filter(Boolean),
    [state.settings.focusLabels]
  )

  if (phase === 'setup') {
    return (
      <div className="flex flex-col items-center gap-7 px-4 pt-5 pb-32">
        <h2 className="pixel-text text-xl text-sprout-moss">Start a Focus Session</h2>

        <div className="panel-paper w-full max-w-md p-6 space-y-6">
          <div>
            <p className="text-xs font-bold text-sprout-charcoal/60 mb-2.5">Duration</p>
            <div className="grid grid-cols-4 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setDuration(p)
                    setCustomMinutes('')
                  }}
                  className={`btn-pixel pressable py-2 text-sm font-bold ${
                    duration === p && !customMinutes ? 'bg-sprout-sage' : 'bg-sprout-cream'
                  }`}
                >
                  {p}m
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-sprout-charcoal/50">Custom:</span>
              <input
                type="number"
                min={1}
                max={240}
                placeholder="minutes"
                value={customMinutes}
                onChange={(e) => setCustomMinutes(e.target.value)}
                className="flex-1 rounded-xl border-2 border-sprout-charcoal/15 px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-sprout-moss/50 transition-colors duration-300"
              />
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-sprout-charcoal/60 mb-2.5">What are you working on? (optional)</p>
            <Combobox
              value={label}
              onChange={setLabel}
              options={focusLabelOptions}
              placeholder="Pick a label or type your own"
              maxLength={60}
            />
            <p className="mt-2 text-[11px] text-sprout-charcoal/40">
              Edit these quick-select labels anytime from Settings.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleStart}
          className="btn-pixel pressable w-full max-w-md py-4 bg-sprout-peachSoft font-extrabold text-lg"
        >
          Begin ▸
        </button>
        <button type="button" onClick={onExit} className="text-sm font-bold text-sprout-charcoal/40 underline">
          Back to home
        </button>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-30 flex flex-col items-center justify-center px-4"
      style={{
        background: `linear-gradient(to bottom, ${ambientColor}, var(--sprout-cream) 70%)`,
        transition: 'background 1.2s ease-out',
      }}
    >
      <div className="absolute top-12 left-10 animate-drift opacity-60">
        <PixelIcon name="sparkle" size={16} />
      </div>
      <div className="absolute top-28 right-14 animate-drift opacity-50" style={{ animationDelay: '2s' }}>
        <PixelIcon name="sparkle" size={12} />
      </div>
      <div className="absolute bottom-36 left-16 animate-drift opacity-50" style={{ animationDelay: '4s' }}>
        <PixelIcon name="leaf" size={14} />
      </div>

      {sessionMeta.current.label && (
        <p className="mb-5 text-sm font-bold text-sprout-charcoal/60 panel-paper px-4 py-1.5 bg-white/70">
          Working on: {sessionMeta.current.label}
        </p>
      )}

      <PetDisplay stage={stageInfo.current.id} mood={mood} equippedOutfit="none" activity="studying" size="lg" />

      <div className="display-text text-6xl sm:text-7xl text-sprout-charcoal mt-7 tabular-nums">
        {formatTime(timer.secondsLeft)}
      </div>

      <div className="mt-5 h-2 w-64 rounded-full bg-sprout-charcoal/10 overflow-hidden">
        <div
          className="h-full bg-sprout-sage transition-[width] duration-700"
          style={{ width: `${timer.progress * 100}%` }}
        />
      </div>

      <div className="mt-9 flex items-center gap-3">
        <button
          type="button"
          onClick={timer.isRunning ? timer.pause : timer.resume}
          className="btn-pixel pressable px-5 py-2 bg-sprout-sage font-bold text-sm"
        >
          {timer.isRunning ? 'Pause' : 'Resume'}
        </button>
      </div>

      <button
        type="button"
        onClick={handleGiveUp}
        className="absolute bottom-6 right-6 text-xs font-semibold text-sprout-charcoal/35 underline hover:text-sprout-charcoal/60 transition-colors duration-300"
      >
        Give up
      </button>
    </div>
  )
}
