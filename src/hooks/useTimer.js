import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Countdown timer in seconds. Ticks once per second while running,
 * independent of React re-renders (uses Date.now deltas so background
 * tabs don't drift too far).
 */
export function useTimer({ onComplete } = {}) {
  const [totalSeconds, setTotalSeconds] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const intervalRef = useRef(null)
  const deadlineRef = useRef(null)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  const clearTick = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const tick = useCallback(() => {
    const remainingMs = deadlineRef.current - Date.now()
    const remaining = Math.max(0, Math.ceil(remainingMs / 1000))
    setSecondsLeft(remaining)
    if (remaining <= 0) {
      clearTick()
      setIsRunning(false)
      onCompleteRef.current?.()
    }
  }, [clearTick])

  const start = useCallback(
    (durationSeconds) => {
      clearTick()
      setTotalSeconds(durationSeconds)
      setSecondsLeft(durationSeconds)
      deadlineRef.current = Date.now() + durationSeconds * 1000
      setIsRunning(true)
      intervalRef.current = setInterval(tick, 250)
    },
    [clearTick, tick]
  )

  const pause = useCallback(() => {
    if (!isRunning) return
    clearTick()
    setIsRunning(false)
  }, [clearTick, isRunning])

  const resume = useCallback(() => {
    if (isRunning || secondsLeft <= 0) return
    deadlineRef.current = Date.now() + secondsLeft * 1000
    setIsRunning(true)
    intervalRef.current = setInterval(tick, 250)
  }, [isRunning, secondsLeft, tick])

  const reset = useCallback(() => {
    clearTick()
    setIsRunning(false)
    setSecondsLeft(0)
    setTotalSeconds(0)
  }, [clearTick])

  useEffect(() => () => clearTick(), [clearTick])

  const progress = totalSeconds > 0 ? 1 - secondsLeft / totalSeconds : 0

  return { secondsLeft, totalSeconds, isRunning, progress, start, pause, resume, reset }
}
