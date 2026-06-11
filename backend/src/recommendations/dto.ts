import { Type } from 'class-transformer';
import {
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsObject,
  IsOptional,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export enum FuelTypeDto {
  E5 = 'E5',
  E10 = 'E10',
  DIESEL = 'DIESEL',
}

export enum RecommendationBasisDto {
  NEAREST_OPEN = 'NEAREST_OPEN',
  AVG_IN_AREA = 'AVG_IN_AREA',
  USER_REFERENCE_STATION = 'USER_REFERENCE_STATION',
}

export class BestStationDto {
  @IsLatitude()
  lat!: number;

  @IsLongitude()
  lng!: number;

  @IsNumber()
  @Min(1)
  @Max(25)
  radius!: number;

  @IsEnum(FuelTypeDto)
  fuelType!: FuelTypeDto;

  @IsNumber()
  @Min(1)
  @Max(40)
  consumptionLPer100Km!: number;

  @IsNumber()
  @Min(1)
  @Max(500)
  tankLiters!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(500)
  hourlyValueEur?: number;

  @IsOptional()
  @IsEnum(RecommendationBasisDto)
  basis?: RecommendationBasisDto;

  @IsOptional()
  @IsUUID('all')
  referenceStationId?: string;
}

class GeoPoint {
  @IsLatitude()
  lat!: number;
  @IsLongitude()
  lng!: number;
}

export class RouteDto {
  @ValidateNested()
  @Type(() => GeoPoint)
  @IsObject()
  start!: GeoPoint;

  @ValidateNested()
  @Type(() => GeoPoint)
  @IsObject()
  end!: GeoPoint;

  @IsEnum(FuelTypeDto)
  fuelType!: FuelTypeDto;

  @IsNumber()
  @Min(1)
  @Max(40)
  consumptionLPer100Km!: number;

  @IsNumber()
  @Min(1)
  @Max(500)
  tankLiters!: number;

  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(20)
  maxOffsetKm?: number;
}

export class DetourCalcDto {
  @IsNumber()
  @Min(0.001)
  comparisonPricePerLiter!: number;

  @IsNumber()
  @Min(0.001)
  targetPricePerLiter!: number;

  @IsNumber()
  @Min(0)
  detourKm!: number;

  @IsNumber()
  @Min(1)
  @Max(40)
  consumptionLPer100Km!: number;

  @IsNumber()
  @Min(1)
  @Max(500)
  tankLiters!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  additionalMinutes?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  hourlyValueEur?: number;
}
