import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Request } from 'express';

import { AllowTotpPending, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, JwtUser } from '../common/decorators/current-user.decorator';
import { Roles, RolesGuard } from '../common/guards/roles.guard';
import { AdminService } from './admin.service';

class FeatureFlagDto {
  @IsString() key!: string;
  @IsBoolean() enabled!: boolean;
}

// Validiert skip/take statt rohem Number(...): NaN, negative Werte und
// Nicht-Integer (skip=abc, take=-5, skip=1.5) liefen vorher als Prisma-
// ValidationError in 500er. Jetzt sauberes 400 aus der ValidationPipe.
export class AdminPaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  take: number = 50;
}

class TotpConfirmDto {
  @IsString() token!: string;
}

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPERADMIN, Role.SUPPORT, Role.DEVELOPER, Role.READONLY)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('metrics')
  metrics() { return this.admin.metrics(); }

  @Get('users')
  users(@Query() q: AdminPaginationDto) {
    return this.admin.listUsers(q.skip, q.take);
  }

  @Get('api-usage')
  api(@Query() q: AdminPaginationDto) {
    return this.admin.apiLogs(q.skip, q.take);
  }

  @Get('errors')
  errs(@Query() q: AdminPaginationDto) {
    return this.admin.errors(q.skip, q.take);
  }

  @Get('alerts')
  alerts(@Query() q: AdminPaginationDto) {
    return this.admin.alerts(q.skip, q.take);
  }

  @Get('complaints')
  complaints(@Query() q: AdminPaginationDto) {
    return this.admin.complaints(q.skip, q.take);
  }

  @Get('feature-flags')
  flags() { return this.admin.featureFlags(); }

  @Post('feature-flags')
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  async setFlag(@CurrentUser() user: JwtUser, @Body() body: FeatureFlagDto, @Req() req: Request) {
    const res = await this.admin.setFeatureFlag(body.key, body.enabled);
    await this.admin.audit(user.sub, 'feature_flag.set', body.key, { enabled: body.enabled }, req.ip);
    return res;
  }

  @Post('2fa/setup')
  setupTotp(@CurrentUser() user: JwtUser) {
    return this.admin.setupTotp(user.sub);
  }

  @Post('2fa/confirm')
  confirmTotp(@CurrentUser() user: JwtUser, @Body() body: TotpConfirmDto) {
    return this.admin.confirmTotp(user.sub, body.token);
  }

  // Einziger Endpunkt, den ein 2FA-Pre-Auth-Token (Login bei totpEnabled)
  // erreichen darf — bei gueltigem Code gibt es hier vollwertige Tokens.
  @Post('2fa/verify')
  @AllowTotpPending()
  verifyTotp(@CurrentUser() user: JwtUser, @Body() body: TotpConfirmDto) {
    return this.admin.verifyTotp(user.sub, body.token);
  }
}
