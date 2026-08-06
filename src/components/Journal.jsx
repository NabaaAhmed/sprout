import { useMemo, useState } from 'react'
import { useGame } from '../context/GameContext'
import { PixelIcon } from './icons/PixelIcon'
import { JournalNotebook } from './JournalNotebook'

const WEEKS_TO_SHOW = 18
const DAY_MS = 24 * 60 * 60 * 1000
const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
/** Row labels (Sun-first grid): show Mon / Wed / Fri like GitHub. */
const DOW_LABELS = [
  { row: 1, text: 'Mon' },
  { row: 3, text: 'Wed' },
  { row: 5, text: 'Fri' },
]
const CELL_PX = 12
const GAP_PX = 3
const WEEK_STRIDE = CELL_PX + GAP_PX

function isoDateKey(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

function parseLocalDateKey(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function intensityClass(minutes) {
  if (minutes <= 0) return 'bg-sprout-charcoal/10'
  if (minutes < 20) return 'bg-sprout-sage/35'
  if (minutes < 45) return 'bg-sprout-sage/60'
  if (minutes < 90) return 'bg-sprout-moss/65'
  return 'bg-sprout-moss/90'
}

function formatHeatTip(day) {
  const date = parseLocalDateKey(day.key)
  const dateLabel = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  if (day.isFuture) return `${dateLabel} — future`
  if (day.sessions === 0) return `${dateLabel} — no sessions`
  const sessionWord = day.sessions === 1 ? 'session' : 'sessions'
  return `${dateLabel} — ${day.sessions} ${sessionWord}, ${day.minutes} min`
}

function yearRangeLabel(startDate, endDate) {
  const y0 = startDate.getFullYear()
  const y1 = endDate.getFullYear()
  return y0 === y1 ? String(y0) : `${y0}-${y1}`
}

export function Journal() {
  const { state } = useGame()
  const [heatTip, setHeatTip] = useState(null)

  const minutesByDay = useMemo(() => {
    const map = new Map()
    for (const session of state.sessionHistory) {
      if (!session.completed) continue
      const key = isoDateKey(session.date)
      map.set(key, (map.get(key) ?? 0) + session.durationMinutes)
    }
    return map
  }, [state.sessionHistory])

  const sessionsByDay = useMemo(() => {
    const map = new Map()
    for (const session of state.sessionHistory) {
      if (!session.completed) continue
      const key = isoDateKey(session.date)
      map.set(key, (map.get(key) ?? 0) + 1)
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

  const heatmap = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const endOffset = today.getDay() // Sunday = 0
    const totalDays = WEEKS_TO_SHOW * 7
    const start = new Date(today.getTime() - (totalDays - 1 - (6 - endOffset)) * DAY_MS)

    const weeks = []
    let cursor = new Date(start)
    for (let w = 0; w < WEEKS_TO_SHOW; w++) {
      const days = []
      for (let d = 0; d < 7; d++) {
        const key = isoDateKey(cursor)
        days.push({
          key,
          minutes: minutesByDay.get(key) ?? 0,
          sessions: sessionsByDay.get(key) ?? 0,
          isFuture: cursor.getTime() > today.getTime(),
          month: cursor.getMonth(),
          year: cursor.getFullYear(),
          date: new Date(cursor),
        })
        cursor = new Date(cursor.getTime() + DAY_MS)
      }
      weeks.push(days)
    }

    // Month label above the week column that contains the 1st of that month.
    const monthLabels = []
    for (let w = 0; w < weeks.length; w++) {
      const firstOfMonth = weeks[w].find((day) => day.date.getDate() === 1)
      if (!firstOfMonth || firstOfMonth.isFuture) continue
      monthLabels.push({
        weekIndex: w,
        label: firstOfMonth.date.toLocaleDateString(undefined, { month: 'short' }),
      })
    }
    // If the range starts mid-month, label the first column with that month too.
    if (monthLabels.length === 0 || monthLabels[0].weekIndex > 0) {
      const startDay = weeks[0][0]
      const already = monthLabels.some((m) => m.weekIndex === 0)
      if (!already) {
        monthLabels.unshift({
          weekIndex: 0,
          label: startDay.date.toLocaleDateString(undefined, { month: 'short' }),
        })
      }
    }

    return {
      weeks,
      monthLabels,
      yearLabel: yearRangeLabel(start, today),
      start,
      today,
    }
  }, [minutesByDay, sessionsByDay])

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

      <JournalNotebook />

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
        <div className="flex items-baseline justify-between gap-2 mb-3">
          <p className="text-xs font-bold text-sprout-charcoal/50">Study activity</p>
          <p className="text-[10px] font-bold text-sprout-charcoal/35 tabular-nums">{heatmap.yearLabel}</p>
        </div>

        <div className="inline-flex gap-1.5">
          {/* Day-of-week gutter */}
          <div
            className="relative shrink-0 w-7"
            style={{ height: 7 * CELL_PX + 6 * GAP_PX, marginTop: 14 }}
            aria-hidden="true"
          >
            {DOW_LABELS.map(({ row, text }) => (
              <span
                key={text}
                className="absolute right-0 text-[9px] leading-none text-sprout-charcoal/40 font-semibold"
                style={{ top: row * WEEK_STRIDE + 1 }}
              >
                {text}
              </span>
            ))}
          </div>

          <div>
            {/* Month labels aligned to week columns */}
            <div
              className="relative mb-1"
              style={{ height: 12, width: WEEKS_TO_SHOW * WEEK_STRIDE - GAP_PX }}
            >
              {heatmap.monthLabels.map((m) => (
                <span
                  key={`${m.label}-${m.weekIndex}`}
                  className="absolute top-0 text-[9px] leading-none text-sprout-charcoal/45 font-semibold"
                  style={{ left: m.weekIndex * WEEK_STRIDE }}
                >
                  {m.label}
                </span>
              ))}
            </div>

            <div className="flex" style={{ gap: GAP_PX }}>
              {heatmap.weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col" style={{ gap: GAP_PX }}>
                  {week.map((day) => {
                    const tip = formatHeatTip(day)
                    return (
                      <button
                        key={day.key}
                        type="button"
                        title={tip}
                        aria-label={tip}
                        disabled={day.isFuture}
                        onClick={() => setHeatTip(tip)}
                        onMouseEnter={() => setHeatTip(tip)}
                        className={`h-3 w-3 rounded-sm transition-opacity duration-200 ${
                          day.isFuture
                            ? 'bg-transparent cursor-default'
                            : `${intensityClass(day.minutes)} hover:opacity-80`
                        }`}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
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

        {heatTip && (
          <p className="mt-2 text-[11px] font-semibold text-sprout-charcoal/55 animate-fadeIn">{heatTip}</p>
        )}
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
