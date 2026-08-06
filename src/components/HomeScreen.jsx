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

/**
 * Room furniture placements (absolute % of the room scene).
 * Rug renders on its own floor layer under the pet column.
 */
const ROOM_FURNITURE = {
  'decor-plant': {
    size: 42,
    className: 'pointer-events-none',
    // Floor-left corner beside the mat
    style: { left: '3%', bottom: '32%', zIndex: 6 },
  },
  'decor-lamp': {
    size: 36,
    className: 'pointer-events-none animate-gentleFloat',
    style: { right: '5%', top: '8%', zIndex: 6, animationDelay: '0.4s' },
  },
  'decor-books': {
    size: 36,
    className: 'pointer-events-none',
    // Floor-right stack beside the mat
    style: { right: '4%', bottom: '31%', zIndex: 5 },
  },
  'seasonal-lights': {
    size: 28,
    className: 'pointer-events-none animate-gentleFloat',
    style: { left: '8%', top: '7%', zIndex: 4, animationDelay: '1.1s' },
  },
}

const SNOW_FLAKES = [
  { top: '6%', left: '24%', size: 12, delay: '0s', opacity: 0.55 },
  { top: '13%', left: '52%', size: 10, delay: '1.6s', opacity: 0.4 },
  { top: '8%', left: '74%', size: 11, delay: '3.2s', opacity: 0.48 },
]

function RoomFurniture({ decorIds }) {
  const owned = new Set(decorIds)

  return (
    <>
      {decorIds.map((id) => {
        const layout = ROOM_FURNITURE[id]
        if (!layout) return null
        return (
          <span
            key={id}
            className={`absolute ${layout.className}`}
            style={layout.style}
            aria-hidden="true"
          >
            <PixelIcon name={DECOR_ICON[id] ?? 'leaf'} size={layout.size} />
          </span>
        )
      })}

      {owned.has('seasonal-snow') &&
        SNOW_FLAKES.map((flake, i) => (
          <span
            key={`snow-${i}`}
            className="absolute pointer-events-none animate-drift"
            style={{
              top: flake.top,
              left: flake.left,
              zIndex: 3,
              opacity: flake.opacity,
              animationDelay: flake.delay,
            }}
            aria-hidden="true"
          >
            <PixelIcon name="snowflake" size={flake.size} />
          </span>
        ))}
    </>
  )
}

export function HomeScreen({ onStartSession }) {
  const { state, effectiveAffection, mood, stageInfo } = useGame()
  const { current, next, progress } = stageInfo
  const decor = state.inventory.decor ?? []
  const hasRug = decor.includes('decor-rug')

  return (
    <div className="flex flex-col items-center gap-7 px-4 pt-3 pb-32">
      <div className="panel-paper relative w-full max-w-md overflow-hidden bg-sprout-sky/30">
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-sprout-sky/50 via-transparent to-sprout-brown/10" />
        <div
          className="absolute inset-x-0 bottom-0 z-0 h-1/3 pointer-events-none"
          style={{
            background:
              'linear-gradient(to top, rgba(139, 115, 85, 0.12) 0%, rgba(139, 115, 85, 0.04) 55%, transparent 100%)',
          }}
        />

        <div className="relative z-[1] min-h-[240px] flex flex-col items-center justify-end pt-10 pb-7 px-3">
          {hasRug && (
            <span
              className="absolute left-1/2 z-[2] pointer-events-none"
              style={{
                // Floor ellipse under the soil (square pixel rug doesn't read as a mat)
                bottom: '35%',
                transform: 'translateX(-50%)',
                width: 128,
                height: 32,
                borderRadius: '50%',
                background: 'var(--sprout-peach-soft)',
                boxShadow:
                  '0 0 0 2px var(--sprout-charcoal), inset 0 0 0 2px var(--sprout-brown)',
              }}
              aria-hidden="true"
            />
          )}

          {decor.length > 0 && <RoomFurniture decorIds={decor} />}

          <div className="relative z-10 flex flex-col items-center">
            <PetDisplay
              stage={state.pet.stage}
              mood={mood}
              equippedOutfit={state.pet.equippedOutfit}
              equippedStickers={state.pet.equippedStickers}
              activity="idle"
              size="lg"
            />
            <p className="mt-3 pixel-text text-sprout-charcoal text-base">{state.pet.name}</p>
            <p className="text-xs text-sprout-charcoal/50 font-semibold">{current.name}</p>
          </div>
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
