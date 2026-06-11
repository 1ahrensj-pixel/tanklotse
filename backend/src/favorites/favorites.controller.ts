import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, JwtUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { FUEL_PROVIDER, FuelPriceProvider } from '../providers/fuel-price.interface';

class AddFavoriteDto {
  @IsUUID('all')
  stationId!: string;
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;
}

@ApiTags('favorites')
@Controller('favorites')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FavoritesController {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(FUEL_PROVIDER) private readonly provider: FuelPriceProvider,
  ) {}

  @Get()
  list(@CurrentUser() user: JwtUser) {
    return this.prisma.favorite.findMany({
      where: { userId: user.sub },
      include: { station: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post()
  async add(@CurrentUser() user: JwtUser, @Body() body: AddFavoriteDto) {
    // Sicherstellen, dass Station in stations_cache existiert (FK).
    const exists = await this.prisma.station.findUnique({ where: { id: body.stationId } });
    if (!exists) {
      const detail = await this.provider.getDetail(body.stationId);
      await this.prisma.station.upsert({
        where: { id: body.stationId },
        update: {},
        create: {
          id: detail.id,
          name: detail.name,
          brand: detail.brand,
          street: detail.street,
          houseNumber: detail.houseNumber,
          postCode: detail.postCode,
          place: detail.place,
          lat: detail.lat,
          lng: detail.lng,
        },
      });
    }
    return this.prisma.favorite.upsert({
      where: { userId_stationId: { userId: user.sub, stationId: body.stationId } },
      update: {},
      create: { userId: user.sub, stationId: body.stationId },
    });
  }

  @Delete(':stationId')
  @HttpCode(204)
  async remove(
    @CurrentUser() user: JwtUser,
    @Param('stationId', new ParseUUIDPipe({ version: undefined as unknown as '4' })) stationId: string,
  ) {
    await this.prisma.favorite.deleteMany({ where: { userId: user.sub, stationId } });
  }
}
