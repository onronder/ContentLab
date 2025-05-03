import { Pool, PoolClient } from 'pg';

// Connection pool types
type PoolType = 'primary' | 'read_replica';

// Configuration interface
interface PoolConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  max: number; // Maximum number of clients
  idleTimeoutMillis: number; // How long client remains idle before closing
  connectionTimeoutMillis: number; // How long to wait for connection
}

// Pool manager instance to handle multiple pools
class PoolManager {
  private primaryPool: Pool | null = null;
  private readReplicaPool: Pool | null = null;
  private isHealthy = true;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  
  constructor() {
    // Start health checking
    this.startHealthCheck();
  }
  
  /**
   * Initialize database connection pools
   */
  public initialize(): void {
    // Only initialize if pools haven't been created yet
    if (!this.primaryPool) {
      this.primaryPool = this.createPool(this.getPrimaryConfig());
      
      // Attach error handler to detect issues
      this.primaryPool.on('error', (err) => {
        console.error('Primary database pool error:', err);
        this.isHealthy = false;
      });
    }
    
    // Initialize read replica pool if configured
    if (!this.readReplicaPool && process.env.DATABASE_READ_REPLICA_URL) {
      this.readReplicaPool = this.createPool(this.getReadReplicaConfig());
      
      this.readReplicaPool.on('error', (err) => {
        console.error('Read replica database pool error:', err);
        // Read replica errors don't impact overall health
        // We can fall back to primary
      });
    }
  }
  
  /**
   * Create a database connection pool
   * @param config Pool configuration
   * @returns Configured connection pool
   */
  private createPool(config: PoolConfig): Pool {
    return new Pool(config);
  }
  
  /**
   * Get primary database configuration
   * @returns Pool configuration for primary database
   */
  private getPrimaryConfig(): PoolConfig {
    // Use environment variables for production, defaults for development
    return {
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      database: process.env.DATABASE_NAME || 'postgres',
      user: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres',
      max: parseInt(process.env.DATABASE_POOL_MAX || '10'),
      idleTimeoutMillis: parseInt(process.env.DATABASE_IDLE_TIMEOUT || '30000'),
      connectionTimeoutMillis: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT || '5000'),
    };
  }
  
  /**
   * Get read replica configuration
   * @returns Pool configuration for read replica
   */
  private getReadReplicaConfig(): PoolConfig {
    // Use environment variables, falling back to primary config values
    return {
      host: process.env.DATABASE_READ_REPLICA_HOST || process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_READ_REPLICA_PORT || process.env.DATABASE_PORT || '5432'),
      database: process.env.DATABASE_READ_REPLICA_NAME || process.env.DATABASE_NAME || 'postgres',
      user: process.env.DATABASE_READ_REPLICA_USER || process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_READ_REPLICA_PASSWORD || process.env.DATABASE_PASSWORD || 'postgres',
      max: parseInt(process.env.DATABASE_READ_REPLICA_POOL_MAX || process.env.DATABASE_POOL_MAX || '20'),
      idleTimeoutMillis: parseInt(process.env.DATABASE_READ_REPLICA_IDLE_TIMEOUT || process.env.DATABASE_IDLE_TIMEOUT || '30000'),
      connectionTimeoutMillis: parseInt(process.env.DATABASE_READ_REPLICA_CONNECTION_TIMEOUT || process.env.DATABASE_CONNECTION_TIMEOUT || '5000'),
    };
  }
  
  /**
   * Get a client from the appropriate pool
   * @param type Pool type to get client from ('primary' or 'read_replica')
   * @returns Database client
   */
  public async getClient(type: PoolType = 'primary'): Promise<PoolClient> {
    // Initialize pools if not already done
    if (!this.primaryPool) {
      this.initialize();
    }
    
    // For read operations, try read replica first if available
    if (type === 'read_replica' && this.readReplicaPool) {
      try {
        return await this.readReplicaPool.connect();
      } catch (error) {
        console.warn('Read replica connection failed, falling back to primary:', error);
        // Fall back to primary pool if read replica fails
      }
    }
    
    // Use primary pool
    if (!this.primaryPool) {
      throw new Error('Database connection pool is not initialized');
    }
    
    return await this.primaryPool.connect();
  }
  
  /**
   * Execute a query using a client from the appropriate pool
   * @param query SQL query to execute
   * @param params Query parameters
   * @param type Pool type to use ('primary' or 'read_replica')
   * @returns Query result
   */
  public async query(query: string, params: any[] = [], type: PoolType = 'primary'): Promise<any> {
    // Default to primary for write operations
    const isWriteOperation = /^\s*(INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)/i.test(query);
    
    // Always use primary for write operations regardless of requested type
    const poolType = isWriteOperation ? 'primary' : type;
    
    const client = await this.getClient(poolType);
    
    try {
      const start = Date.now();
      const result = await client.query(query, params);
      const duration = Date.now() - start;
      
      // Log slow queries
      if (duration > 1000) {
        console.warn(`Slow query (${duration}ms):`, query, params);
      }
      
      return result;
    } finally {
      client.release();
    }
  }
  
  /**
   * Start periodic health check
   */
  private startHealthCheck(): void {
    // Check every 30 seconds
    this.healthCheckInterval = setInterval(async () => {
      try {
        if (this.primaryPool) {
          const result = await this.primaryPool.query('SELECT 1');
          this.isHealthy = result.rowCount === 1;
        }
        
        // Check read replica separately
        if (this.readReplicaPool) {
          await this.readReplicaPool.query('SELECT 1');
        }
      } catch (error) {
        console.error('Database health check failed:', error);
        this.isHealthy = false;
      }
    }, 30000);
  }
  
  /**
   * Stop health checks and close pools
   */
  public async close(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    // Close pools gracefully
    const closePrimary = this.primaryPool ? this.primaryPool.end() : Promise.resolve();
    const closeReplica = this.readReplicaPool ? this.readReplicaPool.end() : Promise.resolve();
    
    await Promise.all([closePrimary, closeReplica]);
    
    this.primaryPool = null;
    this.readReplicaPool = null;
  }
  
  /**
   * Get database connection status
   * @returns Status object with health information
   */
  public getStatus(): { isHealthy: boolean; pools: { primary: boolean; readReplica: boolean } } {
    return {
      isHealthy: this.isHealthy,
      pools: {
        primary: !!this.primaryPool,
        readReplica: !!this.readReplicaPool,
      },
    };
  }
}

// Export singleton instance
const poolManager = new PoolManager();
export default poolManager; 