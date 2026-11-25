# DROP — viva notes: Advanced Algorithms using Java

## 30-second architecture answer

“DROP has a React user interface, but its product APIs and all assessed algorithm implementations are in Core Java. The Java server uses the JDK's built-in `HttpServer`; it does not use Spring Boot. The frontend sends JSON requests to Java endpoints under `/api`. We implemented six syllabus techniques, including a Bloom Filter for CO5.”

## Six algorithms in the running product

### 1. Trie — venue/locality autocomplete (Unit 4)
- **Code:** `backend/src/com/drop/algorithms/Trie.java`
- **Called by:** `GET /api/search/suggest?q=ban`
- **Product location:** Customer → search spaces.
- **Say:** “At server startup, I insert venue names and locality names into a Trie. As the customer types, Java follows the prefix path and collects a limited number of suggestions from that node. The index stays in memory between requests.”
- **Complexity:** Insert O(L); prefix traversal O(P) plus output traversal. Space O(total characters).

### 2. Binary Max Heap — venue recommendations (Unit 2)
- **Code:** `backend/src/com/drop/algorithms/MaxHeap.java`
- **Called by:** `POST /api/recommendations`
- **Product location:** Customer → Best match / recommendations.
- **Say:** “Java scores eligible spaces using the customer's category, locality, guest count, budget, facilities and rating. Each venue and score is inserted into our array-backed max heap. Extracting the root returns the current highest score.”
- **Complexity:** Insert O(log n), extract O(log n), complete ranking O(n log n).

### 3. Segment Tree — venue availability (Unit 3)
- **Code:** `backend/src/com/drop/algorithms/SegmentTree.java`
- **Called by:** `GET /api/venues/{id}/availability` and `POST /api/bookings`
- **Product location:** Venue details / owner calendar / booking request.
- **Say:** “A venue day has 48 half-hour slots. Free is 1 and occupied is 0. Each tree node stores the number of free slots in its interval. Java queries the requested interval; if its free-slot sum is not equal to the interval length, the booking is rejected. Accepted bookings update the relevant slots.”
- **Complexity:** Build O(n), range query O(log n), point update O(log n), with n=48 slots per day in this prototype.

### 4. Bipartite Matching — batch request allocation suggestions (Unit 5)
- **Code:** `backend/src/com/drop/algorithms/BipartiteMatching.java`
- **Called by:** `POST /api/admin/allocate`
- **Product location:** Admin → Bookings → Run matching.
- **Say:** “Requests form the left side of a bipartite graph and compatible venues form the right side. An edge means the venue satisfies the supplied capacity and optional category/locality constraints. Kuhn's augmenting-path method returns a maximum-cardinality matching; no venue is matched to two requests in that result.”
- **Complexity:** O(VE) worst-case for this augmenting-path implementation.
- **Limit:** The current endpoint returns compatibility suggestions; it does not transactionally reassign stored bookings or consider a multi-day calendar conflict graph.

### 5. Greedy Set Cover — facility coverage (Unit 5)
- **Code:** `backend/src/com/drop/algorithms/GreedySetCover.java`
- **Called by:** `POST /api/recommendations/cover`
- **Product location:** Customer → facility requirements → Find space combination.
- **Say:** “The universe is the list of facilities the event needs. Each venue is a set of facilities it provides. At each step, Java chooses the venue covering the most facilities still missing. The response shows selected spaces, covered facilities and anything left uncovered.”
- **Complexity:** O(k·n·m) for this implementation, where k is selected venues, n is candidate venues and m is required facilities.
- **Limit:** It is an approximation; it does not guarantee the minimum number of venues. For unweighted Set Cover, the greedy approximation ratio is bounded by H(m), at most 1+ln(m).

### 6. Bloom Filter — duplicate event screening (Unit 6 / CO5)
- **Code:** `backend/src/com/drop/algorithms/BloomFilter.java` and `EventDuplicateIndex.java`
- **Called by:** `POST /api/events`
- **Product location:** Venue Owner → publish event.
- **Say:** “When an owner publishes an event, Java normalizes its title, locality and date into a key. The Bloom Filter quickly says definitely not present or possibly present. If possibly present, Java checks an exact HashSet before rejecting it. This handles false positives correctly: a Bloom hit is never treated as proof.”
- **Complexity:** O(k) hash/bit operations per insert or query; O(m) bits of storage. The filter is sized for 5,000 expected keys and a 1% target false-positive probability.

## Tests and performance evidence

- Run `java -ea -cp backend/out AlgorithmTests`. The suite has 33 deterministic assertions: at least five cases for each of the six algorithm modules, including edge and invalid-input cases.
- Run `java -cp backend/out AlgorithmBenchmarks`. It reports median timings from five measured batches after warm-up, at 1,000, 10,000 and 50,000 inputs.
- Baselines: Max Heap top-100 versus full sort; Trie prefix lookup versus linear scan; Segment Tree range sum versus linear scan.
- Quote only the timings in `backend/benchmark-results.csv` generated on the machine used for the presentation. JVM and hardware affect timings.

## Important honest limitations

- Venue rows are clearly labelled `DEMO_OWNER_LISTING`; they are synthetic owner-demo inventory, not verified partner venues or confirmed bookable public inventory.
- Event examples retain original source links, but they are a captured snapshot, not an automatic live scraper. Recheck dates and organiser pages before presenting.
- OpenStreetMap/Overpass discovery is wired in Java at `/api/discovery/places` and does not require an API key. It returns public place data; it does not confirm owner participation or availability.
- The prototype has password hashing and server-side role enforcement, but uses JSON files and in-memory sessions. It is not a secure public launch build.

## Likely viva questions

**Q: Why does a Bloom Filter not give a definitive answer?**  
A: It can return false positives. A negative means definitely absent if the filter was populated correctly; a positive means possibly present, so the code performs exact verification.

**Q: Why use Segment Tree instead of scanning all slots?**  
A: It supports range-sum queries and point updates in logarithmic time. This becomes more useful when the schedule contains many time units or repeated interval queries; the prototype uses 48 half-hour slots per day.

**Q: Does Greedy Set Cover always find the minimum number of spaces?**  
A: No. It is a polynomial-time approximation. We report uncovered facilities and do not claim exact optimality.

**Q: What does maximum matching guarantee?**  
A: Maximum cardinality for the compatibility graph passed to the algorithm, not a globally optimal schedule across all dates unless date/time conflicts are included in that graph.
