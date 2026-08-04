import { useState } from 'react'
import { useGame } from '../context/GameContext'
import { SHOP_ITEMS } from '../data/shopItems'
import { STAGES } from '../data/petStages'
import { PetDisplay } from './PetDisplay'
import { PetSprite } from './PetSprite'
import { StatBar } from './StatBar'
import { PixelIcon } from './icons/PixelIcon'

export function PetStats() {
  const { state, effectiveAffection, mood, stageInfo, feedPet, setPetName } = useGame()
  const { current, next, progress } = stageInfo
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState(state.pet.name)
  const [toast, setToast] = useState(null)

  const foodCounts = state.inventory.food.reduce((acc, id) => {
    acc[id] = (acc[id] ?? 0) + 1
    return acc
  }, {})
  const foodEntries = Object.entries(foodCounts)

  const showToast = (message) => {
    setToast(message)
    setTimeout(() => setToast(null), 1600)
  }

  const handleFeed = (id) => {
    const outcome = feedPet(id)
    if (outcome.success) showToast(`+${outcome.affectionBoost} affection`)
  }

  const saveName = () => {
    setPetName(nameDraft)
    setEditingName(false)
  }

  return (
    <div className="flex flex-col items-center gap-6 px-4 pt-3 pb-32">
      <h2 className="pixel-text text-xl text-sprout-moss">Pet Stats</h2>

      <div className="panel-paper w-full max-w-md p-6 flex flex-col items-center gap-2.5 bg-sprout-sky/20">
        <PetDisplay stage={current.id} mood={mood} equippedOutfit={state.pet.equippedOutfit} size="lg" />

        {editingName ? (
          <div className="flex items-center gap-2 mt-1">
            <input
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              maxLength={20}
              className="rounded-xl border-2 border-sprout-charcoal/15 px-2 py-1 text-sm text-center bg-white"
              autoFocus
            />
            <button onClick={saveName} className="btn-pixel pressable px-3 py-1 text-xs font-bold bg-sprout-sage">
              Save
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditingName(true)}
            className="flex items-center gap-1.5 pixel-text text-base text-sprout-charcoal mt-1"
          >
            <span>{state.pet.name}</span>
            <PixelIcon name="pencil" size={13} />
          </button>
        )}
        <p className="text-xs text-sprout-charcoal/50 font-semibold">
          {current.name} · {(state.pet.totalFocusMinutes / 60).toFixed(1)} hrs studied
        </p>
      </div>

      <div className="panel-paper w-full max-w-md p-5 space-y-5">
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

        <div className="pt-1.5">
          <p className="text-xs font-bold text-sprout-charcoal/50 mb-3">Evolution stages</p>
          <div className="flex justify-between">
            {STAGES.map((s) => (
              <div key={s.id} className={`flex flex-col items-center gap-1 flex-1 ${s.id <= current.id ? '' : 'opacity-35 grayscale'}`}>
                <PetSprite stage={s.id} pixelSize={30} />
                <span
                  className={`text-[10px] font-bold text-center mt-1 ${
                    s.id === current.id ? 'text-sprout-moss' : 'text-sprout-charcoal/40'
                  }`}
                >
                  {s.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="panel-paper w-full max-w-md p-5">
        <p className="text-xs font-bold text-sprout-charcoal/50 mb-3">Feed your pet</p>
        {foodEntries.length === 0 ? (
          <p className="text-sm text-sprout-charcoal/45 italic py-3 text-center">No food yet — visit the shop.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2.5">
            {foodEntries.map(([id, qty]) => {
              const item = SHOP_ITEMS.find((i) => i.id === id)
              if (!item) return null
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleFeed(id)}
                  className="btn-pixel pressable flex flex-col items-center gap-1.5 py-2.5 bg-sprout-blushSoft/25"
                >
                  <PixelIcon name={item.icon} size={26} />
                  <span className="text-[10px] font-bold">x{qty}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 panel-paper px-4 py-2 bg-sprout-charcoal text-sprout-cream text-sm font-bold z-30 animate-fadeIn">
          {toast}
        </div>
      )}
    </div>
  )
}
