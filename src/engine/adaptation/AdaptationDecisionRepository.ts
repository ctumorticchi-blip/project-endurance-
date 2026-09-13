import { createListStore, storage } from '@/shared/storage'
import type { AdaptationDecision } from './AdaptationDecision'

const store = createListStore<AdaptationDecision>({
  storage,
  key: 'adaptation-decisions',
  currentVersion: 1,
})

/** Append-only audit trail of every decision the engine has made — feeds
 * debugging, the Progress page, and future UI explanations (brief §28). */
export const AdaptationDecisionRepository = {
  loadAll: store.loadAll,
  append: store.append,
  clear: store.clear,
}
