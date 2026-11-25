package com.drop.algorithms;

/** Segment tree over half-hour venue slots: 1 = free, 0 = occupied. */
public final class SegmentTree {
    private final int n;
    private final int[] sum;

    public SegmentTree(int[] values) {
        if (values == null) throw new IllegalArgumentException("Slot array cannot be null");
        n = values.length;
        sum = new int[Math.max(1, 4 * n)];
        for (int value : values) if (value != 0 && value != 1)
            throw new IllegalArgumentException("Availability values must be 0 (occupied) or 1 (free)");
        if (n > 0) build(1, 0, n - 1, values);
    }

    private void build(int p, int l, int r, int[] values) {
        if (l == r) { sum[p] = values[l]; return; }
        int m = (l + r) >>> 1;
        build(p * 2, l, m, values); build(p * 2 + 1, m + 1, r, values);
        sum[p] = sum[p * 2] + sum[p * 2 + 1];
    }

    /** Returns number of free slots in the inclusive range [left, right]. */
    public int query(int left, int right) {
        validateRange(left, right);
        return query(1, 0, n - 1, left, right);
    }

    private int query(int p, int a, int b, int left, int right) {
        if (left <= a && b <= right) return sum[p];
        int m = (a + b) >>> 1, result = 0;
        if (left <= m) result += query(p * 2, a, m, left, right);
        if (right > m) result += query(p * 2 + 1, m + 1, b, left, right);
        return result;
    }

    /** Updates one slot in O(log n). */
    public void update(int index, int value) {
        if (index < 0 || index >= n) throw new IllegalArgumentException("Slot index out of range");
        if (value != 0 && value != 1) throw new IllegalArgumentException("Availability value must be 0 or 1");
        update(1, 0, n - 1, index, value);
    }

    private void update(int p, int l, int r, int index, int value) {
        if (l == r) { sum[p] = value; return; }
        int m = (l + r) >>> 1;
        if (index <= m) update(p * 2, l, m, index, value); else update(p * 2 + 1, m + 1, r, index, value);
        sum[p] = sum[p * 2] + sum[p * 2 + 1];
    }

    public int size() { return n; }
    private void validateRange(int left, int right) {
        if (n == 0 || left < 0 || right >= n || left > right)
            throw new IllegalArgumentException("Invalid or empty availability range");
    }
}
