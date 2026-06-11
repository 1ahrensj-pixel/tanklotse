import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

import { roundCoord } from './cache-keys';

export interface SearchKeyParams {
  lat: number;
  lng: number;
  radius: number;
  fuelType: string;
  sort: string;
}

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private redis!: Redis;

  async onModuleInit() {
    this.redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      lazyConnect: false,
    });
    this.redis.on('error', (e) => this.logger.error(`Redis-Fehler: ${e.message}`));
  }

  async onModuleDestroy() {
    await this.redis?.quit();
  }

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.redis.get(key);
    if (raw == null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  searchKey({ lat, lng, radius, fuelType, sort }: SearchKeyParams): string {
    return `stations:${roundCoord(lat)}:${roundCoord(lng)}:${radius}:${fuelType}:${sort}`;
  }

  detailKey(stationId: string): string {
    return `details:${stationId}`;
  }

  pricesKey(stationIds: string[]): string {
    const sorted = [...stationIds].sort().join(',');
    let h = 0;
    for (let i = 0; i < sorted.length; i++) {
      h = ((h << 5) - h + sorted.charCodeAt(i)) | 0;
    }
    return `prices:${(h >>> 0).toString(16)}:${stationIds.length}`;
  }
}
