import { useGame } from '../context/GameContext'
import { PetDisplay } from './PetDisplay'
import { StatBar } from './StatBar'
import { PixelIcon } from './icons/PixelIcon'

const DECOR_ICON = {
  'decor-lamp': 'lantern',
  'decor-plant': 'plant',
  'decor-books': 'books',
  'decor-rug': 'rug',
  'seasonal-snow': 'snowflake',
  'seasonal-lights': 'fireflyjar',
}

export function HomeScreen({ onStartSession }) {
  const { state, effectiveAffection, mood, stageInfo } = useGame()
  const { current, next, progress } = stageInfo

  return (
    <div className="flex flex-col items-center gap-7 px-4 pt-3 pb-32">
      <div className="panel-paper relative w-full max-w-md overflow-hidden bg-sprout-sky/30">
        <div className="absolute inset-0 bg-gradient-to-b from-sprout-sky/50 via-transparent to-sprout-brown/10" />

        {state.inventory.decor.length > 0 && (
          <div className="absolute top-4 left-0 right-0 flex justify-center gap-4 px-4 flex-wrap">
            {state.inventory.decor.map((id, i) => (
              <span key={`${id}-${i}`} className="animate-drift" style={{ animationDelay: `${i * 0.5}s` }}>
                <PixelIcon name={DECOR_ICON[id] ?? 'leaf'} size={22} />
              </span>
            ))}
          </div>
        )}

        <div className="relative flex flex-col items-center justify-center py-14">
          <PetDisplay
            stage={current.id}
            mood={mood}
            equippedOutfit={state.pet.equippedOutfit}
            equippedStickers={state.pet.equippedStickers ?? []}
            activity="idle"
          />
          <p className="mt-4 pixel-text text-sprout-charcoal text-base">{state.pet.name}</p>
          <p className="text-xs text-sprout-charcoal/50 font-semibold">{current.name}</p>
        </div>
      </div>

      <div className="panel-paper w-full max-w-md p-5 space-y-4">
        <StatBar
          icon="heart"
          label="Affection"
          value={effectiveAffection}
          colorClass="bg-sprout-blushSoft"
          trailing={`${effectiveAffection}/100`}
        />
        <StatBar
          icon="leaf"
          label={next ? `Growth toward ${next.name}` : 'Fully grown'}
          value={progress * 100}
          colorClass="bg-sprout-sage"
          trailing={next ? `${Math.round(progress * 100)}%` : 'Max stage'}
        />
        <p className="text-xs text-sprout-charcoal/50 leading-relaxed">{current.blurb}</p>
      </div>

      <button
        type="button"
        onClick={onStartSession}
        className="btn-pixel pressable w-full max-w-md py-4 bg-sprout-peachSoft text-sprout-charcoal font-extrabold text-lg"
      >
        Start Focus Session ▸
      </button>
    </div>
  )
}
