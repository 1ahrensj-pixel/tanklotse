import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { FUEL_PROVIDER, FuelPriceProvider, ProviderStation } from '../providers/fuel-price.interface';
import {
  STATIONS_PERSISTENCE_PORT,
  StationsPersistencePort,
} from './ports/stations-persistence.port';
import { SearchStationsDto, FuelTypeQuery } from './dto';

/**
 * PR #24 §6.2 — Hexagonal-Pilot. Service spricht nur mit zwei Ports:
 *   - FUEL_PROVIDER (Provider-Sicht — Tankerkoenig/Mock/...)
 *   - STATIONS_PERSISTENCE_PORT (DB-Sicht — Prisma/InMemory/...)
 *
 * Keine direkte Prisma-Abhaengigkeit mehr.
 */
@Injectable()
export class StationsService {
  constructor(
    @Inject(FUEL_PROVIDER) private readonly provider: FuelPriceProvider,
    @Inject(STATIONS_PERSISTENCE_PORT)
    private readonly persistence: StationsPersistencePort,
  ) {}

  async search(dto: SearchStationsDto) {
    const stations = await this.provider.search({
      lat: dto.lat,
      lng: dto.lng,
      radius: dto.radius,
      fuelType: dto.fuelType,
      sort: dto.sort === 'distance' ? 'distance' : 'price',
    });

    let filtered = stations;
    if (dto.onlyOpen) {
      filtered = filtered.filter((s) => s.isOpen);
    }
    // BrandFilter NUR wenn Nutzer ihn explizit setzt; sonst keine versteckte Filterung.
    if (dto.brandFilter && dto.brandFilter.length > 0) {
      const wanted = new Set(dto.brandFilter.map((b) => b.toLowerCase()));
      filtered = filtered.filter((s) => wanted.has(s.brand.toLowerCase()));
    }

    return {
      attribution: this.provider.attribution,
      count: filtered.length,
      stations: filtered.map((s) => this.shapeStation(s, dto.fuelType)),
    };
  }

  async detail(id: string) {
    try {
      const detail = await this.provider.getDetail(id);
      return {
        attribution: this.provider.attribution,
        station: detail,
      };
    } catch {
      // Provider liefert plain Error fuer unbekannte IDs — in 404 uebersetzen,
      // damit der Client einen aussagekraeftigen Status erhaelt.
      throw new NotFoundException(`Station ${id} nicht gefunden.`);
    }
  }

  async prices(id: string) {
    const data = await this.provider.getPrices([id]);
    const found = data[id];
    if (!found) {
      throw new NotFoundException(`Station ${id} nicht gefunden.`);
    }
    return {
      attribution: this.provider.attribution,
      prices: found,
    };
  }

  async complaint(stationId: string, type: string, correction: string | undefined, userId: string | null) {
    // Station muss in DB existieren (FK). Bei Cache-Miss → on-the-fly aus Provider holen + persistieren.
    const exists = await this.persistence.findStationById(stationId);
    if (!exists) {
      try {
        const detail = await this.provider.getDetail(stationId);
        await this.persistence.upsertStation({
          id: detail.id,
          name: detail.name,
          brand: detail.brand,
          street: detail.street,
          houseNumber: detail.houseNumber,
          postCode: detail.postCode,
          place: detail.place,
          lat: detail.lat,
          lng: detail.lng,
        });
      } catch {
        // Station weder in DB noch beim Provider — wir verweigern.
        throw new Error(`Station ${stationId} unbekannt.`);
      }
    }
    const result = await this.provider.submitComplaint({ stationId, type, correction });
    await this.persistence.createComplaint({
      userId,
      stationId,
      complaintType: type,
      correction,
      status: result.forwarded ? 'FORWARDED' : 'PENDING',
      forwardedAt: result.forwarded ? new Date() : null,
    });
    return result;
  }

  private shapeStation(s: ProviderStation, fuel: FuelTypeQuery) {
    const fuelKey =
      fuel === FuelTypeQuery.E5
        ? 'e5'
        : fuel === FuelTypeQuery.E10
          ? 'e10'
          : fuel === FuelTypeQuery.DIESEL
            ? 'diesel'
            : null;
    return {
      id: s.id,
      name: s.name,
      brand: s.brand,
      address: {
        street: s.street,
        houseNumber: s.houseNumber,
        postCode: s.postCode,
        place: s.place,
      },
      lat: s.lat,
      lng: s.lng,
      distanceKm: s.distanceKm,
      isOpen: s.isOpen,
      prices: s.prices,
      selectedPrice: fuelKey ? s.prices[fuelKey] : null,
    };
  }
}
