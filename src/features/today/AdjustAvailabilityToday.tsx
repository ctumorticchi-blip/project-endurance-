import { useState } from 'react'
import { createAvailabilityException } from '@/core/availability/Availability'
import { AvailabilityRepository } from '@/core/availability/AvailabilityRepository'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { Field } from '@/shared/components/Field'
import { INPUT_CLASSES } from '@/shared/components/inputStyles'
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
    <Card className="flex items-end gap-2 p-3">
      <div className="flex-1">
        <Field label="Minutes disponibles aujourd'hui">
          <input
            type="number"
            min={0}
            value={minutes}
            onChange={(e) => setMinutes(e.target.value === '' ? '' : Number(e.target.value))}
            className={INPUT_CLASSES}
          />
        </Field>
      </div>
      <Button onClick={handleConfirm} className="px-3 py-2 text-xs">
        Ajuster
      </Button>
    </Card>
  )
}
