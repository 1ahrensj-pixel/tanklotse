import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../../common/guards/roles.guard';
import { ExternalServicesService } from './external-services.service';

/**
 * Admin-Endpoint fuer den Konfigurations-Status externer Dienste
 * (Auftrag §20, Audit 2026-05-06 §11 Aufgabe 6).
 *
 * - Geschuetzt durch JwtAuthGuard + RolesGuard
 * - Nur SUPERADMIN und DEVELOPER haben Zugriff. ADMIN wurde bewusst
 *   entfernt: der Endpunkt verraet zwar keine Secret-Werte, gibt aber
 *   Betriebsinformation preis (welche Provider aktiv sind, welche Keys
 *   fehlen, welche Sicherheitsfeatures aus sind). Das gehoert in
 *   Operations-/Engineering-Hand.
 * - Antworten enthalten ausschliesslich Variablen-Namen und Booleans,
 *   niemals Secret-Werte.
 */
@ApiTags('admin/system')
@Controller('admin/system')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPERADMIN, Role.DEVELOPER)
@ApiBearerAuth()
export class ExternalServicesController {
  constructor(private readonly svc: ExternalServicesService) {}

  @Get('external-services')
  @ApiOperation({
    summary: 'Status aller externen Dienste (ohne Secrets)',
    description:
      'Gibt fuer jeden externen Dienst zurueck: aktiv/inaktiv, vollstaendig konfiguriert ja/nein, ' +
      'fehlende oder ungueltige ENV-Schluessel (nur Namen, NIE Werte).',
  })
  list() {
    return {
      summary: this.svc.summary(),
      services: this.svc.list(),
    };
  }
}
