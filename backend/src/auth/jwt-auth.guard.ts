import {
  ExecutionContext,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

export const ALLOW_TOTP_PENDING_KEY = 'allowTotpPending';

/**
 * Markiert Endpunkte, die mit einem 2FA-Pre-Auth-Token (Claim
 * `totpPending: true`) erreichbar sein muessen — aktuell ausschliesslich
 * POST /admin/2fa/verify. Alle anderen JWT-geschuetzten Endpunkte lehnen
 * Pre-Auth-Tokens mit 401 + Fehlercode `TOTP_REQUIRED` ab.
 */
export const AllowTotpPending = () => SetMetadata(ALLOW_TOTP_PENDING_KEY, true);

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ok = await (super.canActivate(context) as boolean | Promise<boolean>);
    if (!ok) return false;

    const req = context.switchToHttp().getRequest();
    const user = req.user as { totpPending?: boolean } | undefined;
    if (user?.totpPending) {
      const allowed = this.reflector.getAllAndOverride<boolean | undefined>(
        ALLOW_TOTP_PENDING_KEY,
        [context.getHandler(), context.getClass()],
      );
      if (!allowed) {
        // Step-up unvollstaendig: Passwort war korrekt, aber der TOTP-Code
        // fehlt noch. Eindeutiger Fehlercode fuer Clients (Admin-Dashboard).
        throw new UnauthorizedException({
          message: '2FA-Verifizierung erforderlich.',
          error: 'TOTP_REQUIRED',
        });
      }
    }
    return true;
  }
}
