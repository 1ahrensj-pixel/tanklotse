import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';

import { configValidation } from './common/config/validation';
import { LoggerModule } from './common/logging/logger.module';
import { MetricsModule } from './common/metrics/metrics.module';
import { PrismaModule } from './prisma/prisma.module';
import { CacheModule } from './cache/cache.module';
import { ProvidersModule } from './providers/providers.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { StationsModule } from './stations/stations.module';
import { FavoritesModule } from './favorites/favorites.module';
import { AlertsModule } from './alerts/alerts.module';
import { RecommendationsModule } from './recommendations/recommendations.module';
import { PushModule } from './push/push.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { ComplaintsModule } from './complaints/complaints.module';
import { AdminModule } from './admin/admin.module';
import { GeoModule } from './geo/geo.module';
import { RoutingModule } from './routing/routing.module';
import { SavingsModule } from './savings/savings.module';
import { HighwayModule } from './highway/highway.module';
import { SavedRoutesModule } from './saved-routes/saved-routes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: configValidation,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: Number(process.env.RATE_LIMIT_TTL ?? 60) * 1000,
        limit: Number(process.env.RATE_LIMIT_MAX ?? 100),
      },
    ]),
    ScheduleModule.forRoot(),
    // Audit §7.3 — strukturierte JSON-Logs mit Redact-Regeln.
    LoggerModule,
    // Audit §7.2 — Prometheus /metrics-Endpoint + globaler Request-Interceptor.
    MetricsModule,
    PrismaModule,
    CacheModule,
    ProvidersModule,
    HealthModule,
    AuthModule,
    UsersModule,
    VehiclesModule,
    StationsModule,
    FavoritesModule,
    AlertsModule,
    RecommendationsModule,
    PushModule,
    SubscriptionModule,
    ComplaintsModule,
    AdminModule,
    GeoModule,
    RoutingModule,
    SavingsModule,
    HighwayModule,
    SavedRoutesModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
