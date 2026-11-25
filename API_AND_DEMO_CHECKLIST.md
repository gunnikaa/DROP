# DROP API and Live Demonstration Checklist

## Core endpoints

| Method | Endpoint | Role / purpose | Algorithm involved |
|---|---|---|---|
| GET | `/api/health` | Backend status and enabled algorithms | Lists six Java techniques |
| GET | `/api/venues` | Browse approved catalogue | — |
| GET | `/api/search/suggest?q=ban` | Customer autocomplete | Trie |
| POST | `/api/recommendations` | Rank matching venues | Binary Max Heap |
| GET | `/api/venues/{id}/availability?from=YYYY-MM-DD&to=YYYY-MM-DD` | Query venue-day availability | Segment Tree |
| POST | `/api/bookings` | Request a time range; rejects conflicts | Segment Tree |
| PATCH | `/api/bookings/{id}/approve` | Owner accepts a request | Rebuilds affected availability index on status change |
| POST | `/api/admin/allocate` | Suggest one-to-one request/venue matches | Bipartite Matching |
| POST | `/api/recommendations/cover` | Cover requested facilities with spaces | Greedy Set Cover |
| POST | `/api/events` | Owner publishes an event; duplicate pre-check | Bloom Filter + exact verification |
| GET | `/api/discovery/places?query=cafe` | Public, unverified place discovery; not bookable inventory | OpenStreetMap Overpass API (not an availability source) |

## Example requests

### Search autocomplete

```bash
curl "http://localhost:8091/api/search/suggest?q=ban"
```

### Heap-based recommendation

```bash
curl -X POST http://localhost:8091/api/recommendations \
  -H "Content-Type: application/json" \
  -d '{"locality":"Bandra","guests":20,"budget":3000}'
```

### Set Cover

```bash
curl -X POST http://localhost:8091/api/recommendations/cover \
  -H "Content-Type: application/json" \
  -d '{"requiredFacilities":["Wi-Fi","Air conditioning","Washrooms","Projector"]}'
```

### Bipartite matching

```bash
curl -X POST http://localhost:8091/api/admin/allocate \
  -H "Content-Type: application/json" \
  -d '{"requests":[{"guests":20,"locality":"Bandra"},{"guests":100,"category":"Exhibition"}]}'
```

## Eight-minute demo flow

1. **Problem (45 sec):** Explain underused temporary spaces and fragmented discovery.
2. **Customer (90 sec):** Type a locality to show Trie suggestions; submit constraints and point to the ranked list produced by the Java Max Heap.
3. **Availability (90 sec):** Open a venue's availability, request a slot, then submit an overlapping request and show the rejection. Explain 48 half-hour slots and Segment Tree range query/update.
4. **Owner (45 sec):** Show owner request management and event publication. Publish a duplicate title/locality/date and show exact-confirmed duplicate rejection after Bloom pre-check.
5. **Admin (75 sec):** Run batch allocation and explain matched/unmatched requests from Bipartite Matching.
6. **Facility coverage (60 sec):** Request Wi-Fi, washrooms and projector; show selected venues and any uncovered facilities from Greedy Set Cover.
7. **Evidence (45 sec):** Open `backend/test-results.txt`, `backend/benchmark-results.csv` and `VIVA_ALGORITHM_NOTES.md`.

## Before presenting

- Start the backend and frontend from a clean project extraction.
- Check `/api/health` and each endpoint above.
- Use the seeded synthetic owner inventory only as demonstration data; state clearly that those owners have not necessarily joined DROP.
- Recheck all public event links and event dates on the day of the demo.
- If demonstrating OSM discovery, confirm Overpass is reachable and retain the on-screen OpenStreetMap attribution. Do not imply a discovered business has joined DROP or confirmed availability.
- Keep one known-good set of sample inputs ready, but also demonstrate one edge case live.

The Admin matching panel displays the individual matched venue for each request and explicitly labels unmatched requests; it is not limited to a success-count toast.
