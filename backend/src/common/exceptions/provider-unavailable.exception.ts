import { ServiceUnavailableException } from '@nestjs/common';

/**
 * Wird geworfen, wenn ein externer Provider (Tankerkoenig, Mapbox,
 * Nominatim, FCM, ...) nicht antwortet, ein Timeout produziert oder
 * 5xx liefert. Klare Trennung zu `INVALID_INPUT` (Client-Fehler) und
 * `STATION_NOT_FOUND` (Resource-Fehler).
 *
 * Wichtig: `reason` darf NIE die Provider-URL inklusive Tokens
 * enthalten — der `redactMapboxToken`-Helper aus dem Routing-Service
 * kuemmert sich darum bei Logs. Hier nur ein generisches Label.
 */
export class ProviderUnavailableException extends ServiceUnavailableException {
  constructor(provider: string, reason?: string) {
    super({
      statusCode: 503,
      error: 'PROVIDER_UNAVAILABLE',
      message: `Externer Anbieter "${provider}" ist aktuell nicht erreichbar.`,
      provider,
      reason: reason ?? null,
    });
  }
}
