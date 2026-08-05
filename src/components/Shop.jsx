import { useCallback, useState } from 'react'
import { useGame } from '../context/GameContext'
import { SHOP_CATEGORIES, SHOP_ITEMS } from '../data/shopItems'
import { PixelIcon } from './icons/PixelIcon'
import { Toast } from './Toast'
import { FeedCeremony } from './FeedCeremony'

function inventoryBucket(category) {
  if (category === 'food') return 'food'
  if (category === 'outfits') return 'outfits'
  if (category === 'stickers') return 'stickers'
  return 'decor'
}

export function Shop() {
  const { state, buyItem, consumeFood, equipOutfit, toggleSticker } = useGame()
  const [category, setCategory] = useState('food')
  const [toast, setToast] = useState(null)
  const [feedingItem, setFeedingItem] = useState(null)

  const items = SHOP_ITEMS.filter((i) => i.category === category)

  const isOwned = (item) => {
    if (item.category === 'food') return false
    const bucket = inventoryBucket(item.category)
    return (state.inventory[bucket] ?? []).includes(item.id)
  }

  const ownedFoodCount = (id) => state.inventory.food.filter((f) => f === id).length

  const handleBuy = (item) => {
    const outcome = buyItem(item.id)
    if (outcome.success) setToast(`Bought ${item.name}`)
    else if (outcome.reason === 'insufficient-funds') setToast('Not enough SP')
    else if (outcome.reason === 'already-owned') setToast('Already owned')
  }

  const handleFeed = (item) => {
    if (feedingItem) return
    const outcome = consumeFood(item.id)
    if (outcome.success) setFeedingItem(outcome.item)
  }

  const handleFeedFinished = useCallback(({ affectionBoost }) => {
    setFeedingItem((current) => {
      if (current) setToast(`Fed ${current.name} — +${affectionBoost} affection`)
      return null
    })
  }, [])

  const handleOutfit = (item) => {
    const equipped = state.pet.equippedOutfit === item.id
    equipOutfit(equipped ? 'none' : item.id)
    setToast(equipped ? `Unequipped ${item.name}` : `Equipped ${item.name}`)
  }

  const handleSticker = (item) => {
    const equipped = (state.pet.equippedStickers ?? []).includes(item.id)
    toggleSticker(item.id)
    setToast(equipped ? `Unequipped ${item.name}` : `Equipped ${item.name}`)
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
          const stickerOn = (state.pet.equippedStickers ?? []).includes(item.id)

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
                    disabled={foodQty === 0 || Boolean(feedingItem)}
                    className="btn-pixel pressable flex-1 py-1.5 text-xs font-bold bg-sprout-blushSoft"
                  >
                    Feed
                  </button>
                </div>
              ) : owned ? (
                item.category === 'outfits' ? (
                  <button
                    type="button"
                    onClick={() => handleOutfit(item)}
                    className={`btn-pixel pressable w-full py-1.5 text-xs font-bold ${
                      state.pet.equippedOutfit === item.id ? 'bg-sprout-moss text-white' : 'bg-sprout-sage'
                    }`}
                  >
                    {state.pet.equippedOutfit === item.id ? 'Equipped' : 'Equip'}
                  </button>
                ) : item.category === 'stickers' ? (
                  <button
                    type="button"
                    onClick={() => handleSticker(item)}
                    className={`btn-pixel pressable w-full py-1.5 text-xs font-bold ${
                      stickerOn ? 'bg-sprout-moss text-white' : 'bg-sprout-sage'
                    }`}
                  >
                    {stickerOn ? 'Equipped' : 'Equip'}
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

      <Toast message={toast} onDone={() => setToast(null)} />
      {feedingItem && <FeedCeremony item={feedingItem} onFinished={handleFeedFinished} />}
    </div>
  )
}
