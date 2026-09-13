import type { StorageAdapter } from './StorageAdapter'

const NAMESPACE = 'project-endurance:'

/**
 * Thin, defensive wrapper around `window.localStorage`. Swallows quota and
 * serialization errors rather than crashing the coaching flow — losing a
 * single write is better than losing the whole session (private browsing,
 * storage disabled, quota exceeded, etc).
 */
export class LocalStorageAdapter implements StorageAdapter {
  private key(key: string): string {
    return `${NAMESPACE}${key}`
  }

  get<T>(key: string): T | undefined {
    try {
      const raw = window.localStorage.getItem(this.key(key))
      if (raw === null) return undefined
      return JSON.parse(raw) as T
    } catch {
      return undefined
    }
  }

  set<T>(key: string, value: T): void {
    try {
      window.localStorage.setItem(this.key(key), JSON.stringify(value))
    } catch {
      // Quota exceeded or storage unavailable: fail silently, caller keeps
      // working with in-memory state for the current session.
    }
  }

  remove(key: string): void {
    try {
      window.localStorage.removeItem(this.key(key))
    } catch {
      // no-op
    }
  }

  clear(): void {
    try {
      Object.keys(window.localStorage)
        .filter((k) => k.startsWith(NAMESPACE))
        .forEach((k) => window.localStorage.removeItem(k))
    } catch {
      // no-op
    }
  }
}
