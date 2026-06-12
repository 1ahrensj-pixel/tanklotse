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

  // Begrenzt die Logflut bei einem laengeren Redis-Ausfall: nach dem ersten
  // Fehler wird erst nach Ablauf des Fensters wieder geloggt.
  private lastErrorLogAt = 0;

  async onModuleInit() {
    this.redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
      maxRetriesPerRequest: 2,
      // Kein Offline-Queueing: faellt Redis aus, scheitern Commands sofort
      // statt sich aufzustauen — der Cache ist nur Beschleuniger, kein Muss.
      enableOfflineQueue: false,
      lazyConnect: false,
    });
    this.redis.on('error', (e) => this.warnThrottled(e.message));
  }

  async onModuleDestroy() {
    await this.redis?.quit().catch(() => undefined);
  }

  /**
   * Cache ist ein reiner Beschleuniger — faellt Redis aus, darf das NIE den
   * Request killen. get() liefert bei Fehler einen Cache-Miss (null), set()
   * und del() sind best-effort. So bleibt die Suche live, auch wenn Redis
   * kurzzeitig weg ist (statt 500 → direkter Provider-Call).
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.redis.get(key);
      if (raw == null) return null;
      return JSON.parse(raw) as T;
    } catch (e) {
      this.warnThrottled(`get(${key}) fehlgeschlagen: ${(e as Error).message}`);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    try {
      await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (e) {
      this.warnThrottled(`set(${key}) fehlgeschlagen: ${(e as Error).message}`);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (e) {
      this.warnThrottled(`del(${key}) fehlgeschlagen: ${(e as Error).message}`);
    }
  }

  private warnThrottled(message: string) {
    const now = Date.now();
    if (now - this.lastErrorLogAt > 30_000) {
      this.lastErrorLogAt = now;
      this.logger.warn(`Redis nicht erreichbar (Cache uebersprungen): ${message}`);
    }
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
