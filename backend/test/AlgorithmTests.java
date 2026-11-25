import com.drop.algorithms.*;
import java.util.*;

/** Dependency-free deterministic correctness suite: 5 cases for every assessed algorithm. */
public final class AlgorithmTests {
    private static int passed = 0;
    public static void main(String[] args) {
        trieTests(); heapTests(); segmentTreeTests(); matchingTests(); setCoverTests(); bloomTests();
        System.out.println("PASS: " + passed + " algorithm correctness tests.");
    }
    private static void trieTests() {
        Trie t = new Trie();
        check(t.suggest(List.of("Bandra", "Bandra West", "Andheri"), "ban", 10).size() == 2, "Trie prefix matches");
        check(t.suggest(List.of("Bandra", "Andheri"), "xyz", 10).isEmpty(), "Trie missing prefix");
        check(t.suggest(List.of("Bandra", "Bandra West", "Bandstand"), "ban", 2).size() == 2, "Trie limit");
        check(t.suggest(List.of("BANDRA"), "BAN", 10).contains("bandra"), "Trie case normalization");
        expect(() -> t.suggest(List.of("Bandra"), "b", -1), "Trie rejects negative limit");
    }
    private static void heapTests() {
        MaxHeap<String> h = new MaxHeap<>(); h.add(4,"four"); h.add(9,"nine"); h.add(6,"six");
        check("nine".equals(h.poll().value()), "Heap extracts maximum");
        check("six".equals(h.poll().value()) && "four".equals(h.poll().value()), "Heap maintains order");
        check(h.poll() == null, "Heap empty extraction");
        h.add(-5,"negative"); check("negative".equals(h.poll().value()), "Heap supports negative scores");
        expect(() -> h.add(Double.NaN,"bad"), "Heap rejects NaN priority");
    }
    private static void segmentTreeTests() {
        SegmentTree st = new SegmentTree(new int[]{1,1,0,1,1});
        check(st.query(0,1) == 2, "Segment tree full-free subrange");
        check(st.query(0,4) == 4, "Segment tree total free count");
        st.update(2,1); check(st.query(0,4) == 5, "Segment tree point update");
        st.update(0,0); check(st.query(0,2) == 2, "Segment tree occupied update");
        expect(() -> st.query(-1,2), "Segment tree rejects out-of-range query");
    }
    private static void matchingTests() {
        int[] a = BipartiteMatching.maximumMatching(new boolean[][]{{true,true},{true,false}});
        check(a[0] >= 0 && a[1] >= 0 && a[0] != a[1], "Matching assigns distinct venues");
        check(Arrays.stream(BipartiteMatching.maximumMatching(new boolean[][]{{false},{false}})).allMatch(x -> x == -1), "Matching infeasible graph");
        check(BipartiteMatching.maximumMatching(new boolean[][]{}).length == 0, "Matching empty left side");
        int[] reroute = BipartiteMatching.maximumMatching(new boolean[][]{{true,false},{true,true}});
        check(reroute[0] >= 0 && reroute[1] >= 0 && reroute[0] != reroute[1], "Matching uses augmenting path");
        expect(() -> BipartiteMatching.maximumMatching(new boolean[][]{{true},{true,false}}), "Matching rejects ragged matrix");
    }
    private static void setCoverTests() {
        List<Set<String>> sets = List.of(Set.of("wifi","ac"), Set.of("projector"), Set.of("wifi","projector"));
        List<Integer> cover = GreedySetCover.choose(sets, List.of("wifi","ac","projector"));
        check(cover.size() == 2, "Set cover finds a two-space cover");
        check(GreedySetCover.choose(sets, List.of()).isEmpty(), "Set cover empty universe");
        check(GreedySetCover.choose(sets, List.of("unavailable")).isEmpty(), "Set cover reports no selected cover when impossible");
        check(GreedySetCover.choose(List.of(Set.of("wifi","ac","projector")), List.of("wifi","ac","projector")).equals(List.of(0)), "Set cover one-set solution");
        expect(() -> GreedySetCover.choose(null, List.of("wifi")), "Set cover rejects null input");
    }
    private static void bloomTests() {
        BloomFilter b = new BloomFilter(100, 0.01);
        check(!b.mightContain("event-alpha"), "Bloom filter empty negative");
        b.add("event-alpha"); check(b.mightContain("event-alpha"), "Bloom filter inserted key positive");
        b.add("event-beta"); check(b.mightContain("event-beta"), "Bloom filter multiple inserts");
        BloomFilter tiny = new BloomFilter(1, 0.5); tiny.add("seed"); boolean falsePositive = false; for (int i = 0; i < 1000; i++) if (tiny.mightContain("candidate-" + i)) { falsePositive = true; break; }
        check(falsePositive, "Bloom filter can produce a false positive");
        expect(() -> new BloomFilter(0, 0.01), "Bloom filter rejects invalid capacity");
        EventDuplicateIndex index = new EventDuplicateIndex(100, 0.01);
        index.addExisting("Art Fair", "Bandra", "2026-12-01");
        check(index.isDuplicate(" art   fair ", "bandra", "2026-12-01"), "Duplicate index normalizes exact match");
        check(!index.isDuplicate("Art Fair", "Bandra", "2026-12-02"), "Duplicate index distinguishes event date");
        expect(() -> index.addNew("Art Fair", "Bandra", "2026-12-01"), "Duplicate index blocks confirmed duplicate");
    }
    private static void check(boolean condition, String name) { if (!condition) throw new AssertionError(name); passed++; System.out.println("PASS " + name); }
    private static void expect(Runnable action, String name) { try { action.run(); throw new AssertionError("Expected exception: " + name); } catch (IllegalArgumentException expected) { passed++; System.out.println("PASS " + name); } }
}
