import { createListStore, storage } from '@/shared/storage'
import type { CompletedSession } from './CompletedSession'

const store = createListStore<CompletedSession>({
  storage,
  key: 'completed-sessions',
  currentVersion: 1,
})

export const CompletedSessionRepository = {
  loadAll: store.loadAll,
  append: store.append,
  clear: store.clear,
}
