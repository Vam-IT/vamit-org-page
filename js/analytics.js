// Privacy-hardened PostHog init (EU Cloud). Requires js/vendor/posthog.js
// to have executed first (see script order in each page's <head>).
posthog.init('phc_A5QVr9NYBy9Do6gyT5oO3rqrUR4rKkpd0LVM3J8qerk', {
  api_host: 'https://eu.i.posthog.com',

  // Nothing written to cookies / localStorage / sessionStorage.
  persistence: 'memory',

  // Minimize what's collected: no auto-tracking of clicks/inputs/forms,
  // no session replay, no surveys. capture_pageview stays at its default
  // (true) so normal page visits -- including their utm_* params -- are
  // still visible.
  autocapture: false,
  disable_session_recording: true,
  disable_surveys: true,

  // Don't create persistent "Person" profiles for anonymous traffic --
  // we never call posthog.identify().
  person_profiles: 'identified_only',

  // Respect the browser's Do Not Track signal, if sent.
  respect_dnt: true,
});
