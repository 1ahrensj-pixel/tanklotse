/**
 * Abstrakte Schnittstelle für jede Datenquelle.
 *
 * Konkrete Provider:
 *   - TankerkoenigProvider (Phase 1, real angebunden)
 *   - FutureMtskProvider   (Phase 2, vorbereitet für direkten MTS-K-Bezug)
 *   - MockProvider         (NUR Tests, niemals produktiv)
 */
export type SortKey = 'price' | 'distance' | 'real_value';

export interface ProviderStation {
  id: string;
  name: string;
  brand: string;
  street: string;
  houseNumber: string | null;
  postCode: string;
  place: string;
  lat: number;
  lng: number;
  distanceKm: number | null;
  isOpen: boolean;
  prices: {
    e5: number | null;
    e10: number | null;
    diesel: number | null;
  };
}

export interface ProviderStationDetail extends ProviderStation {
  openingTimes: Array<{
    text: string;
    start: string;
    end: string;
  }>;
  overrides: string[];
  wholeDay: boolean;
  state: string | null;
  lastUpdated: string | null;
}

export interface SearchParams {
  lat: number;
  lng: number;
  radius: number;
  fuelType: 'E5' | 'E10' | 'DIESEL' | 'ALL';
  sort: SortKey;
}

export interface ComplaintPayload {
  stationId: string;
  type: string;
  correction?: string;
}

export const FUEL_PROVIDER = Symbol('FUEL_PROVIDER');

export interface FuelPriceProvider {
  readonly name: string;
  readonly attribution: string;

  search(params: SearchParams): Promise<ProviderStation[]>;
  getDetail(stationId: string): Promise<ProviderStationDetail>;
  getPrices(stationIds: string[]): Promise<Record<string, ProviderStation['prices'] & { isOpen: boolean }>>;
  submitComplaint(payload: ComplaintPayload): Promise<{ ok: boolean; forwarded: boolean }>;
}
