'use client';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

/**
 * Fehler mit strukturiertem HTTP-Status und optionalem Backend-Fehlercode
 * (z. B. `TOTP_REQUIRED` aus dem 2FA-Step-up), damit Aufrufer nicht
 * Fehlertexte parsen muessen.
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('tk_admin_token');
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API}/api${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text();
    let code: string | undefined;
    try {
      code = (JSON.parse(text) as { error?: string }).error;
    } catch {
      // Body ist kein JSON — dann gibt es keinen Fehlercode.
    }
    // Abgelaufene/ungueltige Session: Token verwerfen und zur Anmeldung.
    // Bewusst KEIN Refresh-Flow — das Dashboard ist ein internes Tool,
    // erneutes Einloggen ist zumutbar. Ausgenommen: /auth/*-Aufrufe und
    // die Login-Seite selbst (dort zeigt das Formular den Fehler an).
    if (
      res.status === 401 &&
      !path.startsWith('/auth/') &&
      typeof window !== 'undefined' &&
      window.location.pathname !== '/login'
    ) {
      clearToken();
      window.location.assign('/login');
    }
    throw new ApiError(res.status, `API ${res.status}: ${text}`, code);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export function setToken(token: string) {
  window.localStorage.setItem('tk_admin_token', token);
}
export function clearToken() {
  window.localStorage.removeItem('tk_admin_token');
}

/** Generischer SWR-Fetcher: passt zur strikten Signatur ab swr@2.3. */
export function swrFetcher<T = unknown>(path: string): Promise<T> {
  return api<T>(path);
}
