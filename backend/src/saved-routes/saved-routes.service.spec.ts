import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { FuelType } from '@prisma/client';

import { SavedRoutesService } from './saved-routes.service';

describe('SavedRoutesService — Ownership', () => {
  function makeSvc(routeOwner: string | null, vehicleOwner?: string) {
    const prisma = {
      savedRoute: {
        findUnique: jest.fn().mockResolvedValue(
          routeOwner == null
            ? null
            : { id: 'r1', userId: routeOwner, name: 'r1' },
        ),
        findMany: jest.fn(),
        create: jest.fn().mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
          id: 'new-r',
          ...data,
        })),
        update: jest.fn().mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
          id: 'r1',
          ...data,
        })),
        delete: jest.fn(),
      },
      vehicle: {
        findFirst: jest.fn().mockImplementation(
          async ({ where }: { where: { id: string; userId: string } }) =>
            vehicleOwner != null && where.userId === vehicleOwner
              ? { id: where.id }
              : null,
        ),
      },
    };
    const recs = { stationsAlongRoute: jest.fn() };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { svc: new SavedRoutesService(prisma as any, recs as any), prisma, recs };
  }

  const baseCreateDto = {
    name: 'Heimweg',
    startLabel: 'Buero',
    startLat: 50.93,
    startLng: 6.95,
    endLabel: 'Zuhause',
    endLat: 51.0,
    endLng: 7.0,
    fuelType: FuelType.DIESEL,
    maxDetourKm: 3,
    active: true,
  };

  it('User A darf Route von User B nicht lesen → 403', async () => {
    const { svc } = makeSvc('user-b');
    await expect(svc.get('user-a', 'r1')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('Unbekannte Route → 404', async () => {
    const { svc } = makeSvc(null);
    await expect(svc.get('user-a', 'r1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('Eigene Route → liefert Route', async () => {
    const { svc } = makeSvc('user-a');
    const r = await svc.get('user-a', 'r1');
    expect(r.id).toBe('r1');
  });

  it('Update auf fremde Route → 403, kein update-Call', async () => {
    const { svc, prisma } = makeSvc('user-b');
    await expect(svc.update('user-a', 'r1', { name: 'X' })).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.savedRoute.update).not.toHaveBeenCalled();
  });

  it('Delete auf fremde Route → 403, kein delete-Call', async () => {
    const { svc, prisma } = makeSvc('user-b');
    await expect(svc.remove('user-a', 'r1')).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.savedRoute.delete).not.toHaveBeenCalled();
  });

  it('Recommendations auf fremde Route → 403', async () => {
    const { svc } = makeSvc('user-b');
    await expect(svc.getRecommendations('user-a', 'r1', 7, 50)).rejects.toBeInstanceOf(ForbiddenException);
  });

  // Audit-Finding §7 / Pruefbericht 2026-05-06: defaultVehicleId muss Eigentum
  // des Aufrufers sein.
  describe('defaultVehicleId-Ownership-Guard', () => {
    it('create: eigene vehicleId → erlaubt', async () => {
      const { svc, prisma } = makeSvc(null, 'user-a');
      await expect(
        svc.create('user-a', { ...baseCreateDto, defaultVehicleId: 'veh-1' }),
      ).resolves.toMatchObject({ defaultVehicleId: 'veh-1' });
      expect(prisma.vehicle.findFirst).toHaveBeenCalledWith({
        where: { id: 'veh-1', userId: 'user-a' },
        select: { id: true },
      });
      expect(prisma.savedRoute.create).toHaveBeenCalled();
    });

    it('create: fremde vehicleId → 403, kein savedRoute.create', async () => {
      const { svc, prisma } = makeSvc(null, 'user-b');
      await expect(
        svc.create('user-a', { ...baseCreateDto, defaultVehicleId: 'veh-of-b' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.savedRoute.create).not.toHaveBeenCalled();
    });

    it('create: ohne defaultVehicleId → keine Vehicle-Pruefung, erlaubt', async () => {
      const { svc, prisma } = makeSvc(null);
      await expect(svc.create('user-a', baseCreateDto)).resolves.toBeDefined();
      expect(prisma.vehicle.findFirst).not.toHaveBeenCalled();
    });

    it('update: fremde vehicleId → 403, kein savedRoute.update', async () => {
      const { svc, prisma } = makeSvc('user-a', 'user-b');
      await expect(
        svc.update('user-a', 'r1', { defaultVehicleId: 'veh-of-b' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.savedRoute.update).not.toHaveBeenCalled();
    });

    it('update: defaultVehicleId=null (entfernen) → erlaubt, keine Vehicle-Pruefung', async () => {
      const { svc, prisma } = makeSvc('user-a');
      await expect(
        svc.update('user-a', 'r1', { defaultVehicleId: null }),
      ).resolves.toBeDefined();
      expect(prisma.vehicle.findFirst).not.toHaveBeenCalled();
      expect(prisma.savedRoute.update).toHaveBeenCalled();
    });

    it('update: eigene vehicleId → erlaubt', async () => {
      const { svc, prisma } = makeSvc('user-a', 'user-a');
      await expect(
        svc.update('user-a', 'r1', { defaultVehicleId: 'veh-own' }),
      ).resolves.toBeDefined();
      expect(prisma.savedRoute.update).toHaveBeenCalled();
    });
  });
});
