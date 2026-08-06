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

const DEFAULT_JOURNAL_TITLES = ['English', 'Math', 'Research', 'Biology', 'Random thoughts']
const MAX_PAGE_TITLE = 60
const MAX_PAGE_CONTENT = 20000

function makeJournalPageId(seed = '') {
  const slug = String(seed)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 24)
  return `page-${slug || 'note'}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function createDefaultJournalPages() {
  return DEFAULT_JOURNAL_TITLES.map((title, i) => ({
    id: `page-default-${i}-${title.toLowerCase().replace(/\s+/g, '-')}`,
    title,
    content: '',
    lastEdited: nowISO(),
  }))
}

function normalizeJournalPages(raw) {
  // if journalPages is already there (even empty), leave it alone — don't re-seed defaults
  if (Array.isArray(raw?.journalPages)) {
    return raw.journalPages
      .filter((p) => p && typeof p === 'object')
      .map((p, i) => ({
        id: typeof p.id === 'string' && p.id ? p.id : makeJournalPageId(`migrated-${i}`),
        title: String(p.title ?? 'Untitled').trim().slice(0, MAX_PAGE_TITLE) || 'Untitled',
        content: String(p.content ?? '').slice(0, MAX_PAGE_CONTENT),
        lastEdited: typeof p.lastEdited === 'string' ? p.lastEdited : nowISO(),
      }))
  }

  const pages = createDefaultJournalPages()
  const legacy = typeof raw?.journalNotes === 'string' ? raw.journalNotes.trim() : ''
  if (legacy) {
    const target = pages.find((p) => p.title === 'Random thoughts') ?? pages[0]
    target.content = legacy.slice(0, MAX_PAGE_CONTENT)
    target.lastEdited = nowISO()
  }
  return pages
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
      equippedStickers: [],
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
      stickers: [],
    },
    sessionHistory: [],
    // old study-note list — kept around so older saves still merge cleanly
    notes: [],
    // quiz tab draft (survives refresh, which i definitely wanted)
    quizNotesDraft: '',
    // old single-string journal — migrated into journalPages now
    journalNotes: '',
    // multi-page notebook (no ai, just local notes)
    journalPages: createDefaultJournalPages(),
    // past quiz runs + scores
    quizAttempts: [],
    settings: {
      soundOn: true,
      defaultSessionLength: 25,
      focusLabels: [...DEFAULT_FOCUS_LABELS],
    },
  }
}

// fill in missing fields from older localStorage saves (stickers/notes/etc)
function normalizeState(raw) {
  const defaults = createDefaultState()
  if (!raw || typeof raw !== 'object') return defaults
  return {
    ...defaults,
    ...raw,
    pet: {
      ...defaults.pet,
      ...(raw.pet ?? {}),
      equippedStickers: Array.isArray(raw.pet?.equippedStickers) ? raw.pet.equippedStickers : [],
    },
    currency: { ...defaults.currency, ...(raw.currency ?? {}) },
    streak: { ...defaults.streak, ...(raw.streak ?? {}) },
    inventory: {
      ...defaults.inventory,
      ...(raw.inventory ?? {}),
      stickers: Array.isArray(raw.inventory?.stickers) ? raw.inventory.stickers : [],
    },
    sessionHistory: Array.isArray(raw.sessionHistory) ? raw.sessionHistory : [],
    notes: Array.isArray(raw.notes) ? raw.notes : [],
    quizNotesDraft: typeof raw.quizNotesDraft === 'string' ? raw.quizNotesDraft : '',
    journalNotes: typeof raw.journalNotes === 'string' ? raw.journalNotes : '',
    journalPages: normalizeJournalPages(raw),
    quizAttempts: Array.isArray(raw.quizAttempts) ? raw.quizAttempts : [],
    settings: {
      ...defaults.settings,
      ...(raw.settings ?? {}),
      focusLabels: Array.isArray(raw.settings?.focusLabels)
        ? raw.settings.focusLabels
        : [...DEFAULT_FOCUS_LABELS],
    },
  }
}

const GameContext = createContext(null)

export function GameProvider({ children }) {
  const [state, setState] = usePersistedState(STORAGE_KEY, (raw) => normalizeState(raw))

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

        const bucket =
          item.category === 'food'
            ? 'food'
            : item.category === 'outfits'
              ? 'outfits'
              : item.category === 'stickers'
                ? 'stickers'
                : 'decor'
        const alreadyOwned = bucket !== 'food' && (prev.inventory[bucket] ?? []).includes(item.id)
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
            [bucket]: [...(prev.inventory[bucket] ?? []), item.id],
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

  // pulled out of feedPet so the ui can do the chew animation first —
  // item leaves inventory right away (no double-feed) but affection waits
  // until the animation's done. not sure if best but it works.
  const consumeFood = useCallback(
    (foodId) => {
      const item = SHOP_ITEMS.find((i) => i.id === foodId && i.category === 'food')
      if (!item) return { success: false }

      let outcome = { success: false }
      setState((prev) => {
        const idx = prev.inventory.food.indexOf(foodId)
        if (idx === -1) return prev

        const nextFood = [...prev.inventory.food]
        nextFood.splice(idx, 1)

        outcome = { success: true, item }
        return { ...prev, inventory: { ...prev.inventory, food: nextFood } }
      })
      return outcome
    },
    [setState]
  )

  const applyFeedBoost = useCallback(
    (affectionBoost) => {
      setState((prev) => {
        const decayed = Math.min(
          100,
          Math.max(AFFECTION_FLOOR, prev.pet.affection - AFFECTION_DECAY_PER_DAY * daysSinceInteraction)
        )
        const boosted = Math.min(100, decayed + affectionBoost)
        return { ...prev, pet: { ...prev.pet, affection: boosted, lastFedTimestamp: nowISO() } }
      })
    },
    [setState, daysSinceInteraction]
  )

  const toggleSticker = useCallback(
    (stickerId) => {
      setState((prev) => {
        if (!(prev.inventory.stickers ?? []).includes(stickerId)) return prev
        const equipped = prev.pet.equippedStickers ?? []
        const nextEquipped = equipped.includes(stickerId)
          ? equipped.filter((id) => id !== stickerId)
          : [...equipped, stickerId]
        return { ...prev, pet: { ...prev.pet, equippedStickers: nextEquipped } }
      })
    },
    [setState]
  )

  const equipOutfit = useCallback(
    (outfitId) => {
      setState((prev) => {
        if (outfitId !== 'none' && !(prev.inventory.outfits ?? []).includes(outfitId)) return prev
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

  const setQuizNotesDraft = useCallback(
    (text) => {
      setState((prev) => ({ ...prev, quizNotesDraft: String(text ?? '').slice(0, 8000) }))
    },
    [setState]
  )

  const addJournalPage = useCallback(
    (title) => {
      const trimmed = String(title ?? '')
        .trim()
        .slice(0, MAX_PAGE_TITLE)
      if (!trimmed) return null
      const page = {
        id: makeJournalPageId(trimmed),
        title: trimmed,
        content: '',
        lastEdited: nowISO(),
      }
      setState((prev) => ({
        ...prev,
        journalPages: [...(prev.journalPages ?? []), page],
      }))
      return page.id
    },
    [setState]
  )

  const updateJournalPage = useCallback(
    (id, patch) => {
      setState((prev) => ({
        ...prev,
        journalPages: (prev.journalPages ?? []).map((page) => {
          if (page.id !== id) return page
          const next = { ...page, lastEdited: nowISO() }
          if (typeof patch?.title === 'string') {
            const title = patch.title.trim().slice(0, MAX_PAGE_TITLE)
            if (title) next.title = title
          }
          if (typeof patch?.content === 'string') {
            next.content = patch.content.slice(0, MAX_PAGE_CONTENT)
          }
          return next
        }),
      }))
    },
    [setState]
  )

  const deleteJournalPage = useCallback(
    (id) => {
      setState((prev) => ({
        ...prev,
        journalPages: (prev.journalPages ?? []).filter((page) => page.id !== id),
      }))
    },
    [setState]
  )

  const awardSproutPoints = useCallback(
    (amount) => {
      const n = Math.floor(Number(amount) || 0)
      if (n <= 0) return
      setState((prev) => ({
        ...prev,
        currency: { ...prev.currency, sproutPoints: prev.currency.sproutPoints + n },
      }))
    },
    [setState]
  )

  const saveQuizAttempt = useCallback(
    (attempt) => {
      setState((prev) => ({
        ...prev,
        quizAttempts: [...(prev.quizAttempts ?? []), attempt].slice(-50),
      }))
    },
    [setState]
  )

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
      consumeFood,
      applyFeedBoost,
      equipOutfit,
      toggleSticker,
      setPetName,
      updateSettings,
      resetGame,
      setQuizNotesDraft,
      addJournalPage,
      updateJournalPage,
      deleteJournalPage,
      awardSproutPoints,
      saveQuizAttempt,
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
      consumeFood,
      applyFeedBoost,
      equipOutfit,
      toggleSticker,
      setPetName,
      updateSettings,
      resetGame,
      setQuizNotesDraft,
      addJournalPage,
      updateJournalPage,
      deleteJournalPage,
      awardSproutPoints,
      saveQuizAttempt,
    ]
  )

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used within a GameProvider')
  return ctx
}
