import React from 'react'
import { Clock } from 'lucide-react'
import { useCountdown } from '@/hooks/useCountdown'

interface ListingCountdownBadgeProps {
  targetTime?: string | null
  targetPrice?: number | null
  onExpire?: () => void
}

export const ListingCountdownBadge: React.FC<ListingCountdownBadgeProps> = ({
  targetTime,
  targetPrice,
  onExpire,
}) => {
  const { hours, minutes, seconds, isExpired, totalSecondsLeft } = useCountdown(targetTime, onExpire)

  if (!targetTime || isExpired) return null

  // Format time HH:MM:SS
  const formatTime = (v: number) => v.toString().padStart(2, '0')
  const timeString = `${formatTime(hours)}:${formatTime(minutes)}:${formatTime(seconds)}`

  // Style according to time remaining
  let colorClass = 'bg-blue-100 text-blue-700 border-blue-200'
  if (totalSecondsLeft < 3600) {
    // Less than 1 hour (Red)
    colorClass = 'bg-red-100 text-red-700 border-red-200 animate-pulse'
  } else if (totalSecondsLeft < 3600 * 3) {
    // Less than 3 hours (Orange)
    colorClass = 'bg-orange-100 text-orange-700 border-orange-200'
  }

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-sm font-medium shadow-sm ${colorClass}`}>
      <Clock className="w-4 h-4" />
      <span>{timeString}</span>
      {targetPrice != null && (
        <>
          <span className="mx-0.5 opacity-50">|</span>
          <span className="font-bold">
            -&gt; {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(targetPrice)}
          </span>
        </>
      )}
    </div>
  )
}
