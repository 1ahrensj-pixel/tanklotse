import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { ExitCheckDto } from './highway.dto';
import { HighwayService } from './highway.service';

@ApiTags('highway')
@Controller('highway')
export class HighwayController {
  constructor(private readonly service: HighwayService) {}

  @Post('exit-check')
  @ApiOperation({
    summary: 'Autobahn-Abfahrts-Check.',
    description:
      'Antwortet ohne Routing-Provider mit status: PREPARED. Mit Mock-Provider (Tests) oder ' +
      'kommerziellem Routing-Provider liefert er konkrete Abfahrts-Empfehlungen mit Lohnt-sich-Check.',
  })
  exitCheck(@Body() body: ExitCheckDto) {
    return this.service.exitCheck(body);
  }
}
