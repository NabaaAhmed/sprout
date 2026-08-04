import { PixelIcon } from './icons/PixelIcon'

export function StatBar({ icon, label, value, max = 100, colorClass = 'bg-sprout-sage', trailing }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5 text-xs font-bold text-sprout-charcoal/70">
        <span className="flex items-center gap-1.5">
          <PixelIcon name={icon} size={13} />
          <span>{label}</span>
        </span>
        {trailing != null && <span className="display-text text-sprout-charcoal/60">{trailing}</span>}
      </div>
      <div className="h-2.5 w-full rounded-full bg-sprout-charcoal/10 border-2 border-sprout-charcoal/15 overflow-hidden">
        <div
          className={`h-full rounded-full ${colorClass} transition-[width] duration-700 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
