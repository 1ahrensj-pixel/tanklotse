import { Type } from 'class-transformer';
import { IsLatitude, IsLongitude, IsNumber } from 'class-validator';

/**
 * Audit-Auftrag §4.4 — Common-DTO fuer Geo-Koordinaten.
 *
 * Statt in jedem Controller `IsLatitude`/`IsLongitude` neu zu deklarieren,
 * importieren Endpoints diese Klasse oder extenden sie. Wird sowohl als
 * Standalone-DTO (Body/Query) genutzt als auch via `extends` von
 * Search-/Route-DTOs.
 *
 * Wahrheits-Garantie: `class-validator` lehnt Werte ausserhalb
 * lat ∈ [-90,90] / lng ∈ [-180,180] mit 400 ab — keine stille
 * Truncation auf den naechsten gueltigen Wert.
 */
export class CoordinatesDto {
  @Type(() => Number)
  @IsNumber()
  @IsLatitude({ message: 'lat muss im Bereich [-90, 90] liegen.' })
  lat!: number;

  @Type(() => Number)
  @IsNumber()
  @IsLongitude({ message: 'lng muss im Bereich [-180, 180] liegen.' })
  lng!: number;
}
