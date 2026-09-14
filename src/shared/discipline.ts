import type { Discipline } from '@/shared/types/common'

/** Shared everywhere a discipline needs a human label — was duplicated
 * across four screens (and inconsistent: "Renfo" in one, "Renforcement"
 * elsewhere) before being consolidated here. */
export const DISCIPLINE_LABELS: Record<Discipline, string> = {
  swim: '🏊 Natation',
  bike: '🚴 Vélo',
  run: '🏃 Course',
  strength: '💪 Renforcement',
  mobility: '🧘 Mobilité',
  brick: '🔀 Brick',
}
