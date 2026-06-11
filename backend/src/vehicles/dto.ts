import { FuelType } from '@prisma/client';
import { IsBoolean, IsEnum, IsIn, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

const VEHICLE_CLASSES = [
  'compact_small',
  'compact',
  'midsize',
  'suv',
  'van',
  'rv',
  'custom',
] as const;
const DRIVING_PROFILES = ['city', 'mixed', 'highway'] as const;

export class CreateVehicleDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  @IsEnum(FuelType)
  fuelType!: FuelType;

  @IsNumber()
  @Min(1)
  @Max(40)
  consumptionLPer100Km!: number;

  @IsNumber()
  @Min(1)
  @Max(500)
  typicalTankLiters!: number;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsBoolean()
  isCommercial?: boolean;

  @IsOptional()
  @IsIn(VEHICLE_CLASSES)
  vehicleClass?: (typeof VEHICLE_CLASSES)[number];

  @IsOptional()
  @IsIn(DRIVING_PROFILES)
  drivingProfile?: (typeof DRIVING_PROFILES)[number];
}

export class UpdateVehicleDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsEnum(FuelType)
  fuelType?: FuelType;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(40)
  consumptionLPer100Km?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(500)
  typicalTankLiters?: number;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsBoolean()
  isCommercial?: boolean;

  @IsOptional()
  @IsIn(VEHICLE_CLASSES)
  vehicleClass?: (typeof VEHICLE_CLASSES)[number];

  @IsOptional()
  @IsIn(DRIVING_PROFILES)
  drivingProfile?: (typeof DRIVING_PROFILES)[number];
}

export class EstimateConsumptionQueryDto {
  @IsIn(VEHICLE_CLASSES)
  vehicleClass!: (typeof VEHICLE_CLASSES)[number];

  @IsIn(DRIVING_PROFILES)
  drivingProfile!: (typeof DRIVING_PROFILES)[number];
}
