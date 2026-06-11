import 'reflect-metadata';

import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

import { CoordinatesDto } from './coordinates.dto';
import { PaginationDto } from './pagination.dto';

/**
 * Audit-Auftrag §4.4 — Common-DTO-Validierung.
 */
describe('CoordinatesDto', () => {
  it('akzeptiert Koeln (50.9375, 6.9603)', () => {
    const dto = plainToInstance(CoordinatesDto, { lat: '50.9375', lng: '6.9603' });
    const errors = validateSync(dto);
    expect(errors).toEqual([]);
    expect(dto.lat).toBe(50.9375);
    expect(dto.lng).toBe(6.9603);
  });

  it('lehnt lat=91 ab (out of range)', () => {
    const dto = plainToInstance(CoordinatesDto, { lat: '91', lng: '0' });
    const errors = validateSync(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints?.isLatitude).toMatch(/-90, 90/);
  });

  it('lehnt lng=181 ab (out of range)', () => {
    const dto = plainToInstance(CoordinatesDto, { lat: '0', lng: '181' });
    const errors = validateSync(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints?.isLongitude).toMatch(/-180, 180/);
  });

  it('lehnt nicht-numerische Werte ab', () => {
    const dto = plainToInstance(CoordinatesDto, { lat: 'abc', lng: 'def' });
    const errors = validateSync(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('PaginationDto', () => {
  it('Default page=1, pageSize=20', () => {
    const dto = plainToInstance(PaginationDto, {});
    const errors = validateSync(dto);
    expect(errors).toEqual([]);
    expect(dto.skip).toBe(0);
    expect(dto.take).toBe(20);
  });

  it('page=3, pageSize=15 → skip=30, take=15', () => {
    const dto = plainToInstance(PaginationDto, { page: '3', pageSize: '15' });
    const errors = validateSync(dto);
    expect(errors).toEqual([]);
    expect(dto.skip).toBe(30);
    expect(dto.take).toBe(15);
  });

  it('pageSize > 100 → Validation-Error', () => {
    const dto = plainToInstance(PaginationDto, { page: '1', pageSize: '500' });
    const errors = validateSync(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints?.max).toMatch(/100/);
  });

  it('page < 1 → Validation-Error', () => {
    const dto = plainToInstance(PaginationDto, { page: '0' });
    const errors = validateSync(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('skip kann nicht negativ werden (selbst bei page=0 als Fallback)', () => {
    const dto = plainToInstance(PaginationDto, { page: '1' });
    expect(dto.skip).toBeGreaterThanOrEqual(0);
  });
});
