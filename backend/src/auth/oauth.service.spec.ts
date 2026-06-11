import { UnauthorizedException } from '@nestjs/common';
import axios from 'axios';
import * as jwt from 'jsonwebtoken';
import { createPublicKey, generateKeyPairSync } from 'node:crypto';

import { OauthService } from './oauth.service';

/**
 * Tests laufen ohne echtes Network: axios (Apple-JWKS-Endpoint) wird gemockt,
 * Tokens werden mit einem selbst generierten RSA-Testkey signiert.
 *
 * jsonwebtoken wird partiell gemockt (verify als Spy mit echter
 * Implementierung), damit das von jwkToPem erzeugte PEM abgegriffen und
 * direkt gegen node:crypto verifiziert werden kann — jwkToPem selbst ist
 * bewusst nicht exportiert.
 */
jest.mock('axios');
jest.mock('jsonwebtoken', () => {
  const actual = jest.requireActual('jsonwebtoken');
  return { ...actual, verify: jest.fn(actual.verify) };
});

const axiosMock = axios as jest.Mocked<typeof axios>;
const verifyMock = jwt.verify as unknown as jest.Mock;

describe('OauthService.verifyApple', () => {
  const BUNDLE_ID = 'de.tanklotse.app.test';
  const KID = 'test-kid-1';

  // Einmalig generierter RSA-Testkey (Modulus-High-Bit ist bei RSA immer
  // gesetzt → der 0x00-Padding-Pfad von jwkToPem wird mitgetestet).
  const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const privatePem = privateKey.export({ type: 'pkcs8', format: 'pem' }) as string;

  let envBackup: NodeJS.ProcessEnv;

  function appleJwk(): { kid: string; kty: string; n: string; e: string; alg: string; use: string } {
    const jwk = publicKey.export({ format: 'jwk' }) as { kty: string; n: string; e: string };
    return { ...jwk, kid: KID, alg: 'RS256', use: 'sig' };
  }

  function signToken(payloadOverrides: Record<string, unknown> = {}, kid: string = KID): string {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: 'https://appleid.apple.com',
      aud: BUNDLE_ID,
      sub: 'apple-user-001',
      email: 'apfel@example.com',
      email_verified: 'true',
      iat: now,
      exp: now + 600,
      ...payloadOverrides,
    };
    return jwt.sign(payload, privatePem, { algorithm: 'RS256', keyid: kid });
  }

  beforeEach(() => {
    envBackup = { ...process.env };
    process.env.APPLE_BUNDLE_ID = BUNDLE_ID;
    jest.clearAllMocks();
    // Gemockter Apple-JWKS-Endpoint liefert unseren Testkey.
    axiosMock.get.mockResolvedValue({ data: { keys: [appleJwk()] } });
  });

  afterEach(() => {
    process.env = envBackup;
  });

  it('happy path: gueltiges selbstsigniertes Token → ExternalIdentity', async () => {
    const service = new OauthService();
    const identity = await service.verifyApple(signToken());

    expect(identity).toEqual({
      sub: 'apple-user-001',
      email: 'apfel@example.com',
      emailVerified: true,
    });
  });

  it('jwkToPem: erzeugtes PEM ist identisch zum SPKI-Export von node:crypto', async () => {
    const service = new OauthService();
    await service.verifyApple(signToken());

    // jwkToPem-Output wird als 2. Argument an jwt.verify uebergeben.
    expect(verifyMock).toHaveBeenCalledTimes(1);
    const pemArg = verifyMock.mock.calls[0][1] as string;
    expect(pemArg).toContain('-----BEGIN PUBLIC KEY-----');

    // 1) Byte-Vergleich des PEM-Strings gegen den node:crypto-Referenz-Export.
    const expectedPem = publicKey.export({ type: 'spki', format: 'pem' }) as string;
    expect(pemArg.trim()).toBe(expectedPem.trim());

    // 2) Semantischer Vergleich: gleiches SPKI-DER nach Re-Import via node:crypto.
    const expectedDer = publicKey.export({ type: 'spki', format: 'der' }) as Buffer;
    const actualDer = createPublicKey(pemArg).export({ type: 'spki', format: 'der' }) as Buffer;
    expect(actualDer.equals(expectedDer)).toBe(true);
  });

  it('abgelaufenes Token → UnauthorizedException', async () => {
    const now = Math.floor(Date.now() / 1000);
    const expired = signToken({ iat: now - 7200, exp: now - 3600 });
    const service = new OauthService();

    await expect(service.verifyApple(expired)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('falsche Audience → UnauthorizedException', async () => {
    const wrongAudience = signToken({ aud: 'com.evil.other' });
    const service = new OauthService();

    await expect(service.verifyApple(wrongAudience)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('falscher Issuer → UnauthorizedException', async () => {
    const wrongIssuer = signToken({ iss: 'https://evil.example.com' });
    const service = new OauthService();

    await expect(service.verifyApple(wrongIssuer)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('unbekanntes kid (kein passender JWK) → UnauthorizedException', async () => {
    const unknownKid = signToken({}, 'unbekanntes-kid');
    const service = new OauthService();

    await expect(service.verifyApple(unknownKid)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('ohne APPLE_BUNDLE_ID → UnauthorizedException ohne JWKS-Fetch', async () => {
    delete process.env.APPLE_BUNDLE_ID;
    const service = new OauthService();

    await expect(service.verifyApple(signToken())).rejects.toBeInstanceOf(UnauthorizedException);
    expect(axiosMock.get).not.toHaveBeenCalled();
  });
});
