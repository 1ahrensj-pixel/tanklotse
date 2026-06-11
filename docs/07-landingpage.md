# 07 – Landingpage

## Stack

Next.js 15.5.15 (gepatchte Version, CVE-2025-66478 fixed) · React 19 · Tailwind 3.4 · static export.

## Seiten (10)

| Pfad | Inhalt |
|---|---|
| `/` | Hero, Empfehlungs-Demo, Feature-Strip |
| `/funktionen` | Vollständige Feature-Übersicht |
| `/privat` | Privatnutzer-Argumente, Datenschutz-Hinweis |
| `/firmen` | B2B-/Flotten-Modul (Phase 2) |
| `/preise` | Free/Premium/Flotte-Tarife |
| `/datenschutz` | DSGVO-Erklärung |
| `/impressum` | Anbieterkennzeichnung (Platzhalter — vor Veröffentlichung ausfüllen) |
| `/datenquelle` | CC-BY-4.0-Hinweis Tankerkönig + MTS-K |
| `/kontakt` | Mailto-Link |
| `/app` | App-Download (Links erst nach Store-Freigabe) |

Plus: `sitemap.xml`, `robots.txt`, OpenGraph-Meta, JSON-LD (in `layout.tsx`).

## Build

```bash
cd landingpage
npm install
npm run build
```

Erzeugt `.next/standalone/server.js` für Container-Deployment.

## SEO

- Keywords aus Spezifikation Punkt 7 (günstig tanken, Spritpreise vergleichen, Dieselpreis-App, …) in Meta + Body.
- `metadataBase` aus `NEXT_PUBLIC_SITE_URL`.
- Sitemap und Robots werden automatisch generiert.

## Eigenes Design

Petrol-Mint-Palette (`brand.500 = #1f7e75`), bewusst **nicht** an clever-tanken / mehr-tanken / ADAC orientiert.

## Was vor dem Live-Gang noch zu tun ist

- Impressum-Platzhalter mit echten Anbieterdaten füllen.
- App-Store- und Play-Links eintragen, sobald Builds freigegeben sind.
- Domain `tanklotse.de` erst nach DENIC-/DPMA-/EUIPO-Recherche endgültig verwenden.
- Lighthouse-Run gegen produktive Domain.
