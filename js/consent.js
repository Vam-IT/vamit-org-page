// Consent gate for PostHog analytics. Nothing runs until the visitor
// actively accepts here; the decision itself is stored in localStorage
// (this alone is treated as technically necessary and needs no separate
// consent). A small persistent toggle lets visitors reopen the banner and
// change their mind at any time.
//
// js/vendor/posthog.js (268 KB) and js/analytics.js are NOT loaded via
// static <script> tags on most pages -- they're fetched on demand, only
// once consent is actually granted, so visitors who decline or haven't
// decided yet never download them. (go/flyer/index.html is the deliberate
// exception: it still loads them eagerly, because that page's whole job is
// firing one tracking beacon in the instant before it redirects away, and
// there's no time to wait on a fresh network fetch for that.)
(function () {
  var CONSENT_KEY = 'vamit_consent';
  var bannerEl = null;
  var toggleEl = null;
  var analyticsLoading = false;
  var pendingCallbacks = [];

  function ensureAnalyticsLoaded(callback) {
    if (typeof window.vamitInitAnalytics === 'function') {
      callback();
      return;
    }
    pendingCallbacks.push(callback);
    if (analyticsLoading) return;
    analyticsLoading = true;

    var vendorScript = document.createElement('script');
    vendorScript.src = '/js/vendor/posthog.js';
    vendorScript.onload = function () {
      var analyticsScript = document.createElement('script');
      analyticsScript.src = '/js/analytics.js';
      analyticsScript.onload = function () {
        pendingCallbacks.forEach(function (cb) { cb(); });
        pendingCallbacks = [];
      };
      document.head.appendChild(analyticsScript);
    };
    document.head.appendChild(vendorScript);
  }

  function getConsent() {
    try { return localStorage.getItem(CONSENT_KEY); }
    catch (e) { return null; }
  }
  function setConsent(value) {
    try { localStorage.setItem(CONSENT_KEY, value); }
    catch (e) { /* storage unavailable (e.g. private mode) -- just don't persist */ }
  }

  window.vamitConsent = {
    get: getConsent,
    isGranted: function () { return getConsent() === 'granted'; }
  };

  function injectStyles() {
    var style = document.createElement('style');
    style.textContent = [
      '.vamit-consent-banner{position:fixed;left:0;right:0;bottom:0;z-index:9999;',
      'background:#1A2536;color:#E0E3E5;border-top:1px solid #2D3A4F;',
      'font-family:Inter,sans-serif;font-size:0.9rem;line-height:1.5;',
      'padding:1rem 1.25rem;display:flex;gap:1rem;flex-wrap:wrap;align-items:center;justify-content:space-between;',
      'box-shadow:0 -4px 24px rgba(0,0,0,0.25);}',
      '.vamit-consent-text{flex:1 1 320px;max-width:640px;}',
      '.vamit-consent-text a{color:#00F5FF;text-decoration:underline;}',
      '.vamit-consent-actions{display:flex;gap:0.6rem;flex-wrap:wrap;}',
      '.vamit-consent-btn{font-family:Inter,sans-serif;font-weight:600;font-size:0.85rem;',
      'padding:0.6rem 1.1rem;border-radius:8px;cursor:pointer;border:1px solid #2D3A4F;',
      'background:transparent;color:#E0E3E5;white-space:nowrap;}',
      '.vamit-consent-btn:hover{border-color:#00F5FF;}',
      '.vamit-consent-btn--accept{background:#00F5FF;color:#0D1421;border-color:#00F5FF;}',
      '.vamit-consent-btn--accept:hover{opacity:0.9;}',
      '.vamit-consent-toggle{position:fixed;left:1rem;bottom:1rem;z-index:9998;',
      'font-family:Inter,sans-serif;font-size:0.72rem;font-weight:600;letter-spacing:0.03em;',
      'padding:0.45rem 0.8rem;border-radius:999px;cursor:pointer;',
      'background:#1A2536;color:#94A3B8;border:1px solid #2D3A4F;}',
      '.vamit-consent-toggle:hover{color:#00F5FF;border-color:#00F5FF;}'
    ].join('');
    document.head.appendChild(style);
  }

  function buildBanner() {
    var el = document.createElement('div');
    el.className = 'vamit-consent-banner';
    el.setAttribute('role', 'region');
    el.setAttribute('aria-label', 'Cookie- und Analyse-Einstellungen');

    var text = document.createElement('div');
    text.className = 'vamit-consent-text';
    text.innerHTML = 'Wir nutzen das cookielose Analyse-Tool PostHog (EU-Hosting, Frankfurt), um zu verstehen, ' +
      'über welche Kanäle Besucher auf unsere Seite gelangen. Ohne Ihre Zustimmung findet keine Analyse statt. ' +
      'Mehr dazu in unserer <a href="/datenschutz.html">Datenschutzerklärung</a>.';

    var actions = document.createElement('div');
    actions.className = 'vamit-consent-actions';

    var declineBtn = document.createElement('button');
    declineBtn.type = 'button';
    declineBtn.className = 'vamit-consent-btn';
    declineBtn.textContent = 'Ablehnen';
    declineBtn.addEventListener('click', function () { applyConsent('denied'); });

    var acceptBtn = document.createElement('button');
    acceptBtn.type = 'button';
    acceptBtn.className = 'vamit-consent-btn vamit-consent-btn--accept';
    acceptBtn.textContent = 'Akzeptieren';
    acceptBtn.addEventListener('click', function () { applyConsent('granted'); });

    actions.appendChild(declineBtn);
    actions.appendChild(acceptBtn);
    el.appendChild(text);
    el.appendChild(actions);
    return el;
  }

  function buildToggle() {
    var el = document.createElement('button');
    el.type = 'button';
    el.className = 'vamit-consent-toggle';
    el.textContent = 'Datenschutz-Einstellungen';
    el.addEventListener('click', showBanner);
    return el;
  }

  function showBanner() {
    if (toggleEl) toggleEl.style.display = 'none';
    if (bannerEl) return;
    bannerEl = buildBanner();
    document.body.appendChild(bannerEl);
  }

  function hideBanner() {
    if (bannerEl && bannerEl.parentNode) bannerEl.parentNode.removeChild(bannerEl);
    bannerEl = null;
    if (toggleEl) toggleEl.style.display = '';
  }

  function applyConsent(value) {
    setConsent(value);
    hideBanner();
    if (value === 'granted') {
      ensureAnalyticsLoaded(function () { window.vamitInitAnalytics(); });
    }
  }

  injectStyles();
  toggleEl = buildToggle();
  document.body.appendChild(toggleEl);

  var consent = getConsent();
  if (consent === 'granted') {
    ensureAnalyticsLoaded(function () { window.vamitInitAnalytics(); });
  } else if (consent !== 'denied') {
    showBanner();
  }
})();
