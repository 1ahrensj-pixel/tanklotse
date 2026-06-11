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
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, JwtUser } from '../common/decorators/current-user.decorator';
import { CreateVehicleDto, EstimateConsumptionQueryDto, UpdateVehicleDto } from './dto';
import {
  VEHICLE_CLASSES_DE,
  DRIVING_PROFILES_DE,
  estimateConsumption,
  suggestedTankLiters,
} from './vehicle-estimates';
import { VehiclesService } from './vehicles.service';

@ApiTags('vehicles')
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly service: VehiclesService) {}

  // --- Public (Onboarding) ----------------------------------------------
  // Diese beiden Endpoints liefern nur statische Stammdaten und werden im
  // Mobile-Onboarding VOR dem Account-Setup gerufen. Daher kein Auth-Guard.
  @Get('classes')
  @ApiOperation({ summary: 'Liste der unterstuetzten Fahrzeugklassen + Fahrprofile (deutsche Labels).' })
  classes() {
    return {
      vehicleClasses: Object.entries(VEHICLE_CLASSES_DE).map(([id, label]) => ({ id, label })),
      drivingProfiles: Object.entries(DRIVING_PROFILES_DE).map(([id, label]) => ({ id, label })),
    };
  }

  @Get('estimate')
  @ApiOperation({ summary: 'Verbrauchs- und Tankmengen-Schaetzung anhand Klasse + Fahrprofil.' })
  estimate(@Query() q: EstimateConsumptionQueryDto) {
    return {
      vehicleClass: q.vehicleClass,
      drivingProfile: q.drivingProfile,
      consumptionLPer100Km: estimateConsumption(q.vehicleClass, q.drivingProfile),
      typicalTankLiters: suggestedTankLiters(q.vehicleClass),
      isEstimate: true,
    };
  }

  // --- Authenticated User Operations ------------------------------------
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Liste der eigenen Fahrzeuge.' })
  list(@CurrentUser() user: JwtUser) {
    return this.service.list(user.sub);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Neues Fahrzeug anlegen.' })
  create(@CurrentUser() user: JwtUser, @Body() body: CreateVehicleDto) {
    return this.service.create(user.sub, body);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Fahrzeug aktualisieren.' })
  update(@CurrentUser() user: JwtUser, @Param('id', new ParseUUIDPipe()) id: string, @Body() body: UpdateVehicleDto) {
    return this.service.update(user.sub, id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(204)
  @ApiOperation({ summary: 'Fahrzeug loeschen.' })
  remove(@CurrentUser() user: JwtUser, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.remove(user.sub, id);
  }
}
