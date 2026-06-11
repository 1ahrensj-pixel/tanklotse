import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

import { CacheService } from '../cache/cache.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  ComplaintPayload,
  FuelPriceProvider,
  ProviderStation,
  ProviderStationDetail,
  SearchParams,
  SortKey,
} from './fuel-price.interface';

interface TkListResponse {
  ok: boolean;
  message?: string;
  stations: Array<{
    id: string;
    name: string;
    brand: string;
    street: string;
    houseNumber?: string;
    place: string;
    postCode: number | string;
    lat: number;
    lng: number;
    dist: number;
    isOpen: boolean;
    e5?: number | null;
    e10?: number | null;
    diesel?: number | null;
  }>;
}

interface TkPricesResponse {
  ok: boolean;
  prices: Record<
    string,
    {
      status: string;
      e5?: number | false;
      e10?: number | false;
      diesel?: number | false;
    }
  >;
}

interface TkDetailResponse {
  ok: boolean;
  station: {
    id: string;
    name: string;
    brand: string;
    street: string;
    houseNumber?: string;
    place: string;
    postCode: number | string;
    lat: number;
    lng: number;
    isOpen: boolean;
    state?: string;
    e5?: number | null;
    e10?: number | null;
    diesel?: number | null;
    overrides?: string[];
    wholeDay?: boolean;
    openingTimes?: Array<{ text: string; start: string; end: string }>;
  };
}

interface TkComplaintResponse {
  ok: boolean;
  message?: string;
}

@Injectable()
export class TankerkoenigProvider implements FuelPriceProvider {
  readonly name = 'tankerkoenig';
  readonly attribution =
    'Datenquelle: Tankerkönig (Daten der Markttransparenzstelle für Kraftstoffe), CC BY 4.0.';

  private readonly logger = new Logger(TankerkoenigProvider.name);
  private readonly http: AxiosInstance;
  private readonly apiKey: string;

  constructor(
    private readonly cache: CacheService,
    private readonly prisma: PrismaService,
  ) {
    const baseURL = process.env.TANKERKOENIG_BASE_URL ?? 'https://creativecommons.tankerkoenig.de/json';
    const apiKey = process.env.TANKERKOENIG_API_KEY;
    if (!apiKey) {
      throw new Error('TANKERKOENIG_API_KEY ist nicht gesetzt.');
    }
    this.apiKey = apiKey;
    this.http = axios.create({
      baseURL,
      timeout: 10_000,
      headers: { 'User-Agent': 'TankLotse/1.0 (+https://tanklotse.de)' },
    });
  }

  async search(params: SearchParams): Promise<ProviderStation[]> {
    const cacheKey = this.cache.searchKey({
      lat: params.lat,
      lng: params.lng,
      radius: params.radius,
      fuelType: params.fuelType.toLowerCase(),
      sort: params.sort,
    });
    const cached = await this.cache.get<ProviderStation[]>(cacheKey);
    if (cached) return cached;

    const sortParam = params.sort === 'distance' ? 'dist' : 'price';
    const typeParam = params.fuelType === 'ALL' ? 'all' : params.fuelType.toLowerCase();

    const data = await this.call<TkListResponse>('/list.php', {
      lat: params.lat,
      lng: params.lng,
      rad: Math.min(params.radius, 25),
      sort: sortParam,
      type: typeParam,
      apikey: this.apiKey,
    });

    if (!data.ok) {
      throw new ServiceUnavailableException(`Tankerkönig: ${data.message ?? 'unbekannter Fehler'}`);
    }

    const stations: ProviderStation[] = data.stations.map((s) => ({
      id: s.id,
      name: s.name,
      brand: s.brand,
      street: s.street,
      houseNumber: s.houseNumber ?? null,
      postCode: String(s.postCode).padStart(5, '0'),
      place: s.place,
      lat: Number(s.lat),
      lng: Number(s.lng),
      distanceKm: typeof s.dist === 'number' ? s.dist : null,
      isOpen: Boolean(s.isOpen),
      prices: {
        e5: typeof s.e5 === 'number' ? s.e5 : null,
        e10: typeof s.e10 === 'number' ? s.e10 : null,
        diesel: typeof s.diesel === 'number' ? s.diesel : null,
      },
    }));

    // Persistenz Stammdaten + aktuelle Preise (Cache-Tabelle)
    await this.persistStationsAndPrices(stations);

    // 60 Sekunden Redis-Cache → Reduktion API-Last
    await this.cache.set(cacheKey, stations, 60);
    return stations;
  }

  async getDetail(stationId: string): Promise<ProviderStationDetail> {
    const cacheKey = this.cache.detailKey(stationId);
    const cached = await this.cache.get<ProviderStationDetail>(cacheKey);
    if (cached) return cached;

    const data = await this.call<TkDetailResponse>('/detail.php', {
      id: stationId,
      apikey: this.apiKey,
    });
    if (!data.ok) {
      throw new ServiceUnavailableException('Tankerkönig: Detail-Abfrage fehlgeschlagen.');
    }
    const s = data.station;
    const detail: ProviderStationDetail = {
      id: s.id,
      name: s.name,
      brand: s.brand,
      street: s.street,
      houseNumber: s.houseNumber ?? null,
      postCode: String(s.postCode).padStart(5, '0'),
      place: s.place,
      lat: Number(s.lat),
      lng: Number(s.lng),
      distanceKm: null,
      isOpen: Boolean(s.isOpen),
      prices: {
        e5: typeof s.e5 === 'number' ? s.e5 : null,
        e10: typeof s.e10 === 'number' ? s.e10 : null,
        diesel: typeof s.diesel === 'number' ? s.diesel : null,
      },
      openingTimes: s.openingTimes ?? [],
      overrides: s.overrides ?? [],
      wholeDay: Boolean(s.wholeDay),
      state: s.state ?? null,
      lastUpdated: new Date().toISOString(),
    };
    await this.cache.set(cacheKey, detail, 600);
    return detail;
  }

