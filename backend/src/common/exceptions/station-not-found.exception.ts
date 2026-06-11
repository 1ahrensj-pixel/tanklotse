import { NotFoundException } from '@nestjs/common';

/**
 * Wird geworfen, wenn ein Service eine Station-ID nicht im Repository
 * findet. Statt generischem `NotFoundException` liefert dieses Pattern
 * einen stabilen `error`-Code (`STATION_NOT_FOUND`) fuer das Frontend.
 */
export class StationNotFoundException extends NotFoundException {
  constructor(stationId: string) {
    super({
      statusCode: 404,
      error: 'STATION_NOT_FOUND',
      message: `Tankstelle ${stationId} nicht gefunden.`,
    });
  }
}
