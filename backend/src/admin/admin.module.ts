import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { ApiReadinessController } from './system/api-readiness.controller';
import { ApiReadinessService } from './system/api-readiness.service';
import { ExternalServicesController } from './system/external-services.controller';
import { ExternalServicesService } from './system/external-services.service';

@Module({
  // AuthModule liefert AuthService fuer den 2FA-Step-up
  // (verifyTotp stellt nach gueltigem Code vollwertige Tokens aus).
  imports: [AuthModule],
  controllers: [AdminController, ExternalServicesController, ApiReadinessController],
  providers: [AdminService, ExternalServicesService, ApiReadinessService],
})
export class AdminModule {}
