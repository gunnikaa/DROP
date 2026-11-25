# Windows and VS Code setup

## Requirements

- Windows 10 or 11
- JDK 17 or newer (`java -version`, `javac -version`)
- Node.js 20.19+ or 22.12+ (`node --version`, `npm --version`; Vite 8 requirement)
- VS Code (optional, but useful for editing)

## Start DROP

1. Extract the ZIP to a normal writable folder.
2. In VS Code, choose **File → Open Folder** and select `java-app-drop-main`.
3. Run `run-drop-windows.bat` from the integrated terminal.
4. The script compiles the Core Java server and installs frontend dependencies on the first run. It opens the Java API in a separate window and runs Vite in the terminal.
5. Open the local address printed by Vite (usually `http://localhost:5173`). The API is at `http://localhost:8091`.

## Enable Geoapify place search (recommended)

1. Create a free key at [Geoapify MyProjects](https://myprojects.geoapify.com/). The current free plan provides 3,000 daily credits and requires Geoapify and OpenStreetMap attribution.
2. In the VS Code PowerShell terminal, enter the key into the current terminal session, then start DROP:

   ```powershell
   $env:DROP_GEOAPIFY_API_KEY = Read-Host "Enter your Geoapify API key"
   .\run-drop-windows.bat
   ```

   The key is passed to the Java backend and is not built into the frontend. Set it again in a new terminal session. Do not commit the key or put it in the project ZIP. Without this setting, discovery falls back to public Overpass and may time out.

The Java process writes its local JSON data to `backend/data`. To store data elsewhere, set `DROP_DATA_DIR` before launching. If you change the Java API port, set both `PORT` and `DROP_API_PORT` to the same value so the Vite proxy stays aligned. Set `DROP_ADMIN_EMAIL` and `DROP_ADMIN_PASSWORD` before the first launch to replace the demo admin account.

## Manual start

In a VS Code terminal, compile and start the API:

```powershell
New-Item -ItemType Directory -Force backend/out | Out-Null
Get-ChildItem backend/src -Recurse -Filter *.java | ForEach-Object FullName | Set-Content -Encoding ascii backend/sources.txt
javac -encoding UTF-8 -d backend/out @backend/sources.txt
java -cp backend/out com.drop.server.DropServer
```

In a second terminal:

```powershell
npm install
npm run dev
```

## Run checks

Frontend production build and unit tests:

```powershell
npm run build
npm test
```

Core Java algorithm suite and end-to-end API walkthrough:

```powershell
javac -encoding UTF-8 -d backend/out @backend/sources.txt
javac -encoding UTF-8 -cp backend/out -d backend/out backend/test/AlgorithmTests.java
java -ea -cp backend/out AlgorithmTests
powershell.exe -NoProfile -ExecutionPolicy Bypass -File backend/test/ApiSmoke.ps1
```

The API smoke script uses ports 8099 (Java) and 5199 (Vite proxy) and a fresh, uniquely named temporary data folder. It verifies `/api` proxy routing, creates test-only customer/owner records, then stops its server processes and removes its temporary files when finished. It requires `npm install` to have completed.
