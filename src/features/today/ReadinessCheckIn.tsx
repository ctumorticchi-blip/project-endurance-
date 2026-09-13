import { useState } from 'react'
import { createReadinessCheck, type ReadinessLevel } from '@/core/history/ReadinessCheck'
import { ReadinessCheckRepository } from '@/core/history/ReadinessCheckRepository'
import type { DateISO } from '@/shared/types/common'

const OPTIONS: { value: ReadinessLevel; label: string }[] = [
  { value: 'tired', label: 'Fatigué' },
  { value: 'normal', label: 'Normal' },
  { value: 'great', label: 'Très bien' },
]

interface ReadinessCheckInProps {
  date: DateISO
  plannedSessionId: string
  onSelect?: (level: ReadinessLevel) => void
}

export function ReadinessCheckIn({ date, plannedSessionId, onSelect }: ReadinessCheckInProps) {
  const [selected, setSelected] = useState<ReadinessLevel | undefined>(() => {
    const existing = ReadinessCheckRepository.loadAll().find(
      (c) => c.date === date && c.plannedSessionId === plannedSessionId,
    )
    return existing?.level
  })

  const handleSelect = (level: ReadinessLevel) => {
    setSelected(level)
    ReadinessCheckRepository.append(createReadinessCheck({ date, plannedSessionId, level }))
    onSelect?.(level)
  }

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium">Comment te sens-tu aujourd'hui ?</legend>
      <div className="flex gap-2">
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected === option.value}
            onClick={() => handleSelect(option.value)}
            className={`flex-1 rounded-lg border px-2 py-2 text-xs font-medium ${
              selected === option.value
                ? 'border-primary bg-surface-muted text-primary'
                : 'border-border bg-surface text-text'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}
