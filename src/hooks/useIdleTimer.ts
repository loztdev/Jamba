import { useEffect, useRef } from 'react'

export function useIdleTimer(
  timeoutMs: number,
  onIdle: () => void,
  onActive: () => void
): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isIdleRef = useRef(false)

  useEffect(() => {
    function reset() {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (isIdleRef.current) {
        isIdleRef.current = false
        onActive()
      }
      timerRef.current = setTimeout(() => {
        isIdleRef.current = true
        onIdle()
      }, timeoutMs)
    }

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'wheel']
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }))

    reset()

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      events.forEach((e) => window.removeEventListener(e, reset))
    }
  }, [timeoutMs, onIdle, onActive])
}
