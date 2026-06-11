import { Module } from '@nestjs/common';

import { ProvidersModule } from '../providers/providers.module';
import { PushModule } from '../push/push.module';
import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';
import { AlertsScheduler } from './alerts.scheduler';

@Module({
  imports: [ProvidersModule, PushModule],
  controllers: [AlertsController],
  providers: [AlertsService, AlertsScheduler],
})
export class AlertsModule {}
