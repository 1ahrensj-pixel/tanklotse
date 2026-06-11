import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Optionaler JWT-Guard (Audit-Befund "POST /stations/:id/complaint
 * verlangt JWT, App bietet den Flow anonym an").
 *
 * Verhaelt sich wie `JwtAuthGuard`, wirft aber KEIN 401 bei fehlendem
 * oder ungueltigem Token: `req.user` bleibt dann einfach `null`.
 * Endpoints koennen so eingeloggte Nutzer zuordnen (`req.user.sub`)
 * und anonyme Nutzer trotzdem bedienen (z. B.
 * `stations.service.complaint` mit `userId=null`).
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = unknown>(_err: unknown, user: TUser | false | null): TUser {
    // Bei Fehler/fehlendem Token: anonym weiter statt UnauthorizedException.
    // 2FA-Pre-Auth-Tokens (Claim totpPending) gelten ebenfalls als anonym —
    // vor abgeschlossenem Step-up darf nichts personalisiert werden.
    const candidate = user as { totpPending?: boolean } | false | null;
    if (candidate && candidate.totpPending) return null as TUser;
    return (user || null) as TUser;
  }
}
