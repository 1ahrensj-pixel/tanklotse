import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard';

describe('OptionalJwtAuthGuard', () => {
  const guard = new OptionalJwtAuthGuard();

  it('liefert null statt 401, wenn kein Token vorliegt', () => {
    // passport-jwt liefert user=false + info 'No auth token'.
    expect(guard.handleRequest(null, false)).toBeNull();
  });

  it('liefert null statt 401 bei ungueltigem/abgelaufenem Token', () => {
    expect(guard.handleRequest(new Error('jwt expired'), false)).toBeNull();
  });

  it('reicht den validierten Nutzer durch, wenn das Token gueltig ist', () => {
    const user = { sub: 'user-123', email: 'u@x', role: 'USER' };
    expect(guard.handleRequest(null, user)).toBe(user);
  });

  it('behandelt 2FA-Pre-Auth-Tokens (totpPending) als anonym', () => {
    const user = { sub: 'admin-1', email: 'a@x', role: 'ADMIN', totpPending: true };
    expect(guard.handleRequest(null, user)).toBeNull();
  });
});
