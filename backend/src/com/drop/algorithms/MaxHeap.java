package com.drop.algorithms;

import java.util.ArrayList;
import java.util.List;

/** Array-backed binary max heap; extracts the highest venue score first. */
public final class MaxHeap<T> {
    public record Entry<T>(double priority, T value) {}
    private final List<Entry<T>> a = new ArrayList<>();
    public void add(double priority, T value) {
        if (!Double.isFinite(priority)) throw new IllegalArgumentException("Priority must be finite");
        if (value == null) throw new IllegalArgumentException("Heap value cannot be null");
        a.add(new Entry<>(priority, value)); int i = a.size() - 1;
        while (i > 0) { int parent = (i - 1) / 2; if (a.get(parent).priority() >= priority) break; swap(i, parent); i = parent; }
    }
    public Entry<T> poll() {
        if (a.isEmpty()) return null;
        Entry<T> top = a.get(0), last = a.remove(a.size() - 1);
        if (!a.isEmpty()) { a.set(0, last); int i = 0;
            while (true) { int l = 2 * i + 1, r = l + 1, best = i;
                if (l < a.size() && a.get(l).priority() > a.get(best).priority()) best = l;
                if (r < a.size() && a.get(r).priority() > a.get(best).priority()) best = r;
                if (best == i) break; swap(i, best); i = best;
            }
        }
        return top;
    }
    public boolean isEmpty() { return a.isEmpty(); }
    public int size() { return a.size(); }
    private void swap(int i, int j) { Entry<T> x = a.get(i); a.set(i, a.get(j)); a.set(j, x); }
}
