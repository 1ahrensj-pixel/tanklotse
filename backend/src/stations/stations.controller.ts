import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { ComplaintDto, SearchStationsDto } from './dto';
import { StationsService } from './stations.service';

@ApiTags('stations')
@Controller('stations')
export class StationsController {
  constructor(private readonly service: StationsService) {}

  @Get('search')
  @ApiOperation({ summary: 'Tankstellen-Umkreissuche.' })
  search(@Query() query: SearchStationsDto) {
    return this.service.search(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Tankstellen-Details (Adresse, Marke, Oeffnungszeiten).' })
  detail(@Param('id') id: string) {
    return this.service.detail(id);
  }

  @Get(':id/prices')
  @ApiOperation({ summary: 'Aktuelle Preise einer Tankstelle.' })
  prices(@Param('id') id: string) {
    return this.service.prices(id);
  }

  @Get(':id/details')
  @ApiOperation({ summary: 'Alias zu /stations/:id fuer Spec-Konformitaet.' })
  details(@Param('id') id: string) {
    // Alias zu /:id für Spec-Konformität (Punkt 9 im Auftrag)
    return this.service.detail(id);
  }

  @Post(':id/complaint')
  // Optionaler Guard: Die App ist ohne Login nutzbar, Beschwerden sind
  // auch anonym erlaubt (userId=null). Eingeloggte Nutzer werden ueber
  // req.user.sub zugeordnet; das Rate-Limit schuetzt vor Missbrauch.
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Beschwerde melden (z. B. falscher Preis, geschlossen).' })
  complaint(
    @Param('id', new ParseUUIDPipe({ version: undefined as unknown as '4' })) id: string,
    @Body() body: ComplaintDto,
    @Req() req: Request,
  ) {
    const userId = (req.user as { sub?: string } | undefined)?.sub ?? null;
    return this.service.complaint(id, body.type, body.correction, userId);
  }
}
