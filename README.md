# HTL Sammelkarten – Website

Werbe-Website für die Sammelkarten mit den Lehrpersonen der HTL Dornbirn – ein Maturaprojekt der 5aWI.

Gebaut nach dem Claude-Design „HTL Sammelkarten – Website“ und dem Design-System „HTL Sammelkarten“.

## Aufbau

- `index.html` – die Seite (Navigation, Hero, Kartenliste, Sammlerstapel, Typen, Termine, Fußzeile)
- `css/tokens.css` – Farben, Schriften, Abstände (Design-Tokens)
- `css/bundle.css` – Komponenten: Karten (`sk-…`) und Website (`hw-…`)
- `css/site.css` – seitenspezifische Stile, Stapel-Animation, Mobil-Ansicht
- `js/main.js` – Kartendaten, Kartenliste mit Filter, Stapel, Typen, Mobil-Menü
- `fonts/` – Montserrat und Lato

Neue Karten trägst du in `js/main.js` in `KARTEN` (offene Karten) bzw. `STAPEL` (Holo, Full Art, Spezial) ein.

## Lokal ansehen

Einfach `index.html` im Browser öffnen – kein Build nötig.

## Veröffentlichen

Die Seite ist rein statisch und läuft z. B. auf GitHub Pages (Settings → Pages → Branch `main`, Ordner `/`).
