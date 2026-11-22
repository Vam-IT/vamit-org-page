// Language handling for the two homepages (/ and /en/).
//
// There is deliberately no automatic redirect: crawlers report an English
// browser language, so redirecting would hide the German homepage from search
// engines. Visitors with a non-German browser get a visible link instead (the
// inline script in index.html shows it, before the first paint).
// Nothing is stored in the browser.
(function () {
  // Left behind by the earlier redirect.
  try { localStorage.removeItem('vamit_lang'); } catch (e) { /* storage unavailable */ }

  // Keep campaign parameters (flyer QR code) when switching language.
  if (!window.location.search) return;
  document.querySelectorAll('a[hreflang]').forEach(function (link) {
    link.search = window.location.search;
  });
})();
