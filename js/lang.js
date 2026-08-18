// Defaults the site's language to the visitor's browser preference,
// but only on the German homepage (/) -- the one page that has a real
// English counterpart (/en/). Deep German pages (leistungen.html etc.)
// have no English translation to redirect to, and /en/ itself is never
// redirected away from, so a deliberate link to /en/ always works.
//
// An explicit choice via the nav language-switch link is remembered
// (localStorage) and wins over the browser default on future visits,
// so switching language once doesn't get overridden again later.
(function () {
  var LANG_KEY = 'vamit_lang';

  function getStored() {
    try { return localStorage.getItem(LANG_KEY); }
    catch (e) { return null; }
  }
  function setStored(value) {
    try { localStorage.setItem(LANG_KEY, value); }
    catch (e) { /* storage unavailable -- just don't persist */ }
  }

  // Record explicit choices made via the nav language switch, on every page.
  var langLink = document.querySelector('.nav-lang');
  if (langLink) {
    langLink.addEventListener('click', function () {
      var target = langLink.getAttribute('lang');
      if (target) setStored(target);
    });
  }

  // Only the German homepage auto-redirects; /en/ and all deep German
  // pages are left alone so a direct/explicit visit always just works.
  var path = window.location.pathname;
  var isGermanHome = path === '/' || path === '/index.html';
  if (!isGermanHome) return;

  var preferred = getStored();
  if (!preferred) {
    var browserLang = (navigator.language || (navigator.languages && navigator.languages[0]) || 'de').toLowerCase();
    preferred = browserLang.indexOf('de') === 0 ? 'de' : 'en';
    setStored(preferred);
  }

  if (preferred === 'en') {
    window.location.replace('/en/');
  }
})();
