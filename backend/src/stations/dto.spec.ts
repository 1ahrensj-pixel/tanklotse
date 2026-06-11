import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';

import { SearchStationsDto } from './dto';

// Sweep-2-Befund: enableImplicitConversion macht aus jedem nicht-leeren
// Query-String true (Boolean('false') === true) — onlyOpen=false kam daher
// nie im Service an. Das explizite @Transform muss das korrigieren.
describe('SearchStationsDto — onlyOpen-Transform', () => {
  const make = (query: Record<string, unknown>) =>
    plainToInstance(
      SearchStationsDto,
      { lat: 48.14, lng: 11.56, radius: 5, fuelType: 'E10', ...query },
      { enableImplicitConversion: true },
    );

  it("onlyOpen='false' → false (vorher faelschlich true)", () => {
    expect(make({ onlyOpen: 'false' }).onlyOpen).toBe(false);
  });

  it("onlyOpen='true' → true", () => {
    expect(make({ onlyOpen: 'true' }).onlyOpen).toBe(true);
  });

  it("onlyOpen='1' → true, onlyOpen='0' → false", () => {
    expect(make({ onlyOpen: '1' }).onlyOpen).toBe(true);
    expect(make({ onlyOpen: '0' }).onlyOpen).toBe(false);
  });

  it('onlyOpen nicht gesetzt → bleibt undefined', () => {
    expect(make({}).onlyOpen).toBeUndefined();
  });
});
