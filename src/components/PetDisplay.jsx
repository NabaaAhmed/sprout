import { useMemo } from 'react'
import { PetSprite } from './PetSprite'
import { PixelIcon } from './icons/PixelIcon'

const OUTFIT_ICON = {
  'outfit-scarf': 'scarf',
  'outfit-hat': 'acorn',
  'outfit-glasses': 'glasses',
}

const STICKER_LAYOUT = {
  'sticker-sunglasses': { icon: 'sunglasses', top: 0.48, left: 0.5, size: 0.4, translate: '-50% -50%' },
  'sticker-bandana': { icon: 'bandana', top: 0.78, left: 0.5, size: 0.42, translate: '-50% -40%' },
  'sticker-flower': { icon: 'flower', top: 0.1, left: 0.88, size: 0.3, translate: '-50% 0%' },
  'sticker-sparkles': { icon: 'sparkleStickers', top: 0.18, left: 0.02, size: 0.32, translate: '0% 0%' },
  'sticker-bow': { icon: 'bow', top: 0.02, left: 0.5, size: 0.32, translate: '-50% 0%' },
}

const MOOD_LABEL = {
  happy: 'Feeling great',
  content: 'Doing alright',
  wistful: 'Missing you a little',
}

const SIZE_PX = {
  lg: 108,
  sm: 68,
}

export function PetDisplay({
  stage,
  mood,
  equippedOutfit,
  equippedStickers = [],
  activity = 'idle',
  size = 'lg',
  chewing = false,
  mouthOpen = false,
}) {
  const pixelSize = SIZE_PX[size] ?? SIZE_PX.lg

  const moodFilter = useMemo(() => {
    if (mood === 'wistful') return 'saturate-[0.75] brightness-[0.97]'
    return ''
  }, [mood])

  return (
    <div className="relative flex flex-col items-center select-none">
      {activity === 'studying' && (
        <div className="absolute -top-5 -right-3 animate-gentleFloat">
          <PixelIcon name="book" size={20} />
        </div>
      )}
      {activity === 'happy' && (
        <>
          <div className="absolute -top-3 -left-3 animate-sparkle">
            <PixelIcon name="sparkle" size={14} />
          </div>
          <div className="absolute -top-5 right-0 animate-sparkle" style={{ animationDelay: '0.6s' }}>
            <PixelIcon name="sparkle" size={12} />
          </div>
        </>
      )}
      {mood === 'wistful' && activity === 'idle' && (
        <div className="absolute -top-4 right-0 opacity-80">
          <PixelIcon name="teardrop" size={12} />
        </div>
      )}

      <div className={`relative ${chewing ? '' : 'animate-breathe'} ${moodFilter}`}>
        <PetSprite stage={stage} pixelSize={pixelSize} chewing={chewing} mouthOpen={mouthOpen} />

        {equippedOutfit !== 'none' && OUTFIT_ICON[equippedOutfit] && (
          <div className="absolute z-10 pointer-events-none" style={{ bottom: pixelSize * 0.18, left: '50%', transform: 'translateX(-50%)' }}>
            <PixelIcon name={OUTFIT_ICON[equippedOutfit]} size={Math.round(pixelSize * 0.32)} />
          </div>
        )}

        {(equippedStickers ?? []).map((id) => {
          const layout = STICKER_LAYOUT[id]
          if (!layout) return null
          return (
            <div
              key={id}
              className="absolute z-20 pointer-events-none"
              style={{
                top: pixelSize * layout.top,
                left: pixelSize * layout.left,
                transform: `translate(${layout.translate})`,
              }}
            >
              <PixelIcon name={layout.icon} size={Math.round(pixelSize * layout.size)} />
            </div>
          )
        })}
      </div>

      <span className="mt-2 text-xs font-bold text-sprout-moss/70">{MOOD_LABEL[mood]}</span>
    </div>
  )
}
