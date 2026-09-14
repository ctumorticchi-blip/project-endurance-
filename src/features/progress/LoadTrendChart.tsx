import type { LoadTrendPoint } from '@/engine/history/buildLoadTrend'

interface LoadTrendChartProps {
  points: LoadTrendPoint[]
}

function formatWeekLabel(dateISO: string): string {
  return new Date(dateISO).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

/**
 * Planned vs actual load, one pair of bars per week — still a single chart,
 * not a dashboard (brief §39), just two series instead of one so plan
 * adherence is visible at a glance. Load is the same relative, decomposable
 * unit the plan itself is built from (`engine/metrics/load.ts`), never
 * presented as a certified score.
 */
export function LoadTrendChart({ points }: LoadTrendChartProps) {
  const maxLoad = Math.max(1, ...points.flatMap((p) => [p.plannedLoad, p.actualLoad]))

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-4 text-xs text-text-muted">
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-full bg-primary/30" />
          Prévue
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-full bg-primary" />
          Réalisée
        </span>
      </div>

      <div className="flex items-end gap-2" style={{ height: '4.5rem' }}>
        {points.map((point) => (
          <div
            key={point.weekStart}
            role="img"
            aria-label={`Semaine du ${formatWeekLabel(point.weekStart)} : charge prévue ${point.plannedLoad}, réalisée ${point.actualLoad}`}
            className="flex h-full flex-1 items-end gap-0.5"
          >
            <div
              className="h-full flex-1 rounded-t-[var(--radius-sm)] bg-primary/30"
              style={{
                height: point.plannedLoad > 0 ? `${Math.max(6, (point.plannedLoad / maxLoad) * 100)}%` : '2px',
              }}
            />
            <div
              className="h-full flex-1 rounded-t-[var(--radius-sm)] bg-primary"
              style={{
                height: point.actualLoad > 0 ? `${Math.max(6, (point.actualLoad / maxLoad) * 100)}%` : '2px',
              }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        {points.map((point) => (
          <span key={point.weekStart} className="flex-1 text-center text-[10px] text-text-faint">
            {formatWeekLabel(point.weekStart)}
          </span>
        ))}
      </div>
    </div>
  )
}
