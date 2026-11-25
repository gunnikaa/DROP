package com.drop.algorithms;

import java.util.*;

/** Greedy ln(|U|)+1 approximation for unweighted set cover (not guaranteed optimal). */
public final class GreedySetCover {
    private GreedySetCover() {}
    public static List<Integer> choose(List<Set<String>> facilities, List<String> required) {
        if (facilities == null || required == null) throw new IllegalArgumentException("Inputs cannot be null");
        for (Set<String> set : facilities) if (set == null) throw new IllegalArgumentException("Facility sets cannot contain null");
        if (required.stream().anyMatch(Objects::isNull)) throw new IllegalArgumentException("Required facilities cannot contain null");
        Set<String> uncovered = new LinkedHashSet<>(required);
        if (uncovered.isEmpty()) return List.of();
        List<Integer> chosen = new ArrayList<>(); Set<Integer> used = new HashSet<>();
        while (!uncovered.isEmpty()) {
            int best = -1; Set<String> bestGain = Set.of();
            for (int i = 0; i < facilities.size(); i++) if (!used.contains(i)) {
                Set<String> gain = new HashSet<>(facilities.get(i)); gain.retainAll(uncovered);
                if (gain.size() > bestGain.size()) { best = i; bestGain = gain; }
            }
            if (best < 0 || bestGain.isEmpty()) break;
            chosen.add(best); used.add(best); uncovered.removeAll(bestGain);
        }
        return List.copyOf(chosen);
    }
}
