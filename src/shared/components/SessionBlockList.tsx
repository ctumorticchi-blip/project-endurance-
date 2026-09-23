import { Fragment, type ReactNode } from 'react'
import type { PlannedSession } from '@/core/training/PlannedSession'
import type { WorkoutBlock } from '@/core/training/WorkoutBlock'
import type { AthleteZones } from '@/engine/calibration/calculateAthleteZones'
import { DISCIPLINE_LABELS } from '@/shared/discipline'
import { hasStructuredSections, inferBlockRole, inferBrickLeg } from '@/shared/utils/blockPresentation'
import { resolveBlockTargetDescription } from '@/shared/utils/intensityDisplay'
import { formatBlock } from '@/shared/utils/workoutBlock'
import { Card } from './Card'

const SECTION_LABELS = {
  warmup: 'Échauffement',
  main: 'Bloc principal',
  cooldown: 'Retour au calme',
} as const

/** Strips the emoji prefix from `DISCIPLINE_LABELS` for inline part titles
 * ("Partie 1 · Vélo", not "Partie 1 · 🚴 Vélo"). */
function disciplineName(discipline: 'swim' | 'bike' | 'run'): string {
  return DISCIPLINE_LABELS[discipline].replace(/^\S+\s/, '')
}

interface SessionBlockListProps {
  session: PlannedSession
  zones: AthleteZones
  /** When provided, each block renders as a checkbox the athlete can tick
   * off during execution (the Workout Player's checklist mode) rather than
   * a plain read-only card (Today / session detail). */
  checkedBlockIds?: Set<string>
  onToggleBlock?: (blockId: string) => void
}

function BlockCard({
  block,
  discipline,
  zones,
  checked,
  onToggle,
}: {
  block: WorkoutBlock
  discipline: PlannedSession['discipline']
  zones: AthleteZones
  checked?: boolean
  onToggle?: () => void
}) {
  const targetDescription = resolveBlockTargetDescription(discipline, block, zones) ?? block.targetZone
  const body = (
    <span className="flex-1">
      <p className={`font-medium ${checked ? 'line-through' : ''}`}>{block.label}</p>
      <p className="text-xs text-text-muted">
        {formatBlock(block)}
        {targetDescription ? ` · ${targetDescription}` : ''} · RPE {block.targetRpeMin}-{block.targetRpeMax}
      </p>
      {block.note && <p className="mt-1 text-xs text-text-muted">{block.note}</p>}
    </span>
  )

  return (
    <Card as="li" variant="muted" className="text-sm">
      {onToggle ? (
        <label className="flex cursor-pointer items-start gap-3">
          <input type="checkbox" checked={checked} onChange={onToggle} className="mt-1" />
          {body}
        </label>
      ) : (
        <div className="flex items-start gap-3">{body}</div>
      )}
    </Card>
  )
}

function Section({ title, blocks, render }: { title: string; blocks: WorkoutBlock[]; render: (b: WorkoutBlock) => ReactNode }) {
  if (blocks.length === 0) return null
  return (
    <Fragment>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">{title}</h3>
      <ol className="flex flex-col gap-2">{blocks.map(render)}</ol>
    </Fragment>
  )
}

/**
 * The full structured prescription for one session (Coaching Experience V1
 * brief §6/§17/§48): warm-up / main set / cool-down grouped visually when
 * the session actually has them, a brick's bike/transition/run legs shown
 * as explicit parts rather than one flat 90-minute block, and every
 * block's target resolved to the best real metric the athlete has tested
 * for (`resolveBlockTargetDescription`) instead of a bare zone name.
 * Reused by Today, the day-detail plan view, and the Workout Player so the
 * three screens never re-implement (or subtly disagree on) this logic.
 */
export function SessionBlockList({ session, zones, checkedBlockIds, onToggleBlock }: SessionBlockListProps) {
  const renderBlock = (block: WorkoutBlock, discipline: PlannedSession['discipline'] = session.discipline) => (
    <BlockCard
      key={block.id}
      block={block}
      discipline={discipline}
      zones={zones}
      checked={checkedBlockIds?.has(block.id)}
      onToggle={onToggleBlock ? () => onToggleBlock(block.id) : undefined}
    />
  )

  if (session.discipline === 'brick') {
    // Group consecutive blocks by inferred leg (bike / transition / run) —
    // brief §48: a brick must never render as one vague composite block.
    const groups: { leg: string; blocks: WorkoutBlock[] }[] = []
    for (const block of session.blocks) {
      const leg = inferBrickLeg(block) ?? 'main'
      const lastGroup = groups.at(-1)
      if (lastGroup && lastGroup.leg === leg) lastGroup.blocks.push(block)
      else groups.push({ leg, blocks: [block] })
    }
    let partNumber = 0
    return (
      <div className="flex flex-col gap-4">
        {groups.map((group, i) => {
          const legDiscipline =
            group.leg === 'bike' || group.leg === 'run' || group.leg === 'swim' ? group.leg : 'run'
          const isTransition = group.leg === 'transition'
          if (!isTransition) partNumber += 1
          const title = isTransition ? 'Transition' : `Partie ${partNumber} · ${disciplineName(legDiscipline)}`
          return <Section key={i} title={title} blocks={group.blocks} render={(b) => renderBlock(b, legDiscipline)} />
        })}
      </div>
    )
  }

  if (!hasStructuredSections(session.blocks)) {
    return <ol className="flex flex-col gap-2">{session.blocks.map((b) => renderBlock(b))}</ol>
  }

  const sections: Record<'warmup' | 'main' | 'cooldown', WorkoutBlock[]> = { warmup: [], main: [], cooldown: [] }
  for (const block of session.blocks) sections[inferBlockRole(block)].push(block)

  return (
    <div className="flex flex-col gap-4">
      <Section title={SECTION_LABELS.warmup} blocks={sections.warmup} render={(b) => renderBlock(b)} />
      <Section title={SECTION_LABELS.main} blocks={sections.main} render={(b) => renderBlock(b)} />
      <Section title={SECTION_LABELS.cooldown} blocks={sections.cooldown} render={(b) => renderBlock(b)} />
    </div>
  )
}
