// Kondensiert audit/wettbewerbsanalyse-raw.json zu einem kompakten Digest
// (~6 KB), der als Kontext in Strategie-Agenten-Prompts passt.
const fs = require('fs');
const j = require('./wettbewerbsanalyse-raw.json');

const lines = [];
lines.push('WETTBEWERBER-DIGEST (Multi-Agent-Recherche 12.06.2026, Quellen in audit/wettbewerbsanalyse-raw.json):');
for (const w of j.wettbewerber) {
  lines.push('');
  lines.push(`## ${w.name}`);
  lines.push(`Play: ${w.bewertungPlay || '?'} | iOS: ${w.bewertungAppStore || '?'} | Monetarisierung: ${(w.monetarisierung || '').slice(0, 140)}`);
  lines.push(`Datenquelle: ${(w.datenquelle || '?').slice(0, 140)}`);
  lines.push(`Lohnt-sich-Check: ${w.hatLohntSichCheck} | Web-Version: ${w.hatWebVersion}`);
  lines.push(`Stärken: ${(w.staerken || []).slice(0, 3).map((s) => s.slice(0, 110)).join(' • ')}`);
  lines.push(`Schwächen: ${(w.schwaechen || []).slice(0, 3).map((s) => s.slice(0, 110)).join(' • ')}`);
  if (w.besonderheiten?.length) lines.push(`Besonderheiten: ${w.besonderheiten.slice(0, 2).map((s) => s.slice(0, 130)).join(' • ')}`);
}
lines.push('');
lines.push('## USP-SKEPTIKER-CHECK');
lines.push(`Behauptung "keine dt. App rechnet den Umweg" WIDERLEGT: ${(j.uspCheck.gefundeneApps || []).join('; ')}`);
lines.push(j.uspCheck.begruendung.slice(0, 500));
lines.push('');
lines.push('## SYNTHESE-KERN');
lines.push('Unsere Vorteile: ' + j.synthese.unsereVorteile.map((v) => v.split(':')[0]).join(' | '));
lines.push('Deren Vorteile: ' + j.synthese.derenVorteile.map((v) => v.split(':')[0]).join(' | '));
lines.push('Marktlücke: ' + (j.synthese.marktluecke || '').slice(0, 600));
lines.push('Fazit: ' + (j.synthese.fazit || '').slice(0, 600));

const out = lines.join('\n');
fs.writeFileSync(process.argv[2] || 'audit/wettbewerber-digest.txt', out);
console.log('Digest:', out.length, 'Zeichen');
