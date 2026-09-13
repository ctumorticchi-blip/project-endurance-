import type { StorageAdapter, VersionedRecord } from './StorageAdapter'

/**
 * A migration upgrades a record from exactly `fromVersion` to
 * `fromVersion + 1`. `createVersionedStore` chains them so a record
 * written by an old build is upgraded step by step to `currentVersion`
 * before it ever reaches application code.
 */
export interface Migration<T = unknown> {
  fromVersion: number
  migrate: (data: T) => T
}

export interface VersionedStore<T> {
  load: () => T | undefined
  save: (data: T) => void
  clear: () => void
}

export function createVersionedStore<T>(options: {
  storage: StorageAdapter
  key: string
  currentVersion: number
  migrations?: Migration[]
}): VersionedStore<T> {
  const { storage, key, currentVersion, migrations = [] } = options

  return {
    load(): T | undefined {
      const record = storage.get<VersionedRecord<unknown>>(key)
      if (!record) return undefined

      let { version, data } = record
      const sorted = [...migrations].sort((a, b) => a.fromVersion - b.fromVersion)

      while (version < currentVersion) {
        const migration = sorted.find((m) => m.fromVersion === version)
        if (!migration) {
          // No migration path: rather than silently returning corrupt/stale
          // data, drop the record so the app falls back to a clean state.
          return undefined
        }
        data = migration.migrate(data)
        version += 1
      }

      return data as T
    },

    save(data: T): void {
      const record: VersionedRecord<T> = { version: currentVersion, data }
      storage.set(key, record)
    },

    clear(): void {
      storage.remove(key)
    },
  }
}
