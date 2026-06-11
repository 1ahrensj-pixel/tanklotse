import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * Audit-Auftrag §4.4 — Common-DTO fuer Pagination-Parameter.
 *
 * `page` ist 1-basiert (1, 2, 3, ...). `pageSize` ist limitiert auf 100,
 * damit kein Endpoint versehentlich grosse Listen ausliefert.
 *
 * Verwendung im Controller:
 *
 *   @Get()
 *   list(@Query() q: PaginationDto) {
 *     return this.svc.findAll({ skip: q.skip, take: q.take });
 *   }
 *
 * `skip` und `take` sind gerechnete Getter, die Services direkt an
 * Prisma weiterreichen koennen.
 */
export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100, { message: 'pageSize darf max. 100 sein.' })
  pageSize?: number = 20;

  get skip(): number {
    return Math.max(0, ((this.page ?? 1) - 1) * (this.pageSize ?? 20));
  }

  get take(): number {
    return this.pageSize ?? 20;
  }
}
