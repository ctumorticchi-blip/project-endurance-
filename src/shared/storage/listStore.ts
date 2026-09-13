import type { StorageAdapter } from './StorageAdapter'
import { createVersionedStore, type Migration } from './versionedStore'

export interface ListStore<T> {
  loadAll: () => T[]
  append: (item: T) => void
  replaceAll: (items: T[]) => void
  clear: () => void
}

/** Same versioning guarantees as `createVersionedStore`, specialized for
 * the append-mostly array shape used by history repositories. */
export function createListStore<T>(options: {
  storage: StorageAdapter
  key: string
  currentVersion: number
  migrations?: Migration[]
}): ListStore<T> {
  const store = createVersionedStore<T[]>(options)

  return {
    loadAll: () => store.load() ?? [],
    append: (item: T) => store.save([...(store.load() ?? []), item]),
    replaceAll: (items: T[]) => store.save(items),
    clear: () => store.clear(),
  }
}
