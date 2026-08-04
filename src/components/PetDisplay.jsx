import { useMemo } from 'react'
import { PetSprite } from './PetSprite'
import { PixelIcon } from './icons/PixelIcon'

const OUTFIT_ICON = {
  'outfit-scarf': 'scarf',
  'outfit-hat': 'acorn',
  'outfit-glasses': 'glasses',
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

export function PetDisplay({ stage, mood, equippedOutfit, activity = 'idle', size = 'lg' }) {
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

      <div className={`animate-breathe ${moodFilter}`}>
        <PetSprite stage={stage} pixelSize={pixelSize} />
      </div>

      {equippedOutfit !== 'none' && OUTFIT_ICON[equippedOutfit] && (
        <div className="absolute" style={{ bottom: pixelSize * 0.22 }}>
          <PixelIcon name={OUTFIT_ICON[equippedOutfit]} size={Math.round(pixelSize * 0.32)} />
        </div>
      )}

      <span className="mt-2 text-xs font-bold text-sprout-moss/70">{MOOD_LABEL[mood]}</span>
    </div>
  )
}
