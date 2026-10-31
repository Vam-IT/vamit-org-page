# vamit-org-page

Static multi-page website for VAMIT UG, deployed to GitHub Pages at https://vam-it.com.

## Pages

- `index.html` – Start (Hero, Leistungen, Arbeitsweise, CTA)
- `impressum.html`, `datenschutz.html` – Rechtliches
- `en/index.html` – englische Landing Page (eine Seite)

Schriftarten und Bilder sind lokal eingebunden (`fonts/`, `assets/`). Die Seite bindet
seit dem PostHog-Consent-Banner (`js/consent.js`) ein Analyse-Tool ein, das erst nach
aktiver Zustimmung nachgeladen wird (`js/vendor/`, `js/analytics.js`) — Details in
`datenschutz.html`.

## Deploying to GitHub Pages

1. Push the repository to GitHub.
2. In **Settings → Pages**, set the source to **GitHub Actions**.
3. The workflow in `.github/workflows/pages.yml` publishes the site.
