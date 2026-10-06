# itssivvis.github.io

- `/` – berufliche Visitenkarte von Christoph Hofmann
- `/Game/` – Sivvis Sprint (3D-Minispiel)

## Sivvis Sprint

Ein statisches 3D-Minispiel mit Three.js auf GitHub Pages. Drei Spuren, rote Hindernisse, goldene Kristalle und ein stetig schnellerer Lauf.

### Spielen

- Pfeiltasten oder A / D: Spur wechseln.
- Auf dem Handy: horizontal wischen oder die Pfeil-Schaltflächen verwenden.
- P oder Escape: pausieren bzw. fortsetzen. Der Wechsel in einen anderen Tab pausiert automatisch.
- Ein Kristall zählt 25 Punkte; zusätzlich gibt es einen Punkt pro drei Meter.
- Nach einer Kollision kann sofort neu gestartet werden.

Der persönliche Rekord wird nur im lokalen Browser gespeichert. Kein Server, kein Tracking und keine externen Laufzeit-Abhängigkeiten. Die Grafik benötigt einen Browser mit WebGL 2.

### Lokal starten

```sh
python -m http.server 8000
```

Danach http://localhost:8000 (Visitenkarte) bzw. http://localhost:8000/Game/ (Spiel) öffnen. ES-Module erfordern HTTP; die HTML-Datei nicht direkt per Datei-URL öffnen.

### Dateien und Hosting

Das Spiel liegt komplett in `Game/` (`index.html`, `style.css`, `game.js`, `engine.js`). GitHub Pages veröffentlicht das Hauptverzeichnis von `main`; ein Build ist nicht erforderlich. Die Visitenkarte ist `index.html` im Hauptverzeichnis; `/visitenkarte/` und `/game/` leiten auf die neuen Adressen weiter.

Three.js 0.180.0 liegt unter `Game/vendor/`. Die MIT-Lizenz ist in `Game/vendor/LICENSE` enthalten.
