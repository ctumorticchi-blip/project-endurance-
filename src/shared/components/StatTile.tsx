interface StatTileProps {
  label: string
  value: string
  hint?: string
}

/** A single labeled metric — used wherever the UI shows a number the user
 * scans at a glance (Progress, session summaries). Keeps label/value/hint
 * hierarchy consistent instead of ad hoc paragraphs. */
export function StatTile({ label, value, hint }: StatTileProps) {
  return (
    <div className="flex flex-col gap-0.5 rounded-[var(--radius-sm)] bg-surface-muted px-3 py-2">
      <span className="text-xs text-text-muted">{label}</span>
      <span className="text-xl font-semibold tabular-nums">{value}</span>
      {hint && <span className="text-xs text-text-faint">{hint}</span>}
    </div>
  )
}
