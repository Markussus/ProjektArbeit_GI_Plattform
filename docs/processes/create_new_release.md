## Neuen Release erstellen (Offline-Bundle)

Die Plattform kann als eigenständiges, offline lauffähiges ZIP-Paket für den Einsatz ohne Internet bereitgestellt werden:

### 1. Release bauen
Im Ordner `app/` ausführen:
```bash
npm run release
```

### 2. Was das Skript macht (`deployment/create-release.mjs`):
1. Führt `npm run build` aus (inklusive Java-WASM-Kompilierung nach `app/dist`).
2. Packt den Build zusammen mit dem Python-Offline-Server (`serve.py`) und den 1-Klick-Startern (`start.cmd`, `start.sh`).
3. Erzeugt ein datiertes/getagtes ZIP-Archiv unter `deployment/releases/`.

### 3. Release lokal testen
Das erzeugte Release oder der Ordner `deployment/` kann direkt offline getestet werden:
* **Windows:** Doppelklick auf `deployment/start.cmd`
* **Linux/macOS:** `./deployment/start.sh`
* **Manuell per Python:** `python deployment/serve.py` (öffnet `http://localhost:8000`)
