import { Body, Controller, Delete, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Platform } from '@prisma/client';
import { IsEnum, IsString } from 'class-validator';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, JwtUser } from '../common/decorators/current-user.decorator';
import { PushService } from './push.service';

class RegisterTokenDto {
  @IsString() deviceId!: string;
  @IsString() fcmToken!: string;
  @IsEnum(Platform) platform!: Platform;
}

class RevokeTokenDto {
  @IsString() fcmToken!: string;
}

@ApiTags('push')
@Controller('push')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PushController {
  constructor(private readonly service: PushService) {}

  @Post('register-token')
  register(@CurrentUser() user: JwtUser, @Body() body: RegisterTokenDto) {
    return this.service.registerToken(user.sub, body.deviceId, body.platform, body.fcmToken);
  }

  @Delete('token')
  @HttpCode(204)
  async revoke(@CurrentUser() user: JwtUser, @Body() body: RevokeTokenDto) {
    await this.service.revoke(user.sub, body.fcmToken);
  }
}
