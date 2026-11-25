package com.drop.algorithms;

import java.nio.charset.StandardCharsets;
import java.util.BitSet;
import java.util.Objects;

/**
 * Bloom filter for fast probabilistic pre-checks before exact event-duplicate lookup.
 * A positive means "possibly present"; callers MUST confirm positives in an exact set.
 * A negative means definitely absent, assuming every stored key was inserted.
 */
public final class BloomFilter {
    private final BitSet bits;
    private final int bitCount;
    private final int hashCount;
    private int insertedCount;

    public BloomFilter(int expectedInsertions, double falsePositiveProbability) {
        if (expectedInsertions <= 0) throw new IllegalArgumentException("expectedInsertions must be > 0");
        if (!(falsePositiveProbability > 0.0 && falsePositiveProbability < 1.0))
            throw new IllegalArgumentException("falsePositiveProbability must be between 0 and 1");
        this.bitCount = Math.max(8, (int) Math.ceil(-expectedInsertions * Math.log(falsePositiveProbability) / (Math.log(2) * Math.log(2))));
        this.hashCount = Math.max(1, (int) Math.round((double) bitCount / expectedInsertions * Math.log(2)));
        this.bits = new BitSet(bitCount);
    }

    public synchronized void add(String value) {
        Objects.requireNonNull(value, "value");
        long[] hashes = hashes(value);
        for (int i = 0; i < hashCount; i++) bits.set(index(hashes[0] + i * hashes[1]));
        insertedCount++;
    }

    /** Returns true for a possible match, never proof of membership. */
    public synchronized boolean mightContain(String value) {
        Objects.requireNonNull(value, "value");
        long[] hashes = hashes(value);
        for (int i = 0; i < hashCount; i++) if (!bits.get(index(hashes[0] + i * hashes[1]))) return false;
        return true;
    }

    public int bitCount() { return bitCount; }
    public int hashCount() { return hashCount; }
    public synchronized int insertedCount() { return insertedCount; }
    private int index(long hash) { return (int) Math.floorMod(hash, (long) bitCount); }

    // Two independent 64-bit rolling hashes are combined by double hashing.
    private static long[] hashes(String value) {
        byte[] bytes = value.getBytes(StandardCharsets.UTF_8);
        long h1 = 0xcbf29ce484222325L;
        long h2 = 0x9e3779b97f4a7c15L;
        for (byte b : bytes) {
            h1 = (h1 ^ (b & 0xff)) * 0x100000001b3L;
            h2 ^= (b & 0xff) + 0x9e3779b9L + (h2 << 6) + (h2 >>> 2);
        }
        if (h2 == 0) h2 = 0x27d4eb2dL;
        return new long[]{h1, h2};
    }
}
