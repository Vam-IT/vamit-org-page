// The contact form now posts directly to FormSubmit (a hosted form backend
// that needs no server of our own -- fits the GitHub Pages static site) and
// emails the submission to info@vam-it.com, with Reply-To set to the value
// of the "email" field. No JS is required for the submission itself; this
// script only handles the post-submit "thank you" state.
//
// FormSubmit redirects back to kontakt.html?gesendet=1 after a successful
// submit (see the _next hidden field). We detect that here, swap the form
// for a short confirmation message, and clean the URL so a refresh/back
// doesn't re-trigger it.
(function () {
  var params = new URLSearchParams(window.location.search);
  if (params.get('gesendet') !== '1') return;

  var form = document.getElementById('contactForm');
  var success = document.getElementById('contactFormSuccess');
  if (form) form.hidden = true;
  if (success) {
    success.hidden = false;
    success.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  params.delete('gesendet');
  var newSearch = params.toString();
  var newUrl = window.location.pathname + (newSearch ? '?' + newSearch : '') + window.location.hash;
  window.history.replaceState(null, '', newUrl);
})();
