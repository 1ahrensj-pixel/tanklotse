import { BadRequestException } from '@nestjs/common';

/**
 * Wird geworfen, wenn `lat`/`lng` ausserhalb der zulaessigen Bereiche
 * liegen. Wird typischerweise von `CoordinatesDto`/Validation gefangen,
 * bleibt aber als Programmatic-Throw nuetzlich.
 */
export class InvalidCoordinatesException extends BadRequestException {
  constructor(lat: unknown, lng: unknown) {
    super({
      statusCode: 400,
      error: 'INVALID_COORDINATES',
      message:
        `Koordinaten ungueltig: lat=${lat}, lng=${lng}. ` +
        `Erlaubt: lat ∈ [-90, 90], lng ∈ [-180, 180].`,
    });
  }
}
