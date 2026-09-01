// Betroffenheits-Check zum digitalen Produktpass: läuft vollständig im Browser.
//
// Bewusste Entscheidung: Es werden keine Antworten an einen Server geschickt und keine
// E-Mail-Adresse verlangt, bevor das Ergebnis erscheint. Der Besucher soll zuerst etwas
// bekommen; das Kontaktangebot steht danach und ist freiwillig.
(function () {
  var form = document.getElementById('checkForm');
  var result = document.getElementById('checkResult');
  if (!form || !result) return;

  function wert(name) {
    var el = form.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : null;
  }

  function track(event, props) {
    try {
      if (window.posthog && typeof posthog.capture === 'function' &&
          window.vamitConsent && window.vamitConsent.isGranted()) {
        posthog.capture(event, props || {});
      }
    } catch (e) { /* Analytik darf die Seite nie stören */ }
  }

  // Produktgruppen nach ESPR-Arbeitsplan 2025-2030. Die Termine der ESPR-Gruppen sind
  // Planungsstand; feststehend ist allein der Batterie-Stichtag aus VO (EU) 2023/1542.
  var GRUPPEN = {
    batterie:   { name: 'Batterien',              rechtsakt: 'eigene Verordnung (EU) 2023/1542', ab: '18. Februar 2027', fest: true },
    stahl:      { name: 'Eisen und Stahl',        rechtsakt: '2026', ab: 'voraussichtlich 2028', fest: false },
    textilien:  { name: 'Textilien und Bekleidung', rechtsakt: '2027', ab: 'voraussichtlich 2029', fest: false },
    reifen:     { name: 'Reifen',                 rechtsakt: '2027', ab: 'voraussichtlich 2029', fest: false },
    aluminium:  { name: 'Aluminium',              rechtsakt: '2027', ab: 'voraussichtlich 2029', fest: false },
    moebel:     { name: 'Möbel',                  rechtsakt: '2028', ab: 'voraussichtlich 2030', fest: false },
    matratzen:  { name: 'Matratzen',              rechtsakt: '2029', ab: 'voraussichtlich 2031', fest: false },
    verpackung: { name: 'Verpackungen',           rechtsakt: 'PPWR (EU) 2025/40', ab: 'bereits anwendbar', fest: true, ppwr: true },
    andere:     { name: 'eine andere Produktgruppe', rechtsakt: 'noch nicht im Arbeitsplan', ab: 'offen', fest: false, offen: true }
  };

  // Zwei Formen je Art: die Nennform für den Kontext und der Plural für Fließtext.
  // Kleinschreibung per toLowerCase() wäre hier falsch — im Deutschen werden
  // Substantive großgeschrieben.
  var BATTERIEARTEN = {
    ev:        { name: 'Traktionsbatterie für Elektrofahrzeuge', plural: 'Traktionsbatterien' },
    lmt:       { name: 'Batterie für leichte Verkehrsmittel',    plural: 'Batterien für leichte Verkehrsmittel' },
    industrie: { name: 'Industriebatterie',                      plural: 'Industriebatterien' },
    geraet:    { name: 'Gerätebatterie',                         plural: 'Gerätebatterien' }
  };

  var ROLLEN = {
    hersteller:        'Hersteller',
    importeur:         'Importeur',
    bevollmaechtigter: 'Bevollmächtigter',
    zulieferer:        'Zulieferer',
    haendler:          'Händler'
  };

  function traegtVerantwortung(rolle) {
    return rolle === 'hersteller' || rolle === 'importeur' || rolle === 'bevollmaechtigter';
  }

  // Passpflicht für Batterien nach Art. 77 VO (EU) 2023/1542
  function batteriePasspflichtig(art, kapazitaet) {
    if (art === 'ev' || art === 'lmt') return true;
    if (art === 'industrie') return kapazitaet === 'gt2';
    return false;
  }

  function liste(eintraege) {
    return '<ul class="check-list">' + eintraege.map(function (e) {
      return '<li>' + e + '</li>';
    }).join('') + '</ul>';
  }

  function datenHinweis(daten, dringend) {
    if (daten === 'ja') {
      return '<p class="check-hint"><strong>Gute Ausgangslage.</strong> Wenn Material-, Rezyklat- ' +
        'und CO₂-Angaben bereits belastbar vorliegen, ist der aufwendigste Teil erledigt. Es ' +
        'bleibt die technische Umsetzung: Identifikatoren, Datenträger, Zugriffsebenen und die ' +
        'Registrierung.</p>';
    }
    return '<p class="check-hint"><strong>Ihr wahrscheinlicher Engpass.</strong> Sie haben ' +
      'angegeben, dass die geforderten Material- und Umweltangaben ' +
      (daten === 'nein' ? 'noch nicht vorliegen' : 'nur teilweise vorliegen') +
      '. Das ist der Normalfall — und der längste Weg, weil diese Werte von Ihren Zulieferern ' +
      'kommen müssen. Zwischen der ersten Anfrage und einem belastbaren Wert vergehen ' +
      'erfahrungsgemäß Monate. ' +
      (dringend
        ? 'Bei dem Termin, den Sie vor sich haben, ist das der Schritt, der jetzt anfangen muss.'
        : 'Auch wenn Ihr Termin noch entfernt wirkt: Dieser Schritt bestimmt die Gesamtdauer, ' +
          'nicht die Softwareauswahl.') +
      '</p>';
  }

  function ergebnisBatterie(art, kapazitaet, rolle, daten) {
    var pflicht = batteriePasspflichtig(art, kapazitaet);
    var html = '';

    if (!pflicht) {
      html += '<p class="check-verdict check-verdict--neutral">Für ' + BATTERIEARTEN[art].plural +
        ' besteht <strong>keine Batteriepass-Pflicht</strong>.</p>';
      html += '<p>Die Passpflicht nach Artikel 77 trifft Traktionsbatterien, Batterien für leichte ' +
        'Verkehrsmittel und Industriebatterien über 2&nbsp;kWh. Andere Pflichten der ' +
        'Batterieverordnung — Kennzeichnung, Rücknahme, Sorgfaltspflichten — können dennoch gelten.</p>';
      if (art === 'industrie') {
        html += '<p><strong>Achtung bei Varianten:</strong> Sobald eine Variante 2&nbsp;kWh ' +
          'überschreitet, ist diese Variante passpflichtig. Die Prüfung gehört je Produktlinie ' +
          'gemacht, nicht je Unternehmen.</p>';
      }
      return html;
    }

    if (!traegtVerantwortung(rolle)) {
      html += '<p class="check-verdict check-verdict--indirect">Sie sind <strong>indirekt betroffen</strong>.</p>';
      html += '<p>Als ' + ROLLEN[rolle] + ' tragen Sie die Passpflicht nicht selbst — verantwortlich ' +
        'ist, wer die Batterie in der EU in Verkehr bringt. Praktisch brauchen Ihre Kunden ab dem ' +
        '18.&nbsp;Februar 2027 aber Daten von Ihnen.</p>';
      html += liste([
        'Angaben zu Materialzusammensetzung und kritischen Rohstoffen',
        'Nachweise über Rezyklatanteile für Kobalt, Lithium und Nickel',
        'CO₂-Daten Ihrer Vorkette',
        'Sicherheitsdatenblätter und Zertifikate in strukturierter Form'
      ]);
      html += '<p>Wer das vorbereitet hat, wird bevorzugter Lieferant — wer nicht liefern kann, ' +
        'fällt aus der Kette.</p>';
      return html;
    }

    html += '<p class="check-verdict check-verdict--affected">Sie sind <strong>passpflichtig</strong> — ' +
      'ab dem 18.&nbsp;Februar 2027.</p>';
    html += '<p>Als ' + ROLLEN[rolle] + ' bringen Sie ' + BATTERIEARTEN[art].plural +
      (art === 'industrie' ? ' mit mehr als 2&nbsp;kWh' : '') +
      ' in der EU in Verkehr. Damit sind Sie der verantwortliche Wirtschaftsakteur — und Batterien ' +
      'sind die einzige Produktgruppe mit bereits feststehendem Termin.</p>';
    html += liste([
      'Digitaler Pass mit eindeutigem Identifikator und Datenträger am Produkt',
      'Sechs Datenkategorien nach Anhang XIII, getrennt nach Zugriffsebenen',
      'Registrierung in der EU-DPP-Registry vor dem Inverkehrbringen',
      'CO₂-Fußabdruck-Erklärung und Erklärung zu den Sorgfaltspflichten',
      'Verfügbarkeit über die Produktlebensdauer, unabhängig vom Fortbestand des Herausgebers'
    ]);
    html += datenHinweis(daten, true);
    html += '<p><a class="app-link" href="batteriepass.html">Details zum Batteriepass ↗</a></p>';
    return html;
  }

  function ergebnisEspr(gruppe, rolle, daten) {
    var g = GRUPPEN[gruppe];
    var html = '';

    if (g.ppwr) {
      html += '<p class="check-verdict check-verdict--affected">Für Verpackungen gilt ein ' +
        '<strong>eigener Rechtsrahmen</strong> — die PPWR.</p>';
      html += '<p>Die Verpackungsverordnung (EU) 2025/40 steht neben der Ökodesign-Verordnung und ' +
        'ist bereits anwendbar. Sie verlangt Konformitätserklärungen, technische Dossiers sowie ' +
        'Rezyklat- und Stoffnachweise — inhaltlich verwandt mit dem Produktpass, aber ein eigener ' +
        'Pflichtenkatalog. Wer beides betrifft, sollte die Datenerhebung zusammenlegen statt ' +
        'dieselben Zulieferer zweimal zu fragen.</p>';
      html += datenHinweis(daten, true);
      return html;
    }

    if (g.offen) {
      html += '<p class="check-verdict check-verdict--neutral">Ihre Produktgruppe steht ' +
        '<strong>noch nicht im Arbeitsplan</strong>.</p>';
      html += '<p>Der ESPR-Arbeitsplan 2025–2030 nennt zunächst Eisen und Stahl, Textilien, Reifen, ' +
        'Aluminium, Möbel und Matratzen. Die Verordnung ist aber als Rahmen für praktisch alle ' +
        'Produktgruppen angelegt — weitere folgen in späteren Arbeitsplänen. Eine Betroffenheit ' +
        'ist damit eine Frage des Wann, nicht des Ob.</p>';
      html += '<p><strong>Was sich trotzdem jetzt lohnt:</strong> Prüfen, ob Sie über CSRD, ' +
        'Lieferkettenpflichten oder die Verpackungsverordnung ohnehin Material- und Herkunftsdaten ' +
        'erheben. Diese Datenbasis ist zu großen Teilen dieselbe.</p>';
      return html;
    }

    if (!traegtVerantwortung(rolle)) {
      html += '<p class="check-verdict check-verdict--indirect">Sie sind <strong>indirekt betroffen</strong>.</p>';
      html += '<p>Als ' + ROLLEN[rolle] + ' tragen Sie die Passpflicht für ' + g.name +
        ' nicht selbst. Ihre Kunden werden die geforderten Angaben aber bei Ihnen anfragen — ' +
        'voraussichtlich ab ' + g.ab.replace('voraussichtlich ', '') + ', mit Vorlauf davor.</p>';
      html += '<p>Wer die Daten dann strukturiert liefern kann, wird bevorzugter Lieferant. ' +
        'Das ist die Breitenwirkung der Verordnung: Sie erreicht auch Unternehmen, die selbst ' +
        'nie einen Pass ausstellen.</p>';
      return html;
    }

    html += '<p class="check-verdict check-verdict--affected">Sie werden ' +
      '<strong>passpflichtig</strong> — ' + g.ab + '.</p>';
    html += '<p>Für ' + g.name + ' ist der delegierte Rechtsakt für ' + g.rechtsakt +
      ' vorgesehen; die Passpflicht greift erfahrungsgemäß rund zwei Jahre später. Als ' +
      ROLLEN[rolle] + ' sind Sie dann der verantwortliche Wirtschaftsakteur.</p>';
    html += '<p><strong>Wichtige Einschränkung:</strong> Die konkreten Pflichtfelder Ihrer ' +
      'Produktgruppe stehen erst mit dem Rechtsakt fest. Was jetzt schon feststeht, ist die ' +
      'Struktur — eindeutiger Identifikator, Datenträger am Produkt, Zugriffsebenen, ' +
      'Registrierung in der EU-Registry und die Pflicht, den Pass über die Lebensdauer ' +
      'verfügbar zu halten.</p>';
    html += datenHinweis(daten, false);
    return html;
  }

  form.addEventListener('change', function () {
    var istBatterie = wert('gruppe') === 'batterie';
    var artBlock = document.getElementById('artBlock');
    var kapBlock = document.getElementById('kapazitaetBlock');
    if (artBlock) artBlock.hidden = !istBatterie;
    if (kapBlock) kapBlock.hidden = !(istBatterie && wert('art') === 'industrie');
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var gruppe = wert('gruppe');
    var rolle = wert('rolle');
    var daten = wert('daten');
    var art = wert('art');
    var kapazitaet = wert('kapazitaet') || 'unbekannt';

    var fehlt = !gruppe || !rolle || !daten || (gruppe === 'batterie' && !art);
    if (fehlt) {
      result.hidden = false;
      document.getElementById('checkOutcome').innerHTML =
        '<p class="check-verdict check-verdict--neutral">Bitte beantworten Sie alle Fragen.</p>';
      result.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    var html = (gruppe === 'batterie')
      ? ergebnisBatterie(art, kapazitaet, rolle, daten)
      : ergebnisEspr(gruppe, rolle, daten);

    document.getElementById('checkOutcome').innerHTML = html;
    result.hidden = false;
    result.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Keine personenbezogenen Daten, nur die Einstufung selbst.
    track('produktpass_check_completed', {
      gruppe: gruppe, art: art, kapazitaet: kapazitaet, rolle: rolle, datenlage: daten
    });

    var kontext = document.getElementById('checkKontext');
    if (kontext) {
      kontext.value = 'Produktgruppe: ' + GRUPPEN[gruppe].name +
        (art ? ' (' + BATTERIEARTEN[art].name + ')' : '') +
        (gruppe === 'batterie' && art === 'industrie'
          ? ', Kapazität ' + (kapazitaet === 'gt2' ? '> 2 kWh' : '≤ 2 kWh') : '') +
        ' · Rolle: ' + ROLLEN[rolle] + ' · Datenlage: ' + daten;
    }
  });
})();
