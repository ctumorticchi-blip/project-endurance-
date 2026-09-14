import { Field } from '@/shared/components/Field'
import { INPUT_CLASSES } from '@/shared/components/inputStyles'
import type { OnboardingDraft } from '../onboardingState'

interface EquipmentStepProps {
  draft: OnboardingDraft
  onChange: (patch: Partial<OnboardingDraft>) => void
}

export function EquipmentStep({ draft, onChange }: EquipmentStepProps) {
  const equipment = draft.equipment

  if (draft.sport === 'running') {
    return (
      <div className="flex flex-col gap-5 px-4 py-6">
        <div>
          <h1 className="text-lg font-semibold">Ton matériel</h1>
          <p className="text-sm text-text-muted">
            La course à pied ne demande pas de matériel spécifique — une bonne paire de
            chaussures adaptées à ta foulée suffit. Rien à renseigner ici.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 px-4 py-6">
      <div>
        <h1 className="text-lg font-semibold">Ton matériel</h1>
        <p className="text-sm text-text-muted">
          Pour ne te proposer que des séances réalisables.
        </p>
      </div>

      <label className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-3">
        <input
          type="checkbox"
          checked={equipment.hasPoolAccess}
          onChange={(e) =>
            onChange({ equipment: { ...equipment, hasPoolAccess: e.target.checked } })
          }
        />
        <span className="text-sm">J'ai accès à une piscine</span>
      </label>

      {equipment.hasPoolAccess && (
        <div className="ml-6">
          <Field label="Combien de jours par semaine ?">
            <input
              type="number"
              min={0}
              max={7}
              value={equipment.poolDaysPerWeek ?? ''}
              onChange={(e) =>
                onChange({
                  equipment: {
                    ...equipment,
                    poolDaysPerWeek: e.target.value === '' ? undefined : Number(e.target.value),
                  },
                })
              }
              className={`w-24 ${INPUT_CLASSES}`}
            />
          </Field>
        </div>
      )}

      <label className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-3">
        <input
          type="checkbox"
          checked={equipment.hasBike}
          onChange={(e) => onChange({ equipment: { ...equipment, hasBike: e.target.checked } })}
        />
        <span className="text-sm">J'ai un vélo</span>
      </label>

      <label className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-3">
        <input
          type="checkbox"
          checked={equipment.hasHomeTrainer}
          onChange={(e) =>
            onChange({ equipment: { ...equipment, hasHomeTrainer: e.target.checked } })
          }
        />
        <span className="text-sm">J'ai un home trainer</span>
      </label>
    </div>
  )
}
