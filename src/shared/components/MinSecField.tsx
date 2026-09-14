import { INPUT_CLASSES } from './inputStyles'

interface MinSecFieldProps {
  legend: string
  idPrefix: string
  minutes: number | ''
  seconds: number | ''
  onMinutesChange: (value: number | '') => void
  onSecondsChange: (value: number | '') => void
  hint?: string
}

/** A time or pace entered as minutes + seconds rather than a single raw
 * "secondes" number — nobody thinks of a 400m swim split or a running
 * pace in bare seconds (brief feedback: ask for the unit people actually
 * think in). Used both for a stopwatch time (calibration tests) and for
 * directly entering an already-known pace value. */
export function MinSecField({
  legend,
  idPrefix,
  minutes,
  seconds,
  onMinutesChange,
  onSecondsChange,
  hint,
}: MinSecFieldProps) {
  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="text-sm font-medium">{legend}</legend>
      <div className="flex items-end gap-2">
        <div className="flex flex-col gap-1">
          <label htmlFor={`${idPrefix}-min`} className="text-xs text-text-muted">
            Minutes
          </label>
          <input
            id={`${idPrefix}-min`}
            type="number"
            min={0}
            value={minutes}
            onChange={(e) => onMinutesChange(e.target.value === '' ? '' : Number(e.target.value))}
            className={`w-20 ${INPUT_CLASSES}`}
          />
        </div>
        <span className="pb-2 text-text-muted">:</span>
        <div className="flex flex-col gap-1">
          <label htmlFor={`${idPrefix}-sec`} className="text-xs text-text-muted">
            Secondes
          </label>
          <input
            id={`${idPrefix}-sec`}
            type="number"
            min={0}
            max={59}
            value={seconds}
            onChange={(e) => onSecondsChange(e.target.value === '' ? '' : Number(e.target.value))}
            className={`w-20 ${INPUT_CLASSES}`}
          />
        </div>
      </div>
      {hint && <p className="text-xs text-text-muted">{hint}</p>}
    </fieldset>
  )
}
