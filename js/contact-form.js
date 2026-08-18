// Static site with no backend (GitHub Pages), so the contact form can't
// POST anywhere. Instead it builds a mailto: link from the entered fields
// and navigates to it, which opens the visitor's own mail client prefilled
// -- same delivery channel the rest of the site already relies on.
(function () {
  var form = document.getElementById('contactForm');
  if (!form) return;

  function buildMailtoUrl(name, company, message) {
    var subject = 'Anfrage von ' + name;
    var bodyLines = ['Name: ' + name];
    if (company) bodyLines.push('Firma: ' + company);
    bodyLines.push('', message);

    return 'mailto:info@vam-it.com' +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(bodyLines.join('\n'));
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    var name = form.name.value.trim();
    var company = form.company.value.trim();
    var message = form.message.value.trim();

    window.location.href = buildMailtoUrl(name, company, message);
  });
})();
