import { useEffect, useRef, useState } from 'react'

export interface Countdown {
  remaining: number
  running: boolean
  pause: () => void
  resume: () => void
}

/**
 * A one-second-tick countdown starting at `durationSec`. To restart it for
 * a new duration, remount the component that calls this hook (e.g. render
 * it with `key={stepKey}`) rather than trying to reset it in place — that
 * keeps this hook's state genuinely local to "this step is being timed"
 * instead of layering a reset effect on top.
 */
export function useCountdown(durationSec: number, onComplete: () => void): Countdown {
  const [remaining, setRemaining] = useState(durationSec)
  const [running, setRunning] = useState(true)
  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    onCompleteRef.current = onComplete
  })

  useEffect(() => {
    if (!running) return

    const id = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(id)
          setRunning(false)
          onCompleteRef.current()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(id)
  }, [running])

  return {
    remaining,
    running,
    pause: () => setRunning(false),
    resume: () => setRunning(true),
  }
}
