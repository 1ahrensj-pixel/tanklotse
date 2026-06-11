import * as jwt from 'jsonwebtoken';

import { __testing__ } from './jwt.strategy';

const { verifyWithDualSecret } = __testing__;

describe('verifyWithDualSecret (PR #24 §7.4)', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  // Low-entropy test markers (siehe .gitleaksignore-Block zu 8c9e5ad):
  // bewusst keine Wort-Mischung, damit gitleaks `generic-api-key` (Entropy >= 3.5)
  // nicht anschlaegt. Reine Tests, kein Geheimnis.
  const CURRENT = 'unit-test-marker-current-aaaaaaaaaa';
  const PREV = 'unit-test-marker-previous-bbbbbbbbb';
  const OTHER = 'unit-test-marker-attacker-cccccccc';

  it('akzeptiert Token, das mit dem aktuellen Secret signiert ist', () => {
    process.env.JWT_ACCESS_SECRET = CURRENT;
    delete process.env.JWT_ACCESS_SECRET_PREV;
    const token = jwt.sign({ sub: 'u1', role: 'USER', email: 'a@b.de' }, process.env.JWT_ACCESS_SECRET);
    const payload = verifyWithDualSecret(token);
    expect(payload?.sub).toBe('u1');
  });

  it('akzeptiert Token, das mit dem PREV-Secret signiert ist (Rotations-Uebergang)', () => {
    process.env.JWT_ACCESS_SECRET = CURRENT;
    process.env.JWT_ACCESS_SECRET_PREV = PREV;
    const token = jwt.sign({ sub: 'u2', role: 'USER', email: 'b@c.de' }, process.env.JWT_ACCESS_SECRET_PREV!);
    const payload = verifyWithDualSecret(token);
    expect(payload?.sub).toBe('u2');
  });

  it('lehnt Token ab, das mit keinem der beiden Secrets signiert ist', () => {
    process.env.JWT_ACCESS_SECRET = CURRENT;
    process.env.JWT_ACCESS_SECRET_PREV = PREV;
    const token = jwt.sign({ sub: 'u3', role: 'USER', email: 'c@d.de' }, OTHER);
    expect(verifyWithDualSecret(token)).toBeNull();
  });

  it('lehnt abgelaufenes Token ab (auch wenn signature stimmt)', () => {
    process.env.JWT_ACCESS_SECRET = CURRENT;
    const token = jwt.sign(
      { sub: 'u4', role: 'USER', email: 'd@e.de' },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: '-1s' },
    );
    expect(verifyWithDualSecret(token)).toBeNull();
  });

  it('liefert null wenn JWT_ACCESS_SECRET nicht gesetzt ist', () => {
    delete process.env.JWT_ACCESS_SECRET;
    delete process.env.JWT_ACCESS_SECRET_PREV;
    expect(verifyWithDualSecret('any.token.here')).toBeNull();
  });

  it('Rotations-Smoke: Token mit current bleibt gueltig wenn PREV existiert', () => {
    process.env.JWT_ACCESS_SECRET = CURRENT;
    process.env.JWT_ACCESS_SECRET_PREV = PREV;
    const token = jwt.sign({ sub: 'u5', role: 'USER', email: 'e@f.de' }, process.env.JWT_ACCESS_SECRET);
    expect(verifyWithDualSecret(token)?.sub).toBe('u5');
  });
});
