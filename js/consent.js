// Consent gate for PostHog analytics. Nothing runs until the visitor
// actively accepts here; the decision itself is stored in localStorage
// (this alone is treated as technically necessary and needs no separate
// consent). A button in the footer of every page lets visitors reopen the
// banner and change their mind at any time.
//
// js/vendor/posthog.js (268 KB) and js/analytics.js are NOT loaded via
// static <script> tags on most pages -- they're fetched on demand, only
// once consent is actually granted, so visitors who decline or haven't
// decided yet never download them. (go/flyer/index.html is the deliberate
// exception: it still loads them eagerly, because that page's whole job is
// firing one tracking beacon in the instant before it redirects away, and
// there's no time to wait on a fresh network fetch for that.)
(function () {
  // Bump the version whenever the purpose in the banner text grows: an old
  // "yes" doesn't cover a new purpose. An old "no" keeps counting.
  // v2: clicks on contact links are named explicitly.
  var CONSENT_KEY = 'vamit_consent_v2';
  var PREVIOUS_KEY = 'vamit_consent';
  var bannerEl = null;
  var toggleEl = null;
  var analyticsLoading = false;
  var pendingCallbacks = [];
  var unsavedChoice = null; // only used if localStorage is unavailable
  var bannerObserver = null;

  var T = document.documentElement.lang === 'en' ? {
    region: 'Analytics settings',
    text: 'May we use PostHog (cookieless, hosted in the EU) to analyze visits and clicks on contact links? ' +
      'Only with your consent. <a href="/datenschutz.html">Privacy policy (German)</a>',
    decline: 'Decline',
    accept: 'Accept',
    toggle: 'Privacy settings'
  } : {
    region: 'Analyse-Einstellungen',
    text: 'Dürfen wir mit PostHog (cookielos, EU-Hosting) Besuche und Klicks auf Kontakt-Links auswerten? ' +
      'Nur mit Ihrer Zustimmung. <a href="/datenschutz.html">Datenschutzerklärung</a>',
    decline: 'Ablehnen',
    accept: 'Akzeptieren',
    toggle: 'Datenschutz-Einstellungen'
  };

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
    if (unsavedChoice) return unsavedChoice;
    try {
      return localStorage.getItem(CONSENT_KEY) ||
        (localStorage.getItem(PREVIOUS_KEY) === 'denied' ? 'denied' : null);
    } catch (e) { return null; }
  }
  function setConsent(value) {
    try {
      localStorage.setItem(CONSENT_KEY, value);
      localStorage.removeItem(PREVIOUS_KEY);
      unsavedChoice = null;
    } catch (e) {
      unsavedChoice = value; // storage unavailable -- valid for this page only
    }
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
      'font-family:Inter,sans-serif;font-size:0.875rem;line-height:1.45;',
      'padding:0.8rem 1.25rem;padding-bottom:max(0.8rem,env(safe-area-inset-bottom));',
      'display:flex;gap:0.75rem 1.5rem;flex-wrap:wrap;align-items:center;justify-content:center;',
      'box-shadow:0 -4px 24px rgba(0,0,0,0.25);}',
      '.vamit-consent-text{flex:1 1 260px;max-width:760px;}',
      '.vamit-consent-text a{color:#00F5FF;text-decoration:underline;text-underline-offset:3px;padding:0.6rem 0;}',
      '.vamit-consent-actions{display:flex;gap:0.6rem;}',
      /* Both choices look the same: the privacy policy calls them equivalent. */
      '.vamit-consent-btn{font-family:Inter,sans-serif;font-weight:600;font-size:0.875rem;',
      'min-height:44px;min-width:7.5rem;padding:0.5rem 1rem;border-radius:6px;cursor:pointer;',
      'border:1px solid #94A3B8;background:transparent;color:#E0E3E5;white-space:nowrap;}',
      '.vamit-consent-btn:hover{border-color:#00F5FF;}',
      '.vamit-consent-banner :focus-visible{outline:2px solid #00F5FF;outline-offset:2px;}',
      /* Fallback for pages without a footer; otherwise .footer-bottom styles it. */
      '.vamit-consent-toggle--floating{position:fixed;left:1rem;bottom:1rem;z-index:9998;}',
      '@media (max-width:480px){',
      '.vamit-consent-banner{padding:0.7rem 1rem;font-size:0.8rem;gap:0.6rem;',
      'padding-bottom:max(0.7rem,env(safe-area-inset-bottom));}',
      '.vamit-consent-text{flex-basis:100%;}',
      '.vamit-consent-actions{width:100%;}',
      '.vamit-consent-btn{flex:1;min-width:0;}',
      '}',
      '@media (max-height:500px) and (orientation:landscape){',
      '.vamit-consent-banner{flex-wrap:nowrap;padding:0.4rem 1rem;font-size:0.75rem;}',
      '.vamit-consent-text{flex-basis:0;}',
      '.vamit-consent-btn{min-width:0;font-size:0.8rem;padding:0.4rem 0.75rem;}',
      '}'
    ].join('');
    document.head.appendChild(style);
  }

  function buildBanner() {
    var el = document.createElement('div');
    el.className = 'vamit-consent-banner';
    el.setAttribute('role', 'region');
    el.setAttribute('aria-label', T.region);

    var text = document.createElement('div');
    text.className = 'vamit-consent-text';
    text.innerHTML = T.text;

    var actions = document.createElement('div');
    actions.className = 'vamit-consent-actions';

    var declineBtn = document.createElement('button');
    declineBtn.type = 'button';
    declineBtn.className = 'vamit-consent-btn';
    declineBtn.textContent = T.decline;
    declineBtn.addEventListener('click', function () { applyConsent('denied'); });

    var acceptBtn = document.createElement('button');
    acceptBtn.type = 'button';
    acceptBtn.className = 'vamit-consent-btn';
    acceptBtn.textContent = T.accept;
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
    el.textContent = T.toggle;
    el.addEventListener('click', function () {
      showBanner();
      bannerEl.querySelector('button').focus({ preventScroll: true });
    });
    return el;
  }

  // Reserve room for the banner so it never hides the end of the page.
  function setBannerSpace(px) {
    document.documentElement.style.setProperty('--consent-h', px + 'px');
  }

  function showBanner() {
    if (bannerEl) return;
    bannerEl = buildBanner();
    // First in the tab order, although it's displayed at the bottom.
    document.body.insertBefore(bannerEl, document.body.firstChild);
    setBannerSpace(bannerEl.offsetHeight);
    if ('ResizeObserver' in window) {
      bannerObserver = new ResizeObserver(function () {
        if (bannerEl) setBannerSpace(bannerEl.offsetHeight);
      });
      bannerObserver.observe(bannerEl);
    }
  }

  function hideBanner() {
    if (!bannerEl) return;
    var hadFocus = bannerEl.contains(document.activeElement);
    if (bannerObserver) bannerObserver.disconnect();
    bannerEl.parentNode.removeChild(bannerEl);
    bannerEl = null;
    setBannerSpace(0);
    if (hadFocus) toggleEl.focus({ preventScroll: true });
  }

  function startAnalytics() {
    // The scripts load asynchronously; consent may be gone by now.
    if (getConsent() === 'granted') window.vamitInitAnalytics();
  }

  function applyConsent(value) {
    setConsent(value);
    hideBanner();
    if (value === 'granted') {
      ensureAnalyticsLoaded(startAnalytics);
    }
  }

  injectStyles();
  toggleEl = buildToggle();
  var footerBar = document.querySelector('.footer-bottom');
  if (footerBar) {
    footerBar.appendChild(toggleEl);
  } else {
    toggleEl.classList.add('vamit-consent-toggle--floating');
    document.body.appendChild(toggleEl);
  }

  var consent = getConsent();
  if (consent === 'granted') {
    ensureAnalyticsLoaded(startAnalytics);
  } else if (consent !== 'denied') {
    showBanner();
  }
})();
