import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ConsentType } from '@prisma/client';
import { IsBoolean, IsEnum, IsString } from 'class-validator';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, JwtUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

class ConsentDto {
  @IsEnum(ConsentType)
  type!: ConsentType;
  @IsBoolean()
  accepted!: boolean;
  @IsString()
  version!: string;
}

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('me/consents')
  list(@CurrentUser() user: JwtUser) {
    return this.prisma.userConsent.findMany({
      where: { userId: user.sub },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post('me/consents')
  set(@CurrentUser() user: JwtUser, @Body() body: ConsentDto) {
    return this.prisma.userConsent.create({
      data: {
        userId: user.sub,
        type: body.type,
        accepted: body.accepted,
        version: body.version,
      },
    });
  }
}
