import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { findSessionById } from '@/core/training/TrainingPlan'
import { TrainingPlanRepository } from '@/core/training/TrainingPlanRepository'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { PlaceholderPage } from '@/shared/components/PlaceholderPage'
import { DISCIPLINE_LABELS } from '@/shared/discipline'
import { formatBlock } from '@/shared/utils/workoutBlock'

/**
 * The session player shows the whole structure at once instead of running
 * a per-step countdown: an athlete following a printed or remembered plan
 * doesn't need the app to hold a stopwatch, and a countdown assumes a
 * precision (exact seconds per block) the app doesn't actually have any
 * way to verify was followed (brief feedback: show the program, not a
 * timer). Blocks can be ticked off as a simple checklist while training;
 * "Séance effectuée" always leads straight to the feedback form —
 * ticking blocks is a memory aid, not a gate.
 */
export function SessionPlayerPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const plan = TrainingPlanRepository.load()
  const session = plan && sessionId ? findSessionById(plan, sessionId) : undefined
  const [checkedBlockIds, setCheckedBlockIds] = useState<Set<string>>(new Set())

  if (!session) {
    return (
      <PlaceholderPage
        title="Séance introuvable"
        description="Cette séance n'existe plus dans ton programme."
      />
    )
  }

  const toggleBlock = (blockId: string) => {
    setCheckedBlockIds((prev) => {
      const next = new Set(prev)
      if (next.has(blockId)) next.delete(blockId)
      else next.add(blockId)
      return next
    })
  }

  return (
    <div className="flex flex-col gap-5 px-4 py-6">
      <Link to="/today" className="text-xs text-text-muted underline">
        Annuler
      </Link>

      <div>
        <p className="text-xs font-medium tracking-wide text-text-muted">
          {DISCIPLINE_LABELS[session.discipline]}
        </p>
        <h1 className="text-lg font-semibold">{session.title}</h1>
        <p className="mt-1 text-sm text-text-muted">{session.objective}</p>
      </div>

      <ol className="flex flex-col gap-2">
        {session.blocks.map((block) => {
          const checked = checkedBlockIds.has(block.id)
          return (
            <Card key={block.id} as="li" variant="muted" className="text-sm">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleBlock(block.id)}
                  className="mt-1"
                />
                {/* No opacity fade for the checked state: it visually dims
                 * text-muted's already-moderate contrast below WCAG AA
                 * (measured 2.69:1 via a real axe-core scan) — the
                 * strikethrough alone is enough signal. */}
                <span className="flex-1">
                  <p className={`font-medium ${checked ? 'line-through' : ''}`}>{block.label}</p>
                  <p className="text-xs text-text-muted">
                    {formatBlock(block)}
                    {block.targetZone ? ` · ${block.targetZone}` : ''} · RPE {block.targetRpeMin}-
                    {block.targetRpeMax}
                  </p>
                  {block.note && <p className="mt-1 text-xs text-text-muted">{block.note}</p>}
                </span>
              </label>
            </Card>
          )
        })}
      </ol>

      <Link to="/glossary" className="text-center text-xs text-text-muted underline">
        Un terme n'est pas clair ? Voir le glossaire
      </Link>

      <Button onClick={() => void navigate(`/session/${session.id}/feedback`)} className="w-full">
        Séance effectuée
      </Button>
    </div>
  )
}
