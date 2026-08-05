import { useEffect, useRef, useState } from 'react'

/**
 * Like useState, but reads its initial value from localStorage and
 * writes every update back. Safe against corrupt/missing storage.
 */
export function usePersistedState(key, initialValue) {
  const [state, setState] = useState(() => {
    const fallback = typeof initialValue === 'function' ? initialValue() : initialValue
    try {
      const stored = window.localStorage.getItem(key)
      if (stored != null) {
        const parsed = JSON.parse(stored)
        // If the fallback factory returned a normalized object shape, prefer
        // re-running a normalizer when the caller passed one via `initialValue`
        // that accepts the raw parse — otherwise return parsed as-is.
        if (typeof initialValue === 'function' && initialValue.length >= 1) {
          return initialValue(parsed)
        }
        return parsed
      }
    } catch (err) {
      console.warn(`usePersistedState: failed to read "${key}"`, err)
    }
    return fallback
  })

  const keyRef = useRef(key)

  useEffect(() => {
    try {
      window.localStorage.setItem(keyRef.current, JSON.stringify(state))
    } catch (err) {
      console.warn(`usePersistedState: failed to write "${keyRef.current}"`, err)
    }
  }, [state])

  return [state, setState]
}
