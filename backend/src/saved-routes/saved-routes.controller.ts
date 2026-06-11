import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, JwtUser } from '../common/decorators/current-user.decorator';
import {
  CreateSavedRouteDto,
  SavedRouteRecommendationsDto,
  UpdateSavedRouteDto,
} from './saved-routes.dto';
import { SavedRoutesService } from './saved-routes.service';

@ApiTags('saved-routes')
@Controller('saved-routes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SavedRoutesController {
  constructor(private readonly service: SavedRoutesService) {}

  @Get()
  list(@CurrentUser() user: JwtUser) {
    return this.service.list(user.sub);
  }

  @Get(':id')
  get(@CurrentUser() user: JwtUser, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.get(user.sub, id);
  }

  @Post()
  create(@CurrentUser() user: JwtUser, @Body() body: CreateSavedRouteDto) {
    return this.service.create(user.sub, body);
  }

  @Put(':id')
  update(
    @CurrentUser() user: JwtUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: UpdateSavedRouteDto,
  ) {
    return this.service.update(user.sub, id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() user: JwtUser, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.remove(user.sub, id);
  }

  @Post(':id/recommendations')
  @ApiOperation({ summary: 'Tankstellen entlang der gespeicherten Route mit Lohnt-sich-Check.' })
  recommendations(
    @CurrentUser() user: JwtUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: SavedRouteRecommendationsDto,
  ) {
    return this.service.getRecommendations(user.sub, id, body.consumptionLPer100Km, body.tankLiters);
  }
}
