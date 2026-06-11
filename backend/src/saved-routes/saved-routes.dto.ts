import { FuelType } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateSavedRouteDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @IsString()
  @MaxLength(200)
  startLabel!: string;

  @IsLatitude()
  startLat!: number;

  @IsLongitude()
  startLng!: number;

  @IsString()
  @MaxLength(200)
  endLabel!: string;

  @IsLatitude()
  endLat!: number;

  @IsLongitude()
  endLng!: number;

  @IsEnum(FuelType)
  fuelType!: FuelType;

  @IsOptional()
  @IsUUID('all')
  defaultVehicleId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(20)
  maxDetourKm?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateSavedRouteDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(80) name?: string;
  @IsOptional() @IsString() @MaxLength(200) startLabel?: string;
  @IsOptional() @IsLatitude() startLat?: number;
  @IsOptional() @IsLongitude() startLng?: number;
  @IsOptional() @IsString() @MaxLength(200) endLabel?: string;
  @IsOptional() @IsLatitude() endLat?: number;
  @IsOptional() @IsLongitude() endLng?: number;
  @IsOptional() @IsEnum(FuelType) fuelType?: FuelType;
  @IsOptional() @IsUUID('all') defaultVehicleId?: string | null;
  @IsOptional() @IsNumber() @Min(0.5) @Max(20) maxDetourKm?: number;
  @IsOptional() @IsBoolean() active?: boolean;
}

export class SavedRouteRecommendationsDto {
  @IsNumber()
  @Min(1)
  @Max(40)
  consumptionLPer100Km!: number;

  @IsNumber()
  @Min(1)
  @Max(500)
  tankLiters!: number;
}
