import { Global, Module } from '@nestjs/common';
import { SavingsService } from './savings.service';

@Global()
@Module({
  providers: [SavingsService],
  exports: [SavingsService],
})
export class SavingsModule {}
