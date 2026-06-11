import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { DetourService } from './detour.service';
import { RecommendationsService } from './recommendations.service';
import { BestStationDto, DetourCalcDto, RouteDto } from './dto';

@ApiTags('recommendations')
@Controller('recommendations')
export class RecommendationsController {
  constructor(
    private readonly recommendations: RecommendationsService,
    private readonly detour: DetourService,
  ) {}

  @Post('best-station')
  @ApiOperation({ summary: 'Beste reale Tankempfehlung im Umkreis (inkl. Umweg/Verbrauch).' })
  bestStation(@Body() body: BestStationDto) {
    return this.recommendations.bestStation(body);
  }

  @Post('route')
  @ApiOperation({ summary: 'Tankstellen entlang einer Route, sortiert nach realer Ersparnis.' })
  route(@Body() body: RouteDto) {
    return this.recommendations.stationsAlongRoute(body);
  }

  @Post('detour-calculation')
  @ApiOperation({ summary: 'Berechnet, ob sich der Umweg zur Tankstelle wirklich lohnt.' })
  detourCalc(@Body() body: DetourCalcDto) {
    return this.detour.calculate(body);
  }
}
