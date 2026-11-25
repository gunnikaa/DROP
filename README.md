# DROP - Pop-up Space Discovery and Booking

DROP connects small businesses with venue owners, turning underused spaces into places where new ideas can thrive through pop-ups, exhibitions, workshops, and more. The application has a React and TypeScript frontend and a Core Java HTTP backend.

## Features

- Customer, venue-owner, and administrator workspaces with role-based access.
- Owner-created venue listings that become bookable after administrator approval.
- Search, locality filters, category filters, and autocomplete.
- Booking requests with capacity, date/time, and availability checks.
- Owner approval or rejection and customer booking status.
- Public place discovery for possible hosts, kept separate from approved DROP listings.
- Public contact details shown when the data provider supplies them.

## Technology

- Java 17+ using the JDK HTTP server; no Spring Boot, Maven, or Gradle.
- React, TypeScript, TanStack Start, and Vite.
- JSON files for local prototype persistence.
- Geoapify Places with a public Overpass fallback for public map data.

## Requirements

- Windows 10 or 11 (the included launcher is `run-drop-windows.bat`).
- JDK 17 or newer.
- Node.js 20.19+ or 22.12+ and npm.
- Internet access for dependency installation and public place discovery.

## Start on Windows

1. Extract the ZIP to a writable folder.
2. Open the project root in VS Code. The project root is the folder containing `run-drop-windows.bat`; do not start the command from inside `backend`.
3. Open a PowerShell terminal in that root folder and run:

   ```powershell
   .\run-drop-windows.bat
   ```

4. Keep the terminal and backend window open. Visit the frontend URL printed by Vite (normally `http://localhost:8080`). The Java API listens on `http://localhost:8091`.

The launcher compiles the Java backend, installs frontend packages on first run, and starts the frontend. To add place discovery results from Geoapify, set the key in the same PowerShell window before starting: `$env:DROP_GEOAPIFY_API_KEY = Read-Host "Enter your Geoapify API key"`. Keep API keys private and out of source control. Without a key, the backend tries the public Overpass service, which may be slower or unavailable.

## Run the checks

From the project root:

```powershell
.\test-algorithms-windows.bat
powershell.exe -NoProfile -ExecutionPolicy Bypass -File backend/test/ApiSmoke.ps1
npm run build
npm test
```

The Java algorithm suite and API smoke workflow are described in `backend/README.md` and `API_AND_DEMO_CHECKLIST.md`. Benchmark commands are in `run-benchmarks-windows.bat`.

## Algorithms

| Algorithm | Use in DROP |
|---|---|
| Binary max heap | Prioritize matching venues by recommendation score. |
| Segment tree | Query and update half-hour availability slots. |
| Trie | Return venue and locality prefix suggestions. |
| Bipartite matching | Suggest distinct venues for compatible booking requests. |
| Greedy set cover | Suggest a small set of venues covering required facilities. |
| Bloom filter plus exact set | Screen possible duplicate event submissions, then verify positives exactly. |

## Project structure

- `backend/src/` - Core Java models, algorithms, services, and HTTP server.
- `backend/test/` - Java correctness tests, API smoke workflow, and benchmark harness.
- `src/` - React routes, components, API client, and styles.
- `public/` - Static assets.
- `docs/WINDOWS_SETUP.md` - Detailed Windows setup and manual start instructions.

## Team

- Gunn Mulchandani - backend and API integration.
- Siddhant Amin - frontend implementation.
- Vaishnavi Singh - algorithm implementation.

## Limitations

This is a local academic prototype. It stores data in JSON files and keeps sessions in memory. Publicly discovered places are unverified and cannot be booked through DROP. Only administrator-approved, owner-created listings are bookable. Payments and multi-server booking locks are not implemented.

## Publish this source on GitHub

1. Create an empty repository on GitHub.
2. Extract this ZIP and open a terminal in the project root.
3. Use Git with your own account to create the repository history and push it:

   ```powershell
   git init
   git add .
   git commit -m "Add DROP source code"
   git branch -M main
   git remote add origin <your-GitHub-repository-URL>
   git push -u origin main
   ```

4. Add the other team members as repository collaborators so future work is recorded under each person's account. Never commit API keys.
