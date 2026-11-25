# DROP data and prototype notes

## Events

The event feed contains public Mumbai event listings with their original organiser/ticketing URLs. Each listing should be opened and rechecked before relying on its schedule, price, or ticket availability. DROP stores the source URL and fetch timestamp so that event provenance is visible.

## Venues and place suggestions

The public DROP venue catalogue starts empty and is populated by owner-submitted spaces after administrator approval. Legacy bundled sample rows labelled `DEMO_OWNER_LISTING` are removed on startup.

Place suggestions use Geoapify Places when `DROP_GEOAPIFY_API_KEY` is set; the no-key fallback is the public OpenStreetMap Overpass API. DROP attributes both Geoapify and OpenStreetMap contributors. Results focus on cafes, galleries, event venues, community centers, markets and retail spaces. A map listing is a place to contact about a pop-up, not confirmation that the business rents space. Owner-submitted listings are bookable only after administrator approval.

## Persistence and security

The current Core Java project stores venues, events and bookings in JSON files under `backend/data`. This is deliberately dependency-free for the Java algorithms course. It is not a production multi-user database. Authentication, role-based authorisation, concurrency-safe transactions, privacy controls and payment processing must be completed before public launch.
