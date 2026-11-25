# DROP Core Java backend

The backend uses only JDK 17+ classes, including `com.sun.net.httpserver.HttpServer` and `java.net.http.HttpClient`. It has no Spring Boot, Maven, Gradle, or external Java dependencies.

## Compile and run

From the project root:

```powershell
New-Item -ItemType Directory -Force backend/out | Out-Null
Get-ChildItem backend/src -Recurse -Filter *.java | ForEach-Object FullName | Set-Content -Encoding ascii backend/sources.txt
javac -encoding UTF-8 -d backend/out @backend/sources.txt
java -cp backend/out com.drop.server.DropServer
```

The local API listens on `127.0.0.1:8091`. `PORT` changes its port; set `DROP_API_PORT` to the same value so the Vite `/api` proxy follows it. `DROP_DATA_DIR` changes the JSON data directory. The first launch provisions an admin using `DROP_ADMIN_EMAIL` and `DROP_ADMIN_PASSWORD`, defaulting to `admin@drop.local` and `DropAdmin!2026` for local demo use.

## API and algorithms

| Technique | Endpoint/use |
|---|---|
| Trie | `GET /api/search/suggest?q=` autocomplete |
| Binary max heap | `POST /api/recommendations` ranked matches |
| Segment tree | Availability range queries and booking conflict checks |
| Bipartite matching | `POST /api/admin/allocate` distinct venue/request matches |
| Greedy set cover | `POST /api/recommendations/cover` facility coverage suggestion |
| Bloom filter plus exact set | Owner event duplicate pre-check; positives are checked exactly |

## OpenStreetMap discovery

`GET /api/discovery/places?query=` uses Geoapify Places over a Mumbai bounding box when `DROP_GEOAPIFY_API_KEY` is set; otherwise it falls back to the public Overpass API (`overpass.private.coffee`). Geoapify requests are cached in memory for 15 minutes. Results include map links, publicly available contact details when present, and `availabilityConfirmed: false`. These discovered places are never returned as DROP venue inventory or accepted by the booking endpoint. The Explore page displays Geoapify and OpenStreetMap attribution.

Create a free Geoapify API key at https://myprojects.geoapify.com/ (the free plan currently allows 3,000 credits/day). In PowerShell, set it before launching DROP: `$env:DROP_GEOAPIFY_API_KEY = "your-key"; .\run-drop-windows.bat`. Keep the key out of source control and don't paste it into chat. If the key is not set, the application continues to use Overpass.

If that public instance is unavailable from your network, set `DROP_OVERPASS_URL` to another trusted global Overpass endpoint. Public instances can be overloaded; follow the [OpenStreetMap Overpass usage guidance](https://wiki.openstreetmap.org/wiki/Overpass_API#Public_Overpass_API_instances).

## Tests

Run `backend/test/AlgorithmTests.java` for 33 assertions over the six algorithms. On Windows, `backend/test/ApiSmoke.ps1` starts the API on an isolated loopback port and exercises registration, owner scoping, pending admin review, booking ownership/pricing, owner approval, and authorization boundaries.

## Prototype limits

The local JSON files are not a transactional database. Sessions are in memory, and booking synchronization only protects a single Java server process. There is no payment integration, production identity verification, or distributed availability lock. Do not run this on a public network with real customer data.
