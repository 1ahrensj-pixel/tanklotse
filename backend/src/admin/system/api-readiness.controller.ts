import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../../common/guards/roles.guard';
import { ApiReadinessService } from './api-readiness.service';

/**
 * Audit 2026-05-06 §22 Phase 2: Live-Readiness fuer Staging.
 *
 * Genau wie `/api/admin/system/external-services` ist dieser Endpoint
 * geschuetzt durch JwtAuthGuard + RolesGuard mit den engen Rollen
 * SUPERADMIN + DEVELOPER. Antwort enthaelt KEINE Secret-Werte.
 */
@ApiTags('admin/system')
@Controller('admin/system')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPERADMIN, Role.DEVELOPER)
@ApiBearerAuth()
export class ApiReadinessController {
  constructor(private readonly svc: ApiReadinessService) {}

  @Get('api-readiness')
  @ApiOperation({
    summary: 'Live-API-Readiness inkl. Mapbox-Kostenkontrolle (ohne Secrets)',
    description:
      'Gibt fuer jeden externen Provider zurueck: konfiguriert ja/nein, ' +
      'live-smoke verfuegbar ja/nein, Status-Code, fehlende Schluessel ' +
      '(NUR Namen). Plus Mapbox-Counters (Sliding-Window 1h) fuer ' +
      'Kostenbeobachtung.',
  })
  snapshot() {
    return this.svc.snapshot();
  }
}
