import { ConflictException } from '@nestjs/common';

/**
 * Wird geworfen, wenn ein Resource-Create gegen eine UNIQUE-Constraint
 * laeuft (z.B. Favorit fuer Station bereits angelegt, gespeicherte
 * Route mit demselben Namen, doppelte Email bei Registrierung).
 */
export class DuplicateResourceException extends ConflictException {
  constructor(resource: string, field?: string) {
    super({
      statusCode: 409,
      error: 'DUPLICATE_RESOURCE',
      message: field
        ? `${resource} mit ${field}=… existiert bereits.`
        : `${resource} existiert bereits.`,
      resource,
      field: field ?? null,
    });
  }
}
