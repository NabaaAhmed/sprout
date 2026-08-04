import { useState } from 'react'
import { useGame } from '../context/GameContext'
import { SHOP_CATEGORIES, SHOP_ITEMS } from '../data/shopItems'
import { PixelIcon } from './icons/PixelIcon'

export function Shop() {
  const { state, buyItem, feedPet, equipOutfit } = useGame()
  const [category, setCategory] = useState('food')
  const [toast, setToast] = useState(null)

  const items = SHOP_ITEMS.filter((i) => i.category === category)

  const showToast = (message) => {
    setToast(message)
    setTimeout(() => setToast(null), 1800)
  }

  const isOwned = (item) => {
    if (item.category === 'food') return false
    const bucket = item.category === 'outfits' ? 'outfits' : 'decor'
    return state.inventory[bucket].includes(item.id)
  }

  const ownedFoodCount = (id) => state.inventory.food.filter((f) => f === id).length

  const handleBuy = (item) => {
    const outcome = buyItem(item.id)
    if (outcome.success) showToast(`Bought ${item.name}`)
    else if (outcome.reason === 'insufficient-funds') showToast('Not enough SP')
    else if (outcome.reason === 'already-owned') showToast('Already owned')
  }

  const handleFeed = (item) => {
    const outcome = feedPet(item.id)
    if (outcome.success) showToast(`Fed ${item.name} — +${outcome.affectionBoost} affection`)
  }

  return (
    <div className="flex flex-col items-center gap-5 px-4 pt-3 pb-32">
      <h2 className="pixel-text text-xl text-sprout-moss">Shop</h2>

      <div className="w-full max-w-md flex justify-center gap-2 overflow-x-auto pb-1">
        {SHOP_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setCategory(cat.id)}
            className={`btn-pixel pressable shrink-0 px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 ${
              category === cat.id ? 'bg-sprout-sage' : 'bg-sprout-cream'
            }`}
          >
            <PixelIcon name={cat.icon} size={14} />
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      <div className="w-full max-w-md grid grid-cols-2 gap-4">
        {items.map((item) => {
          const owned = isOwned(item)
          const affordable = state.currency.sproutPoints >= item.cost
          const foodQty = item.category === 'food' ? ownedFoodCount(item.id) : 0

          return (
            <div key={item.id} className="panel-paper p-4 flex flex-col items-center gap-2 bg-white/70">
              <PixelIcon name={item.icon} size={34} />
              <p className="text-sm font-extrabold text-center leading-tight">{item.name}</p>
              <p className="text-[11px] text-sprout-charcoal/50 text-center leading-snug">{item.description}</p>

              {item.category === 'food' && foodQty > 0 && (
                <span className="text-[11px] font-bold text-sprout-moss">In basket: {foodQty}</span>
              )}

              <div className="flex items-center gap-1.5 display-text text-sm text-sprout-charcoal/70 mb-1">
                <PixelIcon name="coin" size={14} />
                <span>{item.cost}</span>
              </div>

              {item.category === 'food' ? (
                <div className="flex gap-1.5 w-full">
                  <button
                    type="button"
                    onClick={() => handleBuy(item)}
                    disabled={!affordable}
                    className="btn-pixel pressable flex-1 py-1.5 text-xs font-bold bg-sprout-peachSoft"
                  >
                    Buy
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFeed(item)}
                    disabled={foodQty === 0}
                    className="btn-pixel pressable flex-1 py-1.5 text-xs font-bold bg-sprout-blushSoft"
                  >
                    Feed
                  </button>
                </div>
              ) : owned ? (
                item.category === 'outfits' ? (
                  <button
                    type="button"
                    onClick={() => equipOutfit(state.pet.equippedOutfit === item.id ? 'none' : item.id)}
                    className={`btn-pixel pressable w-full py-1.5 text-xs font-bold ${
                      state.pet.equippedOutfit === item.id ? 'bg-sprout-moss text-white' : 'bg-sprout-sage'
                    }`}
                  >
                    {state.pet.equippedOutfit === item.id ? 'Equipped' : 'Equip'}
                  </button>
                ) : (
                  <span className="w-full text-center text-xs font-bold text-sprout-moss py-1.5">Owned</span>
                )
              ) : (
                <button
                  type="button"
                  onClick={() => handleBuy(item)}
                  disabled={!affordable}
                  className="btn-pixel pressable w-full py-1.5 text-xs font-bold bg-sprout-peachSoft"
                >
                  Buy
                </button>
              )}
            </div>
          )
        })}
      </div>

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 panel-paper px-4 py-2 bg-sprout-charcoal text-sprout-cream text-sm font-bold z-30 animate-fadeIn">
          {toast}
        </div>
      )}
    </div>
  )
}
