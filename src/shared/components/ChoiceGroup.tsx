interface Choice<T extends string> {
  value: T
  label: string
  hint?: string
}

interface ChoiceGroupProps<T extends string> {
  legend: string
  name: string
  choices: readonly Choice<T>[]
  value: T | undefined
  onChange: (value: T) => void
}

/** Accessible single-select control backed by native radio inputs — no
 * custom ARIA needed, keyboard navigation and labeling come for free. */
export function ChoiceGroup<T extends string>({
  legend,
  name,
  choices,
  value,
  onChange,
}: ChoiceGroupProps<T>) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-sm font-medium text-text">{legend}</legend>
      {choices.map((choice) => (
        <label
          key={choice.value}
          className={`flex cursor-pointer flex-col rounded-lg border px-3 py-2 ${
            value === choice.value
              ? 'border-primary bg-surface-muted'
              : 'border-border bg-surface'
          }`}
        >
          <span className="flex items-center gap-2">
            <input
              type="radio"
              name={name}
              value={choice.value}
              checked={value === choice.value}
              onChange={() => onChange(choice.value)}
              className="accent-[color:var(--color-primary)]"
            />
            <span className="text-sm">{choice.label}</span>
          </span>
          {choice.hint && <span className="ml-6 text-xs text-text-muted">{choice.hint}</span>}
        </label>
      ))}
    </fieldset>
  )
}
