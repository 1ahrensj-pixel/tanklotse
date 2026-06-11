import { Transform } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsLatitude, IsLongitude, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { ComplaintType } from '@prisma/client';

export enum FuelTypeQuery {
  E5 = 'E5',
  E10 = 'E10',
  DIESEL = 'DIESEL',
  ALL = 'ALL',
}

export enum SortQuery {
  PRICE = 'price',
  DISTANCE = 'distance',
  REAL_VALUE = 'real_value',
}

export class SearchStationsDto {
  @IsLatitude()
  lat!: number;

  @IsLongitude()
  lng!: number;

  @IsNumber()
  @Min(1)
  @Max(25)
  radius!: number;

  @IsEnum(FuelTypeQuery)
  fuelType!: FuelTypeQuery;

  @IsOptional()
  @IsEnum(SortQuery)
  sort?: SortQuery;

  // enableImplicitConversion macht aus JEDEM nicht-leeren Query-String true
  // (Boolean('false') === true) — onlyOpen=false kam daher nie an. Wichtig:
  // `value` ist im Transform bereits implizit koerziert, daher den ROHEN
  // Query-Wert aus `obj` lesen.
  @IsOptional()
  @Transform(({ obj }) => {
    const raw = (obj as Record<string, unknown> | undefined)?.onlyOpen;
    return raw === undefined || raw === null
      ? undefined
      : raw === true || raw === 'true' || raw === '1';
  })
  @IsBoolean()
  onlyOpen?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  brandFilter?: string[];
}

export class ComplaintDto {
  @IsEnum(ComplaintType)
  type!: ComplaintType;

  @IsOptional()
  @IsString()
  correction?: string;
}
