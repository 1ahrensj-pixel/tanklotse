import { Injectable } from '@nestjs/common';
import { ComplaintStatus, ComplaintType } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import {
  ComplaintPersistenceInput,
  StationPersistenceRecord,
  StationsPersistencePort,
} from '../ports/stations-persistence.port';

/**
 * PR #24 §6.2 — Hexagonal-Adapter fuer Prisma.
 *
 * Konkrete Implementierung der `StationsPersistencePort`-Schnittstelle.
 * Die Service-Schicht spricht nur mit dem Port, nicht mit diesem Adapter
 * — der Adapter ist beim DI-Container austauschbar (z.B. In-Memory fuer
 * Tests, ein anderer ORM fuer eine zukuenftige Migration).
 */
@Injectable()
export class PrismaStationsPersistenceAdapter implements StationsPersistencePort {
  constructor(private readonly prisma: PrismaService) {}

  async findStationById(id: string): Promise<StationPersistenceRecord | null> {
    const s = await this.prisma.station.findUnique({ where: { id } });
    if (!s) return null;
    return {
      id: s.id,
      name: s.name,
      brand: s.brand,
      street: s.street,
      houseNumber: s.houseNumber,
      postCode: s.postCode,
      place: s.place,
      // Prisma liefert Decimal fuer @db.Decimal-Spalten — Port erwartet number.
      lat: Number(s.lat),
      lng: Number(s.lng),
    };
  }

  async upsertStation(record: StationPersistenceRecord): Promise<void> {
    await this.prisma.station.upsert({
      where: { id: record.id },
      update: {},
      create: record,
    });
  }

  async createComplaint(input: ComplaintPersistenceInput): Promise<void> {
    await this.prisma.complaint.create({
      data: {
        userId: input.userId,
        stationId: input.stationId,
        complaintType: input.complaintType as ComplaintType,
        correction: input.correction,
        status: input.status as ComplaintStatus,
        forwardedAt: input.forwardedAt,
      },
    });
  }
}
