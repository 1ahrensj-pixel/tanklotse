import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AlertType, Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateAlertDto, UpdateAlertDto } from './dto';

@Injectable()
export class AlertsService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.priceAlert.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(userId: string, dto: CreateAlertDto) {
    const alertType: AlertType = dto.alertType ?? AlertType.MAX_PRICE;

    if (!dto.stationId && (dto.lat == null || dto.lng == null || dto.radiusKm == null)) {
      throw new BadRequestException(
        'Entweder stationId ODER (lat, lng, radiusKm) müssen gesetzt sein.',
      );
    }

    if (alertType === AlertType.MAX_PRICE) {
      if (dto.maxPrice == null) {
        throw new BadRequestException('maxPrice ist Pflicht bei MAX_PRICE-Alarmen.');
      }
    } else if (alertType === AlertType.REAL_SAVING) {
      if (dto.minRealSavingEur == null || dto.tankLiters == null || dto.consumptionLPer100Km == null) {
        throw new BadRequestException(
          'minRealSavingEur, tankLiters und consumptionLPer100Km sind Pflicht bei REAL_SAVING-Alarmen.',
        );
      }
    }

    return this.prisma.priceAlert.create({
      data: {
        userId,
        fuelType: dto.fuelType,
        alertType,
        // MAX_PRICE-Felder: maxPrice ist NOT NULL in DB → bei REAL_SAVING ein
        // grosser "Sentinel"-Wert, damit das Pflichtfeld erfuellt ist.
        maxPrice: dto.maxPrice ?? 9.999,
        minRealSavingEur: dto.minRealSavingEur ?? null,
        tankLiters: dto.tankLiters ?? null,
        consumptionLPer100Km: dto.consumptionLPer100Km ?? null,
        maxExtraDistanceKm: dto.maxExtraDistanceKm ?? null,
        onlyOpen: dto.onlyOpen ?? true,
        stationId: dto.stationId ?? null,
        lat: dto.lat ?? null,
        lng: dto.lng ?? null,
        radiusKm: dto.radiusKm ?? null,
        daysOfWeek: dto.daysOfWeek,
        timeWindowStart: dto.timeWindowStart ?? null,
        timeWindowEnd: dto.timeWindowEnd ?? null,
        active: dto.active ?? true,
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateAlertDto) {
    const existing = await this.prisma.priceAlert.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException();
    try {
      return await this.prisma.priceAlert.update({
        where: { id },
        data: dto as Prisma.PriceAlertUncheckedUpdateInput,
      });
    } catch (e) {
      // Syntaktisch valide, aber unbekannte stationId verletzt den FK auf
      // stations_cache (P2003) — sauberes 400 statt 500.
      if ((e as Prisma.PrismaClientKnownRequestError)?.code === 'P2003') {
        throw new BadRequestException('stationId verweist auf keine bekannte Station.');
      }
      throw e;
    }
  }

  async remove(userId: string, id: string) {
    const existing = await this.prisma.priceAlert.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException();
    await this.prisma.priceAlert.delete({ where: { id } });
  }
}
