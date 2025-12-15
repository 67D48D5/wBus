// src/core/cache/CacheManager.ts

/**
 * Generic cache manager for storing and retrieving data
 * Provides a centralized way to manage cache across the application
 */
export class CacheManager<T> {
  private cache: Map<string, T> = new Map();
  private pendingRequests: Map<string, Promise<T>> = new Map();

  /**
   * Get cached data or return null if not found
   */
  get(key: string): T | null {
    return this.cache.get(key) ?? null;
  }

  /**
   * Set data in cache
   */
  set(key: string, value: T): void {
    this.cache.set(key, value);
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Delete a specific key from cache
   */
  delete(key: string): void {
    this.cache.delete(key);
    this.pendingRequests.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.pendingRequests.clear();
  }

  /**
   * Clear all cache except for specified keys
   */
  clearExcept(keysToKeep: string[]): void {
    const keepSet = new Set(keysToKeep);
    for (const key of this.cache.keys()) {
      if (!keepSet.has(key)) {
        this.cache.delete(key);
      }
    }
    for (const key of this.pendingRequests.keys()) {
      if (!keepSet.has(key)) {
        this.pendingRequests.delete(key);
      }
    }
  }

  /**
   * Get or fetch data with automatic deduplication of concurrent requests
   * If data is cached, return it immediately
   * If a request is pending, return the pending promise
   * Otherwise, execute the fetch function and cache the result
   */
  async getOrFetch(
    key: string,
    fetchFn: () => Promise<T>
  ): Promise<T> {
    // Return cached data if available
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    // Return pending request if one exists
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!;
    }

    // Create new request
    const promise = fetchFn()
      .then((data) => {
        this.cache.set(key, data);
        return data;
      })
      .finally(() => {
        this.pendingRequests.delete(key);
      });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  /**
   * Get all keys in cache
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }
}
