import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { AdminPaginationDto } from './admin.controller';

// Sweep-2-Befund: Number(skip)/Number(take) ohne Validierung liess
// skip=abc / take=-5 / skip=1.5 als NaN/negativ in Prisma laufen → 500.
// Das DTO muss diese Faelle als Validierungsfehler (→ 400) abfangen.
describe('AdminPaginationDto', () => {
  const make = (query: Record<string, unknown>) =>
    plainToInstance(AdminPaginationDto, query, { enableImplicitConversion: true });

  it('leere Query → Defaults skip=0, take=50', async () => {
    const dto = make({});
    expect(await validate(dto)).toHaveLength(0);
    expect(dto.skip).toBe(0);
    expect(dto.take).toBe(50);
  });

  it('gueltige Werte werden zu Zahlen konvertiert', async () => {
    const dto = make({ skip: '10', take: '100' });
    expect(await validate(dto)).toHaveLength(0);
    expect(dto.skip).toBe(10);
    expect(dto.take).toBe(100);
  });

  it('skip=abc (NaN) → Validierungsfehler', async () => {
    const errors = await validate(make({ skip: 'abc' }));
    expect(errors.some((e) => e.property === 'skip')).toBe(true);
  });

  it('negative Werte → Validierungsfehler', async () => {
    const errors = await validate(make({ skip: '-1', take: '-5' }));
    expect(errors.some((e) => e.property === 'skip')).toBe(true);
    expect(errors.some((e) => e.property === 'take')).toBe(true);
  });

  it('Nicht-Integer (skip=1.5) → Validierungsfehler', async () => {
    const errors = await validate(make({ skip: '1.5' }));
    expect(errors.some((e) => e.property === 'skip')).toBe(true);
  });

  it('take ueber dem Limit (201) → Validierungsfehler', async () => {
    const errors = await validate(make({ take: '201' }));
    expect(errors.some((e) => e.property === 'take')).toBe(true);
  });
});
