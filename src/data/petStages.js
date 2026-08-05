// Growth stages tied to cumulative focus minutes (spec: hours * 60).
export const STAGES = [
  {
    id: 1,
    name: 'Seedling',
    minMinutes: 0,
    blurb: 'A tiny sprout peeking from its soil mound. So much growing ahead!',
  },
  {
    id: 2,
    name: 'Sprig',
    minMinutes: 5 * 60,
    blurb: 'Two soft leaves now — settled deeper in the dirt and looking proud.',
  },
  {
    id: 3,
    name: 'Bloom',
    minMinutes: 20 * 60,
    blurb: 'A little flower opened on top. Bigger mound, fluffier sprout.',
  },
  {
    id: 4,
    name: 'Ancient Bloom',
    minMinutes: 50 * 60,
    blurb: 'Rooted and glowing — fireflies drift around its fullest bloom.',
  },
]

export function getStageForMinutes(totalFocusMinutes) {
  let current = STAGES[0]
  for (const stage of STAGES) {
    if (totalFocusMinutes >= stage.minMinutes) current = stage
  }
  return current
}

export function getNextStage(stageId) {
  return STAGES.find((s) => s.id === stageId + 1) ?? null
}

export function getStageProgress(totalFocusMinutes) {
  const current = getStageForMinutes(totalFocusMinutes)
  const next = getNextStage(current.id)
  if (!next) return { current, next: null, progress: 1 }
  const span = next.minMinutes - current.minMinutes
  const into = totalFocusMinutes - current.minMinutes
  return { current, next, progress: Math.min(1, Math.max(0, into / span)) }
}
