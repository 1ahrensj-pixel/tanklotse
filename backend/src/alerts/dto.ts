import { AlertType, FuelType } from '@prisma/client';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsUUID,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class CreateAlertDto {
  @IsEnum(FuelType)
  fuelType!: FuelType;

  @IsOptional()
  @IsEnum(AlertType)
  alertType?: AlertType;

  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(5)
  maxPrice?: number;

  // -- REAL_SAVING-Felder --
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(50)
  minRealSavingEur?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(500)
  tankLiters?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(40)
  consumptionLPer100Km?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(25)
  maxExtraDistanceKm?: number;

  @IsOptional()
  @IsBoolean()
  onlyOpen?: boolean;

  @IsOptional()
  @IsUUID('all')
  stationId?: string;

  @IsOptional()
  @IsLatitude()
  lat?: number;

  @IsOptional()
  @IsLongitude()
  lng?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(25)
  radiusKm?: number;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(7)
  @IsNumber({}, { each: true })
  daysOfWeek!: number[];

  @IsOptional()
  @Matches(/^\d{2}:\d{2}$/)
  timeWindowStart?: string;

  @IsOptional()
  @Matches(/^\d{2}:\d{2}$/)
  timeWindowEnd?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateAlertDto {
  @IsOptional() @IsBoolean() active?: boolean;
  @IsOptional() @IsNumber() @Min(0.5) @Max(5) maxPrice?: number;
  @IsOptional() @IsArray() @IsNumber({}, { each: true }) daysOfWeek?: number[];
  @IsOptional() @Matches(/^\d{2}:\d{2}$/) timeWindowStart?: string;
  @IsOptional() @Matches(/^\d{2}:\d{2}$/) timeWindowEnd?: string;
  @IsOptional() @IsUUID('all') stationId?: string;
  @IsOptional() @IsLatitude() lat?: number;
  @IsOptional() @IsLongitude() lng?: number;
  @IsOptional() @IsNumber() @Min(1) @Max(25) radiusKm?: number;
}
