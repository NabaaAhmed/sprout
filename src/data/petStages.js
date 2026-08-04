// Growth stages tied to cumulative focus minutes (spec: hours * 60).
export const STAGES = [
  {
    id: 1,
    name: 'Seedling',
    minMinutes: 0,
    blurb: 'A tiny sprout with a leaf-nub. So much growing ahead!',
  },
  {
    id: 2,
    name: 'Sprig',
    minMinutes: 5 * 60,
    blurb: 'A small leafy creature — look, it grew a second little leaf!',
  },
  {
    id: 3,
    name: 'Bloom',
    minMinutes: 20 * 60,
    blurb: 'A flower bloomed on its head. Bigger and fluffier now.',
  },
  {
    id: 4,
    name: 'Ancient Bloom',
    minMinutes: 50 * 60,
    blurb: 'Glowing softly, with tiny fireflies drifting around it.',
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
