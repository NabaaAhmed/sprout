import { useEffect, useState } from 'react'
import { PetDisplay } from './PetDisplay'
import { PixelIcon } from './icons/PixelIcon'
import { playChime } from '../audio/sound'

const SPARKLE_POSITIONS = [
  { top: '10%', left: '12%', delay: '0s' },
  { top: '14%', left: '78%', delay: '0.3s' },
  { top: '62%', left: '8%', delay: '0.6s' },
  { top: '66%', left: '84%', delay: '0.9s' },
]

export function SessionComplete({ result, meta, onDone }) {
  const [displayedSp, setDisplayedSp] = useState(0)

  useEffect(() => {
    if (!result) return
    playChime()
  }, [result])

  useEffect(() => {
    if (!result) return
    const target = result.spEarned
    const step = Math.max(1, Math.round(target / 24))
    const id = setInterval(() => {
      setDisplayedSp((prev) => {
        const next = prev + step
        if (next >= target) {
          clearInterval(id)
          return target
        }
        return next
      })
    }, 45)
    return () => clearInterval(id)
  }, [result])

  if (!result) return null

  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-sprout-charcoal/30 px-4">
      <div className="panel-paper relative w-full max-w-sm p-7 flex flex-col items-center gap-4 animate-settleIn bg-sprout-cream">
        {SPARKLE_POSITIONS.map((pos, i) => (
          <span key={i} className="absolute animate-sparkle" style={{ top: pos.top, left: pos.left, animationDelay: pos.delay }}>
            <PixelIcon name="sparkle" size={14} />
          </span>
        ))}

        <h2 className="pixel-text text-xl text-sprout-moss text-center">Session Complete</h2>

        <PetDisplay stage={result.newStage.id} mood="happy" equippedOutfit="none" activity="happy" size="sm" />

        {meta?.label && <p className="text-xs text-sprout-charcoal/50">{meta.label}</p>}
        <p className="text-sm font-bold text-sprout-charcoal/60">{meta?.durationMinutes} minutes focused</p>

        <div className="flex items-center gap-2 display-text text-2xl text-sprout-charcoal">
          <PixelIcon name="coin" size={22} />
          <span>+{displayedSp} SP</span>
        </div>

        {result.streakDay > 1 && (
          <p className="text-xs font-bold text-sprout-charcoal/60 flex items-center gap-1.5">
            <PixelIcon name="flame" size={13} />
            {result.streakDay}-day streak (+{result.streakBonus} bonus SP)
          </p>
        )}

        {result.leveledUp && (
          <div className="mt-1 text-center">
            <p className="text-sm font-extrabold text-sprout-moss">Evolved into {result.newStage.name}</p>
            <p className="text-xs text-sprout-charcoal/50">{result.newStage.blurb}</p>
          </div>
        )}

        <button
          type="button"
          onClick={onDone}
          className="btn-pixel pressable mt-2 w-full py-3 bg-sprout-peachSoft font-extrabold"
        >
          Nice!
        </button>
      </div>
    </div>
  )
}
