import { createListStore, storage } from '@/shared/storage'
import type { FamilyProgressionState } from './progressionState'

const store = createListStore<FamilyProgressionState>({
  storage,
  key: 'progression-states',
  currentVersion: 1,
})

/** One record per workout family the athlete has ever been exposed to.
 * Small (one entry per family, not per session) — never grows unbounded
 * the way a history repository does. */
export const ProgressionStateRepository = {
  loadAll: store.loadAll,
  clear: store.clear,

  loadByFamilyId(familyId: string): FamilyProgressionState | undefined {
    return store.loadAll().find((s) => s.familyId === familyId)
  },

  /** Replaces the record for this family id, or appends a new one — a
   * family's progression state is a singleton per athlete, never appended
   * to like an audit trail. */
  save(next: FamilyProgressionState): void {
    const all = store.loadAll()
    const index = all.findIndex((s) => s.familyId === next.familyId)
    if (index === -1) {
      store.append(next)
      return
    }
    const updated = [...all]
    updated[index] = next
    store.replaceAll(updated)
  },
}
