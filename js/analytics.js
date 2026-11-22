// Privacy-hardened PostHog init (EU Cloud). Requires js/vendor/posthog.js
// to have executed first (see script order in each page's <head>).
// Does NOT run on load -- js/consent.js calls vamitInitAnalytics() only
// after the visitor has actively accepted the consent banner (or on
// return visits where consent was already granted).
window.vamitInitAnalytics = function () {
  if (window.vamitAnalyticsInitialized) return;
  window.vamitAnalyticsInitialized = true;

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

    // Pinned here, because several of these are switched on in the PostHog
    // project and would otherwise follow the remote config. Changing any of
    // them means updating datenschutz.html (section V) as well.
    capture_performance: false,
    capture_heatmaps: false,
    capture_dead_clicks: false,
    capture_exceptions: false,
    rageclick: false,
    advanced_disable_flags: true,
    disable_external_dependency_loading: true,
    mask_personal_data_properties: true, // ad click IDs such as gclid, fbclid

    // Don't create persistent "Person" profiles for anonymous traffic --
    // we never call posthog.identify().
    person_profiles: 'identified_only',

    // Respect the browser's Do Not Track signal, if sent.
    respect_dnt: true,

    // Consent can be withdrawn after init. Checked per event, because
    // PostHog's own opt-out would write to browser storage.
    before_send: function (event) {
      return window.vamitConsent && window.vamitConsent.isGranted() ? event : null;
    },
  });
};
