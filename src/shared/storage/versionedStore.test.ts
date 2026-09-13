import { describe, expect, it } from 'vitest'
import { LocalStorageAdapter } from './LocalStorageAdapter'
import { createVersionedStore } from './versionedStore'

interface V1Shape {
  name: string
}
interface V2Shape {
  fullName: string
}

describe('createVersionedStore', () => {
  it('round-trips data at the current version', () => {
    const store = createVersionedStore<V1Shape>({
      storage: new LocalStorageAdapter(),
      key: 'test-v1',
      currentVersion: 1,
    })
    store.save({ name: 'Ada' })
    expect(store.load()).toEqual({ name: 'Ada' })
  })

  it('returns undefined when nothing was saved', () => {
    const store = createVersionedStore<V1Shape>({
      storage: new LocalStorageAdapter(),
      key: 'test-missing',
      currentVersion: 1,
    })
    expect(store.load()).toBeUndefined()
  })

  it('migrates an old record forward through the migration chain', () => {
    const storage = new LocalStorageAdapter()
    const v1Store = createVersionedStore<V1Shape>({ storage, key: 'test-migrate', currentVersion: 1 })
    v1Store.save({ name: 'Ada Lovelace' })

    const v2Store = createVersionedStore<V2Shape>({
      storage,
      key: 'test-migrate',
      currentVersion: 2,
      migrations: [
        {
          fromVersion: 1,
          migrate: (data) => ({ fullName: (data as V1Shape).name }),
        },
      ],
    })

    expect(v2Store.load()).toEqual({ fullName: 'Ada Lovelace' })
  })

  it('drops the record when no migration path exists, instead of returning stale data', () => {
    const storage = new LocalStorageAdapter()
    const v1Store = createVersionedStore<V1Shape>({ storage, key: 'test-no-path', currentVersion: 1 })
    v1Store.save({ name: 'Ada' })

    const v3Store = createVersionedStore<V2Shape>({
      storage,
      key: 'test-no-path',
      currentVersion: 3,
      migrations: [],
    })

    expect(v3Store.load()).toBeUndefined()
  })

  it('clear removes the stored record', () => {
    const store = createVersionedStore<V1Shape>({
      storage: new LocalStorageAdapter(),
      key: 'test-clear',
      currentVersion: 1,
    })
    store.save({ name: 'Ada' })
    store.clear()
    expect(store.load()).toBeUndefined()
  })
})
