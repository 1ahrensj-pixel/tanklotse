import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';

import { DetourService } from './detour.service';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationsService } from './recommendations.service';
import { FUEL_PROVIDER, FuelPriceProvider } from '../providers/fuel-price.interface';
import { SavingsService } from '../savings/savings.service';

describe('RecommendationsController (HTTP)', () => {
  let app: INestApplication;

  const stubProvider: FuelPriceProvider = {
    name: 'stub',
    attribution: 'Test',
    async search() {
      return [];
    },
    async getDetail() {
      throw new Error('not used');
    },
    async getPrices() {
      return {};
    },
    async submitComplaint() {
      return { ok: true, forwarded: false };
    },
  };

  beforeAll(async () => {
    const mod = await Test.createTestingModule({
      controllers: [RecommendationsController],
      providers: [
        SavingsService,
        DetourService,
        RecommendationsService,
        { provide: FUEL_PROVIDER, useValue: stubProvider },
      ],
    }).compile();

    app = mod.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('Spec-Beispiel 1: Diesel 1,70 → 1,60 / 50 l / 4 km / 8 l/100km → +4,488 €', async () => {
    const res = await request(app.getHttpServer())
      .post('/recommendations/detour-calculation')
      .send({
        comparisonPricePerLiter: 1.7,
        targetPricePerLiter: 1.6,
        detourKm: 4,
        consumptionLPer100Km: 8,
        tankLiters: 50,
      })
      .expect(201);
    expect(res.body.priceAdvantageEur).toBeCloseTo(5.0, 2);
    expect(res.body.detourFuelCostEur).toBeCloseTo(0.51, 2);
    expect(res.body.realSavingsEur).toBeCloseTo(4.49, 2);
    expect(res.body.verdict).toBe('lohnt_sich');
  });

  it('Spec-Beispiel 2: Diesel 1,70 → 1,68 / 40 l / 8 km / 10 l/100km → -0,544 €', async () => {
    const res = await request(app.getHttpServer())
      .post('/recommendations/detour-calculation')
      .send({
        comparisonPricePerLiter: 1.7,
        targetPricePerLiter: 1.68,
        detourKm: 8,
        consumptionLPer100Km: 10,
        tankLiters: 40,
      })
      .expect(201);
    expect(res.body.priceAdvantageEur).toBeCloseTo(0.8, 2);
    expect(res.body.detourFuelCostEur).toBeCloseTo(1.34, 2);
    expect(res.body.realSavingsEur).toBeLessThan(0);
    // Legacy-Verdict-Mapping: ERST_AB_X_LITERN → 'nur_wenn_vorbei' (siehe SavingsService)
    expect(['nur_wenn_vorbei', 'lohnt_sich_nicht']).toContain(res.body.verdict);
    expect(res.body.breakEvenLiters).toBeCloseTo(67.2, 0);
  });

  it('Validation: ungueltige Werte werden mit 400 abgelehnt', async () => {
    await request(app.getHttpServer())
      .post('/recommendations/detour-calculation')
      .send({
        comparisonPricePerLiter: -1,
        targetPricePerLiter: 1.6,
        detourKm: 4,
        consumptionLPer100Km: 8,
        tankLiters: 50,
      })
      .expect(400);
  });
});
