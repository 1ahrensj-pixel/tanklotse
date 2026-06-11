import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';

import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { ROLES_KEY, RolesGuard } from '../../common/guards/roles.guard';
import { ExternalServicesController } from './external-services.controller';

/**
 * Audit 2026-05-06 §14 Aufgabe 7 + §15 P2 Aufgabe 8: harte Tests fuer den
 * Admin-System-Endpoint. Prueft via Decorator-Reflection, dass nur
 * SUPERADMIN + DEVELOPER zulaessig sind, und via RolesGuard-Direktaufruf
 * alle relevanten Rollen- und Anonym-Faelle (SUPERADMIN/DEVELOPER ok;
 * ADMIN/USER/SUPPORT/READONLY 403; anonym/User-ohne-role-Feld 403 von
 * RolesGuard, in der echten Pipeline schon vorher 401 von JwtAuthGuard).
 */
describe('ExternalServicesController — Rollen-Schutz', () => {
  function makeContext(user?: { role?: Role }): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
        getResponse: () => ({}),
        getNext: () => ({}),
      }),
      getHandler: () => () => undefined,
      getClass: () => ExternalServicesController,
      // unbenoetigte Felder fuer diesen Test:
      getArgs: () => [],
      getArgByIndex: () => undefined,
      getType: () => 'http',
      switchToRpc: () => ({}) as never,
      switchToWs: () => ({}) as never,
    } as unknown as ExecutionContext;
  }

  it('Decorator-Reflection: nur SUPERADMIN + DEVELOPER sind erlaubt (ADMIN entfernt)', () => {
    const reflector = new Reflector();
    const allowed = reflector.get<Role[]>(ROLES_KEY, ExternalServicesController);
    expect(allowed).toBeDefined();
    expect(allowed).toEqual(expect.arrayContaining([Role.SUPERADMIN, Role.DEVELOPER]));
    expect(allowed).not.toContain(Role.ADMIN);
    expect(allowed).not.toContain(Role.USER);
    expect(allowed).not.toContain(Role.SUPPORT);
    expect(allowed).not.toContain(Role.READONLY);
    expect(allowed.length).toBe(2);
  });

  describe('RolesGuard-Verhalten gegen alle relevanten Rollen- und Anonym-Faelle', () => {
    function guardFor() {
      const reflector = new Reflector();
      // Spy: setze die Required-Roles wie auf dem Controller (nur SUPERADMIN+DEVELOPER).
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([Role.SUPERADMIN, Role.DEVELOPER]);
      return new RolesGuard(reflector);
    }

    it('SUPERADMIN: Zugriff erlaubt', () => {
      const guard = guardFor();
      expect(guard.canActivate(makeContext({ role: Role.SUPERADMIN }))).toBe(true);
    });

    it('DEVELOPER: Zugriff erlaubt', () => {
      const guard = guardFor();
      expect(guard.canActivate(makeContext({ role: Role.DEVELOPER }))).toBe(true);
    });

    it('ADMIN: 403 (Auditor §14 Aufgabe 6: ADMIN entfernt)', () => {
      const guard = guardFor();
      expect(() => guard.canActivate(makeContext({ role: Role.ADMIN }))).toThrow(
        ForbiddenException,
      );
    });

    it('USER: 403', () => {
      const guard = guardFor();
      expect(() => guard.canActivate(makeContext({ role: Role.USER }))).toThrow(
        ForbiddenException,
      );
    });

    it('SUPPORT: 403', () => {
      const guard = guardFor();
      expect(() => guard.canActivate(makeContext({ role: Role.SUPPORT }))).toThrow(
        ForbiddenException,
      );
    });

    it('READONLY: 403', () => {
      const guard = guardFor();
      expect(() => guard.canActivate(makeContext({ role: Role.READONLY }))).toThrow(
        ForbiddenException,
      );
    });

    it('Anonym (kein user-Object): 403 — RolesGuard antwortet vor JwtAuthGuard nicht; das ist OK, weil JwtAuthGuard 401 wirft, BEVOR RolesGuard erreicht wird', () => {
      const guard = guardFor();
      expect(() => guard.canActivate(makeContext(undefined))).toThrow(ForbiddenException);
      // Hinweis: in der echten Pipeline wird JwtAuthGuard zuerst angewandt
      // (Dekorator-Reihenfolge in @UseGuards(JwtAuthGuard, RolesGuard)) und
      // wirft 401, bevor RolesGuard ueberhaupt die Rolle pruefen muss.
    });

    it('User-Object ohne role-Feld: 403', () => {
      const guard = guardFor();
      expect(() => guard.canActivate(makeContext({}))).toThrow(ForbiddenException);
    });
  });

  it('JwtAuthGuard ist als erster Guard registriert (anonym → 401 vor RolesGuard)', () => {
    // Dekorator-Reflection: __guards__ Metadata enthaelt JwtAuthGuard zuerst.
    const guards = Reflect.getMetadata('__guards__', ExternalServicesController);
    expect(guards).toBeDefined();
    expect(guards.length).toBeGreaterThanOrEqual(2);
    // erster Guard ist JwtAuthGuard
    expect(guards[0]).toBe(JwtAuthGuard);
    // zweiter Guard ist RolesGuard
    expect(guards[1]).toBe(RolesGuard);
  });
});
