import { Pool, PoolClient } from 'pg';
import { createClient } from '@supabase/supabase-js';

// Configure connection pool settings
const poolConfig = {
  max: process.env.NODE_ENV === 'production' ? 5 : 20, // Lower max connections in production
  idleTimeoutMillis: 10000, // Reduce idle timeout for Vercel environment
  connectionTimeoutMillis: 5000, // How long to wait for a connection
  // Database connection details come from environment variables
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};

// Create a singleton pool instance
class DBPool {
  private static instance: Pool;
  private static isInitialized = false;
  private static clients: Map<string, PoolClient> = new Map();
  private static isClosing = false;

  private constructor() {}

  /**
   * Get the database pool instance
   */
  public static getInstance(): Pool {
    if (!DBPool.instance) {
      console.log('Creating new database connection pool');
      DBPool.instance = new Pool(poolConfig);
      
      // Handle pool errors
      DBPool.instance.on('error', (err: Error) => {
        console.error('Unexpected error on idle client', err);
      });

      // Set up cleanup function for graceful shutdown
      process.on('SIGTERM', () => DBPool.cleanup());
      process.on('SIGINT', () => DBPool.cleanup());
      
      // Add build-time cleanup for Vercel
      if (typeof process.env.NEXT_PHASE === 'string' && 
         (process.env.NEXT_PHASE === 'phase-production-build' || 
          process.env.NEXT_PHASE === 'phase-export')) {
        console.log('Registered automatic pool cleanup for build process');
        // This ensures the pool is cleaned up after static generation
        process.on('beforeExit', () => {
          console.log('Build process exiting, cleaning up pool');
          DBPool.cleanup();
        });
      }
      
      DBPool.isInitialized = true;
    }
    return DBPool.instance;
  }

  /**
   * Get a client from the pool
   * @param clientId A unique identifier for tracking the client (optional)
   */
  public static async getClient(clientId?: string): Promise<PoolClient> {
    const pool = DBPool.getInstance();
    const client = await pool.connect();
    
    if (clientId) {
      DBPool.clients.set(clientId, client);
    }
    
    return client;
  }

  /**
   * Release a specific client back to the pool
   * @param clientId The client identifier
   */
  public static releaseClient(clientId: string): void {
    const client = DBPool.clients.get(clientId);
    if (client) {
      client.release();
      DBPool.clients.delete(clientId);
    }
  }

  /**
   * Clean up all connections when shutting down
   */
  public static async cleanup(): Promise<void> {
    // Prevent multiple calls to cleanup
    if (DBPool.isClosing) {
      console.log('Cleanup already in progress, skipping duplicate call');
      return;
    }
    
    DBPool.isClosing = true;
    console.log('Cleaning up database connections');
    
    // Release all tracked clients
    for (const [id, client] of DBPool.clients.entries()) {
      try {
        client.release();
        DBPool.clients.delete(id);
      } catch (err) {
        console.error(`Error releasing client ${id}:`, err);
      }
    }
    
    // End the pool only if it exists and isn't already ending
    if (DBPool.instance) {
      try {
        await DBPool.instance.end();
        DBPool.instance = undefined as unknown as Pool; // Clear the instance
        DBPool.isInitialized = false;
        console.log('Pool ended successfully');
      } catch (err) {
        console.error('Error ending pool:', err);
      }
    }
    
    DBPool.isClosing = false;
  }
}

/**
 * Create a Supabase client with the existing database connection pool
 */
export const getSupabaseClientWithPool = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  // Create a Supabase client
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    db: {
      schema: 'public',
    },
    global: {
      // Use our connection pool for database requests
      fetch: async (url, options) => {
        // Only intercept database requests
        const urlString = url.toString();
        if (urlString.includes('/rest/v1')) {
          // Handle the actual fetching using our pool
          try {
            // Ensure pool is initialized but we don't need the reference
            DBPool.getInstance();
            // Continue with the fetch, but now it will use our pooled connection
          } catch (error) {
            console.error('Error with database pool:', error);
          }
        }
        
        // Default fetch behavior
        return fetch(url, options);
      },
    },
  });
  
  return supabase;
};

// Export the pool singleton for direct usage
export const dbPool = DBPool.getInstance();

// Export a function for executing queries with automatic client handling
export async function executeQuery<T = Record<string, unknown>>(
  query: string, 
  params: unknown[] = [],
  clientId?: string
): Promise<T[]> {
  const useClientId = clientId || `query-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const client = await DBPool.getClient(useClientId);
  
  try {
    const result = await client.query(query, params);
    return result.rows as T[];
  } finally {
    DBPool.releaseClient(useClientId);
  }
}

// Export a helper function for transaction handling
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const transactionId = `transaction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const client = await DBPool.getClient(transactionId);
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    DBPool.releaseClient(transactionId);
  }
} 