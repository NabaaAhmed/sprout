import { useEffect, useRef, useState } from 'react'
import { useGame } from '../context/GameContext'
import { PetDisplay } from './PetDisplay'
import { PixelIcon } from './icons/PixelIcon'

/**
 * Overlay that plays the "food pops out → pet chews → food disappears →
 * affection updates" sequence. Item is already consumed from inventory
 * by the caller; we only apply the affection boost after the chew finishes.
 */
export function FeedCeremony({ item, onFinished }) {
  const { state, mood, stageInfo, applyFeedBoost } = useGame()
  const [phase, setPhase] = useState('enter') // enter | chew | exit
  const [mouthOpen, setMouthOpen] = useState(false)
  const finishedRef = useRef(false)
  const onFinishedRef = useRef(onFinished)
  onFinishedRef.current = onFinished

  useEffect(() => {
    if (!item) return undefined
    finishedRef.current = false
    setPhase('enter')
    setMouthOpen(false)

    const timeouts = []
    let chewInterval

    timeouts.push(setTimeout(() => setPhase('chew'), 320))

    timeouts.push(
      setTimeout(() => {
        let flips = 0
        chewInterval = setInterval(() => {
          setMouthOpen((v) => !v)
          flips += 1
          if (flips >= 6) {
            clearInterval(chewInterval)
            setMouthOpen(false)
          }
        }, 200)
      }, 320)
    )

    timeouts.push(setTimeout(() => setPhase('exit'), 320 + 1200))

    timeouts.push(
      setTimeout(() => {
        if (finishedRef.current) return
        finishedRef.current = true
        applyFeedBoost(item.affectionBoost)
        onFinishedRef.current?.({ affectionBoost: item.affectionBoost })
      }, 320 + 1200 + 280)
    )

    return () => {
      timeouts.forEach(clearTimeout)
      if (chewInterval) clearInterval(chewInterval)
    }
  }, [item, applyFeedBoost])

  if (!item) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-sprout-charcoal/35 px-4 animate-fadeIn">
      <div className="panel-paper w-full max-w-xs p-6 flex flex-col items-center gap-3 bg-sprout-cream">
        <p className="text-xs font-bold text-sprout-charcoal/50">Yum!</p>

        <div className="relative flex items-center justify-center py-2">
          <PetDisplay
            stage={stageInfo.current.id}
            mood={mood}
            equippedOutfit={state.pet.equippedOutfit}
            equippedStickers={state.pet.equippedStickers ?? []}
            chewing={phase === 'chew'}
            mouthOpen={mouthOpen}
            size="lg"
          />

          {(phase === 'enter' || phase === 'chew') && (
            <div className={`absolute -right-1 top-1/2 -translate-y-1/2 ${phase === 'enter' ? 'animate-foodPop' : ''}`}>
              <PixelIcon name={item.icon} size={34} />
            </div>
          )}
          {phase === 'exit' && (
            <div className="absolute -right-1 top-1/2 -translate-y-1/2 animate-foodFade">
              <PixelIcon name={item.icon} size={34} />
            </div>
          )}
        </div>

        <p className="text-sm font-bold text-sprout-charcoal">{item.name}</p>
      </div>
    </div>
  )
}
