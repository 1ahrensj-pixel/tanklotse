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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, JwtUser } from '../common/decorators/current-user.decorator';
import { AlertsService } from './alerts.service';
import { CreateAlertDto, UpdateAlertDto } from './dto';

@ApiTags('alerts')
@Controller('alerts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AlertsController {
  constructor(private readonly service: AlertsService) {}

  @Get()
  list(@CurrentUser() user: JwtUser) {
    return this.service.list(user.sub);
  }

  @Post()
  create(@CurrentUser() user: JwtUser, @Body() body: CreateAlertDto) {
    return this.service.create(user.sub, body);
  }

  @Put(':id')
  update(@CurrentUser() user: JwtUser, @Param('id', new ParseUUIDPipe()) id: string, @Body() body: UpdateAlertDto) {
    return this.service.update(user.sub, id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() user: JwtUser, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.remove(user.sub, id);
  }
}
