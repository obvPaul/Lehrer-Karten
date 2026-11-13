/* HTL Sammelkarten – Kartenliste, Filter, Stapel und Menü */
(function () {
  'use strict';

  var TYP = { pflanze: 'Pflanze', feuer: 'Feuer', wasser: 'Wasser', elektro: 'Elektro', psycho: 'Psycho', kampf: 'Kampf', finsternis: 'Finsternis', metall: 'Metall', drache: 'Drache', fee: 'Fee', farblos: 'Farblos' };
  var SELTEN = {
    gewoehnlich: { label: 'Gewöhnlich', klasse: 'sk-selten', punkte: 1 },
    ungewoehnlich: { label: 'Ungewöhnlich', klasse: 'sk-selten', punkte: 2 },
    selten: { label: 'Selten', klasse: 'sk-selten', punkte: 3 },
    holo: { label: 'Selten Holo', klasse: 'sk-selten sk-selten--holo', punkte: 3 },
    fullart: { label: 'Full Art', klasse: 'sk-selten sk-selten--spezial', punkte: 2 },
    spezial: { label: 'Spezial', klasse: 'sk-selten sk-selten--spezial', punkte: 1 }
  };

  /* ---------- Daten ---------- */
  function angriff(kosten, name, schaden, text) { return { kosten: kosten, name: name, schaden: schaden, text: text || '' }; }
  function faehigkeit(name, text) { return { faehigkeit: true, name: name, text: text }; }
  function karte(nr, name, typ, kp, info, selten, angriffe, schwaeche, resistenz, rueckzug, flavor) {
    return { nr: nr, name: name, typ: typ, kp: kp, info: 'Nr. ' + nr + ' · ' + info, selten: selten, angriffe: angriffe, schwaeche: schwaeche, resistenz: resistenz, rueckzug: rueckzug, flavor: flavor };
  }
  function geheim(nr, selten, band) { return { nr: nr, geheim: true, selten: selten, band: band }; }

  var KARTEN = [
    karte('003', 'Prof. Musterfrau', 'pflanze', 70, 'Chemie · Labor C1 · seit 2016', 'ungewoehnlich',
      [angriff(['pflanze'], 'Titration', 10, 'Durchsuche dein Deck nach bis zu 2 Basis-Lehrpersonen und lege sie auf deine Bank. Mische anschließend dein Deck.'), angriff(['pflanze', 'farblos'], 'Reagenzglas', 30)],
      'feuer', null, 1, 'Im Labor nie ohne Schutzbrille anzutreffen. Riecht Schwefel schon am Gang.'),
    karte('007', 'Mag. Beispiel', 'wasser', 80, 'Wirtschaft · Raum 1.08 · seit 2014', 'gewoehnlich',
      [angriff(['farblos'], 'Buchungssatz', 10, 'Ziehe 2 Karten.'), angriff(['wasser', 'farblos'], 'Bilanzsumme', 40)],
      'elektro', null, 1, 'Rechnet jede Pausenjause in Soll und Haben um. Hat den Kassabericht vor der Stunde fertig.'),
    karte('012', 'Prof. Mustermann', 'psycho', 90, 'Mathematik · Raum 2.14 · seit 2011', 'gewoehnlich',
      [angriff(['farblos'], 'Stundenwiederholung', 20, 'Wirf 1 Münze. Bei Kopf ist die gegnerische aktive Lehrperson jetzt verwirrt.'), angriff(['psycho', 'psycho', 'farblos'], 'Überraschungstest', 70)],
      'finsternis', 'kampf', 2, 'Erkennt Abschreiben auf zwanzig Meter Entfernung. Rechnet im Kopf schneller, als der Taschenrechner hochfährt.'),
    karte('019', 'Mag. Muster', 'farblos', 60, 'Deutsch · Raum 3.02 · seit 2021', 'gewoehnlich',
      [angriff(['farblos'], 'Erörterung', 10, 'Ziehe 1 Karte.'), angriff(['farblos', 'farblos'], 'Beistrichfehler', 30)],
      'kampf', null, 1, 'Liest auch das Kleingedruckte. Hört einen fehlenden Beistrich durch zwei Türen.'),
    karte('022', 'Dipl.-Ing. Entwurf', 'elektro', 90, 'Informatik · Raum 4.11 · seit 2018', 'selten',
      [angriff(['elektro'], 'Kompilieren', 20, 'Wirf 1 Münze. Bei Kopf richtet dieser Angriff 20 Schadenspunkte mehr an.'), angriff(['elektro', 'elektro', 'farblos'], 'Endlosschleife', 80, 'Diese Lehrperson kann während deines nächsten Zuges nicht angreifen.')],
      'kampf', null, 1, 'Startet den Rechner neu, bevor die Frage fertig gestellt ist. Hat für jede Fehlermeldung eine Anekdote.'),
    karte('027', 'Prof. Probe', 'kampf', 110, 'Bewegung und Sport · Turnsaal · seit 2008', 'gewoehnlich',
      [angriff(['kampf'], 'Zirkeltraining', 30), angriff(['kampf', 'kampf', 'farblos'], 'Cooper-Test', 90, 'Diese Lehrperson kann während deines nächsten Zuges nicht angreifen.')],
      'psycho', null, 3, 'Kennt keine Regenpause. Die Pfeife hört man bis ins Chemielabor.'),
    karte('033', 'Dipl.-Ing. Modell', 'metall', 100, 'Maschinenbau · Raum 0.21 · seit 2013', 'ungewoehnlich',
      [angriff(['metall', 'farblos'], 'Normteil', 40), angriff(['metall', 'metall', 'farblos'], 'Toleranzkette', 80, 'Während des nächsten gegnerischen Zuges wird dieser Lehrperson 20 Schadenspunkte weniger zugefügt.')],
      'feuer', 'pflanze', 2, 'Misst lieber zweimal. Trägt den Messschieber immer in der Brusttasche.')
  ];

  var STAPEL = [
    karte('051', 'Dipl.-Ing. Schablone', 'elektro', 80, 'Informatik · EDV 3 · seit 2019', 'holo',
      [faehigkeit('Neustart', 'Einmal während deines Zuges kannst du 1 Karte von deiner Hand abwerfen und 2 Karten ziehen.'), angriff(['elektro', 'farblos'], 'Kompilierfehler', 50, 'Diese Lehrperson fügt sich selbst 10 Schadenspunkte zu.')],
      'kampf', 'metall', 1, 'Hat für jedes Problem ein Skript. Das WLAN gehorcht nur ihr.'),
    karte('052', 'Mag. Vorlage', 'wasser', 120, 'Betriebswirtschaft · Raum 1.07 · seit 2004', 'holo',
      [angriff(['wasser', 'farblos'], 'Bilanzstichtag', '40+', 'Dieser Angriff fügt für jede Energie an der gegnerischen aktiven Lehrperson 20 Schadenspunkte mehr zu.'), angriff(['wasser', 'wasser', 'farblos'], 'Rotstift', 100, 'Wirf 1 Energie von dieser Lehrperson ab.')],
      'elektro', null, 2, 'Findet jeden fehlenden Cent. Der Rotstift ist gefürchtet.'),
    karte('053', 'Prof. Skizze', 'fee', 90, 'Grafik · Atelier 2 · seit 2015', 'holo',
      [angriff(['fee'], 'Goldener Schnitt', 20, 'Ziehe Karten, bis du 5 Karten auf der Hand hast.'), angriff(['fee', 'fee', 'farblos'], 'Moodboard', 70)],
      'metall', null, 1, 'Erkennt eine schiefe Grundlinie aus jeder Entfernung. Hat immer einen Farbfächer dabei.'),
    karte('054', 'FOL Rohling', 'feuer', 130, 'Werkstätte · Halle W2 · seit 2009', 'holo',
      [angriff(['feuer'], 'Schweißnaht', 30), angriff(['feuer', 'feuer', 'farblos'], 'Härteprüfung', 110, 'Lege 1 Energie dieser Lehrperson ab.')],
      'wasser', null, 3, 'Hört am Klang, ob die Feile stumpf ist.'),
    karte('055', 'Dipl.-Ing. Konzept', 'drache', 140, 'Abteilungsvorstand · Raum 0.01 · seit 2002', 'holo',
      [faehigkeit('Konferenz', 'Einmal während deines Zuges kannst du 1 Lehrperson von deiner Bank mit deiner aktiven Lehrperson tauschen.'), angriff(['drache', 'farblos', 'farblos'], 'Stundenplan', 120, 'Wirf 2 Energien von dieser Lehrperson ab.')],
      'psycho', null, 3, 'Kennt jeden Raum, jede Klasse und jede Ausrede. Unterschreibt schneller, als du fragen kannst.'),
    geheim('056', 'fullart', 'Ab Dezember'),
    geheim('057', 'fullart', 'Ab Dezember'),
    geheim('058', 'fullart', 'Ab Dezember'),
    geheim('059', 'spezial', 'Geheim'),
    geheim('060', 'spezial', 'Geheim')
  ];

  /* ---------- Bausteine ---------- */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  function wiederhole(n, html) { var s = ''; for (var i = 0; i < n; i++) s += html; return s; }
  function typ(t, extra) { return '<span class="sk-typ' + (extra ? ' ' + extra : '') + '" data-typ="' + t + '" aria-hidden="true"></span>'; }
  function seltenZeichen(selten, mitLabel) {
    var s = SELTEN[selten];
    var attr = mitLabel ? ' role="img" aria-label="' + s.label + '"' : ' aria-hidden="true"';
    return '<span class="' + s.klasse + '"' + attr + '>' + wiederhole(s.punkte, '<i></i>') + '</span>';
  }
  function leiste(k, mitFoto) {
    return '<footer class="sk-karte__leiste"><span class="sk-leiste__nr"><span class="sk-leiste__set karte-label">S1</span><span class="karte-wert">' + k.nr + '/060</span>' + seltenZeichen(k.selten) + '</span>' +
      '<p class="sk-leiste__recht karte-legal">' + (mitFoto ? 'Foto: Klasse 5aHWII<br>' : '') + '© 2026 Maturaprojekt · HTL Dornbirn</p></footer>';
  }

  function angriffHtml(a) {
    var zeile;
    if (a.faehigkeit) {
      zeile = '<div class="sk-angriff__zeile"><span class="sk-angriff__marke karte-label">Fähigkeit</span><h4 class="sk-angriff__name karte-angriff">' + esc(a.name) + '</h4></div>';
    } else {
      zeile = '<div class="sk-angriff__zeile"><span class="sk-angriff__kosten" aria-hidden="true">' + a.kosten.map(function (t) { return '<span class="sk-typ" data-typ="' + t + '"></span>'; }).join('') + '</span>' +
        '<h4 class="sk-angriff__name karte-angriff">' + esc(a.name) + '</h4><span class="sk-angriff__schaden karte-schaden">' + esc(a.schaden) + '</span></div>';
    }
    var text = a.text ? '<p class="sk-angriff__text karte-effekt">' + esc(a.text) + '</p>' : '';
    return '<div class="sk-angriff' + (a.faehigkeit ? ' sk-angriff--faehigkeit' : '') + '">' + zeile + text + '</div>';
  }

  function karteHtml(k) {
    var holo = k.selten === 'holo';
    return '<article class="sk-karte' + (holo ? ' sk-karte--holo' : '') + ' sk-karte--s" data-typ="' + k.typ + '" aria-label="' + esc(k.name + ', Typ ' + TYP[k.typ] + ', ' + k.kp + ' KP') + '">' +
      '<div class="sk-karte__feld">' +
        '<header class="sk-kopf"><div class="sk-kopf__titel"><span class="sk-kopf__stufe karte-label">Basis</span><h3 class="sk-kopf__name karte-name">' + esc(k.name) + '</h3></div>' +
        '<span class="sk-kopf__kp"><span class="karte-label">KP</span><span class="karte-kp">' + k.kp + '</span></span>' + typ(k.typ) + '</header>' +
        '<div class="sk-bild sk-bild--platzhalter">' + (holo ? '<span class="sk-holo"></span>' : '') + '</div>' +
        '<p class="sk-info karte-info">' + esc(k.info) + '</p>' +
        '<div class="sk-angriffe">' + k.angriffe.map(angriffHtml).join('') + '</div>' +
        '<div class="sk-werte">' +
          '<div class="sk-werte__zelle"><span class="sk-werte__label karte-label">Schwäche</span>' + typ(k.schwaeche, 'sk-typ--klein') + '<span class="karte-wert">×2</span></div>' +
          '<div class="sk-werte__zelle"><span class="sk-werte__label karte-label">Resistenz</span>' + (k.resistenz ? typ(k.resistenz, 'sk-typ--klein') + '<span class="karte-wert">-30</span>' : '') + '</div>' +
          '<div class="sk-werte__zelle"><span class="sk-werte__label karte-label">Rückzug</span>' + wiederhole(k.rueckzug, typ('farblos', 'sk-typ--klein')) + '</div>' +
        '</div>' +
        '<p class="sk-flavor karte-flavor">' + esc(k.flavor) + '</p>' +
      '</div>' + leiste(k, true) + '</article>';
  }

  function teaserHtml(k) {
    return '<article class="sk-karte sk-karte--teaser sk-karte--s" aria-label="Geheime Karte, noch nicht enthüllt"><div class="sk-karte__feld">' +
      '<header class="sk-kopf"><div class="sk-kopf__titel"><span class="sk-kopf__stufe karte-label">Geheim</span><h3 class="sk-kopf__name karte-name">???</h3></div>' +
      '<span class="sk-kopf__kp"><span class="karte-label">KP</span><span class="karte-kp">??</span></span><span class="sk-typ sk-typ--unbekannt" aria-hidden="true"></span></header>' +
      '<p class="sk-teaser__frage" aria-hidden="true">?</p><p class="sk-teaser__band karte-label">' + esc(k.band) + '</p></div>' + leiste(k, false) + '</article>';
  }

  function rueckHtml(k) {
    return '<article class="sk-karte sk-karte--rueck' + (k.geheim ? ' sk-karte--rueck-spezial' : '') + ' sk-karte--s"><span class="sk-rueck__wort karte-angriff">Sammelkarten</span><span class="sk-rueck__emblem"><span class="htl-logo"></span></span><span class="sk-rueck__wort sk-rueck__wort--unten karte-angriff">Sammelkarten</span></article>';
  }

  /* ---------- Kartenliste mit Filter ---------- */
  var FILTER = [
    { id: 'alle', label: 'Alle', punkte: 0 },
    { id: 'gewoehnlich', label: 'Gewöhnlich', punkte: 1 },
    { id: 'ungewoehnlich', label: 'Ungewöhnlich', punkte: 2 },
    { id: 'selten', label: 'Selten', punkte: 3 }
  ];
  var raster = document.getElementById('raster');
  var filterBox = document.getElementById('filter');

  function zeigeListe(filter) {
    raster.innerHTML = KARTEN.filter(function (k) { return filter === 'alle' || k.selten === filter; }).map(function (k) {
      return '<figure class="hw-kachel">' + karteHtml(k) +
        '<figcaption class="hw-kachel__zeile"><span class="hw-kachel__nr text-label">' + k.nr + '</span><span class="hw-kachel__name text-nav">' + esc(k.name) + '</span>' +
        '<span class="sk-typ" data-typ="' + k.typ + '" role="img" aria-label="Typ ' + TYP[k.typ] + '"></span>' + seltenZeichen(k.selten, true) + '</figcaption></figure>';
    }).join('');
    Array.prototype.forEach.call(filterBox.children, function (b) { b.setAttribute('aria-pressed', String(b.dataset.filter === filter)); });
  }

  filterBox.innerHTML = FILTER.map(function (f) {
    return '<button class="hw-chip text-nav" type="button" data-filter="' + f.id + '" aria-pressed="false">' + f.label +
      (f.punkte ? ' <span class="sk-selten" aria-hidden="true">' + wiederhole(f.punkte, '<i></i>') + '</span>' : '') + '</button>';
  }).join('');
  filterBox.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-filter]');
    if (b) zeigeListe(b.dataset.filter);
  });
  zeigeListe('alle');

  /* ---------- Stapel ---------- */
  var stapel = document.getElementById('stapel');
  var stapelKnopf = stapel.querySelector('.stapel-knopf');
  var stapelFuss = document.getElementById('stapel-fuss');
  stapel.insertAdjacentHTML('afterbegin', STAPEL.map(function (k, i) {
    return '<div class="flip" data-i="' + i + '"><div class="flip__innen">' +
      '<div class="flip__seite">' + (k.geheim ? teaserHtml(k) : karteHtml(k)) + '</div>' +
      '<div class="flip__seite flip__seite--rueck" aria-hidden="true">' + rueckHtml(k) + '</div></div></div>';
  }).join(''));

  function setzeStapel(offen) {
    stapel.classList.toggle('ist-offen', offen);
    stapelKnopf.setAttribute('aria-expanded', String(offen));
    stapelFuss.hidden = !offen;
  }
  stapelKnopf.addEventListener('click', function () { setzeStapel(true); });
  document.getElementById('stapel-zu').addEventListener('click', function () { setzeStapel(false); stapelKnopf.focus(); });

  /* ---------- Typen ---------- */
  document.getElementById('typen-raster').innerHTML = Object.keys(TYP).map(function (t) {
    return '<div class="typ-eintrag"><span class="sk-typ sk-typ--xl" data-typ="' + t + '" role="img" aria-label="Typ ' + TYP[t] + '"></span><p class="text-untertitel">' + TYP[t] + '</p></div>';
  }).join('');

  /* ---------- Menü (mobil) ---------- */
  var nav = document.querySelector('.hw-nav');
  var menuKnopf = nav.querySelector('.menu-knopf');
  function setzeMenu(offen) {
    nav.classList.toggle('ist-offen', offen);
    menuKnopf.setAttribute('aria-expanded', String(offen));
    menuKnopf.setAttribute('aria-label', offen ? 'Menü schließen' : 'Menü öffnen');
  }
  menuKnopf.addEventListener('click', function () { setzeMenu(!nav.classList.contains('ist-offen')); });
  nav.querySelector('.menu-liste').addEventListener('click', function (e) { if (e.target.closest('a')) setzeMenu(false); });

  /* ---------- Aktiver Navigationspunkt ---------- */
  var links = nav.querySelectorAll('.hw-nav__link');
  if ('IntersectionObserver' in window) {
    var beob = new IntersectionObserver(function (eintraege) {
      eintraege.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (l) {
          if (l.getAttribute('href') === '#' + e.target.id) l.setAttribute('aria-current', 'page'); else l.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['start', 'kartenliste', 'typen', 'termine'].forEach(function (id) { var el = document.getElementById(id); if (el) beob.observe(el); });
  }
})();
