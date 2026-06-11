// Minimale, gebrandete HTML-Seiten fuer Links, die Nutzer direkt aus
// E-Mails im Browser oeffnen (Verify + Passwort-Reset). Kein Frontend-Build
// noetig — self-contained, inline-CSS, deutsch.
//
// Sicherheit: Tokens werden NIE in die Seite interpoliert ausser als
// hidden-input im Reset-Formular (HTML-escaped). Kein externes JS/CSS.

const escapeHtml = (s: string): string =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const shell = (title: string, body: string): string => `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${escapeHtml(title)} — TankLotse</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
    background: #f0f7f4; color: #143d2e; min-height: 100vh;
    display: flex; align-items: center; justify-content: center; padding: 24px;
  }
  .card {
    background: #fff; border-radius: 16px; padding: 40px 32px; max-width: 420px;
    width: 100%; box-shadow: 0 4px 24px rgba(20, 61, 46, .08); text-align: center;
  }
  .logo { font-size: 22px; font-weight: 800; color: #1a8a5e; margin-bottom: 24px; }
  .icon { font-size: 48px; margin-bottom: 16px; }
  h1 { font-size: 22px; margin-bottom: 12px; }
  p { color: #3c5a4d; line-height: 1.55; margin-bottom: 8px; }
  .hint { font-size: 13px; color: #6b8578; margin-top: 16px; }
  form { text-align: left; margin-top: 24px; }
  label { display: block; font-size: 14px; font-weight: 600; margin-bottom: 6px; }
  input[type=password] {
    width: 100%; padding: 12px 14px; border: 1px solid #c3d6cc; border-radius: 10px;
    font-size: 16px; margin-bottom: 16px;
  }
  input[type=password]:focus { outline: 2px solid #1a8a5e; border-color: #1a8a5e; }
  button {
    width: 100%; padding: 13px; background: #1a8a5e; color: #fff; border: 0;
    border-radius: 10px; font-size: 16px; font-weight: 700; cursor: pointer;
  }
  button:hover { background: #157049; }
  button:disabled { background: #9bbfae; cursor: wait; }
  .msg { margin-top: 14px; font-size: 14px; min-height: 20px; }
  .msg.ok { color: #157049; font-weight: 600; }
  .msg.err { color: #b3261e; font-weight: 600; }
</style>
</head>
<body>
<main class="card">
  <div class="logo">⛽ TankLotse</div>
  ${body}
</main>
</body>
</html>`;

export const verifySuccessPage = (): string =>
  shell(
    'E-Mail bestätigt',
    `<div class="icon">✅</div>
  <h1>E-Mail bestätigt!</h1>
  <p>Dein Konto ist jetzt vollständig aktiviert.</p>
  <p>Du kannst dieses Fenster schließen und dich in der TankLotse-App anmelden.</p>`,
  );

export const verifyErrorPage = (): string =>
  shell(
    'Link ungültig',
    `<div class="icon">⚠️</div>
  <h1>Link ungültig oder abgelaufen</h1>
  <p>Dieser Bestätigungslink funktioniert nicht mehr. Verifizierungslinks sind 24&nbsp;Stunden gültig.</p>
  <p>Melde dich in der App an, um einen neuen Link anzufordern.</p>`,
  );

export const resetFormPage = (token: string): string =>
  shell(
    'Passwort zurücksetzen',
    `<div class="icon">🔑</div>
  <h1>Neues Passwort setzen</h1>
  <p>Wähle ein sicheres Passwort (mindestens 12 Zeichen).</p>
  <form id="f">
    <input type="hidden" id="token" value="${escapeHtml(token)}">
    <label for="pw">Neues Passwort</label>
    <input type="password" id="pw" minlength="12" maxlength="200" required autocomplete="new-password">
    <label for="pw2">Passwort wiederholen</label>
    <input type="password" id="pw2" minlength="12" maxlength="200" required autocomplete="new-password">
    <button type="submit" id="btn">Passwort speichern</button>
    <div class="msg" id="msg" role="status"></div>
  </form>
  <script>
    document.getElementById('f').addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = document.getElementById('msg');
      const btn = document.getElementById('btn');
      const pw = document.getElementById('pw').value;
      const pw2 = document.getElementById('pw2').value;
      msg.className = 'msg';
      if (pw !== pw2) {
        msg.textContent = 'Die Passwörter stimmen nicht überein.';
        msg.className = 'msg err';
        return;
      }
      btn.disabled = true;
      try {
        const r = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: document.getElementById('token').value, newPassword: pw }),
        });
        if (r.status === 204) {
          msg.textContent = 'Passwort geändert! Du kannst dich jetzt in der App anmelden.';
          msg.className = 'msg ok';
          document.getElementById('f').querySelectorAll('input,button').forEach((el) => (el.disabled = true));
        } else {
          const data = await r.json().catch(() => ({}));
          msg.textContent = Array.isArray(data.message) ? data.message[0] : (data.message || 'Link ungültig oder abgelaufen. Fordere einen neuen an.');
          msg.className = 'msg err';
          btn.disabled = false;
        }
      } catch {
        msg.textContent = 'Netzwerkfehler — bitte erneut versuchen.';
        msg.className = 'msg err';
        btn.disabled = false;
      }
    });
  </script>`,
  );

export const resetErrorPage = (): string =>
  shell(
    'Link ungültig',
    `<div class="icon">⚠️</div>
  <h1>Link ungültig</h1>
  <p>Dieser Passwort-Reset-Link ist unvollständig oder abgelaufen. Reset-Links sind 30&nbsp;Minuten gültig.</p>
  <p>Fordere in der App unter „Passwort vergessen" einen neuen Link an.</p>`,
  );
