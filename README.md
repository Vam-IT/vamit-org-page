# vamit-org-page

Static multi-page website for VAMIT UG, deployed to GitHub Pages at https://vam-it.com.

## Pages

- `index.html` – Start (Hero, Leistungen, Arbeitsweise, Digitalisierungs-Check-Teaser, App, CTA)
- `leistungen.html` – Leistungen im Detail (4 Felder mit Anker-Links)
- `digitalisierungs-check.html` – Festpreis-Angebotsseite
- `ueber-uns.html` – Über VAMIT (Story, Werte, Geschäftsführer)
- `kontakt.html` – Erstgespräch buchen / E-Mail / Adresse
- `impressum.html`, `datenschutz.html` – Rechtliches
- `en/index.html` – englische Landing Page (eine Seite)

Schriftarten und Bilder sind lokal eingebunden (`fonts/`, `assets/`) — die Seite lädt
keine externen Inhalte (DSGVO).

## Vor dem Launch (TODO)

1. **Bio Veselin Kolev erweitern:** `ueber-uns.html`, Founder-Card (TODO-Kommentar im Code).
2. **Custom Domain prüfen:** In **Settings → Pages** muss `vam-it.com` als Custom Domain
   mit „Enforce HTTPS" hinterlegt sein (die `CNAME`-Datei im Repo wird mit deployt).

## Deploying to GitHub Pages

1. Push the repository to GitHub.
2. In **Settings → Pages**, set the source to **GitHub Actions**.
3. The workflow in `.github/workflows/pages.yml` publishes the site.
