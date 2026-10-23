/**
 * FemmeFlo Session Cache Registry
 * Central coordinator to purge all in-memory client and page-level caches on logout,
 * session invalidation (401/403), or new login.
 */

type CacheClearer = () => void;

const registry = new Set<CacheClearer>();

/**
 * Register a cache-clearing callback.
 * Returns an unregister function.
 */
export function registerSessionCache(clearer: CacheClearer): () => void {
  registry.add(clearer);
  return () => {
    registry.delete(clearer);
  };
}

/**
 * Clear all registered in-memory session caches across the application.
 */
export function clearAllSessionCaches(): void {
  for (const clear of registry) {
    try {
      clear();
    } catch (err) {
      console.warn("Error running session cache clearer:", err);
    }
  }
}
