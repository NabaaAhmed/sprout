import { useEffect, useRef, useState } from 'react'

/**
 * A text input with quick-select suggestions. Picking a suggestion just
 * fills the field — it's never locked, so typing something custom
 * afterward (or instead) always works.
 */
export function Combobox({ value, onChange, options, placeholder, maxLength }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    function handlePointerDown(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [])

  const filtered = value.trim()
    ? options.filter((option) => option.toLowerCase().includes(value.trim().toLowerCase()))
    : options

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          maxLength={maxLength}
          className="font-body w-full rounded-xl border-2 border-sprout-charcoal/15 px-3 py-2 pr-8 text-sm bg-white focus:outline-none focus:border-sprout-moss/50 transition-colors duration-300"
        />
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle class suggestions"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-sprout-charcoal/30 hover:text-sprout-charcoal/60 transition-colors duration-300"
        >
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {open && filtered.length > 0 && (
        <ul className="absolute z-10 mt-1.5 w-full max-h-48 overflow-y-auto rounded-2xl border-2 border-sprout-charcoal/10 bg-white py-1 shadow-sm animate-fadeIn">
          {filtered.map((option) => (
            <li key={option}>
              <button
                type="button"
                onClick={() => {
                  onChange(option)
                  setOpen(false)
                }}
                className={`font-body w-full text-left px-3 py-1.5 text-sm transition-colors duration-200 hover:bg-sprout-sage/12 ${
                  option === value ? 'text-sprout-moss font-bold' : 'text-sprout-charcoal/75'
                }`}
              >
                {option}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
