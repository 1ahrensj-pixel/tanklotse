import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto, UpdateVehicleDto } from './dto';

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.vehicle.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async create(userId: string, dto: CreateVehicleDto) {
    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) {
        await tx.vehicle.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
      }
      return tx.vehicle.create({ data: { ...dto, userId } });
    });
  }

  async update(userId: string, id: string, dto: UpdateVehicleDto) {
    const existing = await this.prisma.vehicle.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException();
    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) {
        await tx.vehicle.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
      }
      return tx.vehicle.update({ where: { id }, data: dto });
    });
  }

  async remove(userId: string, id: string) {
    const existing = await this.prisma.vehicle.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException();
    await this.prisma.vehicle.delete({ where: { id } });
  }
}
