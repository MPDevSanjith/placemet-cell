import { createClient } from 'redis';

class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.isDisabled = false;
    this._hasLoggedError = false;
    this.init();
  }

  async init() {
    try {
      const redisEnabledEnv = String(process.env.REDIS_ENABLED || 'true').toLowerCase();
      const isExplicitlyDisabled = redisEnabledEnv === 'false' || redisEnabledEnv === '0' || redisEnabledEnv === 'off';
      const redisUrl = process.env.REDIS_URL;

      if (isExplicitlyDisabled || !redisUrl) {
        this.isDisabled = true;
        this.isConnected = false;
        console.log('ℹ️ Redis disabled; using in-memory cache only');
        return;
      }

      // Create Redis client with guarded reconnects and error throttling
      let reconnectAttempts = 0;
      this.client = createClient({
        url: redisUrl,
        socket: {
          connectTimeout: 5000,
          lazyConnect: true,
          reconnectStrategy: (retries) => {
            reconnectAttempts = retries;
            // Backoff capped at 1s; stop after 5 retries to avoid log spam
            if (retries > 5) {
              return new Error('Stopping Redis reconnects after 5 attempts');
            }
            return Math.min(retries * 100, 1000);
          }
        }
      });

      this.client.on('error', (err) => {
        if (!this._hasLoggedError) {
          console.log('Redis Client Error:', err.message);
          this._hasLoggedError = true;
        }
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('✅ Redis connected');
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        console.log('❌ Redis disconnected');
        this.isConnected = false;
      });

      // Try to connect once
      await this.client.connect();
    } catch (error) {
      console.log('Redis connection failed, using in-memory cache:', error.message);
      this.isConnected = false;
      this.isDisabled = true;
      // Ensure client is cleaned up and no further reconnects are attempted
      try {
        if (this.client) {
          await this.client.quit().catch(() => {});
        }
      } finally {
        this.client = null;
      }
    }
  }

  async get(key) {
    if (this.isDisabled || !this.isConnected || !this.client) {
      return null;
    }

    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis GET error:', error.message);
      return null;
    }
  }

  async set(key, value, ttlSeconds = 300) {
    if (this.isDisabled || !this.isConnected || !this.client) {
      return false;
    }

    try {
      await this.client.setEx(key, ttlSeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Redis SET error:', error.message);
      return false;
    }
  }

  async del(key) {
    if (this.isDisabled || !this.isConnected || !this.client) {
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Redis DEL error:', error.message);
      return false;
    }
  }

  async flush() {
    if (this.isDisabled || !this.isConnected || !this.client) {
      return false;
    }

    try {
      await this.client.flushAll();
      return true;
    } catch (error) {
      console.error('Redis FLUSH error:', error.message);
      return false;
    }
  }

  // Cache key generators
  static getStudentListKey(filters = {}) {
    return `students:list:${JSON.stringify(filters)}`;
  }

  static getAIAnalysisKey(query) {
    return `ai:analysis:${Buffer.from(query).toString('base64')}`;
  }

  static getStatisticsKey() {
    return 'statistics:comprehensive';
  }

  static getCourseBreakdownKey() {
    return 'breakdown:course';
  }

  static getDepartmentBreakdownKey() {
    return 'breakdown:department';
  }
}

// Export singleton instance
export default new CacheService();
