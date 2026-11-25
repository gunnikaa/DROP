package com.drop.algorithms;

import java.util.*;

/** Trie for venue-name and locality prefix autocomplete. */
public final class Trie {
    private static final class Node { final Map<Character, Node> next = new TreeMap<>(); boolean end; }
    private final Node root = new Node();
    private final Set<String> originalWords = new HashSet<>();
    public void insert(String word) {
        if (word == null || word.isBlank()) throw new IllegalArgumentException("Trie word cannot be blank");
        String normalized = word.trim().toLowerCase(Locale.ROOT); Node node = root;
        for (char c : normalized.toCharArray()) node = node.next.computeIfAbsent(c, ignored -> new Node());
        node.end = true; originalWords.add(normalized);
    }
    public List<String> suggest(Collection<String> words, String prefix, int limit) {
        if (words == null || prefix == null) throw new IllegalArgumentException("Words and prefix are required");
        if (limit < 0) throw new IllegalArgumentException("Limit cannot be negative");
        for (String word : words) if (word != null && !word.isBlank()) insert(word);
        if (limit == 0) return List.of();
        String normalized = prefix.trim().toLowerCase(Locale.ROOT); Node node = root;
        for (char c : normalized.toCharArray()) { node = node.next.get(c); if (node == null) return List.of(); }
        List<String> out = new ArrayList<>(); collect(node, new StringBuilder(normalized), out, limit); return out;
    }
    private void collect(Node node, StringBuilder prefix, List<String> out, int limit) {
        if (out.size() >= limit) return;
        if (node.end) out.add(prefix.toString());
        for (var entry : node.next.entrySet()) { if (out.size() >= limit) break; prefix.append(entry.getKey()); collect(entry.getValue(), prefix, out, limit); prefix.setLength(prefix.length() - 1); }
    }
}
