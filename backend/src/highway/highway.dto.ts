import { IsEnum, IsLatitude, IsLongitude, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

import { FuelTypeDto } from '../recommendations/dto';

export class ExitCheckDto {
  @IsLatitude()
  currentLat!: number;

  @IsLongitude()
  currentLng!: number;

  @IsOptional()
  @IsString()
  @MaxLength(50000)
  routePolyline?: string;

  @IsEnum(FuelTypeDto)
  fuelType!: FuelTypeDto;

  @IsNumber()
  @Min(1)
  @Max(500)
  tankLiters!: number;

  @IsNumber()
  @Min(1)
  @Max(40)
  consumptionLPer100Km!: number;

  @IsNumber()
  @Min(0.5)
  @Max(20)
  maxExitDetourKm!: number;
}
