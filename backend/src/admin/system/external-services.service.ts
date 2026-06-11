import { Injectable, Optional } from '@nestjs/common';

import {
  buildExternalServicesStatus,
  ExternalServicesConfig,
  getExternalServicesConfig,
} from '../../common/config/external-services.config';
import { ExternalServiceStatus } from '../../common/config/external-services.types';

/**
 * Liefert den Status aller externen Dienste (Auftrag §19/§20).
 *
 * Garantie: gibt NIEMALS Secret-Werte zurueck. Nur Variablen-Namen
 * (`missingKeys`/`invalidKeys`) und Boolean-Flags.
 */
@Injectable()
export class ExternalServicesService {
  private readonly readConfig: () => ExternalServicesConfig;

  /**
   * Bietet die Konfigurations-Lookup-Funktion injection-freundlich an
   * (ueberschreibbar in Tests). Default: liest `process.env`.
   *
   * `@Optional()` ist Pflicht, weil Nest sonst versucht, eine
   * Funktion per DI aufzuloesen (es gibt keinen Function-Provider).
   */
  constructor(@Optional() readConfig?: () => ExternalServicesConfig) {
    this.readConfig = readConfig ?? (() => getExternalServicesConfig());
  }

  /**
   * Hauptfunktion fuer den Admin-Endpoint.
   * Gibt eine Liste aller Dienste mit ihrem aktuellen Status zurueck.
   */
  list(): ExternalServiceStatus[] {
    return buildExternalServicesStatus(this.readConfig());
  }

  /**
   * Aggregierte Gesamtsicht — pratisch fuer Health-Dashboards.
   */
  summary(): {
    total: number;
    configured: number;
    missing: number;
    invalid: number;
    disabled: number;
    optional: number;
  } {
    const list = this.list();
    return {
      total: list.length,
      configured: list.filter((s) => s.status === 'configured').length,
      missing: list.filter((s) => s.status === 'missing').length,
      invalid: list.filter((s) => s.status === 'invalid').length,
      disabled: list.filter((s) => s.status === 'disabled').length,
      optional: list.filter((s) => s.status === 'optional').length,
    };
  }
}
