import { Injectable, UnauthorizedException } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import * as jwt from 'jsonwebtoken';
import axios from 'axios';

export interface ExternalIdentity {
  sub: string;
  email: string | null;
  emailVerified: boolean;
}

@Injectable()
export class OauthService {
  private readonly googleClient = new OAuth2Client(process.env.GOOGLE_OAUTH_CLIENT_ID);
  private appleKeysCache: { keys: jwt.JwtHeader[]; fetchedAt: number } | null = null;

  async verifyGoogle(idToken: string): Promise<ExternalIdentity> {
    if (!process.env.GOOGLE_OAUTH_CLIENT_ID) {
      throw new UnauthorizedException('Google-Login serverseitig nicht konfiguriert.');
    }
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_OAUTH_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload?.sub) throw new Error('kein sub');
      return {
        sub: payload.sub,
        email: payload.email ?? null,
        emailVerified: Boolean(payload.email_verified),
      };
    } catch {
      throw new UnauthorizedException('Google-Token ungültig.');
    }
  }

  async verifyApple(identityToken: string): Promise<ExternalIdentity> {
    if (!process.env.APPLE_BUNDLE_ID) {
      throw new UnauthorizedException('Apple-Login serverseitig nicht konfiguriert.');
    }
    try {
      const decodedHeader = jwt.decode(identityToken, { complete: true }) as
        | { header: jwt.JwtHeader; payload: jwt.JwtPayload }
        | null;
      if (!decodedHeader) throw new Error('Token nicht decodierbar');
      const kid = decodedHeader.header.kid;
      if (!kid) throw new Error('Kein kid');

      const jwks = await this.fetchAppleJwks();
      const key = jwks.find((k) => k.kid === kid);
      if (!key) throw new Error('Apple JWK nicht gefunden');
      const pem = jwkToPem(key);

      const verified = jwt.verify(identityToken, pem, {
        algorithms: ['RS256'],
        issuer: 'https://appleid.apple.com',
        audience: process.env.APPLE_BUNDLE_ID,
      }) as jwt.JwtPayload;

      return {
        sub: String(verified.sub),
        email: typeof verified.email === 'string' ? verified.email : null,
        emailVerified: verified.email_verified === true || verified.email_verified === 'true',
      };
    } catch {
      throw new UnauthorizedException('Apple-Token ungültig.');
    }
  }

  private async fetchAppleJwks(): Promise<AppleJwk[]> {
    if (this.appleKeysCache && Date.now() - this.appleKeysCache.fetchedAt < 3600_000) {
      return this.appleKeysCache.keys as unknown as AppleJwk[];
    }
    const res = await axios.get<{ keys: AppleJwk[] }>('https://appleid.apple.com/auth/keys', {
      timeout: 5000,
    });
    this.appleKeysCache = { keys: res.data.keys as unknown as jwt.JwtHeader[], fetchedAt: Date.now() };
    return res.data.keys;
  }
}

interface AppleJwk {
  kid: string;
  kty: string;
  n: string;
  e: string;
  alg?: string;
  use?: string;
}

// Minimal JWK-to-PEM (RSA), reicht für Apple-IDP
function jwkToPem(jwk: { n: string; e: string; kty: string }): string {
  if (jwk.kty !== 'RSA') throw new Error('nur RSA unterstützt');
  const modulus = base64UrlToBuffer(jwk.n);
  const exponent = base64UrlToBuffer(jwk.e);

  const modulusHex = bufferToHex(prependZeroIfNeeded(modulus));
  const exponentHex = bufferToHex(exponent);

  const modulusEncoded = encodeAsn1Integer(modulusHex);
  const exponentEncoded = encodeAsn1Integer(exponentHex);
  const sequence = encodeAsn1Sequence(modulusEncoded + exponentEncoded);

  const pubkeyBitString = '03' + lengthHex((sequence.length / 2 + 1)) + '00' + sequence;
  const algId = '300d06092a864886f70d0101010500';
  const spki = encodeAsn1SequenceFromHex(algId + pubkeyBitString);
  const der = Buffer.from(spki, 'hex');
  const b64 = der.toString('base64').match(/.{1,64}/g)!.join('\n');
  return `-----BEGIN PUBLIC KEY-----\n${b64}\n-----END PUBLIC KEY-----\n`;
}

function base64UrlToBuffer(s: string): Buffer {
  const pad = '='.repeat((4 - (s.length % 4)) % 4);
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64');
}
function bufferToHex(b: Buffer): string {
  return b.toString('hex');
}
function prependZeroIfNeeded(b: Buffer): Buffer {
  return b[0] & 0x80 ? Buffer.concat([Buffer.from([0]), b]) : b;
}
function lengthHex(len: number): string {
  if (len < 0x80) return len.toString(16).padStart(2, '0');
  const hex = len.toString(16);
  const padded = hex.length % 2 ? '0' + hex : hex;
  return (0x80 + padded.length / 2).toString(16) + padded;
}
function encodeAsn1Integer(hex: string): string {
  return '02' + lengthHex(hex.length / 2) + hex;
}
function encodeAsn1Sequence(hexBody: string): string {
  return '30' + lengthHex(hexBody.length / 2) + hexBody;
}
function encodeAsn1SequenceFromHex(hexBody: string): string {
  return encodeAsn1Sequence(hexBody);
}
