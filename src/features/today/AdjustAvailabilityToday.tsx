import { useState } from 'react'
import { createAvailabilityException } from '@/core/availability/Availability'
import { AvailabilityRepository } from '@/core/availability/AvailabilityRepository'
import { Button } from '@/shared/components/Button'
import type { DateISO } from '@/shared/types/common'

interface AdjustAvailabilityTodayProps {
  date: DateISO
  onAdjust: (availableMinutes: number) => void
}

/** Lets the athlete declare a one-off "I have less time today" exception
 * (brief §22) without touching their weekly pattern. */
export function AdjustAvailabilityToday({ date, onAdjust }: AdjustAvailabilityTodayProps) {
  const [open, setOpen] = useState(false)
  const [minutes, setMinutes] = useState<number | ''>('')

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-center text-xs text-text-muted underline"
      >
        Aujourd'hui j'ai moins de temps
      </button>
    )
  }

  const handleConfirm = () => {
    if (minutes === '' || minutes < 0) return
    const availability = AvailabilityRepository.load()
    if (availability) {
      AvailabilityRepository.save({
        ...availability,
        exceptions: [
          ...availability.exceptions.filter((e) => e.date !== date),
          createAvailabilityException({ date, type: 'reduced', minutes }),
        ],
      })
    }
    setOpen(false)
    onAdjust(minutes)
  }

  return (
    <div className="flex items-end gap-2 rounded-lg border border-border bg-surface p-3">
      <label className="flex flex-1 flex-col gap-1">
        <span className="text-xs font-medium">Minutes disponibles aujourd'hui</span>
        <input
          type="number"
          min={0}
          value={minutes}
          onChange={(e) => setMinutes(e.target.value === '' ? '' : Number(e.target.value))}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
      </label>
      <Button onClick={handleConfirm} className="px-3 py-2 text-xs">
        Ajuster
      </Button>
    </div>
  )
}
