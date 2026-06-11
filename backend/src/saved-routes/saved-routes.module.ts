import { Module } from '@nestjs/common';

import { RecommendationsModule } from '../recommendations/recommendations.module';
import { SavedRoutesController } from './saved-routes.controller';
import { SavedRoutesService } from './saved-routes.service';

@Module({
  imports: [RecommendationsModule],
  controllers: [SavedRoutesController],
  providers: [SavedRoutesService],
  exports: [SavedRoutesService],
})
export class SavedRoutesModule {}
