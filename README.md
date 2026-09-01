# vamit-org-page

Static multi-page website for VAMIT UG, deployed to GitHub Pages at https://vam-it.com.

## Pages

- `index.html` – Start (Hero, Leistungen, Arbeitsweise, Digitalisierungs-Check-Teaser, App, CTA)
- `leistungen.html` – Leistungen im Detail (4 Felder mit Anker-Links)
- `digitaler-produktpass.html` – Pillar-Seite zum DPP (Produktgruppen, Zeitplan, Technik, FAQ)
- `batteriepass.html` – Cluster-Seite zum Batteriepass (erste Gruppe mit festem Termin)
- `produktpass-check.html` – Betroffenheits-Check über alle Produktgruppen, läuft vollständig im Browser
- `batteriepass-check.html` – Weiterleitung auf `produktpass-check.html`
- `digitalisierungs-check.html` – Angebotsseite für den IT-Check
- `ueber-uns.html` – Über VAMIT (Story, Werte, Geschäftsführer)
- `kontakt.html` – Erstgespräch buchen / E-Mail / Adresse
- `impressum.html`, `datenschutz.html` – Rechtliches
- `en/index.html` – englische Landing Page (eine Seite)

Schriftarten und Bilder sind lokal eingebunden (`fonts/`, `assets/`). Die Seite bindet
seit dem PostHog-Consent-Banner (`js/consent.js`) ein Analyse-Tool ein, das erst nach
aktiver Zustimmung nachgeladen wird (`js/vendor/`, `js/analytics.js`) — Details in
`datenschutz.html`.

## Digitaler Produktpass

Die Produktpass-Seiten sind der Akquisekanal für das DPP-Produkt, aufgebaut als Pillar
(`digitaler-produktpass.html`) mit Cluster (`batteriepass.html`). Die Begründung —
warum eine Fachseite statt einer Produktseite, warum ein Diagnosewerkzeug statt eines
Kontaktformulars, und was bewusst nicht übernommen wurde — steht in
[`docs/go-to-market-dpp.md`](docs/go-to-market-dpp.md).

Der Check (`js/produktpass-check.js`) wertet ausschließlich im Browser aus: keine Übertragung
von Antworten, keine E-Mail-Abfrage vor dem Ergebnis. Nur die Einstufung selbst geht — hinter
demselben Consent-Gate wie der Rest — als PostHog-Ereignis raus.

Der Countdown (`js/deadline.js`) liest sein Zieldatum aus dem `data-deadline`-Attribut;
ohne JavaScript bleibt der Platzhalter stehen, statt eine falsche Zahl zu zeigen.

## Offene Punkte

1. **Bio Veselin Kolev erweitern:** `ueber-uns.html`, Founder-Card (TODO-Kommentar im Code) —
   braucht noch echte Angaben zu Schwerpunkt, Hintergrund und Zertifizierungen.

## Deploying to GitHub Pages

1. Push the repository to GitHub.
2. In **Settings → Pages**, set the source to **GitHub Actions**.
3. The workflow in `.github/workflows/pages.yml` publishes the site.
