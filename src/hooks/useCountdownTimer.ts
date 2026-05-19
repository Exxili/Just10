import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

interface UseCountdownTimerOptions {
  durationSeconds: number
  autoStart?: boolean
  initialStartedAtMs?: number
  onComplete?: () => void
}

export function useCountdownTimer({
  durationSeconds,
  autoStart = true,
  initialStartedAtMs,
  onComplete,
}: UseCountdownTimerOptions) {
  const durationMs = durationSeconds * 1000
  const [startedAtMs, setStartedAtMs] = useState<number | null>(
    autoStart && initialStartedAtMs !== undefined ? initialStartedAtMs : null,
  )
  const [pausedAtMs, setPausedAtMs] = useState<number | null>(null)
  const [totalPausedMs, setTotalPausedMs] = useState(0)
  const [nowMs, setNowMs] = useState(initialStartedAtMs ?? 0)
  const completedRef = useRef(false)
  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    if (autoStart && startedAtMs === null) {
      const timeoutId = window.setTimeout(() => {
        const currentTime = Date.now()
        setStartedAtMs(currentTime)
        setNowMs(currentTime)
      }, 0)

      return () => window.clearTimeout(timeoutId)
    }
  }, [autoStart, startedAtMs])

  const isRunning = startedAtMs !== null && pausedAtMs === null
  const isPaused = startedAtMs !== null && pausedAtMs !== null

  const elapsedMs = useMemo(() => {
    if (startedAtMs === null) {
      return 0
    }

    const effectiveNow = pausedAtMs ?? nowMs
    return Math.min(durationMs, Math.max(0, effectiveNow - startedAtMs - totalPausedMs))
  }, [durationMs, nowMs, pausedAtMs, startedAtMs, totalPausedMs])

  const elapsedSeconds = Math.floor(elapsedMs / 1000)
  const remainingSeconds = Math.max(0, durationSeconds - elapsedSeconds)
  const progress = durationMs === 0 ? 1 : elapsedMs / durationMs

  useEffect(() => {
    if (!isRunning) {
      return
    }

    const intervalId = window.setInterval(() => setNowMs(Date.now()), 250)
    return () => window.clearInterval(intervalId)
  }, [isRunning])

  useEffect(() => {
    if (remainingSeconds === 0 && startedAtMs !== null && !completedRef.current) {
      completedRef.current = true
      onCompleteRef.current?.()
    }
  }, [remainingSeconds, startedAtMs])

  const start = useCallback(() => {
    completedRef.current = false
    setStartedAtMs(Date.now())
    setPausedAtMs(null)
    setTotalPausedMs(0)
    setNowMs(Date.now())
  }, [])

  const pause = useCallback(() => {
    if (startedAtMs !== null && pausedAtMs === null) {
      setPausedAtMs(Date.now())
    }
  }, [pausedAtMs, startedAtMs])

  const resume = useCallback(() => {
    if (pausedAtMs !== null) {
      setTotalPausedMs((value) => value + Date.now() - pausedAtMs)
      setPausedAtMs(null)
      setNowMs(Date.now())
    }
  }, [pausedAtMs])

  const stop = useCallback(() => {
    setPausedAtMs(Date.now())
  }, [])

  const reset = useCallback(() => {
    completedRef.current = false
    setStartedAtMs(autoStart ? Date.now() : null)
    setPausedAtMs(null)
    setTotalPausedMs(0)
    setNowMs(Date.now())
  }, [autoStart])

  return {
    remainingSeconds,
    elapsedSeconds,
    progress,
    isRunning,
    isPaused,
    start,
    pause,
    resume,
    stop,
    reset,
  }
}
