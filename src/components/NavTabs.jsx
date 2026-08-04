import { PixelIcon } from './icons/PixelIcon'

const TABS = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'shop', label: 'Shop', icon: 'shop' },
  { id: 'journal', label: 'Journal', icon: 'journal' },
  { id: 'stats', label: 'Pet', icon: 'heart' },
]

export function NavTabs({ active, onChange }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 px-3 pb-4 pt-1">
      <div className="panel-paper mx-auto max-w-md flex justify-between px-2 py-2.5 bg-sprout-cream/95 backdrop-blur-sm">
        {TABS.map((tab) => {
          const isActive = active === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-1.5 rounded-2xl transition-colors duration-300 ${
                isActive ? 'bg-sprout-sage/35' : 'hover:bg-sprout-sage/10'
              }`}
            >
              <PixelIcon name={tab.icon} size={18} />
              <span className={`pixel-text text-[12px] ${isActive ? 'text-sprout-moss' : 'text-sprout-charcoal/50'}`}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
