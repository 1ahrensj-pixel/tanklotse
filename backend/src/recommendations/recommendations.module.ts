import { Module } from '@nestjs/common';

import { ProvidersModule } from '../providers/providers.module';
import { RoutingModule } from '../routing/routing.module';
import { DetourService } from './detour.service';
import { RecommendationsService } from './recommendations.service';
import { RecommendationsController } from './recommendations.controller';

@Module({
  imports: [ProvidersModule, RoutingModule],
  controllers: [RecommendationsController],
  providers: [DetourService, RecommendationsService],
  exports: [DetourService, RecommendationsService],
})
export class RecommendationsModule {}
