/**
 * Storage is abstracted so the coaching engine never depends on
 * `localStorage` directly. M0 ships `LocalStorageAdapter` only; a future
 * `CloudStorageAdapter` (M2) implements the same interface without
 * touching any caller.
 */
export interface StorageAdapter {
  get<T>(key: string): T | undefined
  set<T>(key: string, value: T): void
  remove(key: string): void
  clear(): void
}

/**
 * Every persisted record is wrapped with a schema version so future
 * migrations can detect and upgrade old shapes instead of guessing.
 */
export interface VersionedRecord<T> {
  version: number
  data: T
}
