import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { GeoReverseDto, GeoSearchDto } from './geo.dto';
import { GeoService } from './geo.service';

@ApiTags('geo')
@Controller('geo')
export class GeoController {
  constructor(private readonly service: GeoService) {}

  @Get('search')
  @ApiOperation({ summary: 'Geocoding: Stadt, PLZ, Adresse → lat/lng (DE/AT/CH).' })
  search(@Query() q: GeoSearchDto) {
    return this.service.search(q.q, q.limit ?? 5);
  }

  @Get('reverse')
  @ApiOperation({ summary: 'Reverse-Geocoding: lat/lng → Ortsbezeichnung.' })
  reverse(@Query() q: GeoReverseDto) {
    return this.service.reverse(q.lat, q.lng);
  }
}
