import type { GymOfflineRosterEntry, OfflineCheckinEntry } from './self-checkin-actions'

// Minimal promise-based IndexedDB wrapper for the self check-in kiosk's
// offline cache. No external dependency — the schema is tiny (two stores) and
// a library would outweigh the code it replaces.
const DB_NAME = 'gym-self-checkin'
const DB_VERSION = 1
const ROSTER_STORE = 'roster'
const QUEUE_STORE = 'queue'

// A gym should be online most days; a device that hasn't synced in this long
// is either abandoned or lost. Rather than hold real member data (phone
// digits, names) at rest indefinitely, the cache self-purges instead of
// serving it — the tablet just stops offering the offline fallback until it
// reconnects.
const ROSTER_MAX_AGE_MS = 3 * 24 * 60 * 60 * 1000

type QueueRecord = OfflineCheckinEntry & { token: string; _key: string }

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      // Namespaced by token (keyPath 'token') since a shared device could in
      // theory open more than one gym's kiosk over time.
      if (!db.objectStoreNames.contains(ROSTER_STORE)) {
        db.createObjectStore(ROSTER_STORE, { keyPath: 'token' })
      }
      // '_key' (token + clientId) is the actual primary key, distinct from
      // the plain 'clientId' field the server echoes back on sync.
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        db.createObjectStore(QUEUE_STORE, { keyPath: '_key' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function withStore<T>(
  storeName: string,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode)
    const store = tx.objectStore(storeName)
    const request = fn(store)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function saveOfflineRoster(
  token: string,
  entries: GymOfflineRosterEntry[]
): Promise<void> {
  await withStore(ROSTER_STORE, 'readwrite', (store) =>
    store.put({ token, entries, savedAt: Date.now() })
  )
}

export async function getOfflineRoster(token: string): Promise<GymOfflineRosterEntry[]> {
  const record = await withStore<
    { token: string; entries: GymOfflineRosterEntry[]; savedAt: number } | undefined
  >(ROSTER_STORE, 'readonly', (store) => store.get(token))

  if (!record) return []

  if (Date.now() - record.savedAt > ROSTER_MAX_AGE_MS) {
    await withStore(ROSTER_STORE, 'readwrite', (store) => store.delete(token))
    return []
  }

  return record.entries
}

function queueKey(token: string, clientId: string) {
  return `${token}:${clientId}`
}

export async function enqueueOfflineCheckin(
  token: string,
  entry: OfflineCheckinEntry
): Promise<void> {
  const record: QueueRecord = { ...entry, token, _key: queueKey(token, entry.clientId) }
  await withStore(QUEUE_STORE, 'readwrite', (store) => store.put(record))
}

export async function getOfflineQueue(token: string): Promise<OfflineCheckinEntry[]> {
  const all = await withStore<QueueRecord[]>(QUEUE_STORE, 'readonly', (store) => store.getAll())
  return all
    .filter((record) => record.token === token)
    .map(({ clientId, digits, checkedInAt }) => ({ clientId, digits, checkedInAt }))
}

export async function removeFromOfflineQueue(token: string, clientIds: string[]): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, 'readwrite')
    const store = tx.objectStore(QUEUE_STORE)
    for (const clientId of clientIds) {
      store.delete(queueKey(token, clientId))
    }
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}
