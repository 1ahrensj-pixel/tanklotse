// Extrahiert das Workflow-Result-JSON aus einem Task-Output-File
// (string-bewusstes Klammer-Balancing, weil nach dem JSON noch XML folgt).
const fs = require('fs');

const src = process.argv[2];
const dst = process.argv[3];
// Das Task-Output-File ist vollstaendiges JSON: { summary, agentCount, logs, result }.
const j = JSON.parse(fs.readFileSync(src, 'utf8')).result;
if (!j || !j.wettbewerber) {
  console.error('Kein Result-JSON gefunden');
  process.exit(1);
}
fs.writeFileSync(dst, JSON.stringify(j, null, 2));
console.log('OK —', j.wettbewerber.length, 'Wettbewerber | Synthese:', !!j.synthese);
console.log('');
console.log('=== USP-CHECK (Skeptiker) ===');
console.log('Widerlegt:', j.uspCheck.widerlegt, '| gefunden:', (j.uspCheck.gefundeneApps || []).join('; ') || '—');
console.log(j.uspCheck.begruendung.slice(0, 500));
console.log('');
const s = j.synthese;
console.log('=== UNSERE VORTEILE ===');
s.unsereVorteile.forEach((v) => console.log('+', v));
console.log('=== DEREN VORTEILE ===');
s.derenVorteile.forEach((v) => console.log('-', v));
console.log('=== FEATURE-LUECKEN ===');
s.featureLuecken.forEach((f) =>
  console.log(`[${f.prio}/${f.aufwand || '?'}] ${f.feature} — hat: ${f.werHatEs}`));
console.log('=== TOP-MASSNAHMEN ===');
s.topMassnahmen.forEach((m, i) => console.log(`${i + 1}. ${m}`));
console.log('=== MARKTLUECKE ===');
console.log(s.marktluecke || '—');
console.log('=== FAZIT ===');
console.log(s.fazit);
