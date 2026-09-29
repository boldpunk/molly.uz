// The database lives in us-east-1 and the server in Helsinki, so every query
// costs a transatlantic round trip. Storefront data (catalog, pages, brand)
// changes only when someone edits it in the admin, so it is kept in memory
// and served instantly; admin edits clear it (see lib/revalidate.ts), and a
// short lifetime catches anything changed outside the admin.
//
// Expired entries are served while a fresh copy loads in the background, so
// after the first visit no request waits on the database for this data.

const TTL_MS = 5 * 60_000;

interface Entry {
  value: Promise<unknown>;
  expires: number;
  refreshing: boolean;
}

const store = new Map<string, Entry>();
let generation = 0;

export function cached<A extends unknown[], R>(
  name: string,
  load: (...args: A) => Promise<R>
): (...args: A) => Promise<R> {
  return (...args: A) => {
    const key = `${name}:${JSON.stringify(args)}`;
    const now = Date.now();
    const hit = store.get(key);

    if (hit && hit.expires > now) return hit.value as Promise<R>;

    if (hit && !hit.refreshing) {
      hit.refreshing = true;
      const startedIn = generation;
      load(...args)
        .then((value) => {
          if (startedIn !== generation) return;
          store.set(key, {
            value: Promise.resolve(value),
            expires: Date.now() + TTL_MS,
            refreshing: false,
          });
        })
        .catch(() => {
          hit.refreshing = false;
        });
      return hit.value as Promise<R>;
    }
    if (hit) return hit.value as Promise<R>;

    const value = load(...args);
    const entry: Entry = { value, expires: now + TTL_MS, refreshing: false };
    store.set(key, entry);
    // A failed load must not be remembered — the next request retries.
    value.catch(() => {
      if (store.get(key) === entry) store.delete(key);
    });
    return value;
  };
}

export function clearDataCache(): void {
  generation++;
  store.clear();
}
