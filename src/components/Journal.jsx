import { useMemo } from 'react'
import { useGame } from '../context/GameContext'
import { PixelIcon } from './icons/PixelIcon'
import { StudyNotes } from './StudyNotes'

const WEEKS_TO_SHOW = 18
const DAY_MS = 24 * 60 * 60 * 1000

function isoDateKey(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

function intensityClass(minutes) {
  if (minutes <= 0) return 'bg-sprout-charcoal/10'
  if (minutes < 20) return 'bg-sprout-sage/35'
  if (minutes < 45) return 'bg-sprout-sage/60'
  if (minutes < 90) return 'bg-sprout-moss/65'
  return 'bg-sprout-moss/90'
}

export function Journal() {
  const { state } = useGame()

  const minutesByDay = useMemo(() => {
    const map = new Map()
    for (const session of state.sessionHistory) {
      if (!session.completed) continue
      const key = isoDateKey(session.date)
      map.set(key, (map.get(key) ?? 0) + session.durationMinutes)
    }
    return map
  }, [state.sessionHistory])

  const totalHours = useMemo(
    () => (state.pet.totalFocusMinutes / 60).toFixed(1),
    [state.pet.totalFocusMinutes]
  )

  const heatmapWeeks = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    // Align the grid so the last column ends on today, first day-of-week = Sunday.
    const endOffset = today.getDay()
    const totalDays = WEEKS_TO_SHOW * 7
    const start = new Date(today.getTime() - (totalDays - 1 - (6 - endOffset)) * DAY_MS)

    const weeks = []
    let cursor = new Date(start)
    for (let w = 0; w < WEEKS_TO_SHOW; w++) {
      const days = []
      for (let d = 0; d < 7; d++) {
        const key = isoDateKey(cursor)
        const minutes = minutesByDay.get(key) ?? 0
        days.push({ key, minutes, isFuture: cursor.getTime() > today.getTime() })
        cursor = new Date(cursor.getTime() + DAY_MS)
      }
      weeks.push(days)
    }
    return weeks
  }, [minutesByDay])

  const recentSessions = useMemo(
    () => [...state.sessionHistory].reverse().slice(0, 15),
    [state.sessionHistory]
  )

  return (
    <div className="flex flex-col items-center gap-6 px-4 pt-3 pb-32">
      <h2 className="pixel-text text-xl text-sprout-moss">Journal</h2>

      <div className="w-full max-w-md grid grid-cols-3 gap-3">
        <StatCard icon="hourglass" label="Total hours" value={totalHours} />
        <StatCard icon="flame" label="Current streak" value={state.streak.current} />
        <StatCard icon="trophy" label="Longest streak" value={state.streak.longest} />
      </div>

      <div className="panel-paper w-full max-w-md p-5 overflow-x-auto">
        <p className="text-xs font-bold text-sprout-charcoal/50 mb-3">Study activity</p>
        <div className="flex gap-[3px]">
          {heatmapWeeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((day) => (
                <div
                  key={day.key}
                  title={`${day.key}: ${day.minutes} min`}
                  className={`h-3 w-3 rounded-sm ${day.isFuture ? 'bg-transparent' : intensityClass(day.minutes)}`}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-1 text-[10px] text-sprout-charcoal/40">
          <span>Less</span>
          <div className="h-2.5 w-2.5 rounded-sm bg-sprout-charcoal/10" />
          <div className="h-2.5 w-2.5 rounded-sm bg-sprout-sage/35" />
          <div className="h-2.5 w-2.5 rounded-sm bg-sprout-sage/60" />
          <div className="h-2.5 w-2.5 rounded-sm bg-sprout-moss/65" />
          <div className="h-2.5 w-2.5 rounded-sm bg-sprout-moss/90" />
          <span>More</span>
        </div>
      </div>

      <div className="panel-paper w-full max-w-md p-5">
        <p className="text-xs font-bold text-sprout-charcoal/50 mb-3">Recent sessions</p>
        {recentSessions.length === 0 ? (
          <p className="text-sm text-sprout-charcoal/45 italic py-5 text-center">
            No sessions yet — start one from the home screen.
          </p>
        ) : (
          <ul className="space-y-2.5 max-h-72 overflow-y-auto">
            {recentSessions.map((s, i) => (
              <li key={i} className="flex items-center justify-between text-sm border-b border-sprout-charcoal/10 pb-2">
                <div className="min-w-0">
                  <p className="font-bold truncate">{s.label || 'Focus session'}</p>
                  <p className="text-[11px] text-sprout-charcoal/45">
                    {new Date(s.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <span
                  className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${
                    s.completed ? 'bg-sprout-sage/35 text-sprout-moss' : 'bg-sprout-charcoal/10 text-sprout-charcoal/45'
                  }`}
                >
                  {s.durationMinutes}m {s.completed ? '' : '(gave up)'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <StudyNotes />
    </div>
  )
}

function StatCard({ icon, label, value }) {
  return (
    <div className="panel-paper flex flex-col items-center gap-1 py-4 bg-white/70">
      <PixelIcon name={icon} size={18} />
      <span className="display-text text-lg text-sprout-charcoal">{value}</span>
      <span className="text-[10px] text-sprout-charcoal/45 font-semibold text-center">{label}</span>
    </div>
  )
}
