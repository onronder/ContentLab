import { createClient } from '@/lib/supabase/client';

interface CacheItem<T> {
  value: T;
  expiry: number;
}

// In-memory cache for frequently accessed data
const memoryCache = new Map<string, CacheItem<unknown>>();

/**
 * Default cache expiry times
 */
export const CACHE_EXPIRY = {
  SHORT: 60 * 1000, // 1 minute
  MEDIUM: 5 * 60 * 1000, // 5 minutes
  LONG: 30 * 60 * 1000, // 30 minutes
  VERY_LONG: 60 * 60 * 1000, // 1 hour
  DAY: 24 * 60 * 60 * 1000, // 24 hours
};

/**
 * Set a value in the memory cache
 * @param key - Cache key
 * @param value - Value to store
 * @param expiryMs - Expiry time in milliseconds (default: 5 minutes)
 */
export function setMemoryCache<T>(key: string, value: T, expiryMs: number = CACHE_EXPIRY.MEDIUM): void {
  memoryCache.set(key, {
    value,
    expiry: Date.now() + expiryMs,
  });
}

/**
 * Get a value from the memory cache
 * @param key - Cache key
 * @returns Cached value or null if not found or expired
 */
export function getMemoryCache<T>(key: string): T | null {
  const item = memoryCache.get(key);
  
  if (!item) {
    return null;
  }
  
  // Check if the item has expired
  if (Date.now() > item.expiry) {
    memoryCache.delete(key);
    return null;
  }
  
  return item.value as T;
}

/**
 * Delete a value from the memory cache
 * @param key - Cache key
 */
export function deleteMemoryCache(key: string): void {
  memoryCache.delete(key);
}

/**
 * Clear the entire memory cache or items by prefix
 * @param prefix - Optional prefix to clear only matching keys
 */
export function clearMemoryCache(prefix?: string): void {
  if (!prefix) {
    memoryCache.clear();
    return;
  }
  
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
    }
  }
}

/**
 * Set a value in the persistent cache (Supabase)
 * @param key - Cache key
 * @param value - Value to store
 * @param expirySeconds - Expiry time in seconds (default: 300 seconds / 5 minutes)
 * @returns Promise resolving to true if successful
 */
export async function setPersistentCache<T>(
  key: string, 
  value: T, 
  expirySeconds: number = 300
): Promise<boolean> {
  const supabase = createClient();
  
  try {
    // Store in the cache_items table (need to create this table)
    const { error } = await supabase
      .from('cache_items')
      .upsert({
        cache_key: key,
        cache_value: value,
        expires_at: new Date(Date.now() + (expirySeconds * 1000)).toISOString()
      }, {
        onConflict: 'cache_key'
      });
    
    return !error;
  } catch (err) {
    console.error('Error setting persistent cache:', err);
    return false;
  }
}

/**
 * Get a value from the persistent cache (Supabase)
 * @param key - Cache key
 * @returns Promise resolving to cached value or null if not found or expired
 */
export async function getPersistentCache<T>(key: string): Promise<T | null> {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('cache_items')
      .select('cache_value, expires_at')
      .eq('cache_key', key)
      .maybeSingle();
    
    if (error || !data) {
      return null;
    }
    
    // Check if the item has expired
    if (new Date(data.expires_at) < new Date()) {
      // Delete the expired item
      await supabase
        .from('cache_items')
        .delete()
        .eq('cache_key', key);
      
      return null;
    }
    
    return data.cache_value as T;
  } catch (err) {
    console.error('Error getting persistent cache:', err);
    return null;
  }
}

/**
 * Delete a value from the persistent cache
 * @param key - Cache key
 * @returns Promise resolving to true if successful
 */
export async function deletePersistentCache(key: string): Promise<boolean> {
  const supabase = createClient();
  
  try {
    const { error } = await supabase
      .from('cache_items')
      .delete()
      .eq('cache_key', key);
    
    return !error;
  } catch (err) {
    console.error('Error deleting persistent cache:', err);
    return false;
  }
}

/**
 * Clear items from the persistent cache by prefix
 * @param prefix - Prefix to clear matching keys
 * @returns Promise resolving to true if successful
 */
export async function clearPersistentCacheByPrefix(prefix: string): Promise<boolean> {
  const supabase = createClient();
  
  try {
    const { error } = await supabase
      .from('cache_items')
      .delete()
      .like('cache_key', `${prefix}%`);
    
    return !error;
  } catch (err) {
    console.error('Error clearing persistent cache by prefix:', err);
    return false;
  }
}

/**
 * Function that attempts to get data from memory cache first,
 * then persistent cache, and finally falls back to the data loader function.
 * Results are cached in both memory and persistent cache.
 * 
 * @param key - Cache key
 * @param loader - Function to load data if not in cache
 * @param options - Cache options
 * @returns Promise resolving to the data
 */
export async function withCache<T>(
  key: string,
  loader: () => Promise<T>,
  options: {
    memoryExpiryMs?: number;
    persistentExpirySeconds?: number;
    skipMemoryCache?: boolean;
    skipPersistentCache?: boolean;
  } = {}
): Promise<T> {
  const {
    memoryExpiryMs = CACHE_EXPIRY.MEDIUM,
    persistentExpirySeconds = 300,
    skipMemoryCache = false,
    skipPersistentCache = false
  } = options;
  
  // Try memory cache first (fastest)
  if (!skipMemoryCache) {
    const memoryResult = getMemoryCache<T>(key);
    if (memoryResult !== null) {
      return memoryResult;
    }
  }
  
  // Try persistent cache next
  if (!skipPersistentCache) {
    const persistentResult = await getPersistentCache<T>(key);
    if (persistentResult !== null) {
      // Store in memory cache for faster access next time
      if (!skipMemoryCache) {
        setMemoryCache(key, persistentResult, memoryExpiryMs);
      }
      return persistentResult;
    }
  }
  
  // If not in any cache, load the data
  const data = await loader();
  
  // Store in memory cache
  if (!skipMemoryCache) {
    setMemoryCache(key, data, memoryExpiryMs);
  }
  
  // Store in persistent cache
  if (!skipPersistentCache) {
    await setPersistentCache(key, data, persistentExpirySeconds);
  }
  
  return data;
} 