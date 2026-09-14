interface Choice<T extends string> {
  value: T
  label: string
  hint?: string
}

interface CheckboxGroupProps<T extends string> {
  legend: string
  choices: readonly Choice<T>[]
  value: T[]
  onChange: (value: T[]) => void
}

/** Multi-select sibling of `ChoiceGroup` — same accessible fieldset/legend
 * shell and visual language, backed by native checkboxes instead of
 * mutually-exclusive radios. */
export function CheckboxGroup<T extends string>({
  legend,
  choices,
  value,
  onChange,
}: CheckboxGroupProps<T>) {
  const toggle = (choice: T) => {
    onChange(value.includes(choice) ? value.filter((v) => v !== choice) : [...value, choice])
  }

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-sm font-medium text-text">{legend}</legend>
      {choices.map((choice) => (
        <label
          key={choice.value}
          className={`flex cursor-pointer flex-col rounded-[var(--radius-sm)] border px-3 py-2 transition-colors ${
            value.includes(choice.value)
              ? 'border-primary bg-surface-muted'
              : 'border-border bg-surface'
          }`}
        >
          <span className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value.includes(choice.value)}
              onChange={() => toggle(choice.value)}
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
