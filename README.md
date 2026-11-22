# vamit-org-page

Static website for VAMIT UG, deployed to GitHub Pages at https://vam-it.com.

## Pages

- `index.html` – Start (Hero, Leistungen, Orefy, Über uns, CTA)
- `impressum.html`, `datenschutz.html` – Rechtliches
- `kontakt.html`, `leistungen.html`, `ueber-uns.html`, `digitalisierungs-check.html` – nur
  Weiterleitungen für früher veröffentlichte URLs (GitHub Pages kann keine 301). Erst das Skript
  (behält Query-Parameter), dann der Meta-Refresh (Signal für Google, Fallback ohne JS).
- `404.html` – Fehlerseite (nur absolute Pfade verwenden, sie wird unter jeder URL ausgeliefert)
- `en/index.html` – englische Landing Page (eine Seite)

Schriftarten und Bilder sind lokal eingebunden (`fonts/`, `assets/`). Die Seite bindet
seit dem PostHog-Consent-Banner (`js/consent.js`) ein Analyse-Tool ein, das erst nach
aktiver Zustimmung nachgeladen wird (`js/vendor/`, `js/analytics.js`) — Details in
`datenschutz.html`.

## Regeln

- Keine automatische Sprachweiterleitung (SEO), nur ein Hinweis-Link (`js/lang.js`).
- Wer ändert, was PostHog erfasst, passt `datenschutz.html` (Abschnitt V) an. Bei einem neuen
  Zweck zusätzlich den Bannertext und die Version von `CONSENT_KEY` in `js/consent.js`.
- Das Repository ist öffentlich: keine internen Dokumente committen, auch nicht auf Branches.
- Neue Dateien im Wurzelverzeichnis werden nur veröffentlicht, wenn der Workflow sie kopiert.

## Deploying to GitHub Pages

1. Push the repository to GitHub.
2. In **Settings → Pages**, set the source to **GitHub Actions**.
3. The workflow in `.github/workflows/pages.yml` publishes the site.
