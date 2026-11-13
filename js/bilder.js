/* HTL Sammelkarten – Kartenbilder laden und im Bearbeitungsmodus austauschen
 *
 * Jedes Bildfeld trägt die Kartennummer (data-nr="003"). Liegt im Ordner
 * bilder/ eine Datei mit dieser Nummer (bilder/003.jpg), wird sie angezeigt.
 *
 * Im Bearbeitungsmodus (index.html#bearbeiten) kann man jedes Bild anklicken,
 * ein eigenes Foto hochladen und den Ausschnitt wählen. Das Ergebnis wird in
 * diesem Browser gespeichert und kann als fertige Datei (003.jpg)
 * heruntergeladen werden. Damit es alle Besucher sehen, die Datei in den
 * Ordner bilder/ legen und pushen.
 */
(function () {
  'use strict';

  var ORDNER = 'bilder/';
  var BREITE = 1080, HOEHE = 600;          /* Seitenverhältnis des Bildfelds auf der Karte */
  var DB_NAME = 'sk-bilder', DB_STORE = 'bilder';

  var server = {};   /* nr -> URL der Datei in bilder/ (falls vorhanden) */
  var lokal = {};    /* nr -> Object-URL des im Browser gespeicherten Bildes */
  var lokalBlob = {};
  var geprueft = {};
  var bearbeiten = false;

  /* ---------- Speicher im Browser (IndexedDB) ---------- */
  var dbVersprechen = null;
  function db() {
    if (!dbVersprechen) {
      dbVersprechen = new Promise(function (ok, fehler) {
        try {
          var r = indexedDB.open(DB_NAME, 1);
          r.onupgradeneeded = function () { r.result.createObjectStore(DB_STORE); };
          r.onsuccess = function () { ok(r.result); };
          r.onerror = function () { fehler(r.error); };
        } catch (e) { fehler(e); }
      });
    }
    return dbVersprechen;
  }
  function speichere(nr, blob) {
    return db().then(function (d) {
      return new Promise(function (ok, fehler) {
        var t = d.transaction(DB_STORE, 'readwrite');
        if (blob) t.objectStore(DB_STORE).put(blob, nr); else t.objectStore(DB_STORE).delete(nr);
        t.oncomplete = function () { ok(); };
        t.onerror = function () { fehler(t.error); };
      });
    });
  }
  function ladeLokal() {
    return db().then(function (d) {
      return new Promise(function (ok) {
        var t = d.transaction(DB_STORE, 'readonly');
        var r = t.objectStore(DB_STORE).openCursor();
        r.onsuccess = function () {
          var c = r.result;
          if (!c) { ok(); return; }
          setzeLokal(String(c.key), c.value);
          c.continue();
        };
        r.onerror = function () { ok(); };
      });
    }).catch(function () { /* Kein Speicher verfügbar (z. B. privates Fenster) */ });
  }
  function setzeLokal(nr, blob) {
    if (lokal[nr]) URL.revokeObjectURL(lokal[nr]);
    if (blob) { lokal[nr] = URL.createObjectURL(blob); lokalBlob[nr] = blob; }
    else { delete lokal[nr]; delete lokalBlob[nr]; }
  }

  /* ---------- Anzeige ---------- */
  function felder(nr) { return document.querySelectorAll('.sk-bild[data-nr="' + nr + '"]'); }

  function zeige(nr) {
    var url = lokal[nr] || server[nr];
    Array.prototype.forEach.call(felder(nr), function (f) {
      var img = f.querySelector('img.sk-bild__foto');
      if (url) {
        if (!img) {
          img = document.createElement('img');
          img.className = 'sk-bild__foto';
          img.alt = '';
          f.insertBefore(img, f.firstChild);
        }
        if (img.getAttribute('src') !== url) img.src = url;
        f.classList.remove('sk-bild--platzhalter');
      } else {
        if (img) img.remove();
        f.classList.add('sk-bild--platzhalter');
      }
      f.classList.toggle('ist-lokal', !!lokal[nr]);
      if (bearbeiten && !f.querySelector('.bild-marke')) {
        f.insertAdjacentHTML('beforeend', '<span class="bild-marke text-label">Bild ändern</span>');
      }
    });
  }

  function pruefeServer(nr) {
    if (geprueft[nr]) return;
    geprueft[nr] = true;
    var test = new Image();
    test.onload = function () { server[nr] = test.src; zeige(nr); };
    test.src = ORDNER + nr + '.jpg';
  }

  function ansetzen(wurzel) {
    var liste = wurzel.matches && wurzel.matches('.sk-bild[data-nr]') ? [wurzel] : wurzel.querySelectorAll ? wurzel.querySelectorAll('.sk-bild[data-nr]') : [];
    Array.prototype.forEach.call(liste, function (f) { pruefeServer(f.dataset.nr); zeige(f.dataset.nr); });
  }

  /* Kartenliste wird beim Filtern neu gebaut – neue Bildfelder sofort befüllen */
  new MutationObserver(function (aenderungen) {
    aenderungen.forEach(function (a) {
      Array.prototype.forEach.call(a.addedNodes, function (n) { if (n.nodeType === 1 && !n.classList.contains('bild-marke') && !n.classList.contains('sk-bild__foto')) ansetzen(n); });
    });
  }).observe(document.body, { childList: true, subtree: true });

  ansetzen(document);
  ladeLokal().then(function () { Object.keys(lokal).forEach(zeige); aktualisiereLeiste(); });

  /* ---------- Bearbeitungsmodus ---------- */
  document.body.insertAdjacentHTML('beforeend',
    '<div class="bild-leiste" id="bild-leiste" hidden>' +
      '<div class="bild-leiste__text"><p class="text-nav"><strong>Bilder bearbeiten</strong> – tippe auf ein Kartenbild, um es zu ändern.</p>' +
      '<p class="text-klein" id="bild-status"></p></div>' +
      '<div class="bild-leiste__knoepfe">' +
        '<button class="hw-button hw-button--kompakt hw-button--hell text-button" type="button" id="bild-alle">Alle herunterladen</button>' +
        '<button class="hw-button hw-button--kompakt hw-button--voll text-button" type="button" id="bild-fertig">Fertig</button>' +
      '</div>' +
    '</div>' +
    '<dialog class="bild-dialog" id="bild-dialog" aria-labelledby="bild-titel">' +
      '<form method="dialog" class="bild-dialog__form">' +
        '<p class="text-label bild-dialog__nr" id="bild-nr"></p>' +
        '<h2 class="text-untertitel" id="bild-titel"></h2>' +
        '<div class="bild-buehne" id="bild-buehne"><canvas id="bild-canvas" width="' + BREITE + '" height="' + HOEHE + '"></canvas>' +
          '<p class="bild-buehne__leer text-klein" id="bild-leer">Noch kein Bild – wähle ein Foto aus.</p></div>' +
        '<label class="bild-zoom text-klein" id="bild-zoom-zeile">Zoom <input type="range" id="bild-zoom" min="1" max="4" step="0.01" value="1"></label>' +
        '<p class="text-klein bild-hinweis" id="bild-hinweis">Ziehe das Bild, um den Ausschnitt zu verschieben.</p>' +
        '<input type="file" id="bild-datei" accept="image/*" hidden>' +
        '<div class="bild-dialog__knoepfe">' +
          '<button class="hw-button hw-button--kompakt text-button" type="button" id="bild-waehlen">Foto wählen</button>' +
          '<button class="hw-button hw-button--kompakt text-button" type="button" id="bild-laden">Herunterladen</button>' +
          '<button class="hw-button hw-button--kompakt text-button" type="button" id="bild-zurueck">Entfernen</button>' +
          '<span class="bild-dialog__luecke"></span>' +
          '<button class="hw-button hw-button--kompakt text-button" value="abbrechen">Abbrechen</button>' +
          '<button class="hw-button hw-button--kompakt hw-button--voll text-button" type="button" id="bild-ok">Übernehmen</button>' +
        '</div>' +
      '</form>' +
    '</dialog>');

  var leiste = document.getElementById('bild-leiste');
  var status = document.getElementById('bild-status');
  var dialog = document.getElementById('bild-dialog');
  var canvas = document.getElementById('bild-canvas');
  var ctx = canvas.getContext('2d');
  var zoomFeld = document.getElementById('bild-zoom');
  var datei = document.getElementById('bild-datei');
  var knopfOk = document.getElementById('bild-ok');
  var knopfLaden = document.getElementById('bild-laden');
  var knopfZurueck = document.getElementById('bild-zurueck');

  function aktualisiereLeiste() {
    var n = Object.keys(lokal).length;
    status.textContent = n === 0
      ? 'Noch keine Bilder geändert.'
      : n + (n === 1 ? ' Bild ist' : ' Bilder sind') + ' nur in diesem Browser gespeichert. Herunterladen, in den Ordner „bilder/“ legen und pushen – dann sehen es alle.';
    document.getElementById('bild-alle').disabled = n === 0;
  }

  function setzeBearbeiten(an) {
    bearbeiten = an;
    document.body.classList.toggle('ist-bearbeiten', an);
    leiste.hidden = !an;
    if (an) {
      Array.prototype.forEach.call(document.querySelectorAll('.sk-bild[data-nr]'), function (f) { zeige(f.dataset.nr); });
      aktualisiereLeiste();
    } else {
      Array.prototype.forEach.call(document.querySelectorAll('.bild-marke'), function (m) { m.remove(); });
    }
  }
  function pruefeAdresse() { setzeBearbeiten(location.hash === '#bearbeiten' || /[?&]bearbeiten\b/.test(location.search)); }
  window.addEventListener('hashchange', pruefeAdresse);
  pruefeAdresse();
  if (bearbeiten && location.hash === '#bearbeiten') window.scrollTo(0, 0);

  document.getElementById('bild-fertig').addEventListener('click', function () {
    history.replaceState(null, '', location.pathname + location.search.replace(/[?&]bearbeiten\b/, ''));
    setzeBearbeiten(false);
  });

  function herunterladen(nr) {
    var a = document.createElement('a');
    a.href = lokal[nr];
    a.download = nr + '.jpg';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  document.getElementById('bild-alle').addEventListener('click', function () {
    Object.keys(lokal).sort().forEach(function (nr, i) { setTimeout(function () { herunterladen(nr); }, i * 400); });
  });

  /* ---------- Dialog mit Ausschnitt ---------- */
  var aktuell = null;    /* Kartennummer */
  var bild = null;       /* geladenes Bild (HTMLImageElement) */
  var neu = false;       /* wurde ein neues Foto gewählt? */
  var zoom = 1, px = 0, py = 0;

  function grenzen() {
    var s = Math.max(BREITE / bild.width, HOEHE / bild.height) * zoom;
    var w = bild.width * s, h = bild.height * s;
    var mx = (w - BREITE) / 2, my = (h - HOEHE) / 2;
    px = Math.max(-mx, Math.min(mx, px));
    py = Math.max(-my, Math.min(my, py));
    return { w: w, h: h };
  }
  function zeichne() {
    ctx.clearRect(0, 0, BREITE, HOEHE);
    var hatBild = !!bild;
    document.getElementById('bild-leer').hidden = hatBild;
    canvas.style.visibility = hatBild ? 'visible' : 'hidden';
    document.getElementById('bild-zoom-zeile').hidden = !neu;
    document.getElementById('bild-hinweis').hidden = !neu;
    knopfOk.disabled = !neu;
    knopfLaden.hidden = !lokal[aktuell];
    knopfZurueck.hidden = !lokal[aktuell];
    if (!hatBild) return;
    var g = grenzen();
    ctx.drawImage(bild, BREITE / 2 - g.w / 2 + px, HOEHE / 2 - g.h / 2 + py, g.w, g.h);
  }
  function ladeBild(url, alsNeu) {
    var i = new Image();
    i.onload = function () { bild = i; neu = alsNeu; zoom = 1; px = 0; py = 0; zoomFeld.value = '1'; zeichne(); };
    i.onerror = function () { if (alsNeu) alert('Dieses Bild konnte nicht geöffnet werden. Bitte ein JPG oder PNG wählen.'); };
    i.src = url;
  }

  function oeffne(feld) {
    aktuell = feld.dataset.nr;
    var karte = feld.closest('.sk-karte');
    var name = karte && karte.querySelector('.sk-kopf__name');
    document.getElementById('bild-nr').textContent = 'Karte ' + aktuell + '/060';
    document.getElementById('bild-titel').textContent = name ? name.textContent : 'Kartenbild';
    bild = null; neu = false;
    zeichne();
    var vorhanden = lokal[aktuell] || server[aktuell];
    if (vorhanden) ladeBild(vorhanden, false);
    dialog.showModal();
  }

  document.addEventListener('click', function (e) {
    if (!bearbeiten) return;
    var feld = e.target.closest('.sk-bild[data-nr]');
    if (!feld) return;
    e.preventDefault();
    e.stopPropagation();
    oeffne(feld);
  }, true);

  document.getElementById('bild-waehlen').addEventListener('click', function () { datei.value = ''; datei.click(); });
  datei.addEventListener('change', function () {
    var f = datei.files && datei.files[0];
    if (f) ladeBild(URL.createObjectURL(f), true);
  });
  zoomFeld.addEventListener('input', function () { zoom = parseFloat(zoomFeld.value); zeichne(); });

  /* Ausschnitt verschieben (Maus und Finger) */
  var zug = null;
  canvas.addEventListener('pointerdown', function (e) {
    if (!neu) return;
    zug = { x: e.clientX, y: e.clientY, px: px, py: py };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', function (e) {
    if (!zug) return;
    var f = BREITE / canvas.clientWidth;
    px = zug.px + (e.clientX - zug.x) * f;
    py = zug.py + (e.clientY - zug.y) * f;
    zeichne();
  });
  function zugEnde() { zug = null; }
  canvas.addEventListener('pointerup', zugEnde);
  canvas.addEventListener('pointercancel', zugEnde);
  canvas.addEventListener('wheel', function (e) {
    if (!neu) return;
    e.preventDefault();
    zoom = Math.max(1, Math.min(4, zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08)));
    zoomFeld.value = String(zoom);
    zeichne();
  }, { passive: false });

  knopfOk.addEventListener('click', function () {
    if (!neu || !bild) return;
    var nr = aktuell;
    canvas.toBlob(function (blob) {
      setzeLokal(nr, blob);
      zeige(nr);
      aktualisiereLeiste();
      speichere(nr, blob).catch(function () {
        status.textContent = 'Achtung: Der Browser erlaubt kein Speichern – das Bild bleibt nur bis zum Neuladen. Lade es jetzt herunter.';
      });
      dialog.close();
    }, 'image/jpeg', 0.88);
  });
  knopfLaden.addEventListener('click', function () { if (lokal[aktuell]) herunterladen(aktuell); });
  knopfZurueck.addEventListener('click', function () {
    var nr = aktuell;
    setzeLokal(nr, null);
    speichere(nr, null).catch(function () {});
    zeige(nr);
    aktualisiereLeiste();
    dialog.close();
  });
})();
