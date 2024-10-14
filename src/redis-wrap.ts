// redisClientWrapper.ts
import { createClient, RedisClientType } from 'redis';

class RedisClientWrapper {
  private client: RedisClientType;
  private isConnecting: boolean = false;
  private connectPromise: Promise<RedisClientType> | null = null;

  constructor() {
    this.client = createClient();
    this.client.on('error', (err) => console.error('Redis Client Error', err));
  }

  private async ensureConnected() {
    if (this.client.isOpen) {
      return;
    }
    if (this.isConnecting && this.connectPromise) {
      await this.connectPromise;
    } else {
      this.isConnecting = true;
      this.connectPromise = this.client.connect();
      await this.connectPromise;
      this.isConnecting = false;
    }
  }

  public async get(key: string): Promise<string | null> {
    await this.ensureConnected();
    return this.client.get(key);
  }

  public async set(key: string, value: string): Promise<void> {
    await this.ensureConnected();
    await this.client.set(key, value);
  }

  // Add other Redis commands as needed
}

const redisClientWrapper = new RedisClientWrapper();

export default redisClientWrapper;
