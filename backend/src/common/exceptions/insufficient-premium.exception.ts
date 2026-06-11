import { ForbiddenException } from '@nestjs/common';

/**
 * Wird geworfen, wenn ein Endpoint ein Premium-Feature anbietet und der
 * aktuelle Nutzer kein aktives Abo hat. Klarer Fehler-Code, damit das
 * Frontend gezielt einen Upgrade-CTA anzeigen kann.
 */
export class InsufficientPremiumException extends ForbiddenException {
  constructor(feature: string) {
    super({
      statusCode: 403,
      error: 'INSUFFICIENT_PREMIUM',
      message: `Feature "${feature}" erfordert ein Premium-Abo.`,
      feature,
    });
  }
}
