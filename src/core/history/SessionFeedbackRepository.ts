import { createListStore, storage } from '@/shared/storage'
import type { SessionFeedback } from './SessionFeedback'

const store = createListStore<SessionFeedback>({
  storage,
  key: 'session-feedback',
  currentVersion: 1,
})

export const SessionFeedbackRepository = {
  loadAll: store.loadAll,
  append: store.append,
  clear: store.clear,
}
