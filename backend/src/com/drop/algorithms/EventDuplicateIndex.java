package com.drop.algorithms;

import java.text.Normalizer;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

/** Bloom-filter precheck plus authoritative exact set for duplicate event prevention. */
public final class EventDuplicateIndex {
    private final BloomFilter bloom;
    private final Set<String> exactKeys = new HashSet<>();

    public EventDuplicateIndex(int expectedEvents, double falsePositiveProbability) {
        bloom = new BloomFilter(expectedEvents, falsePositiveProbability);
    }

    public synchronized void addExisting(String title, String locality, String date) {
        String key = key(title, locality, date);
        if (exactKeys.add(key)) bloom.add(key);
    }

    /** Returns true only after an exact-set confirmation; Bloom positives alone never reject. */
    public synchronized boolean isDuplicate(String title, String locality, String date) {
        String key = key(title, locality, date);
        return bloom.mightContain(key) && exactKeys.contains(key);
    }

    public synchronized void addNew(String title, String locality, String date) {
        String key = key(title, locality, date);
        if (bloom.mightContain(key) && exactKeys.contains(key))
            throw new IllegalArgumentException("A matching event already exists for this venue area and date.");
        exactKeys.add(key);
        bloom.add(key);
    }

    public int indexedEvents() { return bloom.insertedCount(); }
    private static String key(String title, String locality, String date) {
        if (title == null || title.isBlank()) throw new IllegalArgumentException("Event title is required");
        if (locality == null || locality.isBlank()) throw new IllegalArgumentException("Locality is required");
        LocalDate.parse(date);
        String t = Normalizer.normalize(title.trim(), Normalizer.Form.NFKC).replaceAll("\\s+", " ").toLowerCase(Locale.ROOT);
        String l = Normalizer.normalize(locality.trim(), Normalizer.Form.NFKC).replaceAll("\\s+", " ").toLowerCase(Locale.ROOT);
        return t + "|" + l + "|" + date;
    }
}
