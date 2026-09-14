import type { WeeklyVolumePoint } from '@/engine/history/buildWeeklyVolumeTrend'

interface WeeklyVolumeChartProps {
  points: WeeklyVolumePoint[]
}

function formatWeekLabel(dateISO: string): string {
  return new Date(dateISO).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

/**
 * A minimal bar-per-week volume chart — no charting library, just relative
 * bar heights against the tallest week in the window. The brief asks for
 * calm and precise, not a dashboard (brief §39: pas d'avalanche de
 * graphiques), so this stays a single, small, real-data visualization.
 */
export function WeeklyVolumeChart({ points }: WeeklyVolumeChartProps) {
  const maxMinutes = Math.max(1, ...points.map((p) => p.minutes))

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-end gap-2" style={{ height: '4.5rem' }}>
        {points.map((point) => (
          <div key={point.weekStart} className="flex h-full flex-1 items-end">
            <div
              role="img"
              aria-label={`Semaine du ${formatWeekLabel(point.weekStart)} : ${point.minutes} minutes`}
              className="w-full rounded-t-[var(--radius-sm)] bg-primary/70"
              style={{
                height: point.minutes > 0 ? `${Math.max(6, (point.minutes / maxMinutes) * 100)}%` : '2px',
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
