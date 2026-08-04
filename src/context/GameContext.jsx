import { createContext, useCallback, useContext, useMemo } from 'react'
import { usePersistedState } from '../hooks/usePersistedState'
import { getStageForMinutes, getStageProgress } from '../data/petStages'
import { SHOP_ITEMS } from '../data/shopItems'
import { DEFAULT_FOCUS_LABELS } from '../data/focusLabels'

const STORAGE_KEY = 'sprout-game-state-v1'
const AFFECTION_FLOOR = 20
const AFFECTION_DECAY_PER_DAY = 5
const MAX_STREAK_BONUS = 20

const DAY_MS = 24 * 60 * 60 * 1000

function nowISO() {
  return new Date().toISOString()
}

function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function daysBetween(a, b) {
  return Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / DAY_MS)
}

function createDefaultState() {
  return {
    pet: {
      name: 'Sprout',
      stage: 1,
      totalFocusMinutes: 0,
      affection: 100,
      lastFedTimestamp: null,
      equippedOutfit: 'none',
      createdAt: nowISO(),
    },
    currency: {
      sproutPoints: 0,
    },
    streak: {
      current: 0,
      longest: 0,
      lastSessionDate: null,
    },
    inventory: {
      food: [],
      decor: [],
      outfits: [],
    },
    sessionHistory: [],
    settings: {
      soundOn: true,
      defaultSessionLength: 25,
      focusLabels: [...DEFAULT_FOCUS_LABELS],
    },
  }
}

const GameContext = createContext(null)

