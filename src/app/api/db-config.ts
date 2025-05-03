import { dbPool, executeQuery, withTransaction } from '@/lib/db-pool';

// Initialize the database pool when this module is first loaded
const pool = dbPool;

/**
 * Initialize database connection tracking
 * @param userId User identifier
 * @param sessionId Session identifier
 */
export async function trackDatabaseConnection(userId: string, sessionId: string) {
  try {
    await executeQuery(
      'SELECT pg_track_connection_context($1, $2, $3)',
      ['content-roadmap-tool', userId, sessionId]
    );
  } catch (error) {
    console.error('Error tracking database connection:', error);
  }
}

/**
 * Get current connection pool stats
 */
export async function getConnectionPoolStats() {
  try {
    const stats = await executeQuery('SELECT * FROM connection_pool_health');
    return stats[0];
  } catch (error) {
    console.error('Error getting connection pool stats:', error);
    return null;
  }
}

/**
 * Get historical connection pool statistics
 * @param hours Number of hours of history to retrieve
 */
export async function getConnectionPoolHistory(hours: number = 24) {
  try {
    const history = await executeQuery(
      'SELECT * FROM connection_pool_stats WHERE recorded_at > NOW() - INTERVAL $1 HOUR ORDER BY recorded_at',
      [hours]
    );
    return history;
  } catch (error) {
    console.error('Error getting connection pool history:', error);
    return [];
  }
}

/**
 * Reset the connection pool
 */
export async function resetConnectionPool() {
  try {
    await executeQuery('CALL reset_connection_pool()');
    return { success: true, message: 'Connection pool reset successfully' };
  } catch (error) {
    console.error('Error resetting connection pool:', error);
    return { success: false, message: 'Failed to reset connection pool' };
  }
}

/**
 * Configure optimal connection pool settings
 */
export async function configureConnectionPool() {
  try {
    await executeQuery('SELECT set_connection_pool_config()');
    return { success: true, message: 'Connection pool configured successfully' };
  } catch (error) {
    console.error('Error configuring connection pool:', error);
    return { success: false, message: 'Failed to configure connection pool' };
  }
}

export { dbPool, executeQuery, withTransaction }; 