import { Injectable } from '@nestjs/common';

import { assertMockAllowed } from './provider-mode.types';

/**
 * Audit 2026-05-06 §22 Phase 8 (PR #11) — Mock-Auth.
 *
 * Vorbereitung. Die echten `OAuthService`/`AuthService`-Pfade bleiben unberuehrt.
 * Dieser Stub liefert deterministische Apple-/Google-Identitaeten fuer
 * Vertrags-Tests, ohne ein echtes OAuth-Token-Format zu validieren.
 *
 * Ehrliche Trennung:
 *   - Validiert keine echten ID-Tokens.
 *   - In `ApiReadinessService` als `mock_ready` ausgewiesen.
 */
export interface MockAuthIdentity {
  provider: 'apple' | 'google';
  providerUserId: string;
  email: string | null;
  emailVerified: boolean;
}

@Injectable()
export class MockAuthProvider {
  readonly name = 'mock';

  constructor() {
    assertMockAllowed('auth');
  }

  async verifyAppleIdToken(token: string): Promise<MockAuthIdentity> {
    if (!token.startsWith('mock-apple-')) {
      throw new Error('Mock-Apple-Token muss mit "mock-apple-" beginnen.');
    }
    const id = token.slice('mock-apple-'.length);
    return {
      provider: 'apple',
      providerUserId: id || 'mock-apple-user',
      email: `${id || 'mock'}@example.invalid`,
      emailVerified: true,
    };
  }

  async verifyGoogleIdToken(token: string): Promise<MockAuthIdentity> {
    if (!token.startsWith('mock-google-')) {
      throw new Error('Mock-Google-Token muss mit "mock-google-" beginnen.');
    }
    const id = token.slice('mock-google-'.length);
    return {
      provider: 'google',
      providerUserId: id || 'mock-google-user',
      email: `${id || 'mock'}@example.invalid`,
      emailVerified: true,
    };
  }
}
