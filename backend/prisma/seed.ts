import 'dotenv/config';
import { PrismaClient, Role, FuelType, ConsentType, Platform } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

// =============================================================================
// Seed-Daten für TankLotse (Dev + lokales Testing)
// =============================================================================
// Legt an:
//   1. SuperAdmin  admin@tanklotse.local  (Passwort aus ADMIN_SEED_PASSWORD)
//   2. Demo-User   demo@tanklotse.local   (Passwort: Demo1234!dev)
//   3. Weiteres Test-Konto user2@tanklotse.local
//   4. Demo-Fahrzeug  (VW Golf, E10, Default)
//   5. Demo-Route     (München Hbf → Flughafen MUC)
//   6. Musterbehälter (5 Tankstellen in München-Nähe + aktuelle Preise)
//   7. Favorit (demo-User → Station 1)
//   8. Preisalarm (demo-User, max 1,80 €/L E10, Radius 5 km)
//   9. Feature-Flags (unverändert — upsert)
//  10. Konsent-Einträge für Demo-User
// =============================================================================

async function main() {
  // ---------------------------------------------------------------------------
  // 1. SuperAdmin
  // ---------------------------------------------------------------------------
  const adminEmail = process.env.ADMIN_SEED_EMAIL ?? 'admin@tanklotse.local';
  const adminPassword = process.env.ADMIN_SEED_PASSWORD;

  if (!adminPassword || adminPassword.length < 12) {
    throw new Error(
      'ADMIN_SEED_PASSWORD muss gesetzt und mindestens 12 Zeichen lang sein.',
    );
  }

  const adminHash = await argon2.hash(adminPassword, { type: argon2.argon2id });

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: Role.SUPERADMIN, passwordHash: adminHash, emailVerified: true },
    create: {
      email: adminEmail,
      passwordHash: adminHash,
      role: Role.SUPERADMIN,
      emailVerified: true,
    },
  });
  console.log(`✓ Admin: ${adminEmail}`);

  // ---------------------------------------------------------------------------
  // 2. Demo-User (vollständig verifiziert, mit Daten)
  // ---------------------------------------------------------------------------
  const demoPassword = process.env.DEMO_SEED_PASSWORD ?? 'Demo1234!dev';
  if (demoPassword.length < 12) {
    throw new Error('DEMO_SEED_PASSWORD muss mindestens 12 Zeichen lang sein.');
  }
  const demoHash = await argon2.hash(demoPassword, { type: argon2.argon2id });

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@tanklotse.local' },
    update: { passwordHash: demoHash, emailVerified: true },
    create: {
      email: 'demo@tanklotse.local',
      passwordHash: demoHash,
      role: Role.USER,
      emailVerified: true,
    },
  });
  console.log(`✓ Demo-User: demo@tanklotse.local`);

  // ---------------------------------------------------------------------------
  // 3. Weiterer Test-Account (nicht verifiziert — testet Onboarding-Flow)
  // ---------------------------------------------------------------------------
  const user2Hash = await argon2.hash('Test1234!unverified', { type: argon2.argon2id });
  await prisma.user.upsert({
    where: { email: 'user2@tanklotse.local' },
    update: {},
    create: {
      email: 'user2@tanklotse.local',
      passwordHash: user2Hash,
      role: Role.USER,
      emailVerified: false, // Absichtlich unbestätigt
    },
  });
  console.log(`✓ Test-User (unverifiziert): user2@tanklotse.local`);

  // ---------------------------------------------------------------------------
  // 4. Demo-Fahrzeug
  // ---------------------------------------------------------------------------
  const existingVehicle = await prisma.vehicle.findFirst({
    where: { userId: demoUser.id, name: 'VW Golf (Demo)' },
  });

  const demoVehicle = existingVehicle ?? await prisma.vehicle.create({
    data: {
      userId: demoUser.id,
      name: 'VW Golf (Demo)',
      fuelType: FuelType.E10,
      consumptionLPer100Km: 6.8,
      typicalTankLiters: 50,
      isDefault: true,
      vehicleClass: 'PKW',
      drivingProfile: 'mixed',
    },
  });
  console.log(`✓ Demo-Fahrzeug: ${demoVehicle.name}`);

  // ---------------------------------------------------------------------------
  // 5. Musterstationen (München-Umgebung) + Preise
  // ---------------------------------------------------------------------------
  const stations = [
    {
      id: '00000000-deed-0001-0000-000000000001',
      name: 'Aral München-Mitte',
      brand: 'ARAL',
      street: 'Bayerstraße',
      houseNumber: '10',
      postCode: '80335',
      place: 'München',
      lat: 48.1401,
      lng: 11.5599,
    },
    {
      id: '00000000-deed-0001-0000-000000000002',
      name: 'Shell München Ost',
      brand: 'SHELL',
      street: 'Rosenheimer Straße',
      houseNumber: '120',
      postCode: '81669',
      place: 'München',
      lat: 48.1218,
      lng: 11.6035,
    },
    {
      id: '00000000-deed-0001-0000-000000000003',
      name: 'Esso Schwabing',
      brand: 'ESSO',
      street: 'Leopoldstraße',
      houseNumber: '50',
      postCode: '80802',
      place: 'München',
      lat: 48.1611,
      lng: 11.5821,
    },
    {
      id: '00000000-deed-0001-0000-000000000004',
      name: 'JET Flughafen Nord',
      brand: 'JET',
      street: 'Flughafenstraße',
      houseNumber: '1',
      postCode: '85356',
      place: 'Freising',
      lat: 48.3434,
      lng: 11.7862,
    },
    {
      id: '00000000-deed-0001-0000-000000000005',
      name: 'TotalEnergies Autobahn',
      brand: 'TOTAL',
      street: 'A9 Rastanlage Nord',
      houseNumber: null,
      postCode: '85386',
      place: 'Eching',
      lat: 48.2991,
      lng: 11.6246,
    },
  ] as const;

  const samplePrices: Record<string, { e5: number; e10: number; diesel: number }> = {
    '00000000-deed-0001-0000-000000000001': { e5: 1.889, e10: 1.839, diesel: 1.699 },
    '00000000-deed-0001-0000-000000000002': { e5: 1.899, e10: 1.849, diesel: 1.709 },
    '00000000-deed-0001-0000-000000000003': { e5: 1.879, e10: 1.829, diesel: 1.689 },
    '00000000-deed-0001-0000-000000000004': { e5: 1.959, e10: 1.909, diesel: 1.769 },
    '00000000-deed-0001-0000-000000000005': { e5: 1.919, e10: 1.869, diesel: 1.729 },
  };

  for (const s of stations) {
    await prisma.station.upsert({
      where: { id: s.id },
      update: { name: s.name, brand: s.brand },
      create: {
        id: s.id,
        name: s.name,
        brand: s.brand,
        street: s.street,
        houseNumber: s.houseNumber ?? null,
        postCode: s.postCode,
        place: s.place,
        lat: s.lat,
        lng: s.lng,
        lastDetailUpdate: new Date(),
      },
    });

    const p = samplePrices[s.id];
    for (const [, fuelEnum, price] of [
      ['e5', FuelType.E5, p.e5],
      ['e10', FuelType.E10, p.e10],
      ['diesel', FuelType.DIESEL, p.diesel],
    ] as const) {
      // Lösche vorhandene Demo-Preise um Duplikate zu vermeiden
      await prisma.stationPrice.deleteMany({
        where: { stationId: s.id, fuelType: fuelEnum, source: 'seed' },
      });
      await prisma.stationPrice.create({
        data: {
          stationId: s.id,
          fuelType: fuelEnum,
          price,
          status: 'OPEN',
          isOpen: true,
          source: 'seed',
          sourceTimestamp: new Date(),
        },
      });
    }
  }
  console.log(`✓ 5 Musterstationen + 15 Preise`);

  // ---------------------------------------------------------------------------
  // 6. Favorit (Demo-User → Station 1)
  // ---------------------------------------------------------------------------
  await prisma.favorite.upsert({
    where: {
      userId_stationId: {
        userId: demoUser.id,
        stationId: '00000000-deed-0001-0000-000000000001',
      },
    },
    update: {},
    create: {
      userId: demoUser.id,
      stationId: '00000000-deed-0001-0000-000000000001',
    },
  });
  console.log(`✓ Favorit: demo → Aral München-Mitte`);

  // ---------------------------------------------------------------------------
  // 7. Gespeicherte Route (Demo-User)  München Hbf → Flughafen MUC
  // ---------------------------------------------------------------------------
  const existingRoute = await prisma.savedRoute.findFirst({
    where: { userId: demoUser.id, name: 'Heimweg (Demo)' },
  });
  if (!existingRoute) {
    await prisma.savedRoute.create({
      data: {
        userId: demoUser.id,
        name: 'Heimweg (Demo)',
        startLabel: 'München Hauptbahnhof',
        startLat: 48.1402,
        startLng: 11.5601,
        endLabel: 'Flughafen München (MUC)',
        endLat: 48.3535,
        endLng: 11.7861,
        fuelType: FuelType.E10,
        defaultVehicleId: demoVehicle.id,
        maxDetourKm: 5,
        active: true,
      },
    });
    console.log(`✓ Gespeicherte Route: Heimweg (Demo)`);
  } else {
    console.log(`✓ Gespeicherte Route: bereits vorhanden`);
  }

  // ---------------------------------------------------------------------------
  // 8. Preisalarm (Demo-User, max 1,80 €/L E10, Radius 5 km)
  // ---------------------------------------------------------------------------
  const existingAlert = await prisma.priceAlert.findFirst({
    where: { userId: demoUser.id, fuelType: FuelType.E10 },
  });
  if (!existingAlert) {
    await prisma.priceAlert.create({
      data: {
        userId: demoUser.id,
        fuelType: FuelType.E10,
        maxPrice: 1.799,
        radiusKm: 5,
        lat: 48.1402,
        lng: 11.5601,
        daysOfWeek: [1, 2, 3, 4, 5], // Mo–Fr
        timeWindowStart: '06:00',
        timeWindowEnd: '09:00',
        active: true,
        alertType: 'MAX_PRICE',
      },
    });
    console.log(`✓ Preisalarm: max 1,799 €/L E10, 5 km`);
  } else {
    console.log(`✓ Preisalarm: bereits vorhanden`);
  }

  // ---------------------------------------------------------------------------
  // 9. Push-Token (Demo-User, damit Push-Service testbar)
  // ---------------------------------------------------------------------------
  await prisma.pushToken.upsert({
    where: {
      userId_deviceId: {
        userId: demoUser.id,
        deviceId: 'seed-demo-device-001',
      },
    },
    update: {},
    create: {
      userId: demoUser.id,
      deviceId: 'seed-demo-device-001',
      platform: Platform.ANDROID,
      fcmToken: 'seed-fcm-token-demo-android-' + demoUser.id,
    },
  });
  console.log(`✓ Push-Token: demo Android (Seed)`);

  // ---------------------------------------------------------------------------
  // 10. Konsent-Einträge für Demo-User
  // ---------------------------------------------------------------------------
  const consents: Array<{ type: ConsentType; accepted: boolean; version: string }> = [
    { type: ConsentType.TERMS, accepted: true, version: '2024-01' },
    { type: ConsentType.PRIVACY, accepted: true, version: '2024-01' },
    { type: ConsentType.LOCATION, accepted: true, version: '1.0' },
    { type: ConsentType.PUSH, accepted: false, version: '1.0' },
  ];
  for (const c of consents) {
    const existing = await prisma.userConsent.findFirst({
      where: { userId: demoUser.id, type: c.type },
    });
    if (!existing) {
      await prisma.userConsent.create({
        data: { userId: demoUser.id, ...c },
      });
    }
  }
  console.log(`✓ Konsent-Einträge: 4 (TERMS, PRIVACY, LOCATION, PUSH)`);

  // ---------------------------------------------------------------------------
  // 11. Feature-Flags (idempotent upsert)
  // ---------------------------------------------------------------------------
  const flags: Array<{ key: string; enabled: boolean; description: string }> = [
    { key: 'premium_enabled', enabled: false, description: 'Premium-Modul aktiv' },
    { key: 'b2b_enabled', enabled: false, description: 'B2B-/Flotten-Modul aktiv' },
    { key: 'route_search_enabled', enabled: true, description: 'Tankstellen entlang Route' },
    { key: 'price_alerts_enabled', enabled: true, description: 'Preisalarme global' },
    { key: 'apple_signin_enabled', enabled: true, description: 'Apple Sign-In' },
    { key: 'google_signin_enabled', enabled: true, description: 'Google Sign-In' },
  ];
  for (const flag of flags) {
    await prisma.featureFlag.upsert({
      where: { key: flag.key },
      update: { description: flag.description },
      create: flag,
    });
  }
  console.log(`✓ 6 Feature-Flags`);

  // ---------------------------------------------------------------------------
  // Zusammenfassung
  // ---------------------------------------------------------------------------
  console.log('\n=== Seed abgeschlossen ===');
  console.log(`Admin:          ${adminEmail}            Passwort: ADMIN_SEED_PASSWORD`);
  console.log('Demo-User:      demo@tanklotse.local     Passwort: Demo1234!dev');
  console.log('Test-User:      user2@tanklotse.local    Passwort: Test1234!unverified (unverifiziert)');
  console.log('Stationen:      5 (München + Umgebung)');
  console.log('Adminer:        http://localhost:8081  →  Server: postgres, DB: tanklotse');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
