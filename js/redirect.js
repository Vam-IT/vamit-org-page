// Generic handler for /go/<source>/ gateway pages. Reads campaign info
// from data-* attributes on <body>, fires a PostHog "campaign_redirect"
// event via sendBeacon, then forwards the visitor to data-target with
// utm_source/utm_medium/utm_campaign appended (merged with any query
// string already present, either on this URL or on data-target itself).
// This query-string handoff is the ONLY attribution link to the landing
// page, since PostHog is configured with persistence: 'memory'.
//
// The redirect itself always happens instantly regardless of consent --
// only the campaign_redirect capture is gated. Without prior consent
// (the common case for a first-time flyer scan) no event fires here, but
// the utm_* params still land on the destination URL, so attribution
// survives if the visitor accepts the consent banner on that next page.
(function () {
  var body        = document.body;
  var utmSource   = body.dataset.utmSource   || '';
  var utmMedium   = body.dataset.utmMedium   || '';
  var utmCampaign = body.dataset.utmCampaign || '';
  var target      = body.dataset.target      || '/';

  function buildDestination() {
    var url = new URL(target, window.location.origin);
    new URLSearchParams(window.location.search).forEach(function (value, key) {
      url.searchParams.set(key, value);
    });
    if (utmSource)   url.searchParams.set('utm_source', utmSource);
    if (utmMedium)   url.searchParams.set('utm_medium', utmMedium);
    if (utmCampaign) url.searchParams.set('utm_campaign', utmCampaign);
    return url.toString();
  }

  var destination = buildDestination();
  var redirected = false;
  function go() {
    if (redirected) return;
    redirected = true;
    window.location.replace(destination);
  }

  try {
    if (window.posthog && typeof posthog.capture === 'function' &&
        window.vamitConsent && window.vamitConsent.isGranted()) {
      posthog.capture('campaign_redirect', {
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
        redirect_target: target
      }, { transport: 'sendBeacon', send_instantly: true });
    }
  } catch (err) {
    // Analytics must never block the redirect.
  }
  go();

  // Ultimate safety net in case something above never ran.
  setTimeout(go, 1000);
})();
