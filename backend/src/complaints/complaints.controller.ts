import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, JwtUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('complaints')
@Controller('complaints')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ComplaintsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('mine')
  list(@CurrentUser() user: JwtUser) {
    return this.prisma.complaint.findMany({
      where: { userId: user.sub },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
