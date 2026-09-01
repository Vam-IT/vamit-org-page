// Zählt die Tage bis zum Batteriepass-Stichtag. Bewusst serverlos und ohne
// Bibliothek: Das Element trägt das Zieldatum selbst (data-deadline), und ohne
// JavaScript bleibt der Platzhalter stehen, statt eine falsche Zahl zu zeigen.
(function () {
  var el = document.getElementById('deadlineDays');
  if (!el) return;

  var ziel = new Date(el.getAttribute('data-deadline') + 'T00:00:00Z');
  if (isNaN(ziel.getTime())) return;

  var heute = new Date();
  var heuteUtc = Date.UTC(heute.getUTCFullYear(), heute.getUTCMonth(), heute.getUTCDate());
  var tage = Math.round((ziel.getTime() - heuteUtc) / 86400000);

  if (tage > 0) {
    el.textContent = tage.toLocaleString('de-DE');
  } else if (tage === 0) {
    el.textContent = 'heute';
    el.nextElementSibling.textContent = 'ist der Stichtag';
  } else {
    el.textContent = Math.abs(tage).toLocaleString('de-DE');
    el.nextElementSibling.textContent = 'Tage seit dem Stichtag';
  }
})();
