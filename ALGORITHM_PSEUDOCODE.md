# Assessed algorithm pseudocode

## Binary Max Heap recommendation ranking

```text
for each eligible venue v:
    score = weightedScore(v, customerConstraints)
    heap.insert(score, v)
while heap is not empty:
    output heap.extractMaximum()
```

## Segment Tree availability

```text
build(node, interval):
    if interval is one slot: node.sum = slot.free
    else:
        build(left child); build(right child)
        node.sum = left.sum + right.sum

isAvailable(left, right):
    return rangeSum(left, right) == right - left + 1

book(left, right):
    if not isAvailable(left, right): reject
    for slot from left to right: pointUpdate(slot, 0)
```

## Trie autocomplete

```text
insert(word):
    node = root
    for character in normalize(word):
        node = node.child[character], creating it if absent
    node.isWord = true

suggest(prefix, limit):
    node = follow prefix from root
    if path missing: return []
    depthFirstCollect(node, prefix, at most limit words)
```

## Bipartite matching (Kuhn augmenting path)

```text
for each request u:
    visitedVenues = empty set
    tryAugment(u)

tryAugment(u):
    for each compatible venue v:
        if v not visited:
            mark v visited
            if v unmatched OR tryAugment(currentRequestOf(v)):
                match v to u
                return true
    return false
```

## Greedy Set Cover

```text
uncovered = requiredFacilities
while uncovered is not empty:
    choose unused venue covering the largest number of uncovered facilities
    if no venue adds coverage: stop
    add venue to answer
    remove its facilities from uncovered
return answer and uncovered
```

## Bloom Filter event duplicate screening

```text
key = normalize(title, locality, localDate)
if BloomFilter.mightContain(key):
    if exactSet.contains(key): reject as duplicate
exactSet.add(key)
BloomFilter.add(key)
accept event
```

A Bloom-filter positive is only a possible match. The exact set is authoritative.
