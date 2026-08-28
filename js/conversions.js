// Lightweight conversion-event tracking, layered on top of js/analytics.js.
// Until now the site only tracked pageviews (autocapture is deliberately
// off, see js/analytics.js), so there was no way to tell whether visitors
// actually engage with the calls to action. This adds a handful of named
// events for the actions that matter for lead generation, using the same
// consent gate as the rest of the analytics setup: nothing is sent unless
// window.vamitConsent.isGranted() is true, and no personal data (name,
// company, message text) is ever included in event properties.
(function () {
  function track(event, props) {
    try {
      if (window.posthog && typeof posthog.capture === 'function' &&
          window.vamitConsent && window.vamitConsent.isGranted()) {
        posthog.capture(event, props || {});
      }
    } catch (e) {
      // Analytics must never break the page.
    }
  }

  function classifyLink(href) {
    if (!href) return null;
    if (href.indexOf('cal.eu/vamit') !== -1) return 'booking_click';
    if (href.indexOf('mailto:') === 0) return 'email_click';
    if (href.indexOf('tel:') === 0) return 'phone_click';
    if (href.indexOf('digitalisierungs-check') !== -1) return 'check_cta_click';
    if (href.indexOf('kontakt.html') !== -1 || href.indexOf('#contact') !== -1) return 'contact_cta_click';
    return null;
  }

  document.addEventListener('click', function (event) {
    var link = event.target.closest ? event.target.closest('a[href]') : null;
    if (!link) return;
    var eventName = classifyLink(link.getAttribute('href') || '');
    if (!eventName) return;
    track(eventName, {
      label: (link.textContent || '').trim().slice(0, 80),
      source_page: window.location.pathname
    });
  }, true);

  document.addEventListener('submit', function (event) {
    var form = event.target;
    if (!form || form.id !== 'contactForm') return;
    var companyField = form.querySelector('[name="company"]');
    track('contact_form_submit', {
      has_company: !!(companyField && companyField.value.trim()),
      source_page: window.location.pathname
    });
  }, true);
})();
