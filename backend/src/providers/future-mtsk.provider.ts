import { Injectable, NotImplementedException } from '@nestjs/common';

import {
  ComplaintPayload,
  FuelPriceProvider,
  ProviderStation,
  ProviderStationDetail,
  SearchParams,
} from './fuel-price.interface';

/**
 * Platzhalter-Adapter für direkten MTS-K-Bezug bzw. einen kommerziellen
 * Datenanbieter (Phase 2). Solange keine eigene VID-Zulassung vorliegt,
 * darf dieser Provider nicht aktiviert werden — alle Methoden werfen.
 *
 * Die Implementierungs-Schritte sind in docs/11-data-provider-migration.md
 * detailliert beschrieben.
 */
@Injectable()
export class FutureMtskProvider implements FuelPriceProvider {
  readonly name = 'mtsk';
  readonly attribution =
    'Datenquelle: Markttransparenzstelle für Kraftstoffe (MTS-K), Direktbezug über VID-Zulassung.';

  private notReady(): never {
    throw new NotImplementedException(
      'MTS-K-Direktbezug ist nicht aktiv. Siehe docs/11-data-provider-migration.md.',
    );
  }

  search(_params: SearchParams): Promise<ProviderStation[]> {
    return this.notReady();
  }
  getDetail(_id: string): Promise<ProviderStationDetail> {
    return this.notReady();
  }
  getPrices(_ids: string[]) {
    return this.notReady();
  }
  submitComplaint(_p: ComplaintPayload) {
    return this.notReady();
  }
}
