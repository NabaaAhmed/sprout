import { useEffect, useRef, useState } from 'react'

/**
 * Like useState, but reads its initial value from localStorage and
 * writes every update back. Safe against corrupt/missing storage.
 */
export function usePersistedState(key, initialValue) {
  const [state, setState] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key)
      if (stored != null) return JSON.parse(stored)
    } catch (err) {
      console.warn(`usePersistedState: failed to read "${key}"`, err)
    }
    return typeof initialValue === 'function' ? initialValue() : initialValue
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
