import { useMemo } from 'react'
import { useGame } from '../context/GameContext'
import { PixelIcon } from './icons/PixelIcon'

const WEEKS_TO_SHOW = 18
const DAY_MS = 24 * 60 * 60 * 1000
const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

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
  const { state, setJournalNotes } = useGame()

  const minutesByDay = useMemo(() => {
    const map = new Map()
    for (const session of state.sessionHistory) {
      if (!session.completed) continue
      const key = isoDateKey(session.date)
      map.set(key, (map.get(key) ?? 0) + session.durationMinutes)
    }
    return map
  }, [state.sessionHistory])

  const labelsByDay = useMemo(() => {
    const map = new Map()
    for (const session of state.sessionHistory) {
      if (!session.completed) continue
      const key = isoDateKey(session.date)
      const list = map.get(key) ?? []
      list.push({
        minutes: session.durationMinutes,
        label: session.label?.trim() || 'Focus session',
      })
      map.set(key, list)
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

  const thisWeek = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const weekStart = new Date(today.getTime() - today.getDay() * DAY_MS)
    const days = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart.getTime() + i * DAY_MS)
      const key = isoDateKey(day)
      const sessions = labelsByDay.get(key) ?? []
      const minutes = minutesByDay.get(key) ?? 0
      days.push({
        key,
        name: WEEKDAY_NAMES[i],
        isToday: key === isoDateKey(today),
        isFuture: day.getTime() > today.getTime(),
        minutes,
        sessions,
      })
    }
    return days
  }, [labelsByDay, minutesByDay])

  return (
    <div className="flex flex-col items-center gap-6 px-4 pt-3 pb-32">
      <h2 className="pixel-text text-xl text-sprout-moss">Journal</h2>

      <div className="w-full max-w-md grid grid-cols-3 gap-3">
        <StatCard icon="hourglass" label="Total hours" value={totalHours} />
        <StatCard icon="flame" label="Current streak" value={state.streak.current} />
        <StatCard icon="trophy" label="Longest streak" value={state.streak.longest} />
      </div>

      <div className="panel-paper w-full max-w-md p-5 space-y-3">
        <div className="flex items-center gap-2">
          <PixelIcon name="pencil" size={14} />
          <p className="text-xs font-bold text-sprout-charcoal/50">My notes</p>
        </div>
        <textarea
          value={state.journalNotes ?? ''}
          onChange={(e) => setJournalNotes(e.target.value)}
          placeholder="Jot anything for yourself — reminders, reflections, to-dos. No AI, just yours."
          rows={5}
          className="font-body w-full resize-none rounded-2xl border-2 border-sprout-charcoal/15 bg-white px-3 py-2.5 text-sm leading-relaxed focus:outline-none focus:border-sprout-moss/50 transition-colors duration-300"
        />
        <p className="text-[10px] text-sprout-charcoal/35">Saved automatically on this device.</p>
      </div>

      <div className="panel-paper w-full max-w-md p-5">
        <p className="text-xs font-bold text-sprout-charcoal/50 mb-3">This week</p>
        <ul className="space-y-2.5">
          {thisWeek.map((day) => (
            <li
              key={day.key}
              className={`flex items-start justify-between gap-3 text-sm border-b border-sprout-charcoal/10 pb-2 last:border-0 ${
                day.isFuture ? 'opacity-40' : ''
              }`}
            >
              <div className="min-w-0">
                <p className={`font-bold ${day.isToday ? 'text-sprout-moss' : 'text-sprout-charcoal/80'}`}>
                  {day.name}
                  {day.isToday ? ' · today' : ''}
                </p>
                {day.sessions.length === 0 ? (
                  <p className="text-[11px] text-sprout-charcoal/40 italic">No sessions</p>
                ) : (
                  <ul className="mt-0.5 space-y-0.5">
                    {day.sessions.map((s, i) => (
                      <li key={i} className="text-[11px] text-sprout-charcoal/60 truncate">
                        {s.minutes} min · {s.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <span className="shrink-0 text-xs font-bold text-sprout-charcoal/45 pt-0.5">
                {day.minutes > 0 ? `${day.minutes}m` : '—'}
              </span>
            </li>
          ))}
        </ul>
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
