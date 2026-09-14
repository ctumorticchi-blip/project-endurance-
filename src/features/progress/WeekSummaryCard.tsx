import type { WeekSummary } from '@/engine/history/buildLastWeekSummary'
import { Card } from '@/shared/components/Card'
import { formatHoursAndMinutes } from '@/shared/utils/duration'

interface WeekSummaryCardProps {
  summary: WeekSummary
}

function formatWeekRange(weekStart: string): string {
  const start = new Date(weekStart)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const fmt = (d: Date) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  return `${fmt(start)} au ${fmt(end)}`
}

/**
 * A short, automatic recap of the last fully elapsed week — adherence
 * (sessions actually done vs planned) and volume, in plain sentences
 * rather than a second chart (brief: no avalanche de graphiques).
 */
export function WeekSummaryCard({ summary }: WeekSummaryCardProps) {
  const { plannedCount, completedCount, plannedMinutes, actualMinutes } = summary

  const adherenceSentence =
    plannedCount === 0
      ? "C'était une semaine de repos complète, sans séance programmée."
      : `${completedCount}/${plannedCount} séance${plannedCount === 1 ? '' : 's'} réalisée${completedCount === 1 ? '' : 's'}, pour ${formatHoursAndMinutes(actualMinutes)} sur ${formatHoursAndMinutes(plannedMinutes)} prévues.`

  return (
    <Card variant="raised" className="flex flex-col gap-1">
      <h2 className="text-sm font-semibold">Résumé de la semaine dernière</h2>
      <p className="text-xs text-text-muted">Du {formatWeekRange(summary.weekStart)}</p>
      <p className="mt-1 text-sm">{adherenceSentence}</p>
    </Card>
  )
}
