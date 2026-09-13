import { LocalStorageAdapter } from './LocalStorageAdapter'
import type { StorageAdapter } from './StorageAdapter'

export type { StorageAdapter, VersionedRecord } from './StorageAdapter'
export { LocalStorageAdapter } from './LocalStorageAdapter'
export { createVersionedStore } from './versionedStore'
export type { Migration, VersionedStore } from './versionedStore'

/** M0's single storage instance. Swap here (not per-call-site) to change backend. */
export const storage: StorageAdapter = new LocalStorageAdapter()