export function GameProvider({ children }) {
  const [state, setState] = usePersistedState(STORAGE_KEY, createDefaultState)

  const lastInteractionDate = useMemo(() => {
    const candidates = [state.pet.lastFedTimestamp, state.streak.lastSessionDate, state.pet.createdAt].filter(
      Boolean
    )
    if (candidates.length === 0) return new Date()
    return new Date(Math.max(...candidates.map((d) => new Date(d).getTime())))
  }, [state.pet.lastFedTimestamp, state.streak.lastSessionDate, state.pet.createdAt])

  const daysSinceInteraction = useMemo(
    () => Math.max(0, daysBetween(new Date(), lastInteractionDate)),
    [lastInteractionDate]
  )

  const effectiveAffection = useMemo(() => {
    const decayed = state.pet.affection - AFFECTION_DECAY_PER_DAY * daysSinceInteraction
    return Math.min(100, Math.max(AFFECTION_FLOOR, decayed))
  }, [state.pet.affection, daysSinceInteraction])

  const mood = useMemo(() => {
    if (effectiveAffection >= 70) return 'happy'
    if (effectiveAffection >= 35) return 'content'
    return 'wistful'
  }, [effectiveAffection])

  const stageInfo = useMemo(() => getStageProgress(state.pet.totalFocusMinutes), [state.pet.totalFocusMinutes])

  const completeSession = useCallback(
    (durationMinutes, label) => {
      const timestamp = nowISO()
      let result = null

      setState((prev) => {
        const today = new Date(timestamp)
        const lastDate = prev.streak.lastSessionDate ? new Date(prev.streak.lastSessionDate) : null
        let nextCurrentStreak
        if (lastDate && daysBetween(today, lastDate) === 0) {
          nextCurrentStreak = Math.max(prev.streak.current, 1)
        } else if (lastDate && daysBetween(today, lastDate) === 1) {
          nextCurrentStreak = prev.streak.current + 1
        } else {
          nextCurrentStreak = 1
        }
        const nextLongestStreak = Math.max(prev.streak.longest, nextCurrentStreak)

        const spBase = Math.floor(durationMinutes * 0.6)
        const streakBonus = Math.min(nextCurrentStreak * 2, MAX_STREAK_BONUS)
        const spEarned = spBase + streakBonus

        const nextTotalFocusMinutes = prev.pet.totalFocusMinutes + durationMinutes
        const prevStage = getStageForMinutes(prev.pet.totalFocusMinutes)
        const nextStage = getStageForMinutes(nextTotalFocusMinutes)
        const leveledUp = nextStage.id > prevStage.id

        result = {
          spEarned,
          spBase,
          streakBonus,
          streakDay: nextCurrentStreak,
          leveledUp,
          newStage: nextStage,
        }

        return {
          ...prev,
          pet: {
            ...prev.pet,
            totalFocusMinutes: nextTotalFocusMinutes,
            stage: nextStage.id,
            affection: 100,
          },
          currency: {
            ...prev.currency,
            sproutPoints: prev.currency.sproutPoints + spEarned,
          },
          streak: {
            current: nextCurrentStreak,
            longest: nextLongestStreak,
            lastSessionDate: timestamp,
          },
          sessionHistory: [...prev.sessionHistory, { date: timestamp, durationMinutes, label, completed: true }],
        }
      })

      return result
    },
    [setState]
  )

  const logAbandonedSession = useCallback(
    (durationMinutes, label) => {
      const timestamp = nowISO()
      setState((prev) => ({
        ...prev,
        sessionHistory: [...prev.sessionHistory, { date: timestamp, durationMinutes, label, completed: false }],
      }))
    },
    [setState]
  )

  const buyItem = useCallback(
    (itemId) => {
      const item = SHOP_ITEMS.find((i) => i.id === itemId)
      if (!item) return { success: false, reason: 'unknown-item' }

      let outcome = { success: false, reason: 'insufficient-funds' }
      setState((prev) => {
        if (prev.currency.sproutPoints < item.cost) return prev

        const bucket = item.category === 'food' ? 'food' : item.category === 'outfits' ? 'outfits' : 'decor'
        const alreadyOwned = bucket !== 'food' && prev.inventory[bucket].includes(item.id)
        if (alreadyOwned) {
          outcome = { success: false, reason: 'already-owned' }
          return prev
        }

        outcome = { success: true }
        return {
          ...prev,
          currency: { ...prev.currency, sproutPoints: prev.currency.sproutPoints - item.cost },
          inventory: {
            ...prev.inventory,
            [bucket]: [...prev.inventory[bucket], item.id],
          },
        }
      })
      return outcome
    },
    [setState]
  )

  const feedPet = useCallback(
    (foodId) => {
      const item = SHOP_ITEMS.find((i) => i.id === foodId && i.category === 'food')
      if (!item) return { success: false }

      let outcome = { success: false }
      setState((prev) => {
        const idx = prev.inventory.food.indexOf(foodId)
        if (idx === -1) return prev

        const nextFood = [...prev.inventory.food]
        nextFood.splice(idx, 1)

        const decayed = Math.min(
          100,
          Math.max(AFFECTION_FLOOR, prev.pet.affection - AFFECTION_DECAY_PER_DAY * daysSinceInteraction)
        )
        const boosted = Math.min(100, decayed + item.affectionBoost)

        outcome = { success: true, affectionBoost: item.affectionBoost }
        return {
          ...prev,
          pet: { ...prev.pet, affection: boosted, lastFedTimestamp: nowISO() },
          inventory: { ...prev.inventory, food: nextFood },
        }
      })
      return outcome
    },
    [setState, daysSinceInteraction]
  )

  const equipOutfit = useCallback(
    (outfitId) => {
      setState((prev) => {
        if (outfitId !== 'none' && !prev.inventory.outfits.includes(outfitId)) return prev
        return { ...prev, pet: { ...prev.pet, equippedOutfit: outfitId } }
      })
    },
    [setState]
  )

  const setPetName = useCallback(
    (name) => {
      const trimmed = name.trim().slice(0, 20)
      if (!trimmed) return
      setState((prev) => ({ ...prev, pet: { ...prev.pet, name: trimmed } }))
    },
    [setState]
  )

  const updateSettings = useCallback(
    (patch) => {
      setState((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }))
    },
    [setState]
  )

  const resetGame = useCallback(() => {
    setState(createDefaultState())
  }, [setState])

  const value = useMemo(
    () => ({
      state,
      effectiveAffection,
      mood,
      stageInfo,
      daysSinceInteraction,
      completeSession,
      logAbandonedSession,
      buyItem,
      feedPet,
      equipOutfit,
      setPetName,
      updateSettings,
      resetGame,
    }),
    [
      state,
      effectiveAffection,
      mood,
      stageInfo,
      daysSinceInteraction,
      completeSession,
      logAbandonedSession,
      buyItem,
      feedPet,
      equipOutfit,
      setPetName,
      updateSettings,
      resetGame,
    ]
  )

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used within a GameProvider')
  return ctx
}
