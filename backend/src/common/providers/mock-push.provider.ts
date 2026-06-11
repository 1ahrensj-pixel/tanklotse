import { Injectable, Logger } from '@nestjs/common';

import { assertMockAllowed } from './provider-mode.types';

/**
 * Audit 2026-05-06 §22 Phase 8 (PR #11) — Mock-Push.
 *
 * Vorbereitung. Der reale `PushService` (firebase-admin) bleibt unberuehrt.
 * Dieser Mock-Stub demonstriert, wie ein `PUSH_PROVIDER_MODE=mock`-Pfad
 * aussehen wird, und dient als Referenz fuer kuenftige Push-Refaktorierung.
 *
 * Ehrliche Trennung:
 *   - Versendet niemals echte Push-Nachrichten.
 *   - Schreibt nur ins Log.
 *   - In `ApiReadinessService` als `mock_ready` ausgewiesen.
 */
export interface MockPushMessage {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

@Injectable()
export class MockPushProvider {
  readonly name = 'mock';
  private readonly logger = new Logger('MockPushProvider');
  private readonly sent: MockPushMessage[] = [];

  constructor() {
    assertMockAllowed('push');
  }

  async sendToToken(message: MockPushMessage): Promise<{ ok: true; messageId: string }> {
    this.sent.push(message);
    const messageId = `mock-${Date.now()}-${this.sent.length}`;
    this.logger.log(
      `[mock-push] ${message.title} -> token=${message.token.slice(0, 6)}*** (id=${messageId})`,
    );
    return { ok: true, messageId };
  }

  /** Test-Helper: zeigt, was waehrend eines Tests „verschickt" wurde. */
  drainSent(): MockPushMessage[] {
    return this.sent.splice(0);
  }
}
