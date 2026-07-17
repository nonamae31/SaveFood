import { useState, useEffect, useRef } from 'react'

interface CountdownState {
  hours: number
  minutes: number
  seconds: number
  isExpired: boolean
  totalSecondsLeft: number
}

/**
 * Custom hook đếm ngược đến một thời điểm UTC.
 * @param targetTime - ISO string thời điểm mục tiêu (UTC)
 * @param onExpire - callback khi hết giờ (VD: invalidate React Query)
 */
export function useCountdown(targetTime: string | null | undefined, onExpire?: () => void): CountdownState {
  const [state, setState] = useState<CountdownState>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
    totalSecondsLeft: 0,
  })

  const expiredRef = useRef(false)
  const onExpireRef = useRef(onExpire)
  onExpireRef.current = onExpire

  useEffect(() => {
    if (!targetTime) {
      setState({ hours: 0, minutes: 0, seconds: 0, isExpired: false, totalSecondsLeft: 0 })
      return
    }

    expiredRef.current = false

    const tick = () => {
      const now = Date.now()
      // Normalize targetTime to UTC if missing 'Z' or '+'
      const normalizedTime = targetTime.endsWith('Z') || targetTime.includes('+') 
        ? targetTime 
        : targetTime + 'Z'
      const target = new Date(normalizedTime).getTime()
      const diffMs = target - now

      if (diffMs <= 0) {
        setState({ hours: 0, minutes: 0, seconds: 0, isExpired: true, totalSecondsLeft: 0 })
        if (!expiredRef.current) {
          expiredRef.current = true
          onExpireRef.current?.()
        }
        return
      }

      const totalSeconds = Math.floor(diffMs / 1000)
      const hours = Math.floor(totalSeconds / 3600)
      const minutes = Math.floor((totalSeconds % 3600) / 60)
      const seconds = totalSeconds % 60

      setState({ hours, minutes, seconds, isExpired: false, totalSecondsLeft: totalSeconds })
    }

    tick() // run immediately
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [targetTime])

  return state
}