  async getPrices(
    stationIds: string[],
  ): Promise<Record<string, ProviderStation['prices'] & { isOpen: boolean }>> {
    if (stationIds.length === 0) return {};
    if (stationIds.length > 10) {
      // Tankerkönig erlaubt bis zu 10 IDs in einem Call.
      const chunks: string[][] = [];
      for (let i = 0; i < stationIds.length; i += 10) {
        chunks.push(stationIds.slice(i, i + 10));
      }
      const results: Array<Record<string, ProviderStation['prices'] & { isOpen: boolean }>> =
        await Promise.all(chunks.map((c) => this.getPrices(c)));
      return Object.assign({}, ...results);
    }
    const cacheKey = this.cache.pricesKey(stationIds);
    const cached =
      await this.cache.get<Record<string, ProviderStation['prices'] & { isOpen: boolean }>>(cacheKey);
    if (cached) return cached;

    const data = await this.call<TkPricesResponse>('/prices.php', {
      ids: stationIds.join(','),
      apikey: this.apiKey,
    });
    if (!data.ok) {
      throw new ServiceUnavailableException('Tankerkönig: Preisabfrage fehlgeschlagen.');
    }
    const result: Record<string, ProviderStation['prices'] & { isOpen: boolean }> = {};
    for (const [id, p] of Object.entries(data.prices)) {
      result[id] = {
        e5: typeof p.e5 === 'number' ? p.e5 : null,
        e10: typeof p.e10 === 'number' ? p.e10 : null,
        diesel: typeof p.diesel === 'number' ? p.diesel : null,
        isOpen: p.status === 'open',
      };
    }
    await this.cache.set(cacheKey, result, 60);
    return result;
  }

  async submitComplaint(payload: ComplaintPayload): Promise<{ ok: boolean; forwarded: boolean }> {
    try {
      const data = await this.call<TkComplaintResponse>('/complaint.php', {
        id: payload.stationId,
        type: payload.type,
        correction: payload.correction ?? '',
        apikey: this.apiKey,
      });
      return { ok: Boolean(data.ok), forwarded: Boolean(data.ok) };
    } catch (e) {
      this.logger.warn(`Beschwerde-Forward fehlgeschlagen: ${(e as Error).message}`);
      return { ok: false, forwarded: false };
    }
  }

  // --- privat ----------------------------------------------------------

  private async call<T>(path: string, params: Record<string, string | number | boolean>): Promise<T> {
    const start = Date.now();
    let attempt = 0;
    let lastErr: unknown;
    while (attempt < 3) {
      try {
        const res = await this.http.get<T>(path, { params });
        await this.logCall(path, res.status, true, Date.now() - start);
        return res.data;
      } catch (err) {
        attempt += 1;
        lastErr = err;
        const status = axios.isAxiosError(err) ? err.response?.status ?? 0 : 0;
        if (status === 429 || status >= 500) {
          await new Promise((r) => setTimeout(r, 250 * attempt * attempt));
          continue;
        }
        await this.logCall(path, status, false, Date.now() - start, (err as Error).message);
        throw new ServiceUnavailableException('Tankerkönig nicht erreichbar.');
      }
    }
    await this.logCall(
      path,
      axios.isAxiosError(lastErr) ? lastErr.response?.status ?? 0 : 0,
      false,
      Date.now() - start,
      (lastErr as Error)?.message,
    );
    throw new ServiceUnavailableException('Tankerkönig nicht erreichbar (Retries erschöpft).');
  }

  private async logCall(
    endpoint: string,
    statusCode: number,
    ok: boolean,
    durationMs: number,
    errorMessage?: string,
  ) {
    try {
      await this.prisma.apiLog.create({
        data: {
          provider: 'tankerkoenig',
          endpoint,
          statusCode,
          ok,
          durationMs,
          errorMessage: errorMessage ?? null,
        },
      });
    } catch {
      // Logging darf nie den Hauptpfad brechen.
    }
  }

  private async persistStationsAndPrices(stations: ProviderStation[]) {
    if (stations.length === 0) return;
    const tx: Promise<unknown>[] = [];
    for (const s of stations) {
      tx.push(
        this.prisma.station.upsert({
          where: { id: s.id },
          update: {
            name: s.name,
            brand: s.brand,
            street: s.street,
            houseNumber: s.houseNumber,
            postCode: s.postCode,
            place: s.place,
            lat: s.lat,
            lng: s.lng,
          },
          create: {
            id: s.id,
            name: s.name,
            brand: s.brand,
            street: s.street,
            houseNumber: s.houseNumber,
            postCode: s.postCode,
            place: s.place,
            lat: s.lat,
            lng: s.lng,
          },
        }),
      );
      const fuelEntries: Array<['E5' | 'E10' | 'DIESEL', number | null]> = [
        ['E5', s.prices.e5],
        ['E10', s.prices.e10],
        ['DIESEL', s.prices.diesel],
      ];
      for (const [fuel, price] of fuelEntries) {
        if (price == null) continue;
        tx.push(
          this.prisma.stationPrice.create({
            data: {
              stationId: s.id,
              fuelType: fuel,
              price,
              status: s.isOpen ? 'OPEN' : 'CLOSED',
              isOpen: s.isOpen,
              source: 'tankerkoenig',
            },
          }),
        );
      }
    }
    await Promise.allSettled(tx);
  }
}

// Hilfsfunktion für Konsumenten der Provider-Antwort, ungenutzt extern.
export function _sortKeyToParam(s: SortKey): string {
  return s === 'distance' ? 'dist' : 'price';
}
