import { Module } from '@nestjs/common';

import { ProvidersModule } from '../providers/providers.module';
import { FavoritesController } from './favorites.controller';

@Module({
  imports: [ProvidersModule],
  controllers: [FavoritesController],
})
export class FavoritesModule {}
