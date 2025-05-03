import { getRedisClient } from './redis';

/**
 * Circuit breaker states
 */
export enum CircuitState {
  CLOSED = 'closed',     // Normal operation - requests are allowed
  OPEN = 'open',         // Failing - requests are blocked
  HALF_OPEN = 'half-open' // Testing recovery - limited requests allowed
}

interface CircuitBreakerOptions {
  failureThreshold: number;    // Number of failures before opening
  resetTimeout: number;        // Time in ms before attempting recovery
  halfOpenSuccessThreshold: number; // Number of successful requests to close circuit
  maxHalfOpenCalls: number;    // Maximum concurrent half-open requests
  timeout?: number;            // Request timeout in ms
  key: string;                 // Unique identifier for this circuit
  logFailure?: (err: Error, key: string) => void; // Optional failure logging function
}

const DEFAULT_OPTIONS: Partial<CircuitBreakerOptions> = {
  failureThreshold: 5,
  resetTimeout: 30000, // 30 seconds
  halfOpenSuccessThreshold: 3,
  maxHalfOpenCalls: 1,
  timeout: 10000, // 10 seconds
  logFailure: (err, key) => console.error(`Circuit ${key} failure:`, err)
};

/**
 * A Redis-based circuit breaker implementation
 * Provides fault tolerance and prevents cascading failures across microservices
 */
export class CircuitBreaker {
  private options: CircuitBreakerOptions;
  private redis = getRedisClient();

  constructor(options: Partial<CircuitBreakerOptions> & { key: string }) {
    this.options = { ...DEFAULT_OPTIONS, ...options } as CircuitBreakerOptions;
    
    if (!this.options.key) {
      throw new Error('Circuit breaker key is required');
    }
  }

  /**
   * Execute a function with circuit breaker protection
   * @param fn - The function to execute
   * @returns Function result or throws error if circuit is open
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    const state = await this.getState();
    
    // If circuit is open, prevent the call
    if (state === CircuitState.OPEN) {
      throw new Error(`Circuit ${this.options.key} is OPEN - request rejected`);
    }
    
    // If circuit is half-open, only allow limited testing calls
    if (state === CircuitState.HALF_OPEN) {
      const currentCalls = await this.incrementHalfOpenCalls();
      
      if (currentCalls > this.options.maxHalfOpenCalls) {
        await this.decrementHalfOpenCalls();
        throw new Error(`Circuit ${this.options.key} is HALF-OPEN and at capacity`);
      }
    }
    
    // Execute the function with timeout protection
    try {
      const result = await this.executeWithTimeout(fn);
      
      // If successful in half-open state, track success
      if (state === CircuitState.HALF_OPEN) {
        await this.trackHalfOpenSuccess();
      }
      
      await this.decrementHalfOpenCalls();
      return result;
    } catch (error) {
      // Handle failure
      if (state === CircuitState.HALF_OPEN) {
        await this.decrementHalfOpenCalls();
        
        // Reset to open on half-open failure
        await this.setState(CircuitState.OPEN);
      } else if (state === CircuitState.CLOSED) {
        // Track failure and potentially open circuit
        await this.trackFailure();
      }
      
      // Log error if configured
      if (this.options.logFailure && error instanceof Error) {
        this.options.logFailure(error, this.options.key);
      }
      
      throw error;
    }
  }
  
  /**
   * Execute function with a timeout
   */
  private async executeWithTimeout<T>(fn: () => Promise<T>): Promise<T> {
    const timeout = this.options.timeout || DEFAULT_OPTIONS.timeout!;
    
    return Promise.race([
      fn(),
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Operation timed out after ${timeout}ms`));
        }, timeout);
      })
    ]);
  }
  
  /**
   * Get the current circuit state
   */
  private async getState(): Promise<CircuitState> {
    const stateKey = `circuit:${this.options.key}:state`;
    const state = await this.redis.get(stateKey);
    
    return (state as CircuitState) || CircuitState.CLOSED;
  }
  
  /**
   * Set the circuit state
   */
  private async setState(state: CircuitState): Promise<void> {
    const stateKey = `circuit:${this.options.key}:state`;
    const now = Date.now();
    
    // Store the state with a timestamp
    await this.redis.set(stateKey, state);
    await this.redis.set(`circuit:${this.options.key}:changed_at`, now);
    
    // If changing to OPEN state, set expiry to auto-transition to HALF-OPEN
    if (state === CircuitState.OPEN) {
      await this.redis.set(`circuit:${this.options.key}:half_open_success`, 0);
      await this.redis.set(`circuit:${this.options.key}:half_open_calls`, 0);
      await this.redis.expire(stateKey, Math.ceil(this.options.resetTimeout / 1000));
    }
    
    // If changing to CLOSED state, reset failure counter
    if (state === CircuitState.CLOSED) {
      await this.redis.set(`circuit:${this.options.key}:failures`, 0);
    }
  }
  
  /**
   * Track a failure and open circuit if threshold is reached
   */
  private async trackFailure(): Promise<void> {
    const failureKey = `circuit:${this.options.key}:failures`;
    const failures = await this.redis.incr(failureKey);
    
    if (failures >= this.options.failureThreshold) {
      await this.setState(CircuitState.OPEN);
    }
  }
  
  /**
   * Track success in half-open state
   */
  private async trackHalfOpenSuccess(): Promise<void> {
    const successKey = `circuit:${this.options.key}:half_open_success`;
    const successes = await this.redis.incr(successKey);
    
    if (successes >= this.options.halfOpenSuccessThreshold) {
      await this.setState(CircuitState.CLOSED);
    }
  }
  
  /**
   * Increment counter for concurrent half-open calls
   */
  private async incrementHalfOpenCalls(): Promise<number> {
    const callsKey = `circuit:${this.options.key}:half_open_calls`;
    return await this.redis.incr(callsKey);
  }
  
  /**
   * Decrement counter for concurrent half-open calls
   */
  private async decrementHalfOpenCalls(): Promise<number> {
    const callsKey = `circuit:${this.options.key}:half_open_calls`;
    const calls = await this.redis.decr(callsKey);
    return Math.max(0, calls);
  }
  
  /**
   * Get circuit statistics
   */
  async getStats(): Promise<{
    state: CircuitState;
    failures: number;
    halfOpenSuccess: number;
    halfOpenCalls: number;
    changedAt: number;
  }> {
    const [state, failures, halfOpenSuccess, halfOpenCalls, changedAt] = await Promise.all([
      this.getState(),
      this.redis.get(`circuit:${this.options.key}:failures`),
      this.redis.get(`circuit:${this.options.key}:half_open_success`),
      this.redis.get(`circuit:${this.options.key}:half_open_calls`),
      this.redis.get(`circuit:${this.options.key}:changed_at`)
    ]);
    
    return {
      state,
      failures: parseInt(failures as string || '0'),
      halfOpenSuccess: parseInt(halfOpenSuccess as string || '0'),
      halfOpenCalls: parseInt(halfOpenCalls as string || '0'),
      changedAt: parseInt(changedAt as string || '0')
    };
  }
  
  /**
   * Manually reset the circuit breaker to closed state
   */
  async reset(): Promise<void> {
    await this.setState(CircuitState.CLOSED);
  }
  
  /**
   * Manually trip the circuit breaker to open state
   */
  async trip(): Promise<void> {
    await this.setState(CircuitState.OPEN);
  }
} 