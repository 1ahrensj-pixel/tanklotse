import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { RecommendationsService } from '../recommendations/recommendations.service';
import { CreateSavedRouteDto, UpdateSavedRouteDto } from './saved-routes.dto';

@Injectable()
export class SavedRoutesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly recommendations: RecommendationsService,
  ) {}

  list(userId: string) {
    return this.prisma.savedRoute.findMany({
      where: { userId },
      orderBy: [{ active: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async get(userId: string, id: string) {
    const r = await this.prisma.savedRoute.findUnique({ where: { id } });
    if (!r) throw new NotFoundException();
    if (r.userId !== userId) throw new ForbiddenException();
    return r;
  }

  async create(userId: string, dto: CreateSavedRouteDto) {
    await this.assertVehicleBelongsToUser(userId, dto.defaultVehicleId);
    return this.prisma.savedRoute.create({
      data: {
        userId,
        name: dto.name,
        startLabel: dto.startLabel,
        startLat: dto.startLat,
        startLng: dto.startLng,
        endLabel: dto.endLabel,
        endLat: dto.endLat,
        endLng: dto.endLng,
        fuelType: dto.fuelType,
        defaultVehicleId: dto.defaultVehicleId ?? null,
        maxDetourKm: dto.maxDetourKm ?? 3,
        active: dto.active ?? true,
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateSavedRouteDto) {
    await this.get(userId, id); // wirft 404/403
    if ('defaultVehicleId' in dto) {
      await this.assertVehicleBelongsToUser(userId, dto.defaultVehicleId ?? null);
    }
    return this.prisma.savedRoute.update({ where: { id }, data: dto });
  }

  /**
   * Audit-Finding §7 / Pruefbericht 2026-05-06: Schema referenziert
   * `vehicles.id`, prueft aber nicht, ob das Fahrzeug demselben User gehoert.
   * Ohne diesen Guard kann ein User eine fremde Fahrzeug-ID an seine Route
   * haengen.
   */
  private async assertVehicleBelongsToUser(
    userId: string,
    vehicleId?: string | null,
  ): Promise<void> {
    if (!vehicleId) return;
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: vehicleId, userId },
      select: { id: true },
    });
    if (!vehicle) {
      throw new ForbiddenException('Fahrzeug gehoert nicht zu diesem Nutzer.');
    }
  }

  async remove(userId: string, id: string) {
    await this.get(userId, id);
    await this.prisma.savedRoute.delete({ where: { id } });
  }

  async getRecommendations(userId: string, id: string, consumption: number, tankLiters: number) {
    const r = await this.get(userId, id);
    return this.recommendations.stationsAlongRoute({
      start: { lat: Number(r.startLat), lng: Number(r.startLng) },
      end: { lat: Number(r.endLat), lng: Number(r.endLng) },
      fuelType: r.fuelType,
      consumptionLPer100Km: consumption,
      tankLiters,
      maxOffsetKm: Number(r.maxDetourKm),
    });
  }
}
